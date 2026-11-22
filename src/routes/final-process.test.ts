import { expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

test("samodzielny pokaz pokazuje tylko widoczne dane i prowadzi do części I", async () => {
  const { app } = createTestApp({ today: "2024-12-09" });
  for (const [person, cycle] of [["ewa", "cycle-ewa"], ["tomasz", "cycle-tomasz"]]) {
    const home = await html(app, person, "/");
    expect(home).toContain(`href="/cycles/${cycle}/part1"`);
    expect(home).not.toContain("Zobacz ocenę");
  }
  const notes = await html(app, "marek", "/notes");
  expect(notes).toContain('href="/cycles/cycle-piotr">Wyznacz kryteria');
  expect(notes).not.toContain("Pismo do gminy poszło");
  expect((await call(app, "anna", "/cycles/cycle-anna/part1")).status).toBe(404);
  await call(app, "marek", "/demo/date", { date: "2025-02-11" });
  expect(await html(app, "marek", "/notes")).not.toContain("Pismo do gminy poszło");
  expect((await call(app, "marek", "/people/piotr/notes", { criterion_id: "rzetelnosc", text: "Fakt dodany na żywo." })).status).toBe(303);
  expect(await html(app, "marek", "/notes")).toContain("Fakt dodany na żywo.");
  expect((await call(app, "marek", "/cycles/cycle-piotr/part1/submit", {})).status).toBe(303);
  expect((await call(app, "piotr", "/cycles/cycle-piotr/part1/confirm", {})).status).toBe(303);
  const after = await html(app, "marek", "/notes");
  expect(after).toContain("Pismo do gminy poszło");
  expect(after).not.toContain("Odpowiedź na pismo gminy była tak ogólna");
  const invite = await html(app, "marek", "/cycles/cycle-piotr/invitations/new?kind=opening");
  expect(invite).toContain("Termin rozmowy o kryteriach minął 27.12.2024.");
  expect(invite).not.toMatch(/-\d+ dni/);
});

test("sprawa wskazuje słownie przekroczony termin dopiero następnego dnia", async () => {
  const { app } = createTestApp({ today: "2024-12-27" });
  const dueDay = await html(app, "marek", "/");
  expect(dueDay).toContain("<b>termin dziś</b><span>do 27.12.2024");
  expect(dueDay).not.toContain("po terminie");
  await call(app, "marek", "/demo/date", { date: "2024-12-28" });
  expect(await html(app, "marek", "/")).toContain("<b>po terminie od 1 dnia</b><span>termin minął 27.12.2024");
});

test("Barbara może wybrać konto, rozpatrzyć wniosek Anny i zobaczyć statystyki bez listy osób", async () => {
  const { app } = createTestApp({ today: "2026-11-22" });
  expect(await (await app.request("/account")).text()).toContain('value="dyrektor-urzedu"');
  expect((await call(app, "anna", "/account", { person_id: "dyrektor-urzedu" })).status).toBe(303);
  const home = await html(app, "dyrektor-urzedu", "/");
  expect(home).toContain("Rozpatrz wniosek");
  expect(home).toContain('href="/cycles/cycle-anna/deadline-change"');
  expect(home).toContain('href="/office/statistics"');

  const stats = await html(app, "dyrektor-urzedu", "/office/statistics");
  expect(stats).toContain('id="statystyki"');
  expect(stats).toContain('class="stat"');
  expect(stats).not.toMatch(/Anna Kwiatkowska|Piotr Wójcik|Tomasz Kamiński/);
  expect((await call(app, "marek", "/office/statistics")).status).toBe(403);
  expect((await call(app, "dyrektor-urzedu", "/hr")).status).toBe(403);

  const decision = await call(app, "dyrektor-urzedu", "/cycles/cycle-anna/deadline-change", {
    case: "4", newDate: "2027-03-15", reason: "Zmiana stanowiska pracy",
  });
  expect(decision.status).toBe(303);
  expect(decision.headers.get("location")).toMatch(/\/letter$/);
  expect(await html(app, "dyrektor-urzedu", "/")).not.toContain("Rozpatrz wniosek");
});

test("kadry otwierają przygotowany arkusz A kierownika urzędu", async () => {
  const { app } = createTestApp({ today: "2026-11-22" });
  expect(await html(app, "joanna", "/hr")).toContain('href="/cycles/cycle-office-head/sheet"');
  const sheet = await html(app, "joanna", "/cycles/cycle-office-head/sheet");
  expect(sheet).toContain("Arkusz A");
  expect(sheet).toContain("Irena Maj");
  expect(sheet).toContain("Zarządzanie strategiczne");
});

test("zestawienie rozdziela terminy, a lista pracowników pomija konto techniczne", async () => {
  const { app } = createTestApp({ today: "2026-11-22" });
  const csv = await (await call(app, "joanna", "/hr/export.csv")).text();
  expect(csv).toContain("Termin oceny;Termin sprzeciwu");
  const tomasz = csv.split("\r\n").find((row) => row.startsWith("Tomasz Kamiński;"))!.split(";");
  expect(tomasz.slice(5, 7)).toEqual(["12.11.2026", "19.11.2026"]);
  expect(await html(app, "joanna", "/hr/people")).not.toContain("/hr/people/admin/edit");
  const accounts = await (await app.request("/account")).text();
  expect(accounts).toMatch(/value="tomasz"><b>Tomasz Kamiński<\/b><span class="cap">Naczelnik wydziału<\/span><span class="acc-role">oceniany<\/span>/);
});

test("tylko uprawnione konto pobiera jedną zatwierdzoną ocenę", async () => {
  const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
  const path = "/cycles/cycle-piotr/assessment/export.json";
  expect((await call(app, "marek", path)).status).toBe(404);
  await approveAndAcknowledgePiotr(app);
  expect(await html(app, "piotr", "/cycles/cycle-piotr/assessment")).toContain(`href="${path}"`);
  expect(await html(app, "joanna", "/hr")).toContain(`href="${path}"`);
  expect((await call(app, "ewa", path)).status).toBe(403);
  const response = await call(app, "joanna", path);
  expect(response.headers.get("content-disposition")).toBe("attachment; filename=ocena.json");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toMatchObject({
    employee: "Piotr Wójcik",
    assessment: { sheet: "C", developmentConclusions: "Kurs pism urzędowych." },
    acknowledgement: { objectionDeadline: "2026-11-30" },
  });
});

test("kadry usuwają dane jednej osoby dopiero po potwierdzeniu", async () => {
  const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
  await approveAndAcknowledgePiotr(app);
  const deletion = "/hr/people/piotr/delete";
  expect(await html(app, "joanna", "/hr/people/piotr/edit")).toContain(`href="${deletion}"`);
  expect(await html(app, "joanna", deletion)).toContain("Potwierdzenie usunięcia danych");
  expect((await call(app, "piotr", deletion, { confirmed: "1" })).status).toBe(403);
  expect((await call(app, "admin", deletion, { confirmed: "1" })).status).toBe(403);
  expect((await call(app, "joanna", deletion, {})).status).toBe(422);
  expect((await call(app, "joanna", "/hr/people/marek/delete", { confirmed: "1" })).status).toBe(409);

  const cycleIds = db.query("SELECT id FROM cycles WHERE person_id = 'piotr'").all() as { id: string }[];
  const note = db.query("SELECT id FROM notes WHERE subject_id = 'piotr' LIMIT 1").get() as { id: number };
  db.query("INSERT INTO feedback_messages (note_id, author_id, recipient_id, sent_on, text) VALUES (?, 'marek', 'piotr', '2027-01-01', 'Przykład')").run(note.id);
  db.query("INSERT INTO absences (person_id, date_from, date_to, recorded_on, recorded_by) VALUES ('piotr', '2027-01-01', '2027-01-02', '2027-01-02', 'joanna')").run();
  expect(db.query("SELECT 1 FROM people WHERE id = 'piotr'").get()).toBeTruthy();

  const res = await call(app, "joanna", deletion, { confirmed: "1" });
  expect(res.status).toBe(303);
  expect(await html(app, "joanna", res.headers.get("location")!)).toContain("Usunięto dane pracownika.");
  for (const { id } of cycleIds) {
    expect(db.query("SELECT 1 FROM cycles WHERE id = ?").get(id)).toBeNull();
    expect(db.query("SELECT 1 FROM cycle_criteria WHERE cycle_id = ?").get(id)).toBeNull();
    expect(db.query("SELECT 1 FROM events WHERE cycle_id = ?").get(id)).toBeNull();
  }
  expect(db.query("SELECT 1 FROM people WHERE id = 'piotr'").get()).toBeNull();
  expect(db.query("SELECT 1 FROM notes WHERE subject_id = 'piotr'").get()).toBeNull();
  expect(db.query("SELECT 1 FROM feedback_messages WHERE recipient_id = 'piotr'").get()).toBeNull();
  expect(db.query("SELECT 1 FROM absences WHERE person_id = 'piotr'").get()).toBeNull();
  expect((await call(app, "joanna", "/cycles/cycle-piotr/assessment/export.json")).status).toBe(404);
  expect((await call(app, "joanna", "/cycles/cycle-tomasz/assessment/export.json")).status).toBe(200);
});
