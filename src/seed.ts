import { createSchema, setDb, type Db } from "./db";
import { seedBase } from "./seed/base";
import { seedPart1 } from "./seed/part1";

export type SeedOptions = { liveStep2?: boolean; afterStep1?: boolean };

export function runSeed(db: Db, options: SeedOptions = {}): void {
  const opts = { liveStep2: options.liveStep2 ?? false, afterStep1: options.afterStep1 ?? false };
  setDb(db);
  createSchema(db);
  seedBase(opts);
  seedPart1(opts);
  // Kolejne plastry dopisują tu swoje moduły: notes, assessments, absences.
}
