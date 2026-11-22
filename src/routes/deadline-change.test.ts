import { describe, expect, test } from "bun:test";
import { cycleLinks } from "../cycle-links";
import { effectiveDeadline } from "../cycles";
import { homeTasks } from "../home-tasks";
import { personById } from "../people";
import { cycleById } from "../cycles";
import { createTestApp } from "../test-helpers";
import { call, html } from "./hr-test-helpers";

const PIOTR = "cycle-piotr";
const CHANGE = { case: "2", newDate: "2027-01-15", reason: "Planowana dłuższa nieobecność ocenianego" };

function setStarted(db: ReturnType<typeof createTestApp>["db"], patch: Record<string, unknown>) {
  const row = db.query("SELECT id, payload FROM events WHERE cycle_id = ? AND type = 'cycle_started'").get(PIOTR) as { id: number; payload: string };
  db.query("UPDATE events SET payload = ? WHERE id = ?").run(JSON.stringify({ ...JSON.parse(row.payload), ...patch }), row.id);
}
const lastEvent = (db: ReturnType<typeof createTestApp>["db"], type: string) =>
  db.query("SELECT * FROM events WHERE type = ? AND cycle_id = ? ORDER BY id DESC").get(type, PIOTR) as { id: number; payload: string } | null;

describe("zmiana terminu przez oceniającego", () => {
  test("Marek zmienia termin Piotra (pkt 2), pismo ma podstawę i nie ma słowa „podpis”", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21" });
    expect(effectiveDeadline(PIOTR).date).toBe("2026-11-27");
    expect((await call(app, "marek", `/cycles/${PIOTR}/deadline-change`)).status).toBe(200);

    const res = await call(app, "marek", `/cycles/${PIOTR}/deadline-change`, CHANGE);
    expect(res.status).toBe(303);
    const ev = lastEvent(db, "deadline_changed")!;
    expect(res.headers.get("location")).toBe(`/cycles/${PIOTR}/deadline-change/${ev.id}/letter`);

    const d = effectiveDeadline(PIOTR);
    expect(d.date).toBe("2027-01-15");
    expect(d.basis).toContain("art. 81 ust. 8 pkt 2 ustawy");

    const tl = await html(app, "marek", `/cycles/${PIOTR}/timeline`);
    expect(tl).toContain("Zmiana terminu oceny z 27.11.2026 na 15.01.2027");
    expect(tl).toContain(`/cycles/${PIOTR}/deadline-change/${ev.id}/letter`);

    const letter = await call(app, "piotr", res.headers.get("location")!);
    expect(letter.status).toBe(200);
    const text = await letter.text();
    expect(text).toContain("Zawiadamiam o zmianie terminu sporządzenia oceny okresowej z <b>27.11.2026</b> na <b>15.01.2027</b>");
    expect(text).toContain("art. 81 ust. 8 pkt 2 ustawy");
    expect(text).toContain("§ 8 rozporządzenia");
    expect(text).toContain("Potwierdzenie odbioru");
    expect(text.toLowerCase()).not.toContain("podpis");

    expect(await html(app, "marek", `/cycles/${PIOTR}/sheet`)).toContain(`/cycles/${PIOTR}/deadline-change/${ev.id}/letter`);
  });

  test("nowy termin w dzień wolny przechodzi na dzień roboczy; wymagane uzasadnienie i późniejsza data", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    const bad = await call(app, "marek", `/cycles/${PIOTR}/deadline-change`, { case: "2", newDate: "2026-11-20", reason: "" });
    expect(bad.status).toBe(422);
    const t = await bad.text();
    expect(t).toContain("Podaj uzasadnienie");
    expect(t).toContain("późniejszy niż dzisiejsza");
    expect((await call(app, "marek", `/cycles/${PIOTR}/deadline-change`, { ...CHANGE, newDate: "2027-01-16" })).status).toBe(303);
    expect(effectiveDeadline(PIOTR).date).toBe("2027-01-18");
  });

  test("warunek 6 miesięcy: 422 z uzasadnieniem, formularz zablokowany", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21" });
    setStarted(db, { previousAssessmentOn: "2026-08-01" });
    const form = await html(app, "marek", `/cycles/${PIOTR}/deadline-change`);
    expect(form).toContain("nie minęło jeszcze 6 miesięcy");
    const res = await call(app, "marek", `/cycles/${PIOTR}/deadline-change`, CHANGE);
    expect(res.status).toBe(422);
    expect(await res.text()).toContain("nie minęło jeszcze 6 miesięcy");
    expect(effectiveDeadline(PIOTR).date).toBe("2026-11-27");
  });

  test("oceniany nie zmienia terminu (403), cudzy oceniający też", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    expect((await call(app, "piotr", `/cycles/${PIOTR}/deadline-change`)).status).toBe(403);
    expect((await call(app, "piotr", `/cycles/${PIOTR}/deadline-change`, CHANGE)).status).toBe(403);
    expect((await call(app, "anna", `/cycles/${PIOTR}/deadline-change`, CHANGE)).status).toBe(403);
  });

  test("po ocenie negatywnej formularz jest niedostępny", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21" });
    setStarted(db, { previousOutcome: "negative", previousAcknowledgedOn: "2026-02-01" });
    expect(await html(app, "marek", `/cycles/${PIOTR}/deadline-change`)).toContain("ocena ponowna po negatywnej");
    expect((await call(app, "marek", `/cycles/${PIOTR}/deadline-change`, CHANGE)).status).toBe(409);
    const piotr = personById("piotr")!;
    expect(cycleLinks(cycleById(PIOTR)!, piotr).map((l) => l.label)).not.toContain("Wniosek o zmianę terminu oceny");
  });
});

describe("wniosek ocenianego", () => {
  test("wniosek Piotra → sprawa u Marka → odrzucenie z powodem → Piotr widzi decyzję", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    expect(cycleLinks(cycleById(PIOTR)!, personById("piotr")!).map((l) => l.label)).toContain("Wniosek o zmianę terminu oceny");
    expect((await call(app, "piotr", `/cycles/${PIOTR}/deadline-change/request`, { reason: "" })).status).toBe(422);
    const sent = await call(app, "piotr", `/cycles/${PIOTR}/deadline-change/request`, { reason: "Urlop szkoleniowy w grudniu" });
    expect(sent.status).toBe(303);
    expect((await call(app, "piotr", `/cycles/${PIOTR}/deadline-change/request`, { reason: "Jeszcze raz" })).status).toBe(409);
    expect(await html(app, "piotr", `/cycles/${PIOTR}/deadline-change/request`)).toContain("Wniosek z 21.11.2026 czeka na decyzję oceniającego");

    expect(homeTasks(personById("marek")!).map((t) => t.title)).toContain("Wniosek o zmianę terminu: Piotr Wójcik");
    expect(await html(app, "marek", "/")).toContain("Wniosek o zmianę terminu");
    expect(await html(app, "marek", `/cycles/${PIOTR}/timeline`)).toContain("Wniosek ocenianego o zmianę terminu oceny");

    expect((await call(app, "marek", `/cycles/${PIOTR}/deadline-change/reject`, { reason: "" })).status).toBe(422);
    expect((await call(app, "marek", `/cycles/${PIOTR}/deadline-change/reject`, { reason: "Termin jest zbyt bliski" })).status).toBe(303);
    expect(homeTasks(personById("marek")!).map((t) => t.title)).not.toContain("Wniosek o zmianę terminu: Piotr Wójcik");

    const seen = await html(app, "piotr", `/cycles/${PIOTR}/deadline-change/request`);
    expect(seen).toContain("odrzucony");
    expect(seen).toContain("Termin jest zbyt bliski");
    expect(await html(app, "marek", `/cycles/${PIOTR}/timeline`)).toContain("Wniosek o zmianę terminu odrzucony");
    expect(effectiveDeadline(PIOTR).date).toBe("2026-11-27");
  });

  test("wniosek → przyjęcie z przypadkiem 4 → nowy termin", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21" });
    await call(app, "piotr", `/cycles/${PIOTR}/deadline-change/request`, { reason: "Urlop szkoleniowy", requestedDate: "2027-01-15" });
    const form = await html(app, "marek", `/cycles/${PIOTR}/deadline-change`);
    expect(form).toContain("Urlop szkoleniowy");
    expect(form).toContain('value="4" checked');

    expect((await call(app, "marek", `/cycles/${PIOTR}/deadline-change`, { case: "4", newDate: "2027-01-15", reason: "Zgoda na wniosek" })).status).toBe(303);
    expect(effectiveDeadline(PIOTR)).toMatchObject({ date: "2027-01-15", basis: ["art. 81 ust. 8 pkt 4 ustawy"] });
    const ev = lastEvent(db, "deadline_changed")!;
    expect(JSON.parse(ev.payload).requestId).toBeGreaterThan(0);
    expect(await html(app, "piotr", `/cycles/${PIOTR}/deadline-change/request`)).toContain("przyjęty");
    expect(homeTasks(personById("marek")!).map((t) => t.title)).not.toContain("Wniosek o zmianę terminu: Piotr Wójcik");
  });

  test("przypadek 4 bez wniosku jest odrzucany (422)", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    expect((await call(app, "marek", `/cycles/${PIOTR}/deadline-change`, { ...CHANGE, case: "4" })).status).toBe(422);
  });

  test("wgrany wniosek Anny jest widoczny na /hr jako stan z prawdziwego zdarzenia", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    expect(await html(app, "joanna", "/hr")).toContain("Wniosek ocenianego o zmianę terminu");
  });
});

describe("termin po zmianie to data z pisma (ustalenie 1 audytu)", () => {
  test("nieobecność wliczona przed zmianą nie dolicza się drugi raz; późniejsza nowa dalej przedłuża", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21" });
    expect(effectiveDeadline("cycle-ewa").date).toBe("2027-06-02");
    const res = await call(app, "marek", `/cycles/cycle-ewa/deadline-change`, { case: "2", newDate: "2027-08-02", reason: "Planowana dłuższa nieobecność ocenianej" });
    expect(res.status).toBe(303);
    expect(effectiveDeadline("cycle-ewa").date).toBe("2027-08-02");
    expect(await html(app, "marek", "/")).toContain("02.08.2027");
    expect(await html(app, "marek", "/")).not.toContain("14.02.2028");
    // nowa nieobecność wpisana po zmianie terminu dalej przedłuża
    const ewa = db.query("SELECT person_id FROM cycles WHERE id = 'cycle-ewa'").get() as { person_id: string };
    db.query("INSERT INTO absences (person_id, date_from, date_to, excused, recorded_on, recorded_by) VALUES (?, '2026-09-01', '2026-10-31', 1, '2026-11-24', 'joanna')").run(ewa.person_id);
    expect(effectiveDeadline("cycle-ewa", { asOf: "2026-11-23" }).date).toBe("2027-08-02");
    expect(effectiveDeadline("cycle-ewa", { asOf: "2026-11-25" }).date > "2027-08-02").toBe(true);
  });
});

test("po piśmie liczy się nieobecność zakończoną po ustawowym końcu, ale przed terminem z pisma", async () => {
  const { app } = createTestApp({ today: "2026-11-21" });
  const path = `/cycles/${PIOTR}`;
  expect((await call(app, "marek", `${path}/deadline-change`, { ...CHANGE, newDate: "2027-06-01" })).status).toBe(303);
  expect((await call(app, "joanna", "/demo/date", { date: "2027-03-15" })).status).toBe(303);
  expect((await call(app, "joanna", `${path}/absences`, { from: "2027-01-04", to: "2027-02-20", excused: "1" })).status).toBe(303);
  expect(effectiveDeadline(PIOTR).date).toBe("2027-07-19");
  const { cycleDeadlineDetails } = await import("../cycles");
  expect(cycleDeadlineDetails(PIOTR)).toMatchObject({ extensionDays: 48, merged: [{ counted: true }] });
});

test("ta sama data zapisu: pismo uwzględnia kolejność wpisania nieobecności", async () => {
  const path = `/cycles/${PIOTR}`;
  for (const beforeLetter of [false, true]) {
    const { app } = createTestApp({ today: "2026-11-21" });
    const absence = () => call(app, "joanna", `${path}/absences`, { from: "2026-09-01", to: "2026-10-20", excused: "1" });
    if (beforeLetter) expect((await absence()).status).toBe(303);
    expect((await call(app, "marek", `${path}/deadline-change`, { ...CHANGE, newDate: "2027-06-01" })).status).toBe(303);
    if (!beforeLetter) expect((await absence()).status).toBe(303);
    expect(effectiveDeadline(PIOTR).date).toBe(beforeLetter ? "2027-06-01" : "2027-07-21");
  }
});
