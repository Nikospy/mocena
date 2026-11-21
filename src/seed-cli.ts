import { Database } from "bun:sqlite";
import { rmSync } from "node:fs";
import { createSchema } from "./db";
import { runSeed } from "./seed";

const file = process.env.MOCENA_DB ?? "mocena.sqlite";
for (const f of [file, `${file}-wal`, `${file}-shm`]) rmSync(f, { force: true });
const args = process.argv.slice(2);
const db = new Database(file, { create: true });
createSchema(db);
runSeed(db, {
  liveStep2: args.includes("--live-step-2"),
  afterStep1: args.includes("--after-step-1"),
});
console.log(`Dane pokazowe wgrane do ${file}`);
