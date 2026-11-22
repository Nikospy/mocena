import { assessmentInForce, assessmentState, hasPendingReassessment } from "../assessment/state";
import { effectiveDeadline } from "../cycles";
import { getDb } from "../db";
import { today } from "../settings";
import { cycleState, type CycleStep } from "./cycle-state";
import { latestCycles, pendingReassessmentPredecessor } from "./latest-cycles";

export type OfficeStats = { byStep: Partial<Record<CycleStep, number>>; onTime: number; late: number; overdueOpen: number; pendingReassessments: number };

/** Statystyki terminowości dla całego urzędu, bez nazwisk; tylko widoczne zdarzenia. */
export function officeStats(): OfficeStats {
  const byStep: OfficeStats["byStep"] = {};
  let overdueOpen = 0;
  let pendingReassessments = 0;
  for (const latest of latestCycles()) {
    const cycle = pendingReassessmentPredecessor(latest) ?? latest;
    const { step, overdue } = cycleState(cycle.id);
    const state = assessmentState(cycle.id);
    byStep[step] = (byStep[step] ?? 0) + 1;
    if (hasPendingReassessment(state)) {
      pendingReassessments++;
      if (state.stage === "draft" && overdue) overdueOpen++;
    } else if (!state.snapshot && effectiveDeadline(cycle.id).date < today()) overdueOpen++;
  }
  let onTime = 0;
  let late = 0;
  for (const { id } of getDb().query("SELECT id FROM cycles").all() as { id: string }[]) {
    const s = assessmentInForce(id);
    if (!s.snapshot || !s.approvedOn) continue;
    if (s.approvedOn <= s.snapshot.deadline.date) onTime++;
    else late++;
  }
  return { byStep, onTime, late, overdueOpen, pendingReassessments };
}
