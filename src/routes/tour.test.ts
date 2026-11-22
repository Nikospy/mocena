import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { TOUR_STOP_IDS } from "../tour/state";

function cookies(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function html(app: ReturnType<typeof createTestApp>["app"], path: string, cookie = "") {
  const res = await app.request(path, { headers: { cookie } });
  return { res, text: await res.text() };
}

const post = (app: ReturnType<typeof createTestApp>["app"], path: string, cookie = "", body?: Record<string, string>) =>
  app.request(path, {
    method: "POST",
    headers: { cookie, ...(body ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });

describe("przewodnik pokazu", () => {
  test("wejście na / bez konta, z 5 formularzami przystanków", async () => {
    const { app } = createTestApp();
    const { res, text } = await html(app, "/");
    expect(res.status).toBe(200);
    expect(text).toContain("Ten asystent nie pisze oceny.");
    expect(text).toContain("Rozpocznij pokaz");
    for (const n of [1, 2, 3, 4, 5]) expect(text).toContain(`action="/tour/${n}"`);
    expect(text.match(/<form[^>]*action="\/tour\/\d"/g)?.length).toBe(6); // 5 kart + „Rozpocznij pokaz”
  });

  test("POST /tour/4: 303 na ocenę Piotra, ciasteczka konta i przewodnika", async () => {
    const { app } = createTestApp();
    const res = await post(app, "/tour/4");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/cycles/cycle-piotr/assessment");
    const c = cookies(res);
    expect(c).toContain("person_id=marek");
    expect(c).toContain("mocena_tour=4");
  });

  test("ekran z ciasteczkiem przewodnika ma kartę kroku i /tour.js", async () => {
    const { app } = createTestApp();
    const c = cookies(await post(app, "/tour/4"));
    const { res, text } = await html(app, "/cycles/cycle-piotr/assessment", c);
    expect(res.status).toBe(200);
    expect(text).toContain("Jedna „1” przesądza o wyniku");
    expect(text).toContain("Krok 4 z 5");
    expect(text).toContain('action="/tour/5"');
    expect(text).toContain('src="/tour.js"');
    expect(text).not.toContain('action="/demo/date"');
  });

  test("zwykły ekran bez ciasteczka nie ma karty ani skryptu", async () => {
    const { app } = createTestApp();
    const { text } = await html(app, "/account");
    expect(text).not.toContain("/tour.js");
    expect(text).toContain('action="/demo/date"');
  });

  test("przystanki są niezależne: 5 po 4, 1 po 5b, data z przystanku", async () => {
    const { app, db } = createTestApp();
    await post(app, "/tour/4");
    expect((await post(app, "/tour/5")).status).toBe(303);
    expect((db.query("SELECT value FROM settings WHERE key = 'demo_date'").get() as any).value).toBe("2026-11-22");
    expect((await post(app, "/tour/5b")).headers.get("location")).toBe("/hr");
    expect((await post(app, "/tour/1")).status).toBe(303);
    expect((db.query("SELECT value FROM settings WHERE key = 'demo_date'").get() as any).value).toBe("2024-12-09");
  });

  test("POST /tour/end zdejmuje ciasteczko przewodnika", async () => {
    const { app } = createTestApp();
    const c = cookies(await post(app, "/tour/2"));
    const res = await post(app, "/tour/end", c, { to: "/account" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/account");
    expect(res.headers.get("set-cookie")).toMatch(/mocena_tour=;/);
  });

  test("nieznany przystanek daje 404", async () => {
    const { app } = createTestApp();
    expect((await post(app, "/tour/9")).status).toBe(404);
  });

  test("w HTML wejścia, każdego przystanku i końca nie ma słowa „podpis”", async () => {
    const { app } = createTestApp();
    const pages: string[] = [(await html(app, "/tour")).text, (await html(app, "/tour/done")).text];
    for (const id of TOUR_STOP_IDS) {
      const res = await post(app, `/tour/${id}`);
      pages.push((await html(app, res.headers.get("location")!, cookies(res))).text);
    }
    for (const p of pages) expect(p.toLowerCase()).not.toContain("podpis");
  });

  test("po ekranie końcowym karta kroku nie zasłania podsumowania", async () => {
    const { app } = createTestApp();
    const c = cookies(await post(app, "/tour/5b"));
    const { text } = await html(app, "/tour/done", c);
    expect(text).toContain("Koniec pokazu");
    expect(text).not.toContain("gpanel");
  });

  test("dodatki z ekranu końcowego ustawiają konto i otwierają ekran bez przewodnika", async () => {
    const { app } = createTestApp();
    const cases: [string, string, RegExp][] = [
      ["ewa-timeline", "person_id=joanna", /\/cycles\/[^/]+\/timeline$/],
      ["fiction", "person_id=marek", /\/assessment\/fiction$/],
      ["sources", "person_id=admin", /^\/admin\/suggestion-sources$/],
    ];
    for (const [id, who, path] of cases) {
      const res = await post(app, `/tour/extra/${id}`, "mocena_tour=5b");
      expect(res.status).toBe(303);
      expect(res.headers.get("location") ?? "").toMatch(path);
      const set = res.headers.getSetCookie().join(" ");
      expect(set).toContain(who);
      expect(set).toMatch(/mocena_tour=;/);
      const page = await html(app, res.headers.get("location")!, cookies(res));
      expect(page.res.status).toBe(200);
    }
    expect((await post(app, "/tour/extra/nic")).status).toBe(404);
  });

  test("przycisk Dalej nazywa następny przystanek", async () => {
    const { app } = createTestApp();
    const res = await post(app, "/tour/4");
    const { text } = await html(app, res.headers.get("location")!, cookies(res));
    expect(text).toContain("Dalej<span class=\"long\">: zapoznanie</span>");
    expect(text).not.toContain("pracownik\"");
  });
});

describe("przewodnik: układ i dostępność", () => {
  test("link do przewodnika stoi zaraz po „Przejdź do treści”, a pasek pokazu ma datę słownie", async () => {
    const { app } = createTestApp();
    const cookie = cookies(await post(app, "/tour/2"));
    const { text } = await html(app, "/people/piotr/notes/new", cookie);
    const a = text.indexOf("Przejdź do treści");
    const b = text.indexOf("Przejdź do przewodnika");
    expect(a).toBeGreaterThan(-1);
    expect(b).toBeGreaterThan(a);
    expect(text.indexOf("<header", a)).toBeGreaterThan(b);
    expect(text).toContain("Po wpisaniu »przejął« pole »Zmiana zadań pracownika« zaznacza się samo jako podpowiedź; można je odznaczyć.");

    const plain = await html(app, "/account");
    expect(plain.text).toMatch(/<aside[^>]*aria-label="Pokaz"/);
    expect(plain.text).toMatch(/dziś \d{1,2} \p{L}+ \d{4}/u);
  });
});
