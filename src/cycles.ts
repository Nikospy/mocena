import { getDb } from "./db";
import { visibleEvents } from "./events";
import { nextAssessmentDeadline, periodEndAfterNegative } from "./engine/deadlines";
import { rules } from "./engine/rules";
import { today } from "./settings";

export type Cycle = { id: string; person_id: string; appraiser_id: string; period_start: string; sheet: string | null };

export function cycleById(id: string): Cycle | null {
  return (getDb().query("SELECT * FROM cycles WHERE id = ?").get(id) as Cycle | null) ?? null;
}

export function effectiveDeadline(cycleId: string, opts: { asOf?: string } = {}): { date: string; basis: string[] } {
  const cycle = cycleById(cycleId);
  if (!cycle) throw new Error(`Brak cyklu ${cycleId}`);
  const started = visibleEvents(cycleId, opts).filter((e) => e.type === "cycle_started").pop();
  const p = started?.payload;
  if (p?.previousOutcome === "negative" && p.previousAcknowledgedOn) {
    return {
      date: periodEndAfterNegative(p.previousAcknowledgedOn),
      basis: [rules.deadlines.reassessmentAfterNegativeMonths.basis],
    };
  }
  return { date: nextAssessmentDeadline(cycle.period_start, 0), basis: [rules.deadlines.assessmentEveryMonths.basis] };
}

/** Widoczny cykl (od daty `cycle_started`) bez widocznego potwierdzenia zapoznania ani fikcji; najpóźniejszy `period_start`. */
export function openCycle(personId: string): Cycle | null {
  const cycles = getDb()
    .query("SELECT * FROM cycles WHERE person_id = ? ORDER BY period_start DESC, id DESC")
    .all(personId) as Cycle[];
  const now = today();
  for (const c of cycles) {
    const ev = visibleEvents(c.id, { asOf: now });
    if (!ev.some((e) => e.type === "cycle_started")) continue;
    if (ev.some((e) => e.type === "assessment_acknowledged" || e.type === "acknowledgement_fiction")) continue;
    return c;
  }
  return null;
}
