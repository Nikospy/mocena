import { getDb } from "../db";
import { seedEvent } from "../events";
import { DEMO_DIRECTOR_GENERAL_ID } from "../people";

type P = [id: string, name: string, role: string, title: string, supervisor: string | null, account: 0 | 1];

const UNIT = "Wydział Organizacyjny";

const people: P[] = [
  ["marek", "Marek Zieliński", "appraiser", "Naczelnik Wydziału Organizacyjnego", "dyrektor-urzedu", 1],
  ["piotr", "Piotr Wójcik", "employee", "Starszy specjalista", "marek", 1],
  ["ewa", "Ewa Nowak", "employee", "Specjalista", "marek", 1],
  ["maria", "Maria Dąbrowska", "employee", "Specjalista", "marek", 0],
  ["tomasz", "Tomasz Kamiński", "employee", "Naczelnik wydziału", "anna", 1],
  ["katarzyna", "Katarzyna Lewandowska", "employee", "Specjalista", "anna", 0],
  ["anna", "Anna Kwiatkowska", "appraiser", "Dyrektor departamentu", "dyrektor-urzedu", 1],
  ["joanna", "Joanna Mazur", "hr", "Główny specjalista ds. kadr", null, 1],
  ["admin", "Administrator", "admin", "Administrator systemu", null, 1],
  ["poprzedni-naczelnik", "Jerzy Malinowski", "appraiser", "Były naczelnik Wydziału Organizacyjnego", null, 0],
  [DEMO_DIRECTOR_GENERAL_ID, "Barbara Szymańska", "appraiser", "Dyrektor generalny urzędu", null, 1],
];

export function seedBase(_opts: { liveStep2: boolean; afterStep1: boolean }): void {
  const db = getDb();
  const insPerson = db.prepare(
    `INSERT INTO people (id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade, grade_awarded_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const [id, name, role, title, sup, acc] of people) {
    const tomasz = id === "tomasz";
    insPerson.run(id, name, role, title, UNIT, sup, acc, tomasz ? 1 : 0, tomasz ? "V" : null, tomasz ? "2022-12-01" : null);
  }

  const set = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  set.run("demo_date", "2024-12-09");
  set.run("office_city", "Rzeszów");
  set.run("office_name", "Podkarpacki Urząd Wojewódzki (dane pokazowe)");

  const insCycle = db.prepare("INSERT INTO cycles (id, person_id, appraiser_id, period_start) VALUES (?, ?, ?, ?)");
  const cycles: [string, string, string, string, string, string, string | null][] = [
    // id, person, appraiser, period_start, event actor, event date, previousAssessmentOn
    ["cycle-piotr", "piotr", "marek", "2024-11-27", "marek", "2024-12-09", "2024-11-27"],
    ["cycle-ewa", "ewa", "marek", "2024-11-20", "poprzedni-naczelnik", "2024-11-20", "2024-11-20"],
    ["cycle-tomasz", "tomasz", "anna", "2024-11-12", "anna", "2024-11-12", "2024-11-12"],
  ];
  for (const [id, person, appraiser, start, actor, date, prev] of cycles) {
    insCycle.run(id, person, appraiser, start);
    seedEvent(
      "cycle_started",
      id,
      actor,
      {
        reason: "previous_assessment",
        periodStart: start,
        previousAssessmentOn: prev,
        previousAcknowledgedOn: prev,
        previousOutcome: "positive",
      },
      date,
    );
  }
}
