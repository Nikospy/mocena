import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";

const count = (db: any) => (db.query("SELECT COUNT(*) c FROM notes").get() as { c: number }).c;

describe("dane pokazowe notatek", () => {
  test("16 notatek, z liveStep2 15 (bez 2026-03-11)", () => {
    expect(count(createTestApp({ today: "2024-12-09" }).db)).toBe(16);
    const { db } = createTestApp({ today: "2024-12-09", seedOptions: { liveStep2: true } });
    expect(count(db)).toBe(15);
    expect(db.query("SELECT 1 FROM notes WHERE date = '2026-03-11'").get()).toBeNull();
  });

  test("autorzy, podział i task_change", () => {
    const { db } = createTestApp({ today: "2024-12-09" });
    const by = (q: string) => (db.query(q).all() as any[]).map((r) => [r.a, r.s, r.c]);
    expect(by("SELECT author_id a, subject_id s, COUNT(*) c FROM notes GROUP BY 1,2 ORDER BY 1,2")).toEqual([
      ["anna", "tomasz", 3], ["marek", "ewa", 4], ["marek", "piotr", 9],
    ]);
    expect((db.query("SELECT date FROM notes WHERE task_change = 1").all() as any[]).map((r) => r.date)).toEqual(["2026-03-11"]);
  });
});
