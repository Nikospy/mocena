import { describe, expect, test } from "bun:test";
import { savePart1 } from "../cycles/part1";
import { buildAssessmentSnapshot } from "../assessment/snapshot";
import { seedEvent } from "../events";
import { createTestApp } from "../test-helpers";
import { call, html } from "./hr-test-helpers";

describe("historia ocen /people/:id/history", () => {
  test("Tomasz: dwie oceny przy 22.11.2026, jedna wcześniej; Anna widzi; Ewa 403; nieznana osoba 404", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22" });
    const h = await html(app, "tomasz", "/people/tomasz/history");
    expect(h).toContain("Ocena z 12.11.2026");
    expect(h).toContain("Ocena z 12.11.2024");
    expect(h).toContain("2016-470/1");
    expect((await call(app, "anna", "/people/tomasz/history")).status).toBe(200);
    expect((await call(app, "ewa", "/people/piotr/history")).status).toBe(403);
    expect((await call(app, "joanna", "/people/nikt/history")).status).toBe(404);
    db.query("UPDATE settings SET value = '2026-01-01' WHERE key = 'demo_date'").run();
    const early = await html(app, "tomasz", "/people/tomasz/history");
    expect(early).toContain("Ocena z 12.11.2024");
    expect(early).not.toContain("Ocena z 12.11.2026");
  });

  test("pusta historia", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    expect(await html(app, "joanna", "/people/maria/history")).toContain("Nie ma jeszcze zatwierdzonych ocen.");
  });

  test("odnośnik do arkusza według canViewSheet", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22" });
    db.query("INSERT INTO cycles (id, person_id, appraiser_id, period_start) VALUES ('cycle-tomasz-dg', 'tomasz', 'dyrektor-urzedu', '2020-11-12')").run();
    seedEvent("cycle_started", "cycle-tomasz-dg", "dyrektor-urzedu", { reason: "previous_assessment", periodStart: "2020-11-12", previousAssessmentOn: "2020-11-12", previousAcknowledgedOn: "2020-11-12", previousOutcome: "positive" }, "2020-11-12");
    savePart1("cycle-tomasz-dg", "dyrektor-urzedu", { additional: [], expectations: {} }, "2020-12-01");
    seedEvent("part1_confirmed", "cycle-tomasz-dg", "tomasz", { place: "Rzeszów", appraiseeName: "Tomasz Kamiński" }, "2020-12-02");
    const ids = (db.query("SELECT criterion_id AS id FROM cycle_criteria WHERE cycle_id = 'cycle-tomasz-dg' ORDER BY rowid").all() as { id: string }[]).map((r) => r.id);
    const snap = buildAssessmentSnapshot("cycle-tomasz-dg", { scores: Object.fromEntries(ids.map((i) => [i, 5])), justification: "", developmentConclusions: "x", interviewDate: "2022-11-10", gradeRequest: { attached: false, motivation: "" } }, { asOf: "2022-11-10" });
    seedEvent("assessment_approved", "cycle-tomasz-dg", "dyrektor-urzedu", snap, "2022-11-10");

    const byAnna = await html(app, "anna", "/people/tomasz/history");
    expect(byAnna).toContain('href="/cycles/cycle-tomasz/sheet"');
    expect(byAnna).toContain('href="/cycles/cycle-tomasz-2022/sheet"');
    expect(byAnna).not.toContain('href="/cycles/cycle-tomasz-dg/sheet"');
    expect((await call(app, "anna", "/cycles/cycle-tomasz-dg/sheet")).status).toBe(403);
    for (const who of ["tomasz", "joanna"]) {
      const h = await html(app, who, "/people/tomasz/history");
      for (const c of ["cycle-tomasz", "cycle-tomasz-2022", "cycle-tomasz-dg"]) expect(h).toContain(`href="/cycles/${c}/sheet"`);
    }
  });
});
