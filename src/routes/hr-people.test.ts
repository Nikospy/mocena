import { beforeEach, describe, expect, test } from "bun:test";
import { effectiveDeadline, openCycle } from "../cycles";
import { submitPart1 } from "../cycles/part1";
import { getDb } from "../db";
import { nextAssessmentDeadline } from "../engine/deadlines";
import { visibleEvents } from "../events";
import { createTestApp } from "../test-helpers";
import { call, html, type App } from "./hr-test-helpers";

let app: App;
beforeEach(() => {
  app = createTestApp().app;
});

const newPerson = { name: "Jan Kowalski", position_title: "Specjalista", unit: "Wydział Organizacyjny", supervisor_id: "marek", prev_on: "2024-03-10", prev_outcome: "positive" };
const piotrForm = { name: "Piotr Wójcik", position_title: "Starszy specjalista", unit: "Wydział Organizacyjny", supervisor_id: "marek", sheet: "C" };
const appraiserOf = (cycleId: string) => (getDb().query("SELECT appraiser_id FROM cycles WHERE id = ?").get(cycleId) as { appraiser_id: string }).appraiser_id;

describe("lista pracowników", () => {
  test("wyszukiwanie bez rozróżniania wielkości liter i z polskimi znakami, sortowanie po terminie", async () => {
    for (const q of ["wój", "WÓJ"]) {
      const h = await html(app, "joanna", `/hr/people?q=${encodeURIComponent(q)}`);
      expect(h).toContain("Piotr Wójcik");
      expect(h).not.toContain("Ewa Nowak");
    }
    const h = await html(app, "joanna", "/hr/people?sort=deadline");
    const at = (name: string) => h.indexOf(name);
    // Tomasz 12.11.2026, Ewa 20.11.2026, Piotr 27.11.2026
    expect(at("Tomasz Kamiński")).toBeLessThan(at("Ewa Nowak"));
    expect(at("Ewa Nowak")).toBeLessThan(at("Piotr Wójcik"));
    expect(h).toContain("27.11.2026");
  });

  test("tylko kadry i administrator", async () => {
    expect((await call(app, "piotr", "/hr/people")).status).toBe(403);
    expect((await call(app, "marek", "/hr/substitutions")).status).toBe(403);
    expect((await call(app, "piotr", "/hr/export.csv")).status).toBe(403);
    expect((await call(app, "admin", "/hr/people")).status).toBe(200);
  });
});

describe("dodawanie i edycja", () => {
  test("nowy pracownik z datą ostatniej oceny dostaje otwarty cykl z terminem z silnika", async () => {
    const r = await call(app, "joanna", "/hr/people", newPerson);
    expect(r.status).toBe(303);
    const cycle = openCycle("jan-kowalski")!;
    expect(cycle.appraiser_id).toBe("marek");
    expect(effectiveDeadline(cycle.id).date).toBe(nextAssessmentDeadline("2024-03-10"));
    const started = visibleEvents(cycle.id).find((e) => e.type === "cycle_started")!;
    expect(Object.keys(started.payload).sort()).toEqual(["periodStart", "previousAcknowledgedOn", "previousAssessmentOn", "previousOutcome", "reason"]);
  });

  test("422 z komunikatami po polsku i bez zapisu", async () => {
    const r = await call(app, "joanna", "/hr/people", { ...newPerson, name: "", prev_on: "" });
    expect(r.status).toBe(422);
    const h = await r.text();
    expect(h).toContain("Wpisz imię i nazwisko.");
    expect(h).toContain("Podaj datę zatrudnienia na czas nieokreślony albo datę i wynik ostatniej oceny");
    expect(getDb().query("SELECT 1 FROM people WHERE name = ?").get("")).toBeNull();
  });

  test("edycja stanowiska zapisuje się", async () => {
    const r = await call(app, "joanna", "/hr/people/piotr/edit", { ...piotrForm, position_title: "Główny specjalista", prev_on: "2024-11-27", prev_outcome: "positive" });
    expect(r.status).toBe(303);
    expect((getDb().query("SELECT position_title FROM people WHERE id = 'piotr'").get() as any).position_title).toBe("Główny specjalista");
  });

  test("zmiana przełożonego przy otwartym cyklu prowadzi do zmiany oceniającego i niczego w cyklu nie zmienia", async () => {
    const r = await call(app, "joanna", "/hr/people/piotr/edit", { ...piotrForm, supervisor_id: "anna", prev_on: "2024-11-27", prev_outcome: "positive" });
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("/cycles/cycle-piotr/appraiser?to=anna");
    expect(appraiserOf("cycle-piotr")).toBe("marek");
    expect(await html(app, "joanna", "/cycles/cycle-piotr/appraiser?to=anna")).toContain('value="anna" selected');
  });

  test("ocena sprzed systemu trafia do historii i przelicza termin", async () => {
    expect(effectiveDeadline("cycle-piotr").date).toBe("2026-11-27");
    const r = await call(app, "joanna", "/hr/people/piotr/edit", { ...piotrForm, prev_on: "2024-06-05", prev_outcome: "positive", prev_level: "powyżej oczekiwań" });
    expect(r.status).toBe(303);
    expect(effectiveDeadline("cycle-piotr").date).toBe(nextAssessmentDeadline("2024-06-05"));
    const h = await html(app, "joanna", "/people/piotr/history");
    expect(h).toContain("Ocena z 05.06.2024");
    expect(h).toContain("pozytywna");
  });
});

describe("zastępstwa", () => {
  const sub = (from: string, to: string) => call(app, "joanna", "/hr/substitutions", { absent_id: "marek", substitute_id: "anna", date_from: from, date_to: to });
  const note = () => call(app, "anna", "/people/piotr/notes", { criterion_id: "rzetelnosc", text: "Fakt." });

  test("poza zakresem dat zastępca dostaje 403, w zakresie widzi zespół i pisze notatkę z on_behalf_of", async () => {
    expect((await sub("2024-12-10", "2024-12-20")).status).toBe(303);
    expect((await note()).status).toBe(403);
    expect(await html(app, "anna", "/")).not.toContain("W zastępstwie za");

    expect((await sub("2024-12-09", "2024-12-20")).status).toBe(303);
    expect(await html(app, "anna", "/")).toContain("W zastępstwie za Marka Zielińskiego do 20.12.2024");
    expect((await note()).status).toBe(303);
    const ev = getDb().query("SELECT payload FROM events WHERE type = 'note_added_in_substitution'").get() as { payload: string };
    expect(JSON.parse(ev.payload).on_behalf_of).toBe("marek");
  });

  test("czynność oceniającego ma on_behalf_of, a oś czasu mówi „w zastępstwie”", async () => {
    await sub("2024-12-09", "2024-12-20");
    expect(submitPart1("cycle-piotr", "anna", { additional: [], expectations: {} })).toEqual({ ok: true });
    const e = visibleEvents("cycle-piotr").find((x) => x.type === "part1_submitted")!;
    expect(e.payload.on_behalf_of).toBe("marek");
    expect(await html(app, "anna", "/cycles/cycle-piotr/timeline")).toContain("(w zastępstwie)");
  });

  test("walidacja: koniec przed początkiem i ten sam człowiek", async () => {
    expect((await sub("2024-12-20", "2024-12-10")).status).toBe(422);
    const same = await call(app, "joanna", "/hr/substitutions", { absent_id: "marek", substitute_id: "marek", date_from: "2024-12-09", date_to: "2024-12-10" });
    expect(same.status).toBe(422);
    expect(await html(app, "joanna", "/hr/substitutions")).toContain("To praktyka z poradnika KPRM, nie przepis.");
  });
});

describe("zestawienie CSV", () => {
  test("UTF-8 z BOM, średniki, nagłówek po polsku i wiersz Piotra", async () => {
    const r = await call(app, "joanna", "/hr/export.csv");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    const text = await r.text();
    expect(text.charCodeAt(0)).toBe(0xfeff);
    const lines = text.slice(1).trimEnd().split("\r\n");
    expect(lines[0]).toBe("Osoba;Stanowisko;Komórka;Oceniający;Stan procesu;Termin;Data ostatniej oceny;Wynik ostatniej oceny");
    const piotr = lines.find((l) => l.startsWith("Piotr Wójcik;"))!;
    expect(piotr).toContain(";Starszy specjalista;Wydział Organizacyjny;Marek Zieliński;");
    expect(piotr.endsWith(";27.11.2024;pozytywna")).toBe(true);
    expect(lines.length).toBeGreaterThan(3);
  });
});
