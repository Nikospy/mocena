import { describe, expect, test } from "bun:test";
import { cycleCriteria, part1Status } from "../cycles/part1";
import { visibleEvents } from "../events";
import { openCycle } from "../cycles";
import { createTestApp } from "../test-helpers";

describe("dane części I", () => {
  test("bez opcji: Piotr bez części I; Ewa i Tomasz potwierdzeni; arkusze i rodzaje stanowisk", () => {
    const { db } = createTestApp({ today: "2024-12-09" });
    expect(part1Status(openCycle("piotr")!.id).state).toBe("not_started");
    expect(part1Status("cycle-ewa").state).toBe("confirmed");
    expect(part1Status("cycle-tomasz").state).toBe("confirmed");
    const ewa = visibleEvents("cycle-ewa").find((e) => e.type === "part1_submitted")!;
    expect(ewa.actorId).toBe("poprzedni-naczelnik");
    expect(ewa.date).toBe("2024-12-02");
    expect((db.query("SELECT appraiser_id FROM cycles WHERE id = 'cycle-ewa'").get() as any).appraiser_id).toBe("marek");
    expect(cycleCriteria("cycle-ewa").map((c) => c.id)).toContain("orientacja-na-klienta");
    const sheet = (id: string) => (db.query("SELECT sheet FROM cycles WHERE id = ?").get(id) as any).sheet;
    expect([sheet("cycle-ewa"), sheet("cycle-tomasz")]).toEqual(["C", "B"]);
    expect(db.query("SELECT id FROM people WHERE position_kind IS NULL").all()).toEqual([]);
    expect((db.query("SELECT position_kind FROM people WHERE id = 'katarzyna'").get() as any).position_kind).toBe("staff");
  });

  test("afterStep1: część I Piotra potwierdzona 2024-12-09", () => {
    createTestApp({ today: "2024-12-09", seedOptions: { afterStep1: true } });
    const id = openCycle("piotr")!.id;
    expect(part1Status(id).state).toBe("confirmed");
    const ev = visibleEvents(id);
    expect(ev.find((e) => e.type === "part1_submitted")!.date).toBe("2024-12-09");
    expect(ev.find((e) => e.type === "part1_confirmed")!.date).toBe("2024-12-09");
    const ids = cycleCriteria(id).map((c) => c.id);
    expect(ids).toContain("orientacja-na-klienta");
    expect(ids).toContain("myslenie-analityczne");
  });
});
