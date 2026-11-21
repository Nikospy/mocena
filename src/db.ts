import { Database } from "bun:sqlite";

let db: Database | null = null;

export function createSchema(d: Database): void {
  d.exec(`
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, position_title TEXT, unit TEXT,
  supervisor_id TEXT, has_account INTEGER NOT NULL DEFAULT 0, appointed INTEGER NOT NULL DEFAULT 0,
  civil_service_grade TEXT, grade_awarded_on TEXT,
  position_kind TEXT, duty_types TEXT NOT NULL DEFAULT '[]'
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
