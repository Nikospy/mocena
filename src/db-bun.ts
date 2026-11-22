import { Database } from "bun:sqlite";
import { createSchema, hasDb, setDefaultDb } from "./db";

/** Bun only: opens the default file database (MOCENA_DB or mocena.sqlite) unless one is already set. */
export function ensureDefaultDb(): void {
  if (hasDb()) return;
  const d = new Database(process.env.MOCENA_DB ?? "mocena.sqlite", { create: true });
  createSchema(d);
  setDefaultDb(d);
}
