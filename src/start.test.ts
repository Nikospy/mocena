import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureDemoDb } from "../scripts/start";

function tmpFile(name = "demo.sqlite") {
  return join(mkdtempSync(join(tmpdir(), "mocena-start-")), name);
}

describe("ensureDemoDb", () => {
  test("nie czyści i nie wgrywa danych do istniejącej bazy", () => {
    const file = tmpFile();
    const db = new Database(file, { create: true });
    db.exec("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT); INSERT INTO settings VALUES ('office_name', 'Mój urząd')");
    db.close();
    const before = readFileSync(file);
    let called = false;
    expect(ensureDemoDb(file, () => { called = true; })).toBe(false);
    expect(called).toBe(false);
    expect(readFileSync(file).equals(before)).toBe(true);
    const again = new Database(file);
    expect(again.query("SELECT value FROM settings WHERE key = 'office_name'").get()).toEqual({ value: "Mój urząd" });
    again.close();
  });

  test("wgrywa dane, gdy pliku nie ma albo jest pusty", () => {
    const missing = tmpFile();
    const seen: string[] = [];
    expect(ensureDemoDb(missing, (f) => seen.push(f))).toBe(true);
    const empty = tmpFile();
    writeFileSync(empty, "");
    expect(ensureDemoDb(empty, (f) => seen.push(f))).toBe(true);
    expect(seen).toEqual([missing, empty]);
  });

  test("domyślny seed zakłada działającą bazę pokazową i drugie wywołanie jej nie rusza", () => {
    const file = tmpFile();
    expect(ensureDemoDb(file)).toBe(true);
    const db = new Database(file);
    db.exec("UPDATE people SET name = 'Zmieniony' WHERE id = 'marek'");
    db.close();
    expect(ensureDemoDb(file)).toBe(false);
    const check = new Database(file);
    expect((check.query("SELECT name FROM people WHERE id = 'marek'").get() as { name: string }).name).toBe("Zmieniony");
    check.close();
  });
});

describe("README: uruchomienie", () => {
  test("jedna komenda i zdanie o Dockerze", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(readme).toContain("bun install && bun run start");
    expect(readme).toContain("Dockera pominięto celowo");
    expect(JSON.parse(readFileSync("package.json", "utf8")).scripts.start).toBe("bun run scripts/start.ts");
  });
});
