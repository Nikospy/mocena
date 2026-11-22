// Stany danych przewodnika pokazu: przed każdym przystankiem baza jest budowana od zera funkcjami domenowymi i seedami.
import { buildAssessmentSnapshot } from "../assessment/snapshot";
import { assessmentState, type AssessmentDraft } from "../assessment/state";
import { cycleById, startNextCycle } from "../cycles";
import { cycleCriteria, savePart1 } from "../cycles/part1";
import { setDb, type Db } from "../db";
import { objectionDeadline } from "../engine/deadlines";
import { seedEvent } from "../events";
import { formatNoteForInsert } from "../notes/insert";
import { runSeed } from "../seed";
import { suggestDevelopmentForm } from "../suggestions";

export const TOUR_STOP_IDS = ["1", "1b", "2", "3", "4", "5", "5b"] as const;
export type TourStopId = (typeof TOUR_STOP_IDS)[number];

export type TourStop = { id: TourStopId; step: 1 | 2 | 3 | 4 | 5; personId: string; date: string };

export const TOUR_STOPS: TourStop[] = [
  { id: "1", step: 1, personId: "marek", date: "2024-12-09" },
  { id: "1b", step: 1, personId: "piotr", date: "2024-12-09" },
  { id: "2", step: 2, personId: "marek", date: "2026-03-11" },
  { id: "3", step: 3, personId: "joanna", date: "2026-11-10" },
  { id: "4", step: 4, personId: "marek", date: "2026-11-21" },
  { id: "5", step: 5, personId: "piotr", date: "2026-11-22" },
  { id: "5b", step: 5, personId: "joanna", date: "2026-11-22" },
];

export function isTourStopId(v: unknown): v is TourStopId {
  return typeof v === "string" && (TOUR_STOP_IDS as readonly string[]).includes(v);
}

const CYCLE = "cycle-piotr";
const APPROVED_ON = "2026-11-21";
const ACKNOWLEDGED_ON = "2026-11-22";

/** Kryteria ze scenariusza kroku 1 (demo.md): oczekiwanie przy „Orientacji na klienta/interesanta”. */
const PART1_INPUT = {
  additional: ["orientacja-na-klienta", "myslenie-analityczne"],
  expectations: { "orientacja-na-klienta": "Odpowiedź na pismo interesanta w ciągu 3 dni roboczych." },
};

function clearAllTables(db: Db): void {
  // Ta sama lista tabel co w POST /demo/restart (src/index.tsx).
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_cf\\_%' ESCAPE '\\'")
    .all() as { name: string }[];
  for (const t of tables) db.prepare(`DELETE FROM "${t.name}"`).run();
  db.prepare("DELETE FROM sqlite_sequence").run();
}

function answerTaskChange(db: Db): void {
  const note = db.query("SELECT * FROM notes WHERE subject_id = 'piotr' AND date = '2026-03-11'").get() as
    | { id: number; cycle_id: string | null; author_id: string; criterion_id: string; date: string }
    | null;
  if (!note) throw new Error("Brak notatki Piotra z 11.03.2026");
  seedEvent("task_change_answered", note.cycle_id, note.author_id, { noteId: note.id, answer: "yes", developmentFormId: suggestDevelopmentForm(note).id }, note.date);
}

function recordPiotrAbsences(db: Db): void {
  const on = "2026-11-10";
  for (const [from, to] of [["2026-10-05", "2026-10-16"], ["2026-10-19", "2026-11-06"]]) {
    const r = db
      .query("INSERT INTO absences (person_id, date_from, date_to, excused, recorded_on, recorded_by) VALUES ('piotr', ?, ?, 1, ?, 'joanna')")
      .run(from, to, on);
    seedEvent("absence_recorded", CYCLE, "joanna", { absence_id: Number(r.lastInsertRowid), notified: ["marek", "piotr"] }, on);
  }
}

/** Ocena z „1” przy Rzetelności (krok 4 scenariusza), uzasadnienie złożone z notatek o Rzetelności, wnioski do programu rozwoju. */
function approvePiotr(db: Db): void {
  const criteria = cycleCriteria(CYCLE);
  const scores = Object.fromEntries(criteria.map((c) => [c.id, c.id === "rzetelnosc" ? 1 : 5]));
  const notes = db
    .query("SELECT date, text FROM notes WHERE subject_id = 'piotr' AND criterion_id = 'rzetelnosc' AND date <= ? ORDER BY date, id")
    .all(APPROVED_ON) as { date: string; text: string }[];
  const draft: AssessmentDraft = {
    scores,
    justification: notes.map(formatNoteForInsert).join("\n"),
    developmentConclusions: "Rozmowa o priorytetach i podziale kolejki wniosków oraz szkolenie z planowania pracy w ciągu roku.",
    interviewDate: APPROVED_ON,
    gradeRequest: { attached: false, motivation: "" },
  };
  const snapshot = buildAssessmentSnapshot(CYCLE, draft, { asOf: APPROVED_ON });
  seedEvent("assessment_approved", CYCLE, "marek", snapshot, APPROVED_ON);
}

function acknowledgePiotr(db: Db): void {
  const place = (db.query("SELECT value FROM settings WHERE key = 'office_city'").get() as { value: string }).value;
  const name = (db.query("SELECT name FROM people WHERE id = 'piotr'").get() as { name: string }).name;
  seedEvent(
    "assessment_acknowledged",
    CYCLE,
    "piotr",
    { place, date: ACKNOWLEDGED_ON, name, objectionDeadline: objectionDeadline(ACKNOWLEDGED_ON) },
    ACKNOWLEDGED_ON,
  );
  const cycle = cycleById(CYCLE)!;
  const assessment = assessmentState(CYCLE).snapshot!;
  startNextCycle(cycle, "piotr", APPROVED_ON, ACKNOWLEDGED_ON, assessment.result.outcome);
}

function build(db: Db, id: TourStopId): void {
  if (id === "1") return runSeed(db, { liveStep2: true });
  if (id === "1b") {
    runSeed(db, { liveStep2: true });
    savePart1(CYCLE, "marek", PART1_INPUT, "2024-12-09");
    return;
  }
  if (id === "2") return runSeed(db, { liveStep2: true, afterStep1: true });
  runSeed(db, { afterStep1: true });
  answerTaskChange(db);
  if (id === "3") return;
  recordPiotrAbsences(db);
  if (id === "4") return;
  approvePiotr(db);
}

/** Czyści bazę widza i buduje stan sprzed przystanku; datę ustawia wprost (z pominięciem reguły „tylko do przodu”). */
export function applyTourStop(db: Db, stop: TourStop): void {
  setDb(db);
  db.transaction(() => {
    clearAllTables(db);
    build(db, stop.id);
    db.query("INSERT INTO settings (key, value) VALUES ('demo_date', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(stop.date);
    if (stop.id === "5b") acknowledgePiotr(db);
  })();
}
