import { describe, expect, test } from "bun:test";
import { openCycle } from "../cycles";
import { seedEvent } from "../events";
import { lastFeedbackDate } from "../notes/repo";
import { createTestApp } from "../test-helpers";

type App = ReturnType<typeof createTestApp>["app"];

async function call(app: App, as: string, path: string, params?: Record<string, string>) {
  const headers: Record<string, string> = { cookie: `person_id=${as}` };
  let body: string | undefined;
  if (params) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(params).toString();
  }
  return app.request(path, { method: params ? "POST" : "GET", headers, body, redirect: "manual" });
}

const STEP2 = "Po odejściu koleżanki 9 marca przejął jej kolejkę wniosków i spisał, co jest otwarte.";
const count = (db: ReturnType<typeof createTestApp>["db"]) => (db.query("SELECT COUNT(*) AS n FROM notes").get() as { n: number }).n;

describe("zapis notatki", () => {
  test("zapisuje wybór człowieka, a wynik adaptera obok; walidacja 422; podpowiedź nie zapisuje", async () => {
    const { app, db } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const before = count(db);
    const sug = await call(app, "marek", "/suggestions/note", { text: STEP2 });
    expect(sug.status).toBe(200);
    const j = (await sug.json()) as { source: string; taskChange: boolean; matched: string[] };
    expect(j.source).toBe("rules");
    expect(j.taskChange).toBe(true);
    expect(j.matched.length).toBeGreaterThan(0);
    expect(count(db)).toBe(before);

    const bad = await call(app, "marek", "/people/piotr/notes", { criterion_id: "wspolpraca", text: "  " });
    expect(bad.status).toBe(422);
    expect(await bad.text()).toContain("Wpisz, co się wydarzyło.");
    expect(count(db)).toBe(before);

    const ok = await call(app, "marek", "/people/piotr/notes", { criterion_id: "wspolpraca", text: STEP2, rating: "good" });
    expect(ok.status).toBe(303);
    expect(ok.headers.get("location")).toMatch(/^\/notes\?saved=\d+$/);
    const row = db.query("SELECT * FROM notes ORDER BY id DESC LIMIT 1").get() as Record<string, unknown>;
    expect(row).toMatchObject({ task_change: 0, suggested_task_change: 1, suggestion_source: "rules", cycle_id: "cycle-piotr", created_at: "2026-03-11" });
  });
});

describe("dostęp", () => {
  test("zapis według openCycle: oceniający cyklu, a bez cyklu przełożony", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const form = { criterion_id: "rzetelnosc", text: "Fakt." };
    expect((await call(app, "anna", "/people/piotr/notes", form)).status).toBe(403);
    expect((await call(app, "anna", "/people/piotr/notes/new")).status).toBe(403);
    db.query("UPDATE cycles SET appraiser_id = 'anna' WHERE id = 'cycle-piotr'").run();
    expect((await call(app, "anna", "/people/piotr/notes", form)).status).toBe(303);
    expect((await call(app, "marek", "/people/piotr/notes", form)).status).toBe(403);
    const mine = await (await call(app, "marek", "/notes")).text();
    expect(mine).toContain("Pismo do gminy poszło 11 lutego");
    const hers = await (await call(app, "anna", "/notes")).text();
    expect(hers).not.toContain("Pismo do gminy poszło 11 lutego");

    // Maria: bez cyklu, przełożony Marek.
    expect((await call(app, "anna", "/people/maria/notes", form)).status).toBe(403);
    expect((await call(app, "marek", "/people/maria/notes", form)).status).toBe(303);
    const m = db.query("SELECT cycle_id FROM notes WHERE subject_id = 'maria'").get() as { cycle_id: string | null };
    expect(m.cycle_id).toBeNull();
  });

  test("osoba z zamkniętym cyklem i bez otwartego: zapis przez przełożonego, nie przez dawnego oceniającego", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    db.query("INSERT INTO cycles (id, person_id, appraiser_id, period_start, sheet) VALUES ('cycle-maria', 'maria', 'anna', '2022-01-01', 'C')").run();
    seedEvent("cycle_started", "cycle-maria", "anna", {}, "2022-01-01");
    seedEvent("assessment_acknowledged", "cycle-maria", "maria", {}, "2024-01-10");
    expect(openCycle("maria")).toBeNull();
    expect((await call(app, "marek", "/people/maria/notes", { criterion_id: "rzetelnosc", text: "Fakt." })).status).toBe(303);
    expect((await call(app, "anna", "/people/maria/notes", { criterion_id: "rzetelnosc", text: "Fakt." })).status).toBe(403);
    expect((db.query("SELECT cycle_id FROM notes WHERE subject_id = 'maria'").get() as { cycle_id: string | null }).cycle_id).toBeNull();
  });

  test("Piotr nie widzi notatki Marka na swoim koncie", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const html = await (await call(app, "piotr", "/notes")).text();
    expect(html).not.toContain("Pismo do gminy poszło 11 lutego");
  });
});

describe("zasada 7: przy nazwisku nic poza nazwiskiem", () => {
  test("lista notatek i formularz notatki", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const list = await (await call(app, "marek", "/notes")).text();
    const headings = [...list.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1]);
    expect(headings).toContain("Piotr Wójcik");
    expect(headings).toContain("Maria Dąbrowska");
    for (const h of headings) expect(h).toMatch(/^[^\d:()]+$/);
    for (const [id, name] of [["piotr", "Piotr Wójcik"], ["maria", "Maria Dąbrowska"]]) {
      const html = await (await call(app, "marek", `/people/${id}/notes/new`)).text();
      expect(html).toContain(`<h1>Nowa notatka: ${name}</h1>`);
    }
  });
});

describe("faza 3", () => {
  test("informacja zwrotna: wysyłka, ekran pracownika, uprawnienia", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const id = (db.query("SELECT id FROM notes WHERE date = '2025-02-11'").get() as { id: number }).id;
    const form = await (await call(app, "marek", `/notes/${id}/feedback`)).text();
    expect(form).toContain("Pracownik nie widzi notatki na swoim koncie");
    expect(form.toLowerCase()).not.toContain("prywatn");
    expect((await call(app, "piotr", `/notes/${id}/feedback`)).status).toBe(403);
    expect((await call(app, "anna", `/notes/${id}/feedback`, { text: "x" })).status).toBe(403);
    expect((await call(app, "marek", "/notes/99999/feedback")).status).toBe(404);
    expect((await call(app, "marek", `/notes/${id}/feedback`, { text: " " })).status).toBe(422);
    expect((await call(app, "piotr", "/feedback")).status).toBe(200);
    const ok = await call(app, "marek", `/notes/${id}/feedback`, { text: "Przy terminach uprzedzaj mnie z wyprzedzeniem." });
    expect(ok.status).toBe(303);
    const fb = await (await call(app, "piotr", "/feedback")).text();
    expect(fb).toContain("Przy terminach uprzedzaj mnie z wyprzedzeniem.");
    expect(fb).toContain("21.11.2026");
    expect(fb).not.toContain("Pismo do gminy poszło 11 lutego");
    expect(lastFeedbackDate("marek", "piotr")).toBe("2026-11-21");
    expect(await (await call(app, "piotr", "/")).text()).toContain("Informacja zwrotna");
  });

  test("data notatki: wcześniejsza zapisuje się, późniejsza niż dziś daje 422; created_at to dziś", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const base = { criterion_id: "rzetelnosc", text: "Fakt." };
    const late = await call(app, "marek", "/people/piotr/notes", { ...base, date: "2026-11-22" });
    expect(late.status).toBe(422);
    expect(await late.text()).toContain("Data nie może być późniejsza niż dziś.");
    expect((await call(app, "marek", "/people/piotr/notes", { ...base, date: "2026-11-10" })).status).toBe(303);
    expect(db.query("SELECT date, created_at FROM notes ORDER BY id DESC LIMIT 1").get()).toEqual({ date: "2026-11-10", created_at: "2026-11-21" });
  });
});
