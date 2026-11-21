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
