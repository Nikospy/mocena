import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { protectedOfficeStats } from "./stats";
import { hideSmall, protectGroups, protectOne, type PrivacyGroup } from "./stats-privacy";

describe("stats-privacy (próg minimalnej grupy)", () => {
  test("hideSmall ukrywa tylko niepuste grupy poniżej progu", () => {
    expect(hideSmall(0, 5)).toBe(false);
    expect(hideSmall(1, 5)).toBe(true);
    expect(hideSmall(4, 5)).toBe(true);
    expect(hideSmall(5, 5)).toBe(false);
    expect(hideSmall(12, 5)).toBe(false);
  });

  test("protectOne ukrywa pojedynczy wynik dla małej liczby osób", () => {
    expect(protectOne(0, 0, 5)).toBe(0);
    expect(protectOne(2, 6, 5)).toBeNull();
    expect(protectOne(5, 5, 5)).toBe(5);
  });

  test("protectGroups ukrywa małe grupy i dopełnienie, gdy ukryta byłaby dokładnie jedna", () => {
    const groups: PrivacyGroup<number>[] = [
      { key: "a", label: "Grupa A", count: 2, people: 2, value: 2 },
      { key: "b", label: "Grupa B", count: 6, people: 6, value: 6 },
      { key: "c", label: "Grupa C", count: 10, people: 10, value: 10 },
      { key: "d", label: "Grupa D", count: 0, people: 0, value: 0 },
    ];
    const out = protectGroups(groups, 5);
    expect(out.find((g) => g.key === "a")?.value).toBeNull();
    // Wtórne ukrywanie: najmniejsza z pozostałych niepustych grup (B) też znika.
    expect(out.find((g) => g.key === "b")?.value).toBeNull();
    expect(out.find((g) => g.key === "c")?.value).toBe(10);
    expect(out.find((g) => g.key === "d")?.value).toBe(0);
  });

  test("protectGroups ukrywa wtórnie także przy ≥2 małych grupach, gdy ich suma < próg (przypadek A10/B1/C1)", () => {
    const groups: PrivacyGroup<number>[] = [
      { key: "a", label: "Komórka A", count: 10, people: 10, value: 10 },
      { key: "b", label: "Komórka B", count: 1, people: 1, value: 1 },
      { key: "c", label: "Komórka C", count: 1, people: 1, value: 1 },
    ];
    const out = protectGroups(groups, 5);
    // B+C = 2 < 5: bez ukrycia A z sumy ogólnej (np. 12 w innej tabeli) dałoby się wyliczyć B=1 i C=1.
    expect(out.map((g) => g.value)).toEqual([null, null, null]);

    // Gdy po ukryciu najmniejszej z pozostałych suma ukrytych osiąga ≥ 5, największa grupa może zostać widoczna.
    const four: PrivacyGroup<number>[] = [
      { key: "a", label: "Komórka A", count: 10, people: 10, value: 10 },
      { key: "b", label: "Komórka B", count: 6, people: 6, value: 6 },
      { key: "c", label: "Komórka C", count: 1, people: 1, value: 1 },
      { key: "d", label: "Komórka D", count: 1, people: 1, value: 1 },
    ];
    const outFour = protectGroups(four, 5);
    expect(outFour.find((g) => g.key === "a")?.value).toBe(10);
    expect(outFour.find((g) => g.key === "b")?.value).toBeNull();
    expect(outFour.find((g) => g.key === "c")?.value).toBeNull();
    expect(outFour.find((g) => g.key === "d")?.value).toBeNull();
  });

  test("protectGroups nie dodaje wtórnego ukrycia, gdy już są ukryte co najmniej dwie grupy o łącznej sumie ≥ próg", () => {
    const groups: PrivacyGroup<number>[] = [
      { key: "a", label: "Grupa A", count: 2, people: 2, value: 2 },
      { key: "b", label: "Grupa B", count: 3, people: 3, value: 3 },
      { key: "c", label: "Grupa C", count: 5, people: 5, value: 5 },
    ];
    const out = protectGroups(groups, 5);
    expect(out.find((g) => g.key === "a")?.value).toBeNull();
    expect(out.find((g) => g.key === "b")?.value).toBeNull();
    expect(out.find((g) => g.key === "c")?.value).toBe(5);
  });

  test("protectGroups zwraca wszystkie grupy bez zmian, gdy każda niepusta osiąga próg", () => {
    const groups: PrivacyGroup<number>[] = [
      { key: "a", label: "Grupa A", count: 5, people: 5, value: 5 },
      { key: "b", label: "Grupa B", count: 8, people: 7, value: 8 },
      { key: "c", label: "Grupa C", count: 0, people: 0, value: 0 },
    ];
    const out = protectGroups(groups, 5);
    expect(out.map((g) => g.value)).toEqual([5, 8, 0]);
  });

  test("wiele ocen tej samej osoby poniżej progu różnych osób nadal jest ukrywane", () => {
    const groups: PrivacyGroup<number>[] = [
      { key: "onTime", label: "W terminie", count: 7, people: 1, value: 7 },
      { key: "late", label: "Po terminie", count: 0, people: 0, value: 0 },
    ];
    const out = protectGroups(groups, 5);
    expect(out[0].value).toBeNull();
    expect(out[1].value).toBe(0);
  });

  test("protectedOfficeStats nie pozwala obejść progu przez odejmowanie między tabelami (A10/B1/C1 w jednym etapie)", () => {
    const { db } = createTestApp({ today: "2026-11-22" });
    // Czyścimy cykle i tworzymy dokładnie 12 osób w jednym etapie (criteria_due): A=10, B=1, C=1.
    db.exec("DELETE FROM events; DELETE FROM cycles; DELETE FROM cycle_criteria;");
    const units = [
      ...Array.from({ length: 10 }, () => "Wydział A"),
      "Wydział B",
      "Wydział C",
    ];
    units.forEach((unit, idx) => {
      const pid = `u-p-${idx}`;
      const cid = `u-c-${idx}`;
      db.query("INSERT INTO people (id, name, role, unit, position_kind) VALUES (?, ?, 'employee', ?, 'staff')").run(pid, `Osoba ${idx}`, unit);
      db.query("INSERT INTO cycles (id, person_id, appraiser_id, period_start, sheet) VALUES (?, ?, 'marek', '2026-11-01', 'C')").run(cid, pid);
      db.query("INSERT INTO events (type, cycle_id, actor_id, date, payload) VALUES ('cycle_started', ?, 'marek', '2026-11-01', ?)").run(
        cid,
        JSON.stringify({ reason: "hired", periodStart: "2026-11-01" }),
      );
    });

    const stats = protectedOfficeStats(5);
    // Tabela według etapu pokazuje 12 (wszystkie w jednym etapie ≥ 5), ale tabela według komórki ukrywa też A=10,
    // więc z różnicy 12 - 10 nie da się odtworzyć B=1 i C=1.
    expect(stats.byStep.criteria_due).toBe(12);
    expect(stats.byUnit.map((u) => [u.label, u.value])).toEqual([
      ["Wydział A", null],
      ["Wydział B", null],
      ["Wydział C", null],
    ]);
  });
});
