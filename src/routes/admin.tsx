import { Hono, type Context } from "hono";
import data from "../../content/suggestion-sources.json";
import { approvedCycles, correctedValues, sheetCorrections, validateCorrection } from "../assessment/corrections";
import { assessmentState } from "../assessment/state";
import { cycleById } from "../cycles";
import { recordEvent } from "../events";
import { registerHomeTasks } from "../home-tasks";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { suggestionMode } from "../suggestions";
import { CorrectionFormView, CorrectionListView } from "../views/sheet-correction";
import { SuggestionSourcesView } from "../views/suggestion-sources";
import { RulesVersionView } from "../views/rules-version";
import { activeRules, defaultRules } from "../engine/rules";
import { MAX_PACK_BYTES, RuleVersionConflict, type RulePackValidation, diffRulePacks, publishRulePack, ruleVersionsList, validateRulePack } from "../engine/rule-pack";
import { errorPage } from "../views/error-page";

registerHomeTasks((person) => {
  if (person.role !== "admin") return [];
  const current = activeRules();
  return [
    { title: "Skąd biorą się podpowiedzi", action: "Otwórz źródła podpowiedzi", href: "/admin/suggestion-sources" },
    {
      title: "Korekta błędów w zatwierdzonych arkuszach",
      detail: "Poprawienie pola zatwierdzonego arkusza z podaniem powodu. Korekta zostaje w historii arkusza.",
      action: "Otwórz listę arkuszy",
      href: "/admin/corrections",
    },
    {
      title: "Wersja przepisów",
      detail: `Obowiązuje wersja ${current.version} z ${current.effectiveFrom.split("-").reverse().join(".")}. Tu możesz pobrać szablon i wgrać nowelizację.`,
      action: "Otwórz wersję przepisów",
      href: "/admin/rules",
    },
  ];
});

const app = new Hono();

function currentRulesInfo() {
  const current = activeRules();
  return {
    version: current.version,
    effectiveFrom: current.effectiveFrom,
    act: current.source.act,
    publisher: current.source.publisher,
    status: current.source.status,
    url: current.source.url,
    file: current.version === defaultRules.version ? "rules/regulation-2016-470.json" : null,
  };
}

const TOO_BIG = `Pakiet reguł jest za duży: najwyżej ${MAX_PACK_BYTES / 1024} KB.`;

/** Treść pakietu z pliku albo z pola tekstowego; za duży plik odrzucamy bez czytania. */
/** Wersja, o której mówi baner po publikacji: jej numer, data i to, czy dopiero na nią czeka. */
function publishedInfo(version: string | undefined) {
  const v = version ? ruleVersionsList().find((x) => x.version === version) : undefined;
  return v ? { version: v.version, effectiveFrom: v.effectiveFrom, scheduled: v.status === "scheduled" } : undefined;
}

async function readRulesPayload(c: Context): Promise<{ raw: string; error?: string }> {
  const length = Number(c.req.header("content-length") ?? 0);
  if (length > MAX_PACK_BYTES * 2 + 4096) return { raw: "", error: TOO_BIG };
  const body = await c.req.parseBody();
  const file = body.file;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PACK_BYTES) return { raw: "", error: TOO_BIG };
    return { raw: await file.text() };
  }
  const raw = typeof body.json === "string" ? body.json : "";
  return new TextEncoder().encode(raw).length > MAX_PACK_BYTES ? { raw: "", error: TOO_BIG } : { raw };
}

app.get("/admin/suggestion-sources", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "admin") return errorPage(c, "Ten ekran widzi administrator. Zmień konto, żeby go otworzyć.", 403);
  return c.html(<SuggestionSourcesView viewer={viewer} today={today()} data={data} modeLabel={data.modes[suggestionMode()]} />);
});

app.get("/admin/rules", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "admin") return errorPage(c, "Ten ekran widzi administrator. Zmień konto, żeby go otworzyć.", 403);
  return c.html(
    <RulesVersionView
      viewer={viewer}
      today={today()}
      info={currentRulesInfo()}
      published={publishedInfo(c.req.query("published"))}
      history={ruleVersionsList()}
    />,
  );
});

app.get("/admin/rules/template.json", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "admin") return errorPage(c, "Szablon pakietu reguł pobiera tylko administrator.", 403);
  const current = activeRules();
  const safeName = current.version.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new Response(JSON.stringify(current, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="rules-${safeName}.json"`,
      "cache-control": "no-store",
    },
  });
});

app.post("/admin/rules/preview", async (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "admin") return errorPage(c, "Nowelizację przepisów wprowadza tylko administrator.", 403);
  const payload = await readRulesPayload(c);
  const raw = payload.raw;
  const validated = payload.error ? ({ ok: false, errors: [payload.error] } as RulePackValidation) : validateRulePack(raw);
  if (!validated.ok) {
    return c.html(
      <RulesVersionView
        viewer={viewer}
        today={today()}
        info={currentRulesInfo()}
        rawJson={raw}
        errors={validated.errors}
        history={ruleVersionsList()}
      />,
      422,
    );
  }
  const diff = diffRulePacks(activeRules(), validated.pack);
  const normalized = JSON.stringify(validated.pack, null, 2);
  return c.html(
    <RulesVersionView
      viewer={viewer}
      today={today()}
      info={currentRulesInfo()}
      rawJson={normalized}
      preview={{ pack: validated.pack, diff, rawJson: normalized }}
      history={ruleVersionsList()}
    />,
  );
});

app.post("/admin/rules/publish", async (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "admin") return errorPage(c, "Nowelizację przepisów publikuje tylko administrator.", 403);
  const payload = await readRulesPayload(c);
  const raw = payload.raw;
  const validated = payload.error ? ({ ok: false, errors: [payload.error] } as RulePackValidation) : validateRulePack(raw);
  if (!validated.ok) {
    return c.html(
      <RulesVersionView
        viewer={viewer}
        today={today()}
        info={currentRulesInfo()}
        rawJson={raw}
        errors={validated.errors}
        history={ruleVersionsList()}
      />,
      422,
    );
  }
  try {
    publishRulePack(validated.pack, viewer.id);
  } catch (e) {
    if (!(e instanceof RuleVersionConflict)) throw e;
    return c.html(<RulesVersionView viewer={viewer} today={today()} info={currentRulesInfo()} rawJson={raw} errors={[e.message]} history={ruleVersionsList()} />, 422);
  }
  return c.redirect(`/admin/rules?published=${encodeURIComponent(validated.pack.version)}`, 303);
});

app.get("/admin/corrections", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "admin") return errorPage(c, "Ten ekran widzi administrator. Zmień konto, żeby go otworzyć.", 403);
  return c.html(<CorrectionListView viewer={viewer} today={today()} cycles={approvedCycles()} />);
});

function correctionContext(viewer: Person | null, cycleId: string) {
  if (!viewer) return { error: "account" as const };
  if (viewer.role !== "admin") return { error: "forbidden" as const };
  const cycle = cycleById(cycleId);
  const st = cycle ? assessmentState(cycle.id) : null;
  const current = cycle ? correctedValues(cycle.id) : null;
  if (!cycle || !st?.approvedOn || !current) return { error: "missing" as const };
  return { cycle, approvedOn: st.approvedOn, current, personName: personById(cycle.person_id)?.name ?? cycle.person_id };
}

app.get("/cycles/:id/sheet/correction", (c) => {
  const viewer = currentPerson(c);
  const cx = correctionContext(viewer, c.req.param("id"));
  if ("error" in cx) {
    if (cx.error === "account") return c.redirect("/account");
    return cx.error === "forbidden" ? errorPage(c, "Korektę zatwierdzonego arkusza wprowadza tylko administrator.", 403) : errorPage(c, "Nie ma zatwierdzonej oceny w tym cyklu.", 404);
  }
  return c.html(
    <CorrectionFormView
      viewer={viewer!}
      today={today()}
      cycleId={cx.cycle.id}
      personName={cx.personName}
      approvedOn={cx.approvedOn}
      current={cx.current}
      corrections={sheetCorrections(cx.cycle.id)}
      saved={c.req.query("saved") === "1"}
    />,
  );
});

app.post("/cycles/:id/sheet/correction", async (c) => {
  const viewer = currentPerson(c);
  const cx = correctionContext(viewer, c.req.param("id"));
  if ("error" in cx) {
    if (cx.error === "account") return c.redirect("/account");
    return cx.error === "forbidden" ? errorPage(c, "Korektę zatwierdzonego arkusza wprowadza tylko administrator.", 403) : errorPage(c, "Nie ma zatwierdzonej oceny w tym cyklu.", 404);
  }
  const body = await c.req.parseBody();
  const values = { field: String(body.field ?? ""), value: String(body.value ?? ""), reason: String(body.reason ?? "") };
  const r = validateCorrection(values, cx.current);
  if (!r.ok) {
    return c.html(
      <CorrectionFormView
        viewer={viewer!}
        today={today()}
        cycleId={cx.cycle.id}
        personName={cx.personName}
        approvedOn={cx.approvedOn}
        current={cx.current}
        corrections={sheetCorrections(cx.cycle.id)}
        values={values}
        errors={r.errors}
      />,
      422,
    );
  }
  recordEvent("sheet_corrected", cx.cycle.id, viewer!.id, { field: r.field, from: cx.current[r.field], to: r.value, reason: values.reason.trim() });
  return c.redirect(`/cycles/${cx.cycle.id}/sheet/correction?saved=1`, 303);
});

export default app;
