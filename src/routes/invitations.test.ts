import { describe, expect, test } from "bun:test";
import { foldLine } from "../ics";
import { createTestApp } from "../test-helpers";
import { call, html } from "./hr-test-helpers";

const PIOTR = "cycle-piotr";
const OPENING = { kind: "opening", date: "2024-12-12", time: "10:00", place: "pokój 214", note: "" };
const sent = (db: ReturnType<typeof createTestApp>["db"]) => db.query("SELECT * FROM events WHERE type = 'invitation_sent' AND cycle_id = ? ORDER BY id").all(PIOTR) as { id: number; payload: string }[];

describe("zaproszenia na rozmowy", () => {
  test("Marek zaprasza Piotra: zdarzenie, karta u Piotra z tematami z § 5, plik .ics", async () => {
    const { app, db } = createTestApp();
    const form = await html(app, "marek", `/cycles/${PIOTR}/invitations/new?kind=opening`);
    expect(form).toContain("Do granicy z § 7: 18 dni (do 27.12.2024)");
    expect(form).toContain("Podpowiedź");
    expect(form).toContain("§ 5 ust. 1");

    const r = await call(app, "marek", `/cycles/${PIOTR}/invitations`, OPENING);
    expect(r.status).toBe(303);
    const [ev] = sent(db);
    expect(JSON.parse(ev.payload)).toEqual(OPENING);

    const home = await html(app, "piotr", "/");
    expect(home).toContain("Zaproszenie na rozmowę o kryteriach: 12.12.2024, 10:00, pokój 214");
    expect(home).toContain("4 tematy z przepisu (§ 5 ust. 1)");
    expect(home).toContain("Potwierdzam termin");
    expect(home).toContain(`/cycles/${PIOTR}/invitations/${ev.id}.ics`);

    const ics = await call(app, "piotr", `/cycles/${PIOTR}/invitations/${ev.id}.ics`);
    expect(ics.status).toBe(200);
    expect(ics.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    const body = await ics.text();
    expect(body).toContain("BEGIN:VEVENT");
    expect(body).toContain("DTSTART;TZID=Europe/Warsaw:20241212T100000");
    expect(body).toContain("DTEND;TZID=Europe/Warsaw:20241212T110000");
    expect(body).toContain("SUMMARY:Rozmowa o kryteriach oceny: Piotr Wójcik");
    expect(body).toContain("TZID:Europe/Warsaw");
    expect(body.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(body.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect((await call(app, "ewa", `/cycles/${PIOTR}/invitations/${ev.id}.ics`)).status).toBe(403);
    expect((await call(app, "piotr", `/cycles/${PIOTR}/invitations/99999.ics`)).status).toBe(404);
  });

  test("Piotr potwierdza, Marek widzi stan; oś czasu ma oba wpisy", async () => {
    const { app, db } = createTestApp();
    await call(app, "marek", `/cycles/${PIOTR}/invitations`, OPENING);
    const [ev] = sent(db);
    expect(await html(app, "marek", "/")).toContain("Wysłane 9.12, czeka na potwierdzenie");

    const c = await call(app, "piotr", `/cycles/${PIOTR}/invitations/${ev.id}/confirm`, {});
    expect(c.status).toBe(303);
    expect((await call(app, "marek", `/cycles/${PIOTR}/invitations/${ev.id}/confirm`, {})).status).toBe(403);
    expect(await html(app, "marek", `/cycles/${PIOTR}/cards/opening`)).toContain("Potwierdzone przez Piotra 9.12");
    expect(await html(app, "piotr", "/")).not.toContain("Potwierdzam termin");
    const tl = await html(app, "marek", `/cycles/${PIOTR}/timeline`);
    expect(tl).toContain("Zaproszenie na rozmowę o kryteriach");
    expect(tl).toContain("Potwierdzenie terminu");
  });

  test("data po granicy z § 7 daje ostrzeżenie, a zapis przechodzi; zła godzina daje 422", async () => {
    const { app, db } = createTestApp();
    const late = { ...OPENING, date: "2024-12-30" };
    const w = await call(app, "marek", `/cycles/${PIOTR}/invitations/new?kind=opening`);
    expect(w.status).toBe(200);
    expect((await call(app, "marek", `/cycles/${PIOTR}/invitations`, { ...late, time: "25:99" })).status).toBe(422);
    expect(sent(db)).toHaveLength(0);
    const r = await call(app, "marek", `/cycles/${PIOTR}/invitations`, late);
    expect(r.status).toBe(303);
    expect(sent(db)).toHaveLength(1);
    const again = await html(app, "marek", `/cycles/${PIOTR}/invitations/new?kind=opening`);
    expect(again).toContain('value="2024-12-30"');
  });

  test("oceniany i obcy nie wysyłają zaproszeń, brak cyklu to 404", async () => {
    const { app, db } = createTestApp();
    expect((await call(app, "piotr", `/cycles/${PIOTR}/invitations`, OPENING)).status).toBe(403);
    expect((await call(app, "anna", `/cycles/${PIOTR}/invitations`, OPENING)).status).toBe(403);
    expect((await call(app, "piotr", `/cycles/${PIOTR}/invitations/new?kind=opening`)).status).toBe(403);
    expect((await call(app, "marek", `/cycles/nie-ma/invitations`, OPENING)).status).toBe(404);
    expect(sent(db)).toHaveLength(0);
  });

  test("nowe zaproszenie unieważnia poprzednie", async () => {
    const { app, db } = createTestApp();
    await call(app, "marek", `/cycles/${PIOTR}/invitations`, OPENING);
    await call(app, "marek", `/cycles/${PIOTR}/invitations`, { ...OPENING, date: "2024-12-13", place: "wideo" });
    const [first, second] = sent(db);
    expect((await call(app, "piotr", `/cycles/${PIOTR}/invitations/${first.id}/confirm`, {})).status).toBe(404);
    expect((await call(app, "piotr", `/cycles/${PIOTR}/invitations/${second.id}/confirm`, {})).status).toBe(303);
    const home = await html(app, "piotr", "/");
    expect(home).not.toContain("pokój 214");
  });

  test("rozmowa oceniająca: karta ma przycisk, Ewa ma potwierdzone zaproszenie z danych pokazowych", async () => {
    const { app } = createTestApp();
    const card = await html(app, "marek", "/cycles/cycle-ewa/cards/assessment-conversation");
    expect(card).toContain("Potwierdzone przez Ewy 3.12");
    expect(card).toContain("Zmień termin");
    expect(await html(app, "marek", `/cycles/${PIOTR}/cards/assessment-conversation`)).toContain("Zaproś na rozmowę");
    expect(await html(app, "marek", `/cycles/${PIOTR}/invitations/new?kind=assessment`)).toContain("§ 10");
  });

  test("w odpowiedziach nie ma słowa „podpis”", async () => {
    const { app, db } = createTestApp();
    await call(app, "marek", `/cycles/${PIOTR}/invitations`, OPENING);
    const [ev] = sent(db);
    const pages = [
      await html(app, "marek", `/cycles/${PIOTR}/invitations/new?kind=opening`),
      await html(app, "piotr", "/"),
      await html(app, "piotr", `/cycles/${PIOTR}/invitations/${ev.id}`),
      await html(app, "marek", `/cycles/${PIOTR}/cards/opening`),
    ];
    for (const p of pages) expect(p.toLowerCase()).not.toContain("podpis");
  });
});

describe("zawijanie linii iCalendar", () => {
  test("nie rozcina znaków wielobajtowych i mieści się w 75 oktetach", () => {
    const folded = foldLine(`DESCRIPTION:${"zażółć gęślą jaźń ".repeat(12)}`);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(parts.map((l, i) => (i ? l.slice(1) : l)).join("")).toBe(`DESCRIPTION:${"zażółć gęślą jaźń ".repeat(12)}`);
  });
});
