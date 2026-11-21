import { describe, expect, test } from "bun:test";
import { criterionWarnings } from "./warnings";

describe("ostrzeżenie „z ostatniego miesiąca”", () => {
  const base = { today: "2026-11-21", windowMonths: 1 };
  test("jedna notatka sprzed 9 dni → recent_only", () => {
    expect(criterionWarnings({ ...base, notes: [{ date: "2026-11-12" }] })).toEqual(["recent_only"]);
  });
  test("notatka dokładnie sprzed miesiąca jest już starsza → brak", () => {
    expect(criterionWarnings({ ...base, notes: [{ date: "2026-10-21" }] })).toEqual([]);
  });
  test("brak notatek → brak ostrzeżenia", () => {
    expect(criterionWarnings({ ...base, notes: [] })).toEqual([]);
  });
});

describe("ostrzeżenie o ocenie skrajnej", () => {
  const base = { today: "2026-11-21", windowMonths: 1 };
  test("ocena 1 bez notatek → extreme_without_facts; z notatką → brak", () => {
    expect(criterionWarnings({ ...base, notes: [], score: 1 })).toEqual(["extreme_without_facts"]);
    expect(criterionWarnings({ ...base, notes: [{ date: "2025-01-01" }], score: 1 })).toEqual([]);
    expect(criterionWarnings({ ...base, notes: [], score: 5 })).toEqual([]);
    expect(criterionWarnings({ ...base, notes: [] })).toEqual([]);
  });
});
