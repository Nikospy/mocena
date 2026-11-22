import { Hono } from "hono";
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

registerHomeTasks((person) =>
  person.role === "admin"
    ? [
        { title: "Skąd biorą się podpowiedzi", href: "/admin/suggestion-sources" },
        {
          title: "Korekta błędów w zatwierdzonych arkuszach",
          detail: "Poprawienie pola zatwierdzonego arkusza z podaniem powodu. Korekta zostaje w historii arkusza.",
          action: "Otwórz listę arkuszy",
          href: "/admin/corrections",
        },
      ]
    : [],
);

const app = new Hono();

app.get("/admin/suggestion-sources", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "admin") return c.text("Brak uprawnień.", 403);
  return c.html(<SuggestionSourcesView viewer={viewer} today={today()} data={data} modeLabel={data.modes[suggestionMode()]} />);
});

app.get("/admin/corrections", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "admin") return c.text("Brak uprawnień.", 403);
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
    return cx.error === "forbidden" ? c.text("Korektę zatwierdzonego arkusza wprowadza tylko administrator.", 403) : c.text("Nie ma zatwierdzonej oceny w tym cyklu.", 404);
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
    return cx.error === "forbidden" ? c.text("Korektę zatwierdzonego arkusza wprowadza tylko administrator.", 403) : c.text("Nie ma zatwierdzonej oceny w tym cyklu.", 404);
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
