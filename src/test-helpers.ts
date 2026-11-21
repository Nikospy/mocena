import { Database } from "bun:sqlite";
import { createSchema, setDb } from "./db";
import app from "./index";
import { runSeed, type SeedOptions } from "./seed";

export function createTestApp(opts: { today?: string; seedOptions?: SeedOptions } = {}) {
  const db = new Database(":memory:");
  createSchema(db);
  setDb(db);
  runSeed(db, opts.seedOptions ?? {});
  if (opts.today) {
    db.query("INSERT INTO settings (key, value) VALUES ('demo_date', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(opts.today);
  }
  return { app, db };
}
