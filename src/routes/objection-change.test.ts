import { describe, expect, test } from "bun:test";
import { getDb } from "../db";
import { createTestApp } from "../test-helpers";
import { call, html } from "./hr-test-helpers";

const CYCLE = "/cycles/cycle-katarzyna";
const ids = () => (getDb().query("SELECT criterion_id AS id FROM cycle_criteria WHERE cycle_id = 'cycle-katarzyna' ORDER BY rowid").all() as { id: string }[]).map((r) => r.id);
const form = (scores: number[]) => Object.fromEntries(ids().map((id, i) => [`score[${id}]`, String(scores[i])]));
const count = (type: string) => (getDb().query("SELECT COUNT(*) AS n FROM events WHERE cycle_id = 'cycle-katarzyna' AND type = ?").get(type) as { n: number }).n;

describe("rozstrzygnięcie „zmiana oceny” zmienia ocenę (art. 83 ust. 3 ustawy)", () => {
  test("wybór „zmiana oceny” w /hr prowadzi do formularza z pierwszą oceną, bez zapisu rozstrzygnięcia", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const r = await call(app, "joanna", `${CYCLE}/objection-outcome`, { outcome: "changed" });
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe(`${CYCLE}/objection-change`);
    expect(count("objection_resolved")).toBe(0);
    const page = await html(app, "joanna", `${CYCLE}/objection-change`);
    expect(page).toContain("Zapisujesz decyzję rozpatrującego sprzeciw (dyrektor generalny urzędu)");
    for (const id of ids()) expect(page).toContain(`name="score[${id}]" value="5" checked`);
    expect((await call(app, "anna", `${CYCLE}/objection-change`)).status).toBe(403);
  });

  test("obniżenie albo brak zmiany: 422 bez zapisu; podniesienie: 303, nowa migawka, arkusz z dopiskiem, pierwsza w historii", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const low = await call(app, "joanna", `${CYCLE}/objection-change`, form([3, 5, 5, 5, 5]));
    expect(low.status).toBe(422);
    expect(await low.text()).toContain("Ocena zmieniona po sprzeciwie nie może być niższa niż pierwsza");
    expect((await call(app, "joanna", `${CYCLE}/objection-change`, form([5, 5, 5, 5, 5]))).status).toBe(422);
    expect(count("objection_resolved")).toBe(0);
    const ok = await call(app, "joanna", `${CYCLE}/objection-change`, form([7, 7, 5, 5, 5]));
    expect(ok.status).toBe(303);
    expect(count("objection_resolved")).toBe(1);
    expect(count("assessment_approved")).toBe(1);
    const { assessmentState } = await import("../assessment/state");
    const s = assessmentState("cycle-katarzyna");
    expect(s.snapshot?.scores[ids()[0]]).toBe(7);
    expect(s.snapshot?.result.mean).toBeCloseTo(5.8);
    const { personById } = await import("../people");
    expect(s.snapshot?.changedOnObjection?.recordedBy).toBe(personById("joanna")!.name);
    expect(s.stage).toBe("acknowledged");
    expect(await html(app, "joanna", `${CYCLE}/sheet`)).toContain("Ocena zmieniona po uwzględnieniu sprzeciwu z dnia 20.11.2026");
    expect(await html(app, "anna", `${CYCLE}/assessment`)).toContain("Ocena zmieniona po uwzględnieniu sprzeciwu z dnia 20.11.2026");
    const tl = await html(app, "anna", `${CYCLE}/timeline`);
    expect(tl).toContain("Ocena zmieniona po uwzględnieniu sprzeciwu");
    expect(tl).toContain("Ocena zatwierdzona przez oceniającego");
    const json = (await (await call(app, "joanna", `${CYCLE}/assessment/export.json`)).json()) as any;
    expect(json.assessment.changedOnObjection.objectionFiledOn).toBe("2026-11-20");
    expect((await call(app, "joanna", `${CYCLE}/objection-change`)).status).toBe(409);
  });
});
