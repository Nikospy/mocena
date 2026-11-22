import { Database } from "bun:sqlite";

let db: Database | null = null;

export function createSchema(d: Database): void {
  d.exec(`
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, position_title TEXT, unit TEXT,
  supervisor_id TEXT, has_account INTEGER NOT NULL DEFAULT 0, appointed INTEGER NOT NULL DEFAULT 0,
  civil_service_grade TEXT, grade_awarded_on TEXT,
  position_kind TEXT, duty_types TEXT NOT NULL DEFAULT '[]', appointed_year INTEGER
);
CREATE TABLE IF NOT EXISTS cycles (
  id TEXT PRIMARY KEY, person_id TEXT NOT NULL, appraiser_id TEXT NOT NULL, period_start TEXT NOT NULL, sheet TEXT
);
CREATE TABLE IF NOT EXISTS cycle_criteria (
  cycle_id TEXT NOT NULL, criterion_id TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('mandatory','additional')),
  expectation TEXT, PRIMARY KEY (cycle_id, criterion_id)
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, cycle_id TEXT, actor_id TEXT,
  date TEXT NOT NULL, payload TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS events_date ON events (date, id);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, author_id TEXT NOT NULL, subject_id TEXT NOT NULL, cycle_id TEXT,
  criterion_id TEXT NOT NULL, date TEXT NOT NULL, text TEXT NOT NULL,
  rating TEXT CHECK (rating IN ('good','needs_improvement') OR rating IS NULL),
  task_change INTEGER NOT NULL DEFAULT 0, suggested_task_change INTEGER,
  suggestion_source TEXT NOT NULL DEFAULT 'none', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS notes_subject_date ON notes (subject_id, date);
CREATE INDEX IF NOT EXISTS notes_author_date ON notes (author_id, date);
CREATE TABLE IF NOT EXISTS feedback_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, note_id INTEGER NOT NULL, author_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL, sent_on TEXT NOT NULL, text TEXT NOT NULL
);
`);
}

export function setDb(d: Database): void {
  db = d;
}

export function getDb(): Database {
  if (!db) {
    db = new Database(process.env.MOCENA_DB ?? "mocena.sqlite", { create: true });
    createSchema(db);
  }
  return db;
}
