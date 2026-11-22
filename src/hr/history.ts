import { actsAsAppraiser } from "../substitutions";
import { assessmentState, currentGradeNumber, type AssessmentSnapshot } from "../assessment/state";
import { getDb } from "../db";
import { mandatoryGrade, type MandatoryGrade } from "../engine/grades";
import { visibleEvents } from "../events";
import { personById, type Person } from "../people";
import { today } from "../settings";

export type HistoryEntry = {
  cycleId: string;
  approvedOn: string;
  sheet: string;
  mean: number;
  overallLevel: string;
  outcome: "positive" | "negative";
  acknowledgedOn: string | null;
  fiction: boolean;
  rulesVersion: { version: string; effectiveFrom: string; act: string };
  snapshot: AssessmentSnapshot;
};

/** Cykle osoby z widocznym `cycle_started`, od najnowszego okresu. */
export function visibleCyclesOf(personId: string): { id: string; appraiser_id: string; person_id: string; period_start: string }[] {
  const rows = getDb().query("SELECT * FROM cycles WHERE person_id = ? ORDER BY period_start DESC, id DESC").all(personId) as {
    id: string;
    appraiser_id: string;
    person_id: string;
    period_start: string;
  }[];
  return rows.filter((c) => visibleEvents(c.id).some((e) => e.type === "cycle_started"));
}

/** Zatwierdzone i widoczne oceny osoby od najnowszej (data zatwierdzenia, potem cykl). */
export function assessmentHistory(personId: string): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (const c of visibleCyclesOf(personId)) {
    const s = assessmentState(c.id);
    if (!s.snapshot || !s.approvedOn) continue;
    const closing = s.acknowledgement ?? s.fiction;
    out.push({
      cycleId: c.id,
      approvedOn: s.approvedOn,
      sheet: s.snapshot.sheet,
      mean: s.snapshot.result.mean,
      overallLevel: s.snapshot.result.overallLevel,
      outcome: s.snapshot.result.outcome,
      acknowledgedOn: closing?.eventDate ?? null,
      fiction: s.fiction !== null,
      rulesVersion: s.snapshot.rulesVersion,
      snapshot: s.snapshot,
    });
  }
  return out.sort((a, b) => b.approvedOn.localeCompare(a.approvedOn) || b.cycleId.localeCompare(a.cycleId));
}

/** Widzą: sama osoba, oceniający któregokolwiek jej cyklu, kadry. */
export function canViewHistory(viewer: Person, personId: string): boolean {
  if (viewer.id === personId || viewer.role === "hr") return true;
  return visibleCyclesOf(personId).some((c) => actsAsAppraiser(c.appraiser_id, viewer.id));
}

/** Obowiązek stopnia z mocy prawa dla osoby, liczony wyłącznie z widocznych zdarzeń. */
export function mandatoryGradeOf(personId: string): MandatoryGrade | null {
  const p = personById(personId);
  if (!p) return null;
  const { grade, awardedOn } = currentGradeNumber(personId);
  return mandatoryGrade(
    {
      isAppointed: p.appointed === 1,
      currentGrade: grade,
      currentGradeOn: awardedOn,
      assessments: assessmentHistory(personId).map((h) => ({
        cycleId: h.cycleId,
        approvedOn: h.approvedOn,
        outcome: h.outcome,
        overallLevel: h.overallLevel,
        acknowledgedOn: h.acknowledgedOn,
      })),
    },
    today(),
  );
}
