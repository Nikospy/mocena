import { expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { call, html } from "./hr-test-helpers";

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
  expect(await html(app, "marek", "/notes")).toContain("Pismo do gminy poszło");
  const invite = await html(app, "marek", "/cycles/cycle-piotr/invitations/new?kind=opening");
  expect(invite).toContain("Termin rozmowy o kryteriach minął 27.12.2024.");
  expect(invite).not.toMatch(/-\d+ dni/);
});

test("sprawa wskazuje słownie przekroczony termin dopiero następnego dnia", async () => {
  const { app } = createTestApp({ today: "2024-12-27" });
  expect(await html(app, "marek", "/")).toContain("do <b>27.12.2024</b>");
  await call(app, "marek", "/demo/date", { date: "2024-12-28" });
  expect(await html(app, "marek", "/")).toContain("po terminie od <b>27.12.2024</b>");
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
