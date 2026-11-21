import { describe, expect, test } from "bun:test";
import { createTestApp } from "./test-helpers";
import { today } from "./settings";

async function login(app: ReturnType<typeof createTestApp>["app"], personId: string) {
  const res = await app.request("/account", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `person_id=${personId}`,
  });
  return res;
}
const form = (date: string) => ({
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: `date=${date}`,
});

describe("trasy F-01", () => {
  test("GET / bez konta przekierowuje na /account", async () => {
    const { app } = createTestApp();
    const res = await app.request("/");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/account");
  });

  test("konto: lista, wybór, ekran startowy z datą", async () => {
    const { app, db } = createTestApp();
    const list = await app.request("/account");
    expect(list.status).toBe(200);
    const html = await list.text();
    const rows = db.query("SELECT id, name FROM people WHERE has_account = 1").all() as { id: string; name: string }[];
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(html).toContain(r.name);

    const res = await login(app, rows[0].id);
    expect(res.status).toBe(303);
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toContain(rows[0].id);

    const home = await app.request("/", { headers: { cookie: cookie.split(";")[0] } });
    expect(home.status).toBe(200);
    const text = await home.text();
    expect(text).toContain(rows[0].name);
    expect(text).toContain("9 grudnia 2024");
    expect(text).toContain('action="/demo/date"');
  });

  test("POST /account z nieznaną osobą daje 422", async () => {
    const { app } = createTestApp();
    expect((await login(app, "nie-ma")).status).toBe(422);
  });

  test("POST /demo/date: późniejsza przesuwa, wcześniejsza i równa dają 422", async () => {
    const { app } = createTestApp();
    const ok = await app.request("/demo/date", form("2025-06-02"));
    expect(ok.status).toBe(303);
    expect(today()).toBe("2025-06-02");
    expect((await app.request("/demo/date", form("2025-01-01"))).status).toBe(422);
    expect((await app.request("/demo/date", form("2025-06-02"))).status).toBe(422);
    expect((await app.request("/demo/date", form("2025-02-30"))).status).toBe(422);
    expect(today()).toBe("2025-06-02");
  });

  test("/style.css jest serwowany lokalnie", async () => {
    const { app } = createTestApp();
    expect((await app.request("/style.css")).status).toBe(200);
  });

  test("createTestApp ustawia datę", () => {
    createTestApp({ today: "2026-03-11" });
    expect(today()).toBe("2026-03-11");
  });
});
