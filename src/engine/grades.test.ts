import { describe, expect, test } from "bun:test";
import { mandatoryGrade, type GradeAssessment, type MandatoryGradeInput } from "./grades";

const HIGH = "powyżej oczekiwań";
const TOP = "znacznie powyżej oczekiwań";
const MID = "na poziomie oczekiwań";

const a = (cycleId: string, approvedOn: string, over: Partial<GradeAssessment> = {}): GradeAssessment => ({
  cycleId,
  approvedOn,
  outcome: "positive",
  overallLevel: HIGH,
  acknowledgedOn: approvedOn,
  ...over,
});

const input = (assessments: GradeAssessment[], over: Partial<MandatoryGradeInput> = {}): MandatoryGradeInput => ({
  isAppointed: true,
  currentGrade: 5,
  currentGradeOn: "2022-12-01",
  assessments,
  ...over,
});

const TODAY = "2026-11-22";

describe("stopień z mocy prawa (art. 89 ust. 2 ustawy)", () => {
  test("Tomasz: dwie oceny, zapoznanie 12.11.2026, termin z soboty 12.12 przechodzi na poniedziałek 14.12.2026", () => {
    const r = mandatoryGrade(input([a("c1", "2024-11-12"), a("c2", "2026-11-12")]), TODAY)!;
    expect(r.dueOn).toBe("2026-12-14");
    expect(r.fromGrade).toBe(5);
    expect(r.toGrade).toBe(6);
    expect(r.cycleId).toBe("c2");
    expect(r.assessmentDates).toEqual(["2024-11-12", "2026-11-12"]);
    expect(r.overdue).toBe(false);
    expect(mandatoryGrade(input([a("c1", "2024-11-12"), a("c2", "2026-11-12")]), "2026-12-15")!.overdue).toBe(true);
  });

  test("wysoka ocena negatywna nie tworzy pary", () => {
    expect(mandatoryGrade(input([a("c1", "2024-11-12", { outcome: "negative" }), a("c2", "2026-11-12")]), TODAY)).toBeNull();
  });

  test("ocena pośrodku rozbija parę", () => {
    expect(mandatoryGrade(input([a("c1", "2023-01-10"), a("c2", "2024-11-12", { overallLevel: MID }), a("c3", "2026-11-12")]), TODAY)).toBeNull();
  });

  test("każda z dwóch ocen może być na innym z dwóch najwyższych poziomów", () => {
    expect(mandatoryGrade(input([a("c1", "2024-11-12", { overallLevel: TOP }), a("c2", "2026-11-12")]), TODAY)).not.toBeNull();
  });

  test("bez zapoznania z drugą oceną nie ma obowiązku; po zapoznaniu jest, a fikcja liczy się jak zapoznanie", () => {
    const pending = [a("c1", "2024-11-12"), a("c2", "2026-11-12", { acknowledgedOn: null })];
    expect(mandatoryGrade(input(pending), TODAY)).toBeNull();
    const done = [a("c1", "2024-11-12"), a("c2", "2026-11-12", { acknowledgedOn: "2026-11-16" })];
    expect(mandatoryGrade(input(done), TODAY)!.dueOn).toBe("2026-12-16");
  });

  test("późniejsza ocena nie kasuje obowiązku, który już powstał", () => {
    const r = mandatoryGrade(input([a("c1", "2024-11-12"), a("c2", "2026-11-12"), a("c3", "2028-11-12", { overallLevel: MID })]), "2028-12-01");
    expect(r?.cycleId).toBe("c2");
    expect(r?.overdue).toBe(true);
  });

  test("pracownik niemianowany nie ma obowiązku", () => {
    expect(mandatoryGrade(input([a("c1", "2024-11-12"), a("c2", "2026-11-12")], { isAppointed: false }), TODAY)).toBeNull();
  });

  test("oceny sprzed bieżącego stopnia się nie liczą", () => {
    expect(mandatoryGrade(input([a("c1", "2024-11-12"), a("c2", "2026-11-12")], { currentGrade: 6, currentGradeOn: "2026-11-13" }), TODAY)).toBeNull();
    expect(mandatoryGrade(input([a("c1", "2022-11-12"), a("c2", "2026-11-12")], { currentGradeOn: "2022-12-01" }), TODAY)).toBeNull();
  });

  test("najwyższy stopień: obowiązek bez kolejnego stopnia", () => {
    const r = mandatoryGrade(input([a("c1", "2024-11-12"), a("c2", "2026-11-12")], { currentGrade: 9 }), TODAY)!;
    expect(r.atMaxGrade).toBe(true);
    expect(r.toGrade).toBeNull();
  });
});
