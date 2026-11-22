import { Database } from "bun:sqlite";
import { createSchema } from "./db";
import { runSeed } from "./seed";

const file = process.env.MOCENA_DB ?? "mocena.sqlite";
const args = process.argv.slice(2);
const db = new Database(file, { create: true });
createSchema(db);
try {
  db.transaction(() => {
    const demo = db.query("SELECT 1 FROM settings WHERE key = 'demo_date'").get();
    if (!demo && db.query("SELECT 1 FROM settings UNION ALL SELECT 1 FROM people LIMIT 1").get()) {
      throw new Error("Ta baza zawiera dane urzędu. Do pokazu wskaż osobny plik przez MOCENA_DB.");
    }
    const tables = db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
    for (const { name } of tables) db.exec(`DELETE FROM "${name.replaceAll('"', '""')}"`);
    db.exec("DELETE FROM sqlite_sequence");
    runSeed(db, { liveStep2: args.includes("--live-step-2"), afterStep1: args.includes("--after-step-1") });
  }).immediate();
  console.log(`Dane pokazowe wgrane do ${file}`);
} catch (error) {
  db.close();
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
