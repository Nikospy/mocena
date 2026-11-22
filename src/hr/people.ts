// Dane pracowników w kadrach: lista, zapis, ocena sprzed systemu. Termin liczy zawsze silnik przez `effectiveDeadline`.
import { effectiveDeadline, openCycle, type Cycle } from "../cycles";
import { getDb } from "../db";
import { sheetForPosition, type PositionKind } from "../engine/criteria";
import { romanGrade } from "../engine/grades";
import { rules } from "../engine/rules";
import { recordEvent, visibleEvents } from "../events";
import { personById, type Person } from "../people";
import { today } from "../settings";
import { assessmentHistory, visibleCyclesOf } from "./history";

export type Sheet = "A" | "B" | "C";
export const SHEETS: Sheet[] = ["A", "B", "C"];
const KIND_OF_SHEET: Record<Sheet, PositionKind> = { A: "head_of_office", B: "manager", C: "staff" };
export const OUTCOME_LABEL = { positive: "pozytywna", negative: "negatywna" } as const;
export const LEVELS: string[] = rules.overallLevels.map((l) => l.name);
export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export type PersonForm = {
  name: string;
  position_title: string;
  unit: string;
  appointed: boolean;
  is_appraiser: boolean;
  sheet: string;
  supervisor_id: string;
  hired_on: string;
  prev_on: string;
  prev_outcome: string;
  prev_level: string;
  grade: string;
  grade_on: string;
};
export type FormErrors = Partial<Record<keyof PersonForm | "form", string>>;

/** Podpowiedź typu arkusza ze stanowiska (§ 3 rozporządzenia): kierownik urzędu A, kierowanie zespołem B, pozostali C. */
export function suggestSheet(title: string): Sheet {
  const t = title.toLocaleLowerCase("pl");
  if (/dyrektor generalny|szef urzędu|kierownik urzędu/.test(t)) return "A";
  if (/naczelnik|dyrektor|kierownik|zastępca/.test(t)) return "B";
  return "C";
}

export function sheetOf(p: Pick<Person, "position_kind">): Sheet | null {
  return p.position_kind ? (sheetForPosition(p.position_kind).sheet as Sheet) : null;
}

function isIsoDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
}

export function supervisorCandidates(exceptId?: string): Person[] {
  return getDb().query("SELECT * FROM people WHERE role = 'appraiser' AND id <> ? ORDER BY name").all(exceptId ?? "") as Person[];
}

/** Ostatnia znana ocena sprzed cyklu: z wpisu o ocenie sprzed systemu albo ze startu cyklu. */
export function previousAssessmentOf(cycleId: string): { on: string; outcome: "positive" | "negative" | null; level: string | null } | null {
  const p = visibleEvents(cycleId).filter((e) => e.type === "cycle_started" || e.type === "previous_assessment_recorded").pop()?.payload;
  return p?.previousAssessmentOn ? { on: p.previousAssessmentOn, outcome: p.previousOutcome ?? null, level: p.previousLevel ?? null } : null;
}

export function formFromPerson(p: Person): PersonForm {
  const cycle = openCycle(p.id);
  const prev = cycle ? previousAssessmentOf(cycle.id) : null;
  const grade = p.civil_service_grade ? String(Number(p.civil_service_grade) || romanToNumber(p.civil_service_grade)) : "";
  return {
    name: p.name,
    position_title: p.position_title ?? "",
    unit: p.unit ?? "",
    appointed: p.appointed === 1,
    is_appraiser: p.role === "appraiser",
    sheet: sheetOf(p) ?? suggestSheet(p.position_title ?? ""),
    supervisor_id: p.supervisor_id ?? "",
    hired_on: "",
    prev_on: prev?.on ?? "",
    prev_outcome: prev?.outcome ?? "",
    prev_level: prev?.level ?? "",
    grade: grade === "0" ? "" : grade,
    grade_on: p.grade_awarded_on ?? "",
  };
}

function romanToNumber(s: string): number {
  const i = [...Array(10).keys()].find((n) => n > 0 && romanGrade(n) === s.trim().toUpperCase());
  return i ?? 0;
}

export function emptyForm(): PersonForm {
  return { name: "", position_title: "", unit: "", appointed: false, is_appraiser: false, sheet: "", supervisor_id: "", hired_on: "", prev_on: "", prev_outcome: "", prev_level: "", grade: "", grade_on: "" };
}

export function readForm(body: Record<string, unknown>): PersonForm {
  const s = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  return {
    name: s("name"),
    position_title: s("position_title"),
    unit: s("unit"),
    appointed: s("appointed") !== "",
    is_appraiser: s("is_appraiser") !== "",
    sheet: s("sheet"),
    supervisor_id: s("supervisor_id"),
    hired_on: s("hired_on"),
    prev_on: s("prev_on"),
    prev_outcome: s("prev_outcome"),
    prev_level: s("prev_level"),
    grade: s("grade"),
    grade_on: s("grade_on"),
  };
}

/** `existing`: edytowana osoba; `hasCycle`: osoba ma już cykl, więc data zatrudnienia nie otwiera nowego. */
export function validateForm(f: PersonForm, opts: { personId?: string; hasCycle: boolean; needsSupervisor: boolean }): FormErrors {
  const e: FormErrors = {};
  const now = today();
  if (!f.name) e.name = "Wpisz imię i nazwisko.";
  else if (f.name.length > 120) e.name = "Imię i nazwisko może mieć najwyżej 120 znaków.";
  if (!f.position_title) e.position_title = "Wpisz stanowisko.";
  if (!f.unit) e.unit = "Wpisz komórkę organizacyjną.";
  if (f.sheet && !SHEETS.includes(f.sheet as Sheet)) e.sheet = "Wybierz typ arkusza: A, B albo C.";
  if (f.supervisor_id) {
    if (f.supervisor_id === opts.personId || !supervisorCandidates().some((p) => p.id === f.supervisor_id)) e.supervisor_id = "Wybierz przełożonego z listy.";
  } else if (opts.needsSupervisor) e.supervisor_id = "Wybierz przełożonego: wyznacza on oceniającego.";
  for (const k of ["hired_on", "prev_on", "grade_on"] as const) {
    if (!f[k]) continue;
    if (!isIsoDate(f[k])) e[k] = "Podaj poprawną datę.";
    else if (f[k] > now) e[k] = "Wpisz datę nie późniejszą niż dzisiejsza.";
  }
  if (f.prev_on && !e.prev_on) {
    if (f.prev_outcome !== "positive" && f.prev_outcome !== "negative") e.prev_outcome = "Wybierz wynik oceny: pozytywna albo negatywna.";
  }
  if (f.prev_level && !LEVELS.includes(f.prev_level)) e.prev_level = "Wybierz poziom z listy.";
  if (f.grade && !GRADES.includes(Number(f.grade))) e.grade = "Wybierz stopień z listy.";
  if (f.grade && !f.grade_on) e.grade_on = "Podaj datę przyznania stopnia.";
  if (!opts.hasCycle && !f.hired_on && !f.prev_on) {
    e.form = "Podaj datę zatrudnienia na czas nieokreślony albo datę i wynik ostatniej oceny. Od niej system liczy termin.";
  }
  return e;
}

function slug(name: string): string {
  const base = name
    .toLocaleLowerCase("pl")
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "osoba";
}

function freeId(table: "people" | "cycles", base: string): string {
  let id = base;
  for (let n = 2; getDb().query(`SELECT 1 FROM ${table} WHERE id = ?`).get(id); n++) id = `${base}-${n}`;
  return id;
}

/** Zapis oceny sprzed systemu: wpis w historii, początek okresu i termin liczone od jej daty. */
function writePrevious(cycleId: string, actorId: string, f: PersonForm): void {
  getDb().query("UPDATE cycles SET period_start = ? WHERE id = ?").run(f.prev_on, cycleId);
  recordEvent("previous_assessment_recorded", cycleId, actorId, {
    reason: "previous_assessment",
    periodStart: f.prev_on,
    previousAssessmentOn: f.prev_on,
    previousAcknowledgedOn: f.prev_on,
    previousOutcome: f.prev_outcome,
    previousLevel: f.prev_level || null,
  });
}

/** Otwiera cykl: wiersz w `cycles` i zdarzenie `cycle_started` z pięcioma polami; termin liczy silnik. */
function startCycle(personId: string, appraiserId: string, f: PersonForm, actorId: string): string {
  const cycleId = freeId("cycles", `cycle-${personId}`);
  const start = f.prev_on || f.hired_on;
  getDb().query("INSERT INTO cycles (id, person_id, appraiser_id, period_start) VALUES (?, ?, ?, ?)").run(cycleId, personId, appraiserId, start);
  recordEvent("cycle_started", cycleId, actorId, {
    reason: f.prev_on ? "previous_assessment" : "employment",
    periodStart: start,
    previousAssessmentOn: f.prev_on || null,
    previousAcknowledgedOn: f.prev_on || null,
    previousOutcome: f.prev_on ? f.prev_outcome : null,
  });
  if (f.prev_on) writePrevious(cycleId, actorId, f);
  return cycleId;
}

export function createPerson(f: PersonForm, actorId: string): { personId: string; cycleId: string } {
  const db = getDb();
  return db.transaction(() => {
    const personId = freeId("people", slug(f.name));
    const { kind, grade, gradeOn } = personColumns(f);
    db.query(
      `INSERT INTO people (id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade, grade_awarded_on, position_kind)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    ).run(personId, f.name, f.is_appraiser ? "appraiser" : "employee", f.position_title, f.unit, f.supervisor_id || null, f.appointed ? 1 : 0, grade, gradeOn, kind);
    return { personId, cycleId: startCycle(personId, f.supervisor_id, f, actorId) };
  })();
}

function personColumns(f: PersonForm): { kind: PositionKind; grade: string | null; gradeOn: string | null } {
  const sheet = (f.sheet || suggestSheet(f.position_title)) as Sheet;
  return { kind: KIND_OF_SHEET[sheet], grade: f.appointed && f.grade ? romanGrade(Number(f.grade)) : null, gradeOn: f.appointed && f.grade ? f.grade_on : null };
}

/** Zapis edycji. Zmiana przełożonego przy otwartym cyklu nie zmienia oceniającego: zwraca cykl, do którego trzeba przejść. */
export function updatePerson(person: Person, f: PersonForm, actorId: string): { appraiserChange?: { cycleId: string; to: string } } {
  const db = getDb();
  const open = openCycle(person.id);
  return db.transaction(() => {
    const { kind, grade, gradeOn } = personColumns(f);
    const role = person.role === "appraiser" || person.role === "employee" ? (f.is_appraiser ? "appraiser" : "employee") : person.role;
    db.query(
      `UPDATE people SET name = ?, role = ?, position_title = ?, unit = ?, supervisor_id = ?, appointed = ?, civil_service_grade = ?, grade_awarded_on = ?, position_kind = ? WHERE id = ?`,
    ).run(f.name, role, f.position_title, f.unit, f.supervisor_id || null, f.appointed ? 1 : 0, grade, gradeOn, kind, person.id);
    if (open) {
      const prev = previousAssessmentOf(open.id);
      if (f.prev_on && (f.prev_on !== prev?.on || f.prev_outcome !== (prev?.outcome ?? "") || (f.prev_level || null) !== (prev?.level ?? null))) writePrevious(open.id, actorId, f);
    } else if ((f.prev_on || f.hired_on) && visibleCyclesOf(person.id).length === 0) {
      startCycle(person.id, f.supervisor_id, f, actorId);
    }
    if (open && f.supervisor_id && f.supervisor_id !== open.appraiser_id) return { appraiserChange: { cycleId: open.id, to: f.supervisor_id } };
    return {};
  })();
}

export type PersonRow = { id: string; name: string; position: string; unit: string; supervisor: string; sheet: Sheet | null; deadline: { date: string; basis: string[] } | null };
export type Sort = "name" | "deadline" | "unit";

const lower = (s: string) => s.toLocaleLowerCase("pl");

export function listPeople(q: string, sort: Sort): PersonRow[] {
  const all = getDb().query("SELECT * FROM people WHERE role <> 'admin' ORDER BY name").all() as Person[];
  const needle = lower(q.trim());
  const rows = all
    .filter((p) => !needle || lower(p.name).includes(needle) || lower(p.position_title ?? "").includes(needle))
    .map((p): PersonRow => {
      const cycle = openCycle(p.id);
      return {
        id: p.id,
        name: p.name,
        position: p.position_title ?? "",
        unit: p.unit ?? "",
        supervisor: (p.supervisor_id && personById(p.supervisor_id)?.name) || "",
        sheet: sheetOf(p),
        deadline: cycle ? effectiveDeadline(cycle.id) : null,
      };
    });
  const byName = (a: PersonRow, b: PersonRow) => a.name.localeCompare(b.name, "pl");
  if (sort === "deadline") rows.sort((a, b) => (a.deadline?.date ?? "9999").localeCompare(b.deadline?.date ?? "9999") || byName(a, b));
  else if (sort === "unit") rows.sort((a, b) => a.unit.localeCompare(b.unit, "pl") || byName(a, b));
  else rows.sort(byName);
  return rows;
}

export type PreviousAssessment = { cycleId: string; on: string; outcome: "positive" | "negative"; level: string | null; recordedOn: string };

/** Oceny sprzed systemu wpisane przez kadry, od najnowszej. */
export function previousAssessments(personId: string): PreviousAssessment[] {
  const out: PreviousAssessment[] = [];
  for (const c of visibleCyclesOf(personId)) {
    for (const e of visibleEvents(c.id)) {
      if (e.type === "previous_assessment_recorded") {
        out.push({ cycleId: c.id, on: e.payload.previousAssessmentOn, outcome: e.payload.previousOutcome, level: e.payload.previousLevel ?? null, recordedOn: e.date });
      }
    }
  }
  return out.sort((a, b) => b.on.localeCompare(a.on) || b.recordedOn.localeCompare(a.recordedOn));
}

/** Data i wynik ostatniej oceny osoby: zatwierdzonej w systemie albo wpisanej sprzed systemu (nowsza z nich). */
export function lastAssessmentOf(personId: string): { on: string; outcome: "positive" | "negative" | null } | null {
  const found: { on: string; outcome: "positive" | "negative" | null }[] = [];
  const h = assessmentHistory(personId)[0];
  if (h) found.push({ on: h.approvedOn, outcome: h.outcome });
  const c: Cycle | undefined = visibleCyclesOf(personId)[0] as Cycle | undefined;
  const prev = c ? previousAssessmentOf(c.id) : null;
  if (prev) found.push({ on: prev.on, outcome: prev.outcome });
  return found.sort((a, b) => b.on.localeCompare(a.on))[0] ?? null;
}

export function employeeDeletionBlock(person: Person): string | null {
  if (person.role === "hr" || person.role === "admin") return "Konta kadr i administratora nie można usunąć: bez niego nikt nie obsłuży systemu.";
  const db = getDb();
  const supervises = db.query("SELECT 1 FROM people WHERE supervisor_id = ? AND id <> ?").get(person.id, person.id);
  const assesses = db.query("SELECT 1 FROM cycles WHERE appraiser_id = ? AND person_id <> ?").get(person.id, person.id);
  const wasAppraiser = db.query(`
    SELECT 1 FROM events e JOIN cycles c ON c.id = e.cycle_id
    WHERE c.person_id <> ? AND e.type = 'appraiser_changed'
      AND (json_extract(e.payload, '$.from_id') = ? OR json_extract(e.payload, '$.to_id') = ?)
  `).get(person.id, person.id, person.id);
  if (supervises || assesses || wasAppraiser) {
    return "Nie można usunąć tej osoby. Jej dane są potrzebne w cyklach albo kartotekach innych pracowników.";
  }
  return null;
}

/** Usuwa kartotekę i powiązane dane także wtedy, gdy mają datę późniejszą niż data systemowa. */
export function deleteEmployee(id: string): { status: 404 | 409; reason: string } | null {
  const db = getDb();
  return db.transaction(() => {
    const person = personById(id);
    if (!person) return { status: 404 as const, reason: "Nie ma takiej osoby." };
    const blocked = employeeDeletionBlock(person);
    if (blocked) return { status: 409 as const, reason: blocked };
    const ownedCycles = "SELECT id FROM cycles WHERE person_id = ?1";
    const ownedNotes = `SELECT id FROM notes WHERE subject_id = ?1 OR author_id = ?1 OR cycle_id IN (${ownedCycles})`;
    db.query(`DELETE FROM feedback_messages WHERE recipient_id = ?1 OR author_id = ?1 OR note_id IN (${ownedNotes})`).run(id);
    db.query(`
      DELETE FROM events WHERE cycle_id IN (${ownedCycles})
        OR (type = 'absence_recorded' AND json_extract(payload, '$.absence_id') IN (SELECT id FROM absences WHERE person_id = ?1))
        OR json_extract(payload, '$.personId') = ?1
        OR json_extract(payload, '$.subject_id') = ?1
        OR json_extract(payload, '$.note_id') IN (${ownedNotes})
        OR json_extract(payload, '$.noteId') IN (${ownedNotes})
        OR (type = 'substitution_set' AND (json_extract(payload, '$.absent_id') = ?1 OR json_extract(payload, '$.substitute_id') = ?1))
    `).run(id);
    db.query(`DELETE FROM notes WHERE id IN (${ownedNotes})`).run(id);
    db.query(`DELETE FROM cycle_criteria WHERE cycle_id IN (${ownedCycles})`).run(id);
    db.query("DELETE FROM cycles WHERE person_id = ?").run(id);
    db.query("DELETE FROM absences WHERE person_id = ?").run(id);
    db.query("DELETE FROM substitutions WHERE absent_id = ?1 OR substitute_id = ?1").run(id);
    db.query(`
      UPDATE events SET actor_id = NULL,
        payload = CASE type WHEN 'part1_submitted' THEN json_set(payload, '$.appraiserName', 'Usunięte konto') ELSE payload END
      WHERE actor_id = ?
    `).run(id);
    db.query("UPDATE events SET payload = json_remove(payload, '$.on_behalf_of') WHERE json_extract(payload, '$.on_behalf_of') = ?").run(id);
    db.query("DELETE FROM people WHERE id = ?").run(id);
    return null;
  })();
}
