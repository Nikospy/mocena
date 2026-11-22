import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSchema, withDb } from "./db";
import app from "./local";
import { call } from "./routes/hr-test-helpers";
import { today } from "./settings";

test("pusta baza pokazuje ekran pierwszego uruchomienia z instrukcją", async () => {
  const db = new Database(":memory:");
  createSchema(db);
  try {
    await withDb(db, async () => {
      expect(today()).toBe(new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" }));
      const root = await app.request("/", { redirect: "manual" });
      expect(root.headers.get("location")).toBe("/account");
      const response = await app.request("/account");
      expect(response.status).toBe(200);
      const page = await response.text();
      expect(page).toContain("Pierwsze uruchomienie");
      expect(page).toContain("bun run init");
      expect(page).not.toContain("/demo/date");
      expect((await app.request("/about")).status).toBe(200);
    });
  } finally {
    db.close();
  }
});

test("init zakłada jedno konto kadr, z którego można dodać przełożonego i pracownika", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mocena-init-"));
  const file = join(dir, "office.sqlite");
  const env = { ...process.env, MOCENA_DB: file };
  const init = () => Bun.spawnSync([process.execPath, "run", "init", "--", "--office", "Urząd Testowy", "--city", "Rzeszów", "--hr", "Agnieszka Przykład"], { env });
  try {
    const result = init();
    expect(result.stderr.toString()).not.toContain("Ta baza");
    expect(result.exitCode).toBe(0);
    expect(init().exitCode).toBe(1);
    expect(Bun.spawnSync([process.execPath, "run", "seed"], { env }).exitCode).toBe(1);
    const db = new Database(file);
    try {
      await withDb(db, async () => {
        expect(db.query("SELECT name, role FROM people WHERE has_account = 1").all()).toEqual([{ name: "Agnieszka Przykład", role: "hr" }]);
        const account = await app.request("/account");
        expect(account.status).toBe(200);
        const page = await account.text();
        expect(page).toContain("Agnieszka Przykład");
        expect(page).not.toMatch(/demo\/date|demo\/restart|konto pokazowe/);
        const login = await call(app, "", "/account", { person_id: "first-hr" });
        expect(login.headers.get("set-cookie")).toContain("person_id=first-hr");
        expect((await call(app, "first-hr", "/hr/people/new")).status).toBe(200);
        const unit = "Wydział Organizacyjny";
        const manager = await call(app, "first-hr", "/hr/people", { name: "Adam Przełożony", position_title: "Naczelnik", unit, is_appraiser: "1" });
        expect(manager.status).toBe(303);
        const worker = await call(app, "first-hr", "/hr/people", {
          name: "Beata Przykład", position_title: "Specjalistka", unit, supervisor_id: "adam-przelozony", hired_on: "2024-01-15",
        });
        expect(worker.status).toBe(303);
        expect(db.query("SELECT person_id, appraiser_id FROM cycles").all()).toEqual([{ person_id: "beata-przyklad", appraiser_id: "adam-przelozony" }]);
        expect((await call(app, "adam-przelozony", "/")).status).toBe(200);
        for (const path of ["/demo/restart", "/demo/date", "/tour/5b", "/tour/extra/fiction"]) {
          expect((await call(app, "first-hr", path, { date: "2099-01-01" })).status).toBe(403);
        }
        expect(db.query("SELECT name FROM people WHERE id = 'first-hr'").get()).toEqual({ name: "Agnieszka Przykład" });
      });
    } finally {
      db.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
