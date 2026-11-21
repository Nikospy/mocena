import { describe, expect, test } from "bun:test";
import { effectiveDeadline } from "../cycles";
import { getDb } from "../db";
import { rulesVersion } from "../engine/rules";
import { seedEvent } from "../events";
import { currentGrade } from "../people";
import { createTestApp } from "../test-helpers";
import { buildAssessmentSnapshot } from "./snapshot";
import type { AssessmentDraft } from "./state";

const piotr = "cycle-piotr";
const draft: AssessmentDraft = {
  scores: { "wykorzystywanie-wiedzy": 7, rzetelnosc: 1, "organizacja-pracy": 7, wspolpraca: 7, komunikacja: 7, "orientacja-na-klienta": 7, "myslenie-analityczne": 7 },
  justification: "Powód.",
  developmentConclusions: "Kurs.",
  interviewDate: null,
  gradeRequest: { attached: false, motivation: "" },
};
const count = () => (getDb().query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n;

describe("buildAssessmentSnapshot", () => {
  test("bez asOf: data migawki, termin i wersja reguł z dnia today(); nic nie zapisuje", () => {
    createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const before = count();
    const s = buildAssessmentSnapshot(piotr, draft);
    expect(count()).toBe(before);
    expect(s.periodFrom).toBe("2024-11-27");
    expect(s.periodTo).toBe("2026-11-21");
    expect(s.confirmation).toEqual({ place: "Rzeszów", date: "2026-11-21", name: "Marek Zieliński" });
    expect(s.deadline).toEqual(effectiveDeadline(piotr));
    expect(s.interviewDate).toBe("2026-11-21");
    expect(s.rulesVersion).toEqual(rulesVersion());
    expect(s.criteria.map((c) => c.id)).toHaveLength(7);
    expect(s.criteria[0].kind).toBe("mandatory");
    expect(s.result.outcome).toBe("negative");
    expect(s.grade).toBeNull();
    expect(s.sheet).toBe("C");
  });

  test("z historycznym asOf: termin i stopień na tę datę, późniejsze nadanie stopnia pominięte", () => {
    createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    seedEvent("cycle_started", piotr, "marek", { reason: "previous_assessment", previousOutcome: "negative", previousAcknowledgedOn: "2025-01-10" }, "2025-06-01");
    seedEvent("mandatory_grade_awarded", "cycle-tomasz", "anna", { personId: "tomasz", fromGrade: 5, toGrade: 9, basis: "t" }, "2026-06-01");
    const d = { ...draft, gradeRequest: { attached: true, motivation: "m" } };
    const asOf = "2025-02-01";
    const s = buildAssessmentSnapshot("cycle-tomasz", d, { asOf: "2026-01-01" });
    expect(s.grade).toBe(5);
    expect(currentGrade("tomasz").grade).toBe(9);
    expect(s.gradeAwardedOn).toBe("2022-12-01");
    expect(s.gradeRequest.targetGrade).toBe(6);
    const p = buildAssessmentSnapshot(piotr, draft, { asOf });
    expect(p.periodTo).toBe(asOf);
    expect(p.deadline).toEqual(effectiveDeadline(piotr, { asOf }));
    expect(p.deadline.date).not.toBe(effectiveDeadline(piotr).date);
  });
});
