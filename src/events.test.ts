import { beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { setDb, getDb } from "./db";
import { runSeed } from "./seed";
import { recordEvent, seedEvent, visibleEvents, visibleEventsOfType } from "./events";
import { setting, today } from "./settings";
import { currentGrade } from "./people";
import { effectiveDeadline, openCycle } from "./cycles";
import { homeTasks, registerHomeTasks } from "./home-tasks";
import { cycleLinks, registerCycleLinks } from "./cycle-links";

function setToday(d: string) {
  getDb().query("UPDATE settings SET value = ? WHERE key = 'demo_date'").run(d);
}

beforeEach(() => {
  runSeed(new Database(":memory:"));
});

describe("widoczność zdarzeń", () => {
  test("zdarzenie z przyszłości odsłania się z datą systemową", () => {
    const id = seedEvent("part1_confirmed", "cycle-piotr", "piotr", { place: "x", appraiseeName: "y" }, "2025-06-02");
    const seen = () => visibleEvents("cycle-piotr").some((e) => e.id === id);
    for (const [d, expected] of [["2024-12-09", false], ["2025-06-01", false], ["2025-06-02", true], ["2026-03-11", true]] as const) {
      setToday(d);
      expect(seen()).toBe(expected);
    }
    setToday("2024-12-09");
    expect(visibleEvents("cycle-piotr", { asOf: "2025-06-02" }).some((e) => e.id === id)).toBe(true);
    expect(visibleEvents("cycle-piotr").some((e) => e.id === id)).toBe(false);
  });

  test("null zwraca zdarzenia bez cyklu; typ ze wszystkich cykli", () => {
    seedEvent("absence_recorded", null, "joanna", { n: 1 }, "2024-12-01");
    expect(visibleEvents(null).map((e) => e.type)).toEqual(["absence_recorded"]);
    expect(visibleEvents(null)[0].payload).toEqual({ n: 1 });
    expect(visibleEventsOfType("cycle_started").map((e) => e.cycleId)).toEqual(expect.arrayContaining(["cycle-piotr", "cycle-ewa", "cycle-tomasz"]));
  });

  test("recordEvent dostaje datę systemową", () => {
    setToday("2026-03-11");
    recordEvent("x", null, "marek", {});
    expect(visibleEvents(null)[0].date).toBe("2026-03-11");
  });

  test("today i setting", () => {
    expect(today()).toBe("2024-12-09");
    expect(setting("office_city")).toBeTruthy();
    expect(setting("brak")).toBeNull();
  });
});

describe("currentGrade", () => {
  test("z people, potem z mandatory_grade_awarded, z asOf", () => {
    expect(currentGrade("tomasz")).toEqual({ grade: "V", awardedOn: "2022-12-01" });
    expect(currentGrade("tomasz", { asOf: "2022-11-30" })).toEqual({ grade: null, awardedOn: null });
    seedEvent("mandatory_grade_awarded", "cycle-tomasz", "joanna", { personId: "tomasz", fromGrade: "V", toGrade: "VI", basis: "x" }, "2024-12-09");
    expect(currentGrade("tomasz")).toEqual({ grade: "VI", awardedOn: "2024-12-09" });
    expect(currentGrade("tomasz", { asOf: "2024-01-01" })).toEqual({ grade: "V", awardedOn: "2022-12-01" });
  });
});

describe("cykle", () => {
  test("openCycle i zamknięcie przez potwierdzenie", () => {
    expect(openCycle("piotr")?.id).toBe("cycle-piotr");
    expect(openCycle("maria")).toBeNull();
    seedEvent("assessment_acknowledged", "cycle-piotr", "piotr", {}, "2025-06-02");
    expect(openCycle("piotr")?.id).toBe("cycle-piotr");
    setToday("2025-06-02");
    expect(openCycle("piotr")).toBeNull();
  });

  test("effectiveDeadline Piotra", () => {
    const d = effectiveDeadline("cycle-piotr", { asOf: "2026-03-11" });
    expect(d.date).toBe("2026-11-27");
    expect(d.basis.length).toBeGreaterThan(0);
  });

  test("ponowna ocena po negatywnej liczy się od zapoznania", () => {
    seedEvent("cycle_started", "cycle-ewa", "marek", { reason: "previous_assessment", periodStart: "2024-11-20", previousAssessmentOn: "2024-11-15", previousAcknowledgedOn: "2024-11-20", previousOutcome: "negative" }, "2024-12-01");
    expect(effectiveDeadline("cycle-ewa").date).toBe("2025-05-20");
  });
});

describe("rejestry i seed", () => {
  test("homeTasks i cycleLinks zbierają zarejestrowane funkcje", () => {
    const offTasks = registerHomeTasks((p) => [{ title: `a-${p.id}`, href: "/a" }]);
    const offLinks = registerCycleLinks((c) => [{ label: c.id, href: "/c" }]);
    const marek = { id: "marek" } as any;
    expect(homeTasks(marek).map((t) => t.title)).toContain("a-marek");
    expect(cycleLinks({ id: "c1" } as any, marek).map((l) => l.label)).toContain("c1");
    offTasks();
    offLinks();
  });

  test("runSeed wgrywa siedem kont", () => {
    const n = getDb().query("SELECT COUNT(*) n FROM people WHERE has_account = 1").get() as { n: number };
    expect(n.n).toBe(7);
  });
});
