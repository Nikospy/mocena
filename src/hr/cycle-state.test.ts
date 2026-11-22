import { describe, expect, test } from "bun:test";
import { savePart1 } from "../cycles/part1";
import { seedEvent } from "../events";
import { createTestApp } from "../test-helpers";
import { cycleState } from "./cycle-state";
import { assessmentHistory, mandatoryGradeOf } from "./history";

function fresh(today: string) {
  const { db } = createTestApp({ today });
  return {
    db,
    at: (date: string) => db.query("UPDATE settings SET value = ? WHERE key = 'demo_date'").run(date),
  };
}

describe("stan cyklu", () => {
  test("criteria_due: 30 dni po ocenie pozytywnej, 7 dni po negatywnej", () => {
    const { db } = fresh("2024-12-09");
    expect(cycleState("cycle-piotr")).toMatchObject({ step: "criteria_due", deadline: { date: "2024-12-27", basis: ["§ 7 pkt 1"] } });
    db.query("INSERT INTO cycles (id, person_id, appraiser_id, period_start) VALUES ('neg', 'maria', 'marek', '2024-11-27')").run();
    seedEvent("cycle_started", "neg", "marek", { periodStart: "2024-11-27", previousAssessmentOn: "2024-11-27", previousAcknowledgedOn: "2024-12-02", previousOutcome: "negative" }, "2024-11-27");
    expect(cycleState("neg").deadline).toEqual({ date: "2024-12-04", basis: ["§ 7 pkt 2"] });
  });

  test("part1_waiting liczy dni od przekazania części I, bez terminu", () => {
    const { at } = fresh("2024-12-09");
    savePart1("cycle-piotr", "marek", { additional: [], expectations: {} }, "2024-12-09");
    at("2024-12-12");
    const s = cycleState("cycle-piotr");
    expect(s.step).toBe("part1_waiting");
    expect(s.text).toBe("Część I czeka na potwierdzenie ocenianego od 3 dni");
    expect(s.deadline).toBeUndefined();
  });

  test("in_period pokazuje termin i podstawę z effectiveDeadline", () => {
    fresh("2024-12-09");
    const s = cycleState("cycle-ewa");
    expect(s.step).toBe("in_period");
    expect(s.deadline).toEqual({ date: "2026-11-20", basis: ["art. 81 ust. 4 ustawy"] });
  });

  test("zatwierdzona, zapoznanie, fikcja, sprzeciw i jego rozpatrzenie", () => {
    const { db, at } = fresh("2026-11-16");
    expect(cycleState("cycle-katarzyna").step).toBe("awaiting_acknowledgement");
    at("2026-11-17");
    expect(cycleState("cycle-katarzyna")).toMatchObject({ step: "acknowledged", deadline: { date: "2026-11-24" } });
    expect(cycleState("cycle-katarzyna").text).toBe("Zapoznanie potwierdzone 17.11.2026");
    at("2026-11-22");
    expect(cycleState("cycle-katarzyna")).toMatchObject({ step: "objection_filed", deadline: { date: "2026-12-04" } });
    seedEvent("objection_resolved", "cycle-katarzyna", "joanna", { outcome: "rejected" }, "2026-11-22");
    expect(cycleState("cycle-katarzyna").text).toContain("sprzeciw nieuwzględniony");

    db.query("DELETE FROM events WHERE type = 'assessment_acknowledged' AND cycle_id = 'cycle-tomasz'").run();
    seedEvent("acknowledgement_fiction", "cycle-tomasz", "anna", { reason: "would_not", deliveryMethod: "post", deliveredOn: "2026-11-13", objectionDeadline: "2026-11-20" }, "2026-11-13");
    const f = cycleState("cycle-tomasz");
    expect(f.step).toBe("fiction");
    expect(f.text).toContain("nie chciał potwierdzić");
    expect(f.text).toContain("pocztą 13.11.2026");
  });

  test("wniosek o zmianę terminu: podstawa art. 81 ust. 8 i bieżący termin", () => {
    fresh("2026-11-22");
    const s = cycleState("cycle-anna");
    expect(s.step).toBe("due_change_requested");
    expect(s.text).toContain("czeka na rozpatrzenie");
    expect(s.more).toContain("zawiadamia pracownika pisemnie");
    expect(s.deadline?.basis).toContain("art. 81 ust. 8 ustawy");
  });

  test("termin oceny po upływie jest oznaczony", () => {
    fresh("2027-06-03");
    expect(cycleState("cycle-ewa").overdue).toBe(true);
  });
});

describe("widoczność w czasie (granica date <= today)", () => {
  test("historia i obowiązek stopnia Tomasza: 11.11 jedna ocena i brak karty, 12.11 dwie oceny i karta", () => {
    const { at } = fresh("2026-11-11");
    expect(assessmentHistory("tomasz")).toHaveLength(1);
    expect(mandatoryGradeOf("tomasz")).toBeNull();
    at("2026-11-12");
    expect(assessmentHistory("tomasz")).toHaveLength(2);
    expect(mandatoryGradeOf("tomasz")).toMatchObject({ dueOn: "2026-12-14", fromGrade: 5, toGrade: 6 });
    at("2026-11-13");
    expect(assessmentHistory("tomasz")).toHaveLength(2);
    expect(mandatoryGradeOf("tomasz")).not.toBeNull();
  });

  test("sprzeciw Katarzyny widoczny od 20.11", () => {
    const { at } = fresh("2026-11-19");
    expect(cycleState("cycle-katarzyna").step).toBe("acknowledged");
    at("2026-11-20");
    expect(cycleState("cycle-katarzyna").step).toBe("objection_filed");
  });
});
