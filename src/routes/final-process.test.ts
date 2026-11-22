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
