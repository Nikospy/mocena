import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { assessmentState } from "../assessment/state";
import { part1Status } from "../cycles/part1";
import { createSchema, setDb } from "../db";
import { visibleEvents } from "../events";
import { TOUR_STOPS, applyTourStop, isTourStopId, type TourStop } from "./state";

function fresh() {
  const db = new Database(":memory:");
  createSchema(db);
  setDb(db);
  return db;
}
const stop = (id: string): TourStop => TOUR_STOPS.find((s) => s.id === id)!;
const count = (db: Database, sql: string) => (db.query(sql).get() as { n: number }).n;

function snapshot(db: Database) {
  const tables = ["people", "cycles", "cycle_criteria", "events", "settings", "notes", "feedback_messages", "absences"];
  return Object.fromEntries(tables.map((t) => [t, db.query(`SELECT * FROM ${t} ORDER BY rowid`).all()]));
}

function state(db: Database, id: string) {
  applyTourStop(db, stop(id));
  const part1 = part1Status("cycle-piotr").state;
  return {
    part1,
    notes: count(db, "SELECT count(*) AS n FROM notes WHERE subject_id = 'piotr'"),
    hasMarchNote: count(db, "SELECT count(*) AS n FROM notes WHERE subject_id = 'piotr' AND date = '2026-03-11'") === 1,
    absences: count(db, "SELECT count(*) AS n FROM absences WHERE person_id = 'piotr'"),
    stage: assessmentState("cycle-piotr").stage,
    demoDate: (db.query("SELECT value FROM settings WHERE key = 'demo_date'").get() as { value: string }).value,
  };
}

describe("applyTourStop", () => {
  test("stany przystanków zgadzają się z tabelą „Stany danych”", () => {
    const db = fresh();
    const s1 = state(db, "1");
    expect(s1).toMatchObject({ part1: "not_started", hasMarchNote: false, absences: 0, demoDate: "2024-12-09" });
    expect(s1.stage).toBe("no_part1");

    const s1b = state(db, "1b");
    expect(s1b).toMatchObject({ part1: "submitted", hasMarchNote: false, absences: 0, demoDate: "2024-12-09" });
    const criteria = db.query("SELECT criterion_id, expectation FROM cycle_criteria WHERE cycle_id = 'cycle-piotr' AND kind = 'additional'").all() as { criterion_id: string; expectation: string | null }[];
    expect(criteria.map((c) => c.criterion_id).sort()).toEqual(["myslenie-analityczne", "orientacja-na-klienta"]);
    expect(criteria.filter((c) => c.expectation).length).toBe(1);

    const s2 = state(db, "2");
    expect(s2).toMatchObject({ part1: "confirmed", hasMarchNote: false, absences: 0, stage: "draft", demoDate: "2026-03-11" });

    const s3 = state(db, "3");
    expect(s3).toMatchObject({ part1: "confirmed", hasMarchNote: true, absences: 0, stage: "draft", demoDate: "2026-11-10" });
    expect(s3.notes).toBe(s2.notes + 1);
    expect(visibleEvents("cycle-piotr").some((e) => e.type === "task_change_answered" && e.payload.answer === "yes")).toBe(true);

    const s4 = state(db, "4");
    expect(s4).toMatchObject({ part1: "confirmed", hasMarchNote: true, absences: 2, stage: "draft", demoDate: "2026-11-21" });

    const s5 = state(db, "5");
    expect(s5).toMatchObject({ absences: 2, stage: "approved", demoDate: "2026-11-22" });
    const a = assessmentState("cycle-piotr");
    expect(a.snapshot?.result.outcome).toBe("negative");
    expect(a.snapshot?.scores["rzetelnosc"]).toBe(1);
    expect(a.snapshot?.justification).not.toBe("");
    expect(a.snapshot?.developmentConclusions).not.toBe("");
    expect(a.acknowledgement).toBeNull();

    const s5b = state(db, "5b");
    expect(s5b).toMatchObject({ stage: "acknowledged", demoDate: "2026-11-22" });
    const ack = assessmentState("cycle-piotr").acknowledgement;
    expect(ack?.date).toBe("2026-11-22");
    expect(ack?.objectionDeadline).toBeTruthy();
  });

  test("powrót w czasie i powtórka dają ten sam stan", () => {
    const db = fresh();
    applyTourStop(db, stop("1"));
    const first = snapshot(db);
    applyTourStop(db, stop("5b"));
    applyTourStop(db, stop("1"));
    expect(snapshot(db)).toEqual(first);
    applyTourStop(db, stop("4"));
    const four = snapshot(db);
    applyTourStop(db, stop("4"));
    expect(snapshot(db)).toEqual(four);
  });

  test("lista przystanków i strażnik", () => {
    expect(TOUR_STOPS.map((s) => s.id)).toEqual(["1", "1b", "2", "3", "4", "5", "5b"]);
    expect(isTourStopId("5b")).toBe(true);
    expect(isTourStopId("6")).toBe(false);
  });
});
