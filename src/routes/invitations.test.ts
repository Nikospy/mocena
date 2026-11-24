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
    expect(form).toContain("Na rozmowę o kryteriach zostało 18 dni – do 27.12.2024.");
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
    expect(await html(app, "marek", "/")).toContain("Wysłano 09.12.2024. Czeka na potwierdzenie ocenianego.");

    const c = await call(app, "piotr", `/cycles/${PIOTR}/invitations/${ev.id}/confirm`, {});
    expect(c.status).toBe(303);
    expect((await call(app, "marek", `/cycles/${PIOTR}/invitations/${ev.id}/confirm`, {})).status).toBe(403);
    expect(await html(app, "marek", `/cycles/${PIOTR}/cards/opening`)).toContain("Potwierdzone przez ocenianego 09.12.2024.");
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
    expect(again).toContain('value="30.12.2024"');
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

  test("zaproszenia Ewy do rozmowy o kryteriach, zaproszenie Piotra do rozmowy oceniającej", async () => {
    const { app } = createTestApp();
    const timeline = await html(app, "marek", "/cycles/cycle-ewa/timeline");
    expect(timeline).toContain("Zaproszenie na rozmowę o kryteriach");
    expect(timeline).not.toContain("Zaproszenie na rozmowę oceniającą");
    const card = await html(app, "marek", "/cycles/cycle-ewa/cards/opening");
    expect(card).toContain("Potwierdzone przez ocenianego 02.12.2024.");
    expect(card).toContain("Zmień datę rozmowy");
    expect(await html(app, "marek", `/cycles/${PIOTR}/cards/assessment-conversation`)).toContain("Zaproś na rozmowę");
    expect(await html(app, "marek", `/cycles/${PIOTR}/invitations/new?kind=assessment`)).toContain("§ 10");
  });

  test("odnośnik „Zaproś na rozmowę oceniającą” pojawia się dopiero po potwierdzeniu części I", async () => {
    const { app } = createTestApp();
    const before = await html(app, "marek", `/cycles/${PIOTR}/part1`);
    expect(before).toContain("Zaproś na rozmowę o kryteriach");
    expect(before).not.toContain("Zaproś na rozmowę oceniającą");

    await call(app, "marek", `/cycles/${PIOTR}/part1/submit`, {});
    const submitted = await html(app, "marek", `/cycles/${PIOTR}/part1`);
    expect(submitted).not.toContain("Zaproś na rozmowę oceniającą");

    await call(app, "piotr", `/cycles/${PIOTR}/part1/confirm`, {});
    const confirmed = await html(app, "marek", `/cycles/${PIOTR}/part1`);
    expect(confirmed).toContain("Zaproś na rozmowę oceniającą");
    expect(await html(app, "marek", "/cycles/cycle-ewa/part1")).toContain("Zaproś na rozmowę oceniającą");
  });

  test("po ponownym rozpoczęciu rundy cyklu (po sprzeciwie) link „Zaproś na rozmowę oceniającą” wymaga potwierdzenia części I w bieżącej rundzie", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22" });
    const { cycleById, openCycle, startNextCycle } = await import("../cycles");
    const { part1Status } = await import("../cycles/part1");
    const { recordEvent } = await import("../events");

    db.query("UPDATE people SET has_account = 1 WHERE id = 'katarzyna'").run();
    expect((await call(app, "joanna", "/cycles/cycle-katarzyna/objection-outcome", { outcome: "redone" })).status).toBe(303);
    startNextCycle(cycleById("cycle-katarzyna")!, "katarzyna", "2026-11-16", "2026-11-17", "positive");
    const next = openCycle("katarzyna")!;
    expect((await call(app, "anna", `/cycles/${next.id}/part1/submit`, {})).status).toBe(303);
    expect((await call(app, "katarzyna", `/cycles/${next.id}/part1/confirm`, {})).status).toBe(303);
    expect(await html(app, "anna", `/cycles/${next.id}/part1`)).toContain("Zaproś na rozmowę oceniającą");

    // Zatwierdzenie i zapoznanie z drugą oceną Katarzyny uruchamia restartNextCycle (nowe cycle_started w bieżącym cyklu).
    const crits = (db.query("SELECT criterion_id AS id FROM cycle_criteria WHERE cycle_id = 'cycle-katarzyna' ORDER BY rowid").all() as { id: string }[]).map((r) => r.id);
    const redoForm: Record<string, string> = { justification: "", developmentConclusions: "Szkolenie.", interviewDate: "2026-11-22" };
    for (const id of crits) redoForm[`score[${id}]`] = "5";
    expect((await call(app, "anna", "/cycles/cycle-katarzyna/assessment/approve", redoForm)).status).toBe(303);
    expect((await call(app, "katarzyna", "/cycles/cycle-katarzyna/assessment/acknowledge", {})).status).toBe(303);

    expect(part1Status(next.id, { currentRound: true }).state).toBe("not_started");
    expect(await html(app, "anna", `/cycles/${next.id}/part1`)).not.toContain("Zaproś na rozmowę oceniającą");

    // Dopiero potwierdzenie części I w bieżącej rundzie przywraca link.
    recordEvent("part1_submitted", next.id, "anna", { sheet: "C", criteria: [], dueDate: "2028-11-22", dueDateBasis: ["art. 81 ust. 4 ustawy"], place: "Rzeszów", appraiserName: "Anna Kwiatkowska" });
    recordEvent("part1_confirmed", next.id, "katarzyna", { place: "Rzeszów", appraiseeName: "Katarzyna Lewandowska" });
    expect(part1Status(next.id, { currentRound: true }).state).toBe("confirmed");
    expect(await html(app, "anna", `/cycles/${next.id}/part1`)).toContain("Zaproś na rozmowę oceniającą");
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

describe("odmowa wglądu w zaproszenie (ustalenie 9 audytu)", () => {
  test("zdanie odmowy wymienia tylko ocenianego i oceniającego", async () => {
    const { app, db } = createTestApp();
    await call(app, "marek", `/cycles/${PIOTR}/invitations`, OPENING);
    const [ev] = sent(db);
    const r = await call(app, "joanna", `/cycles/${PIOTR}/invitations/${ev.id}`);
    expect(r.status).toBe(403);
    const body = await r.text();
    const lead = body.match(/<p class="page-lead">([^<]*)<\/p>/)?.[1] ?? "";
    expect(lead).not.toContain("kadry");
    expect(lead).toContain("oceniany i jego oceniający");
  });
});
