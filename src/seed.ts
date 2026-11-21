import { Database } from "bun:sqlite";
import { rmSync } from "node:fs";
import { createSchema, setDb } from "./db";
import { seedBase } from "./seed/base";
import { seedPart1 } from "./seed/part1";

export type SeedOptions = { liveStep2?: boolean; afterStep1?: boolean };

export function runSeed(db: Database, options: SeedOptions = {}): void {
  const opts = { liveStep2: options.liveStep2 ?? false, afterStep1: options.afterStep1 ?? false };
  setDb(db);
  createSchema(db);
  seedBase(opts);
  seedPart1(opts);
  // Kolejne plastry dopisują tu swoje moduły: notes, assessments, absences.
}

if (import.meta.main) {
  const file = process.env.MOCENA_DB ?? "mocena.sqlite";
  for (const f of [file, `${file}-wal`, `${file}-shm`]) rmSync(f, { force: true });
  const args = process.argv.slice(2);
  runSeed(new Database(file, { create: true }), {
    liveStep2: args.includes("--live-step-2"),
    afterStep1: args.includes("--after-step-1"),
  });
  console.log(`Dane pokazowe wgrane do ${file}`);
}
