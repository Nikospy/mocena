import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { Database } from "bun:sqlite";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setDb, setDefaultDb } from "./db";
import { createTestApp } from "./test-helpers";

describe("GET /healthz", () => {
  test("200 bez ciasteczek, bez danych osobowych", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeNull();
    const body = await res.json();
    expect(body).toEqual({ status: "ok", rulesVersion: "2016-470/1", db: "ok" });
    expect(JSON.stringify(body)).not.toMatch(/Marek|Joanna|Piotr/);
  });

  test("503, gdy baza nie odpowiada", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21" });
    const orig = db.query.bind(db);
    (db as any).query = (sql: string) => {
      if (sql.startsWith("SELECT 1")) throw new Error("db down");
      return orig(sql);
    };
    const res = await app.request("/healthz");
    expect(res.status).toBe(503);
    expect((await res.json()).status).toBe("error");
  });
});

describe("GET /healthz na prawdziwie uszkodzonym pliku", () => {
  const junk = () => {
    const f = join(mkdtempSync(join(tmpdir(), "mocena-health-")), "broken.sqlite");
    writeFileSync(f, "to nie jest baza sqlite ".repeat(500));
    return f;
  };

  test("zapytanie healthz czyta plik: uszkodzona baza daje 503", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    setDb(new Database(junk()));
    const res = await app.request("/healthz");
    expect(res.status).toBe(503);
    expect((await res.json()).db).toBe("error");
  });

  test("uszkodzony plik przy starcie: 503 JSON, a nie 500 HTML", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    setDefaultDb(null as never);
    const prev = process.env.MOCENA_DB;
    process.env.MOCENA_DB = junk();
    try {
      const { default: local } = await import("./local");
      const res = await local.request("/healthz");
      expect(res.status).toBe(503);
      expect(res.headers.get("content-type")).toContain("application/json");
    } finally {
      if (prev === undefined) delete process.env.MOCENA_DB;
      else process.env.MOCENA_DB = prev;
      void app;
    }
  });
});

describe("docs/operations.md", () => {
  test("opisuje kopię, przywracanie i aktualizację oraz /healthz", () => {
    const doc = readFileSync("docs/operations.md", "utf8");
    for (const t of ["Kopia", "Przywracanie", "Aktualizacja", "/healthz", ".backup"]) expect(doc).toContain(t);
  });

  test("README i /about linkują instrukcję", async () => {
    expect(readFileSync("README.md", "utf8")).toContain("docs/operations.md");
    const { app } = createTestApp({ today: "2026-11-21" });
    expect(await (await app.request("/about")).text()).toContain("docs/operations.md");
  });
});
