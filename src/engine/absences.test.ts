import { describe, expect, test } from "bun:test";
import { assessmentDeadline, isLongerThanMonth, mergeAbsences, type AbsenceInput } from "./absences";
import { periodEndAfterNegative } from "./deadlines";

const abs = (from: string, to: string, excused = true): AbsenceInput => ({ from, to, excused });
const regular = (periodStart: string) => ({ kind: "regular" as const, periodStart, previousAcknowledgedOn: null });

describe("mergeAbsences", () => {
  test("przykład organizatora: dwa wpisy rozdzielone weekendem to jedna nieobecność 33 dni", () => {
    const m = mergeAbsences([abs("2026-10-19", "2026-11-06"), abs("2026-10-05", "2026-10-16")]);
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ from: "2026-10-05", to: "2026-11-06", days: 33, longerThanMonth: true });
    expect(m[0].parts).toHaveLength(2);
  });

  test("każdy wpis osobno nie przekracza miesiąca", () => {
    expect(isLongerThanMonth("2026-10-05", "2026-10-16")).toBe(false);
    expect(isLongerThanMonth("2026-10-19", "2026-11-06")).toBe(false);
  });

  test("przerwa z dniem roboczym nie łączy", () => {
    const m = mergeAbsences([abs("2026-10-05", "2026-10-16"), abs("2026-10-20", "2026-11-06")]);
    expect(m.map((x) => x.days)).toEqual([12, 18]);
    expect(assessmentDeadline(regular("2024-11-27"), [abs("2026-10-05", "2026-10-16"), abs("2026-10-20", "2026-11-06")]).extensionDays).toBe(0);
  });

  test("nieusprawiedliwiony wpis w przerwie przerywa ciągłość", () => {
    const list = [abs("2026-10-05", "2026-10-16"), abs("2026-10-19", "2026-10-20", false), abs("2026-10-21", "2026-11-06")];
    expect(mergeAbsences(list).map((x) => x.days)).toEqual([12, 17]);
    expect(assessmentDeadline(regular("2024-11-27"), list).extensionDays).toBe(0);
  });

  test("święto w środku tygodnia łączy", () => {
    const m = mergeAbsences([abs("2026-11-09", "2026-11-10"), abs("2026-11-12", "2026-11-13")]);
    expect(m).toHaveLength(1);
    expect(m[0].days).toBe(5);
  });

  test("wpisy nachodzące i stykające się łączą się niezależnie od kolejności", () => {
    const m = mergeAbsences([abs("2026-03-10", "2026-03-20"), abs("2026-03-01", "2026-03-12"), abs("2026-03-21", "2026-03-25")]);
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ from: "2026-03-01", to: "2026-03-25", days: 25 });
  });

  test("„Do” przed „Od” i zła data rzucają błąd", () => {
    expect(() => mergeAbsences([abs("2026-03-10", "2026-03-09")])).toThrow();
    expect(() => mergeAbsences([abs("2026-02-30", "2026-03-09")])).toThrow();
  });
});

describe("isLongerThanMonth", () => {
  test("koniec miesiąca: porównanie ścisłe", () => {
    expect(isLongerThanMonth("2026-10-05", "2026-11-04")).toBe(false);
    expect(isLongerThanMonth("2026-10-05", "2026-11-05")).toBe(true);
    expect(isLongerThanMonth("2026-01-31", "2026-02-27")).toBe(false);
    expect(isLongerThanMonth("2026-01-31", "2026-02-28")).toBe(true);
  });
});

describe("assessmentDeadline", () => {
  test("przykład organizatora: 27.11.2026 → 30.12.2026", () => {
    const r = assessmentDeadline(regular("2024-11-27"), [abs("2026-10-05", "2026-10-16"), abs("2026-10-19", "2026-11-06")]);
    expect(r).toMatchObject({ base: "2026-11-27", extensionDays: 33, deadline: "2026-12-30", movedToWorkingDay: false });
    expect(r.merged).toHaveLength(1);
    expect(r.merged[0].counted).toBe(true);
  });

  test("druga długa nieobecność w przedłużonym okresie przedłuża znowu", () => {
    const list = [abs("2026-10-05", "2026-11-06"), abs("2026-12-07", "2027-01-15")];
    const r = assessmentDeadline(regular("2024-11-27"), list);
    expect(r.extensionDays).toBe(73);
    expect(r.deadline).toBe("2027-02-08");
  });

  test("nieobecność zaczęta po bieżącym surowym końcu nie przedłuża", () => {
    const list = [abs("2026-10-05", "2026-11-06"), abs("2027-01-04", "2027-02-26")];
    const r = assessmentDeadline(regular("2024-11-27"), list);
    expect(r.deadline).toBe("2026-12-30");
  });

  test("zaokrąglenie do dnia roboczego raz, po przedłużeniu", () => {
    const list = [abs("2025-05-05", "2025-06-06")];
    const a = assessmentDeadline(regular("2024-03-14"), list);
    expect(a.deadline).toBe("2026-04-16");
    expect(a.movedToWorkingDay).toBe(false);
    const b = assessmentDeadline(regular("2024-03-16"), list);
    expect(b.deadline).toBe("2026-04-20");
    expect(b.movedToWorkingDay).toBe(true);
  });

  test("Ewa: 194 dni → 2027-06-02", () => {
    const r = assessmentDeadline(regular("2024-11-20"), [abs("2026-02-16", "2026-08-28")]);
    expect(r).toMatchObject({ base: "2026-11-20", extensionDays: 194, deadline: "2027-06-02" });
  });

  test("nieobecność zaczęta przed okresem liczy dni od jego początku, a próg całej nieobecności", () => {
    const r = assessmentDeadline(regular("2024-11-27"), [abs("2024-11-01", "2024-12-10")]);
    expect(r.extensionDays).toBe(14);
    expect(assessmentDeadline(regular("2024-11-27"), [abs("2024-11-01", "2024-11-26")]).extensionDays).toBe(0);
  });

  test("ponowna ocena po negatywnej: termin z periodEndAfterNegative, bez przedłużenia", () => {
    const cycle = { kind: "after_negative" as const, periodStart: "2026-01-10", previousAcknowledgedOn: "2026-01-10" };
    const r = assessmentDeadline(cycle, [abs("2026-02-01", "2026-04-30")]);
    expect(r.base).toBe(periodEndAfterNegative("2026-01-10"));
    expect(r.deadline).toBe(r.base);
    expect(r.extensionDays).toBe(0);
    expect(r.merged[0].counted).toBe(false);
  });
});
