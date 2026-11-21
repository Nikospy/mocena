import { describe, expect, test } from "bun:test";
import { effectiveDeadline } from "../cycles";
import { rulesVersion } from "../engine/rules";
import { visibleEvents } from "../events";
import { createTestApp } from "../test-helpers";
import { confirmPart1, cycleCriteria, part1Status, saveCriteria, savePart1, submitPart1 } from "./part1";

const piotr = "cycle-piotr";
const input = { additional: ["orientacja-na-klienta", "myslenie-analityczne"], expectations: { "orientacja-na-klienta": "Szybko." } };

describe("część I", () => {
  test("zapis 2 dodatkowych daje 7 wierszy i szkic; 4 dodatkowe, powtórka, obowiązkowe → błędy bez zapisu", () => {
    createTestApp({ today: "2024-12-09" });
    expect(saveCriteria(piotr, "marek", input)).toEqual({ ok: true });
    expect(cycleCriteria(piotr)).toHaveLength(7);
    expect(part1Status(piotr).state).toBe("draft");
    const bad = [
      ["orientacja-na-klienta", "myslenie-analityczne", "negocjowanie", "kreatywnosc"],
      ["negocjowanie", "negocjowanie"],
      ["komunikacja"],
    ];
    for (const additional of bad) {
      const r = saveCriteria(piotr, "marek", { additional, expectations: {} });
      expect(r.ok).toBe(false);
    }
    expect(cycleCriteria(piotr)).toHaveLength(7);
  });

  test("submitPart1: zły input albo zły aktor nie zapisuje nic", () => {
    createTestApp({ today: "2024-12-09" });
    expect(submitPart1(piotr, "marek", { additional: ["komunikacja"], expectations: {} }).ok).toBe(false);
    expect(submitPart1(piotr, "anna", input).ok).toBe(false);
    expect(cycleCriteria(piotr)).toHaveLength(0);
    expect(visibleEvents(piotr).some((e) => e.type === "part1_submitted")).toBe(false);
  });

  test("submitPart1: kryteria, jedno zdarzenie z migawką terminu i wersją reguł; potem blokada", () => {
    createTestApp({ today: "2024-12-09" });
    expect(submitPart1(piotr, "marek", input)).toEqual({ ok: true });
    const evs = visibleEvents(piotr).filter((e) => e.type === "part1_submitted");
    expect(evs).toHaveLength(1);
    expect(evs[0].date).toBe("2024-12-09");
    expect(evs[0].payload.dueDate).toBe(effectiveDeadline(piotr).date);
    expect(evs[0].payload.rulesVersion).toEqual(rulesVersion());
    expect(cycleCriteria(piotr).find((c) => c.id === "orientacja-na-klienta")!.expectation).toBe("Szybko.");
    expect(part1Status(piotr).state).toBe("submitted");
    expect(submitPart1(piotr, "marek", input).ok).toBe(false);
    expect(saveCriteria(piotr, "marek", input).ok).toBe(false);
  });

  test("confirmPart1: tylko oceniany, tylko po przekazaniu, raz", () => {
    createTestApp({ today: "2024-12-09" });
    expect(confirmPart1(piotr, "piotr").ok).toBe(false);
    submitPart1(piotr, "marek", input);
    expect(confirmPart1(piotr, "ewa").ok).toBe(false);
    expect(confirmPart1(piotr, "piotr")).toEqual({ ok: true });
    const e = visibleEvents(piotr).find((x) => x.type === "part1_confirmed")!;
    expect(e.payload).toEqual({ place: "Rzeszów", appraiseeName: "Piotr Wójcik" });
    expect(confirmPart1(piotr, "piotr").ok).toBe(false);
  });

  test("savePart1 nie sprawdza aktora i dobiera arkusz z rodzaju stanowiska", () => {
    const { db } = createTestApp({ today: "2024-12-09" });
    savePart1(piotr, "poprzedni-naczelnik", { additional: [], expectations: {} }, "2024-12-02");
    expect((db.query("SELECT sheet FROM cycles WHERE id = ?").get(piotr) as any).sheet).toBe("C");
    expect(visibleEvents(piotr).find((e) => e.type === "part1_submitted")!.actorId).toBe("poprzedni-naczelnik");
  });

  test("po ocenie negatywnej migawka terminu to 6 miesięcy od zapoznania", () => {
    const { db } = createTestApp({ today: "2024-12-09" });
    db.query("INSERT INTO events (type, cycle_id, actor_id, date, payload) VALUES ('cycle_started','cycle-piotr','marek','2024-12-09', ?)").run(
      JSON.stringify({ reason: "previous_assessment", periodStart: "2024-11-27", previousAssessmentOn: "2024-11-27", previousAcknowledgedOn: "2024-12-01", previousOutcome: "negative" }),
    );
    savePart1(piotr, "marek", { additional: [], expectations: {} }, "2024-12-09");
    const p = visibleEvents(piotr).find((e) => e.type === "part1_submitted")!.payload;
    expect(p.dueDate).toBe("2025-06-01");
  });
});
