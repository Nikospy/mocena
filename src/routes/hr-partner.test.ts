import { describe, expect, test } from "bun:test";
import { visibleEvents } from "../events";
import { cycleLinks } from "../cycle-links";
import { cycleById } from "../cycles";
import { homeTasks } from "../home-tasks";
import { personById } from "../people";
import { createTestApp } from "../test-helpers";

type App = ReturnType<typeof createTestApp>["app"];
type Db = ReturnType<typeof createTestApp>["db"];

async function call(app: App, as: string, path: string, params?: Record<string, string>) {
  const headers: Record<string, string> = { cookie: `person_id=${as}` };
  let body: string | undefined;
  if (params) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(params).toString();
  }
  return app.request(path, { method: params ? "POST" : "GET", headers, body, redirect: "manual" });
}

const events = (db: Db) => (db.query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n;
const STEP2 = "Po odejściu koleżanki 9 marca przejął jej kolejkę wniosków.";
const FORBIDDEN = ["ryzyk", "wskaźnik", "motywac", "ranking", "%"];

async function writeNote(app: App, person: string, extra: Record<string, string> = {}) {
  const r = await call(app, "marek", `/people/${person}/notes`, { criterion_id: "wspolpraca", text: STEP2, rating: "good", ...extra });
  expect(r.status).toBe(303);
  return r.headers.get("location")!;
}

describe("pytanie po notatce", () => {
  test("notatka ze zmianą zadań prowadzi na pytanie, bez zaznaczenia nie; GET nie zapisuje", async () => {
    const { app, db } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const plain = await writeNote(app, "piotr");
    expect(plain).toStartWith("/notes?saved=");
    const loc = await writeNote(app, "piotr", { task_change: "1" });
    expect(loc).toMatch(/^\/notes\/\d+\/task-change$/);
    const before = events(db);
    const page = await call(app, "marek", loc);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("To stała zmiana zadań?");
    expect(events(db)).toBe(before);
  });

  test("kody odpowiedzi i zapis tylko po POST", async () => {
    const { app, db } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const loc = await writeNote(app, "piotr", { task_change: "1" });
    const plainLoc = await writeNote(app, "piotr");
    const plainId = plainLoc.split("=")[1];
    const n0 = events(db);

    expect((await call(app, "marek", "/notes/9999/task-change")).status).toBe(404);
    expect((await call(app, "marek", `/notes/${plainId}/task-change`)).status).toBe(404);
    expect((await call(app, "anna", loc)).status).toBe(403);
    expect((await call(app, "marek", loc, { answer: "maybe" })).status).toBe(422);
    expect((await call(app, "marek", "/notes/9999/task-change", { answer: "yes" })).status).toBe(404);
    expect((await call(app, "anna", loc, { answer: "yes" })).status).toBe(403);
    expect(events(db)).toBe(n0);

    // oceniający cyklu, który nie jest autorem, nie odpowiada; autor dalej tak
    db.query("UPDATE cycles SET appraiser_id = 'anna' WHERE id = 'cycle-piotr'").run();
    expect((await call(app, "anna", loc, { answer: "yes" })).status).toBe(403);
    expect(events(db)).toBe(n0);
    const ok = await call(app, "marek", loc, { answer: "yes" });
    expect(ok.status).toBe(303);
    expect(ok.headers.get("location")).toBe(loc);
    expect(events(db)).toBe(n0 + 1);
    const ev = visibleEvents("cycle-piotr").filter((e) => e.type === "task_change_answered");
    expect(ev).toHaveLength(1);
    expect(ev[0].actorId).toBe("marek");
    const card = await (await call(app, "marek", loc)).text();
    expect(card).toContain("art. 81 ust. 6");
    expect(card).toContain("Forma rozwoju");
    expect((await call(app, "marek", loc, { answer: "no" })).status).toBe(409);
    expect(events(db)).toBe(n0 + 1);
  });

  test("odpowiedź przy notatce o Marii (bez cyklu) ma puste cycle_id i jest w visibleEvents(null)", async () => {
    const { app } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true } });
    const loc = await writeNote(app, "maria", { task_change: "1" });
    const noteId = Number(loc.split("/")[2]);
    expect((await call(app, "marek", loc, { answer: "no" })).status).toBe(303);
    const ev = visibleEvents(null).filter((e) => e.type === "task_change_answered" && e.payload.noteId === noteId);
    expect(ev).toHaveLength(1);
    expect(ev[0].cycleId).toBeNull();
  });
});

describe("ekran „Przed rozmową”", () => {
  test("wersja 90 sekund: podział na 11.03.2026 bez „Tak” i zaległe pytanie; bez zakazanych słów", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const res = await call(app, "marek", "/cycles/cycle-piotr/before-meeting");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Przed rozmową z Piotrem");
    expect(html).toContain("Zaznaczono zmianę zadań w notatce z 11.03.2026.");
    expect(html).toContain("To stała zmiana zadań?");
    expect(html).toContain('action="/notes/10/task-change"');
    expect(html).toContain("wraca praca po godzinach");
    expect(html).toMatch(/href="#note-\d+"/);
    // Zdanie o Marii zostaje na liście notatek o zespole („Notatki o zespole”), nie tutaj.
    expect(html).not.toContain("O Marii nie masz");
    for (const w of FORBIDDEN) expect(html.toLowerCase()).not.toContain(w);
    expect((await call(app, "anna", "/cycles/cycle-piotr/before-meeting")).status).toBe(403);
    expect((await call(app, "joanna", "/cycles/cycle-piotr/before-meeting")).status).toBe(403);
    expect((await call(app, "marek", "/cycles/brak/before-meeting")).status).toBe(404);
  });

  test("pełny pokaz: po „Tak” i przesunięciu daty granica 11.03.2026, bez zaległego pytania", async () => {
    const { app } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const loc = await writeNote(app, "piotr", { task_change: "1" });
    expect((await call(app, "marek", loc, { answer: "yes" })).status).toBe(303);
    expect((await call(app, "marek", "/demo/date", { date: "2026-11-21" })).status).toBe(303);
    const html = await (await call(app, "marek", "/cycles/cycle-piotr/before-meeting")).text();
    expect(html).toContain("Zaznaczono zmianę zadań w notatce z 11.03.2026.");
    expect(html.match(/zmiana zadań/g)).toHaveLength(1);
    expect(html).not.toContain("czeka na odpowiedź");
  });

  test("odnośniki: oceniający ma „Przed rozmową” i „Docenienie”, inni nie", () => {
    const { } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const cycle = cycleById("cycle-piotr")!;
    expect(cycleLinks(cycle, personById("marek")!).map((l) => l.href)).toEqual(
      expect.arrayContaining(["/cycles/cycle-piotr/before-meeting", "/cycles/cycle-piotr/appreciation"]),
    );
    expect(cycleLinks(cycle, personById("anna")!).some((l) => l.href.includes("before-meeting"))).toBe(false);
  });
});

describe("docenienie", () => {
  test("przypomnienie na ekranie startowym; karta z notatką z 18.06.2026 i przyciskiem; 403 dla innych", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    expect(homeTasks(personById("marek")!).some((t) => t.href === "/cycles/cycle-piotr/appreciation")).toBe(true);
    const home = await (await call(app, "marek", "/")).text();
    expect(home).toContain("brak zapisanej informacji zwrotnej dla Piotra");
    const res = await call(app, "marek", "/cycles/cycle-piotr/appreciation");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("18.06.2026");
    expect(html).toMatch(/href="\/notes\/\d+\/feedback"/);
    expect((await call(app, "anna", "/cycles/cycle-piotr/appreciation")).status).toBe(403);
  });

  test("wysłanie informacji zwrotnej zeruje przypomnienie", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const id = (await (await call(app, "marek", "/cycles/cycle-piotr/appreciation")).text()).match(/\/notes\/(\d+)\/feedback/)![1];
    expect((await call(app, "marek", `/notes/${id}/feedback`, { text: "Dobra robota z pismem do gminy." })).status).toBe(303);
    const home = await (await call(app, "marek", "/")).text();
    expect(home).not.toContain("Docenienie: Piotr");
  });
});