import { getDb } from "../db";
import { cycleById, effectiveDeadline } from "../cycles";
import { sheetForPosition, type PositionKind } from "../engine/criteria";
import { rulesVersion } from "../engine/rules";
import { mandatoryCriteria, validateAdditionalCriteria, type Sheet } from "../engine/scoring";
import { recordEvent, seedEvent, visibleEvents } from "../events";
import { today } from "../settings";

export type Part1Input = { additional: string[]; expectations: Record<string, string> };
export type Part1Result = { ok: true } | { ok: false; errors: string[] };
export type Part1State = "not_started" | "draft" | "submitted" | "confirmed";
export type CycleCriterion = { id: string; kind: "mandatory" | "additional"; expectation: string | null };

export function part1Status(cycleId: string): {
  state: Part1State;
  submittedOn?: string;
  confirmedOn?: string;
  waitingDays?: number;
} {
  const ev = visibleEvents(cycleId);
  const submitted = ev.find((e) => e.type === "part1_submitted");
  const confirmed = ev.find((e) => e.type === "part1_confirmed");
  if (submitted && confirmed) return { state: "confirmed", submittedOn: submitted.date, confirmedOn: confirmed.date };
  if (submitted) {
    return { state: "submitted", submittedOn: submitted.date, waitingDays: daysBetween(submitted.date, today()) };
  }
  const rows = getDb().query("SELECT 1 FROM cycle_criteria WHERE cycle_id = ? LIMIT 1").get(cycleId);
  return { state: rows ? "draft" : "not_started" };
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

export function isPart1Locked(cycleId: string): boolean {
  const s = part1Status(cycleId).state;
  return s === "submitted" || s === "confirmed";
}

/** Obowiązkowe, potem dodatkowe, z oczekiwaniem. */
export function cycleCriteria(cycleId: string): CycleCriterion[] {
  const rows = getDb()
    .query("SELECT criterion_id AS id, kind, expectation FROM cycle_criteria WHERE cycle_id = ? ORDER BY rowid")
    .all(cycleId) as CycleCriterion[];
  return [...rows.filter((r) => r.kind === "mandatory"), ...rows.filter((r) => r.kind === "additional")];
}

function sheetOfCycle(cycleId: string): { sheet: Sheet; basis: string } {
  const row = getDb()
    .query("SELECT p.position_kind AS kind FROM cycles c JOIN people p ON p.id = c.person_id WHERE c.id = ?")
    .get(cycleId) as { kind: PositionKind | null } | null;
  if (!row?.kind) throw new Error(`Brak rodzaju stanowiska ocenianego w cyklu ${cycleId}`);
  return sheetForPosition(row.kind);
}

function writeCriteria(cycleId: string, sheet: Sheet, input: Part1Input): void {
  const db = getDb();
  const ins = db.prepare("INSERT INTO cycle_criteria (cycle_id, criterion_id, kind, expectation) VALUES (?, ?, ?, ?)");
  db.query("DELETE FROM cycle_criteria WHERE cycle_id = ?").run(cycleId);
  const exp = (id: string) => input.expectations[id]?.trim() || null;
  for (const id of mandatoryCriteria(sheet)) ins.run(cycleId, id, "mandatory", exp(id));
  for (const id of input.additional) ins.run(cycleId, id, "additional", exp(id));
}

function isAppraiser(cycleId: string, actorId: string): boolean {
  return cycleById(cycleId)?.appraiser_id === actorId;
}

function precheck(cycleId: string, actorId: string, input: Part1Input): string[] {
  if (!isAppraiser(cycleId, actorId)) return ["Tylko bieżący oceniający może wyznaczyć kryteria."];
  if (isPart1Locked(cycleId)) return ["Część I jest już przekazana. Kryteriów i terminu nie można zmienić."];
  return validateAdditionalCriteria(sheetOfCycle(cycleId).sheet, input.additional);
}

export function saveCriteria(cycleId: string, actorId: string, input: Part1Input): Part1Result {
  const errors = precheck(cycleId, actorId, input);
  if (errors.length) return { ok: false, errors };
  const { sheet } = sheetOfCycle(cycleId);
  getDb().transaction(() => writeCriteria(cycleId, sheet, input))();
  return { ok: true };
}

/** Sam zapis: bez sprawdzania aktora i stanu. Woła go `submitPart1` i moduły danych pokazowych. */
export function savePart1(cycleId: string, actorId: string, input: Part1Input, date: string): void {
  const db = getDb();
  const cycle = cycleById(cycleId);
  if (!cycle) throw new Error(`Brak cyklu ${cycleId}`);
  const { sheet, basis } = sheetOfCycle(cycleId);
  const deadline = effectiveDeadline(cycleId, { asOf: date });
  const place = (db.query("SELECT value FROM settings WHERE key = 'office_city'").get() as { value: string } | null)?.value ?? "";
  const actor = db.query("SELECT name FROM people WHERE id = ?").get(actorId) as { name: string } | null;
  db.transaction(() => {
    db.query("UPDATE cycles SET sheet = ? WHERE id = ?").run(sheet, cycleId);
    writeCriteria(cycleId, sheet, input);
    seedEvent(
      "part1_submitted",
      cycleId,
      actorId,
      {
        sheet,
        criteria: cycleCriteria(cycleId),
        dueDate: deadline.date,
        dueDateBasis: deadline.basis,
        criteriaBasis: [basis, "§ 4", ...(input.additional.length ? ["§ 5 ust. 2"] : [])],
        rulesVersion: rulesVersion(),
        place,
        appraiserName: actor?.name ?? "",
      },
      date,
    );
  })();
}

export function submitPart1(cycleId: string, actorId: string, input: Part1Input): Part1Result {
  const db = getDb();
  return db.transaction((): Part1Result => {
    const errors = precheck(cycleId, actorId, input);
    if (errors.length) return { ok: false, errors };
    savePart1(cycleId, actorId, input, today());
    return { ok: true };
  })();
}

export function confirmPart1(cycleId: string, actorId: string): Part1Result {
  const cycle = cycleById(cycleId);
  if (!cycle || cycle.person_id !== actorId) return { ok: false, errors: ["Tylko oceniany może potwierdzić część I."] };
  if (part1Status(cycleId).state !== "submitted") return { ok: false, errors: ["Część I nie czeka na potwierdzenie."] };
  const db = getDb();
  const place = (db.query("SELECT value FROM settings WHERE key = 'office_city'").get() as { value: string } | null)?.value ?? "";
  const p = db.query("SELECT name FROM people WHERE id = ?").get(actorId) as { name: string };
  recordEvent("part1_confirmed", cycleId, actorId, { place, appraiseeName: p.name });
  return { ok: true };
}
