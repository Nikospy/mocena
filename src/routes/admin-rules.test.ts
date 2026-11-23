import { describe, expect, test } from "bun:test";
import { assessmentState } from "../assessment/state";
import { objectionDeadline } from "../engine/deadlines";
import { MAX_PACK_BYTES } from "../engine/rule-pack";
import { activeRules, defaultRules, type RulePack } from "../engine/rules";
import { computeAssessment } from "../engine/scoring";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

function pack(change: (p: RulePack) => void = () => {}, version = "2026-999/2", effectiveFrom = "2026-11-22"): RulePack {
  const copy = structuredClone(defaultRules);
  copy.version = version;
  copy.effectiveFrom = effectiveFrom;
  change(copy);
  return copy;
}

const publish = (app: ReturnType<typeof createTestApp>["app"], p: unknown, as = "admin") =>
  call(app, as, "/admin/rules/publish", { json: typeof p === "string" ? p : JSON.stringify(p) });

describe("Nowelizacja reguł z interfejsu (/admin/rules)", () => {
  test("szablon, uprawnienia, podgląd bez zapisu, publikacja i historia wersji", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    expect((await call(app, "joanna", "/admin/rules/template.json")).status).toBe(403);
    const tpl = (await (await call(app, "admin", "/admin/rules/template.json")).json()) as { version: string };
    expect(tpl.version).toBe("2016-470/1");
    const next = pack((p) => {
      p.deadlines.objectionDays.value = 14;
      p.approval.acknowledgement.basis = "§ 12 (nowelizacja)";
    });
    expect((await call(app, "joanna", "/admin/rules/preview", { json: JSON.stringify(next) })).status).toBe(403);
    expect((await publish(app, next, "marek")).status).toBe(403);

    const preview = await call(app, "admin", "/admin/rules/preview", { json: JSON.stringify(next) });
    expect(preview.status).toBe(200);
    const text = await preview.text();
    expect(text).toContain("Podgląd zmian przed publikacją");
    expect(text).toContain("Termin wniesienia sprzeciwu (dni)");
    expect(text).toContain("Zatwierdzenie oceny: acknowledgement.basis");
    expect(text).toContain("otwartych cykli");
    expect(db.query("SELECT count(*) AS n FROM rule_versions").get()).toEqual({ n: 0 });

    const pub = await publish(app, next);
    expect(pub.status).toBe(303);
    const page = await html(app, "admin", "/admin/rules?published=1");
    expect(page).toContain("Wersje reguł");
    expect(page).toContain("2026-999/2");
    expect(page).toContain("wersja wyjściowa z pliku");
    expect(objectionDeadline("2026-11-22")).toBe("2026-12-07");
    const ev = db.query("SELECT payload FROM events WHERE type = 'rules_published'").get() as { payload: string };
    expect(JSON.parse(ev.payload)).toMatchObject({ fromVersion: "2016-470/1", toVersion: "2026-999/2" });
  });

  test("opublikowana wersja jest niezmienna: ta sama wersja z inną treścią to 422", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22" });
    expect((await publish(app, pack())).status).toBe(303);
    const again = await publish(app, pack((p) => (p.deadlines.objectionDays.value = 20)));
    expect(again.status).toBe(422);
    expect(await again.text()).toContain("jest już opublikowana");
    expect(await publish(app, pack((p) => (p.deadlines.objectionDays.value = 20), "2016-470/1", "2026-11-23"))).toHaveProperty("status", 422);
    expect((db.query("SELECT pack_json FROM rule_versions WHERE version = '2026-999/2'").get() as { pack_json: string }).pack_json).toContain('"value":7');
  });

  test("zatwierdzona ocena czyta reguły swojej wersji, nowa ocena nowe", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    const levelBefore = assessmentState("cycle-piotr").snapshot!.result.overallLevel;
    const sheetBefore = await html(app, "joanna", "/cycles/cycle-piotr/sheet");
    const assessmentBefore = await html(app, "piotr", "/cycles/cycle-piotr/assessment");
    expect(sheetBefore).toContain("Komunikacja");
    expect(sheetBefore).toContain(levelBefore);

    const res = await publish(
      app,
      pack((p) => {
        p.criteria.find((c) => c.id === "komunikacja")!.name = "ZMIENIONA NAZWA";
        p.overallLevels[3].name = "inny poziom";
        p.partialScale[3].name = "inna siódemka";
      }),
    );
    expect(res.status).toBe(303);

    const sheetAfter = await html(app, "joanna", "/cycles/cycle-piotr/sheet");
    expect(sheetAfter).toBe(sheetBefore);
    expect(sheetAfter).not.toContain("ZMIENIONA NAZWA");
    expect(await html(app, "piotr", "/cycles/cycle-piotr/assessment")).toBe(assessmentBefore);

    // Nowa ocena liczy się według nowej wersji.
    expect(activeRules().version).toBe("2026-999/2");
    const fresh = computeAssessment({ komunikacja: 7, rzetelnosc: 7 });
    expect(fresh.overallLevel).toBe("inny poziom");
    expect(await html(app, "marek", "/people/piotr/notes/new")).toContain("ZMIENIONA NAZWA");
  });

  describe("walidacja: sondy z recenzji dają 422, aplikacja działa dalej", () => {
    const probes: [string, (p: any) => void, string][] = [
      ["miesiące poza zakresem", (p) => (p.deadlines.assessmentEveryMonths.value = 99999999), "od 1 do 60"],
      ["dni poza zakresem", (p) => (p.deadlines.objectionDays.value = 91), "od 1 do 90"],
      ["za dużo kryteriów dodatkowych", (p) => (p.maxAdditionalCriteria = 6), "od 0 do 5"],
      ["usunięte kryterium", (p) => (p.criteria = p.criteria.filter((c: any) => c.id !== "rzetelnosc")), "zmiana struktury wymaga zmiany programu"],
      ["skala 0–1", (p) => (p.partialScale = [{ points: 0, name: "a" }, { points: 1, name: "b" }]), "zmiana struktury wymaga zmiany programu"],
      ["jeden poziom ogólny", (p) => (p.overallLevels = [p.overallLevels[0]]), "zmiana struktury wymaga zmiany programu"],
      ["inne kryteria obowiązkowe arkusza C", (p) => (p.sheets.C.mandatoryCriteria = ["komunikacja"]), "zmiana struktury wymaga zmiany programu"],
      ["brak sekcji approval", (p) => delete p.approval, "approval"],
      ["brak sekcji deadlineChange", (p) => delete p.deadlineChange, "deadlineChange"],
      ["brak sekcji appraiserChange", (p) => delete p.appraiserChange, "appraiserChange"],
      ["nieznane pole", (p) => (p.extra = 1), "Nieznane pole"],
      ["data wcześniejsza niż obowiązującej", (p) => (p.effectiveFrom = "2016-04-22"), "nie może być wcześniejsze"],
    ];
    for (const [name, change, expected] of probes) {
      test(name, async () => {
        const { app, db } = createTestApp({ today: "2026-11-22" });
        const bad = pack(change as (p: RulePack) => void);
        for (const path of ["/admin/rules/preview", "/admin/rules/publish"]) {
          const res = await call(app, "admin", path, { json: JSON.stringify(bad) });
          expect(res.status).toBe(422);
          expect(await res.text()).toContain(expected);
        }
        expect(db.query("SELECT count(*) AS n FROM rule_versions").get()).toEqual({ n: 0 });
        expect((await call(app, "admin", "/")).status).toBe(200);
        expect((await call(app, "marek", "/notes")).status).toBe(200);
      });
    }

    test("za duży plik i zepsuty JSON", async () => {
      const { app } = createTestApp({ today: "2026-11-22" });
      const big = JSON.stringify(pack((p) => ((p as any).padding = "x".repeat(MAX_PACK_BYTES))));
      const res = await publish(app, big);
      expect(res.status).toBe(422);
      expect(await res.text()).toContain("za duży");
      expect((await publish(app, "{nie json")).status).toBe(422);
      expect((await call(app, "admin", "/")).status).toBe(200);
    });
  });

  test("effectiveFrom: przyszła wersja czeka na swoją datę wg zegara aplikacji", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22" });
    const res = await publish(app, pack((p) => (p.deadlines.objectionDays.value = 14), "2026-999/3", "2026-12-01"));
    expect(res.status).toBe(303);
    expect(activeRules().version).toBe("2016-470/1");
    expect(objectionDeadline("2026-11-20")).toBe("2026-11-27");
    expect(await html(app, "admin", "/admin/rules")).toContain("zaplanowana");
    db.query("UPDATE settings SET value = '2026-12-02' WHERE key = 'demo_date'").run();
    expect(activeRules().version).toBe("2026-999/3");
    expect(objectionDeadline("2026-12-02")).toBe("2026-12-16");
    expect(await html(app, "admin", "/admin/rules")).toContain("obowiązuje");
  });

  test("podgląd liczy cykle: otwarte przechodzą na nowe wartości, zatwierdzone zostają", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    const next = pack((p) => (p.deadlines.assessmentEveryMonths.value = 12));
    const text = await (await call(app, "admin", "/admin/rules/preview", { json: JSON.stringify(next) })).text();
    expect(text).toContain("<b>6</b> cykli z zatwierdzoną oceną zostanie przy wersji zapisanej w ocenie");
    expect(text).toContain("<b>4</b> otwartych cykli");
    expect(text).toContain("Okres między ocenami (miesiące)");
    expect(text).toContain("zmieni się termin sporządzenia oceny");
  });
});

test("restart pokazu wraca do wersji 2016-470/1", async () => {
  const { app } = createTestApp({ today: "2026-11-22" });
  expect((await publish(app, pack())).status).toBe(303);
  expect(activeRules().version).toBe("2026-999/2");
  expect((await call(app, "admin", "/demo/restart", {})).status).toBe(303);
  expect(activeRules().version).toBe("2016-470/1");
});
