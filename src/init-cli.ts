import { Database } from "bun:sqlite";
import { parseArgs } from "node:util";
import { createSchema } from "./db";
import { OFFICE_INIT_COMMAND } from "./settings";

function initialize(): void {
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  const { values } = parseArgs({
    args,
    options: { office: { type: "string" }, city: { type: "string" }, hr: { type: "string" } },
  });
  const office = values.office?.trim();
  const city = values.city?.trim();
  const hr = values.hr?.trim();
  if (!office || !city || !hr || hr.length > 120) {
    throw new Error(`Podaj nazwę urzędu, miejscowość oraz imię i nazwisko osoby z kadr (do 120 znaków).\n${OFFICE_INIT_COMMAND}`);
  }

  const db = new Database(process.env.MOCENA_DB ?? "mocena.sqlite", { create: true });
  try {
    createSchema(db);
    db.transaction(() => {
      if (db.query("SELECT 1 FROM people UNION ALL SELECT 1 FROM settings LIMIT 1").get()) {
        throw new Error("Ta baza zawiera już dane. Wskaż nowy plik przez MOCENA_DB.");
      }
      const insert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
      insert.run("office_name", office);
      insert.run("office_city", city);
      db.query("INSERT INTO people (id, name, role, position_title, unit, has_account) VALUES ('first-hr', ?, 'hr', 'Kadry', 'Wydział Kadr i Szkoleń', 1)").run(hr);
    }).immediate();
  } finally {
    db.close();
  }
  console.log("Utworzono pierwsze konto kadr. Uruchom bun run dev i wybierz konto.");
}

try {
  initialize();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
