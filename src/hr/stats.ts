import { assessmentInForce, assessmentState, hasPendingReassessment } from "../assessment/state";
import { effectiveDeadline } from "../cycles";
import { getDb } from "../db";
import { statsMinGroupSize } from "../office-settings";
import { today } from "../settings";
import { cycleState, type CycleStep } from "./cycle-state";
import { latestCycles, pendingReassessmentPredecessor } from "./latest-cycles";
import { protectGroups, protectOne, type PrivacyGroup, type ProtectedGroup } from "./stats-privacy";

export type OfficeStats = { byStep: Partial<Record<CycleStep, number>>; onTime: number; late: number; overdueOpen: number; pendingReassessments: number };

export type ProtectedOfficeStats = {
  minGroup: number;
  settingLabel: string;
  hasData: boolean;
  onTime: number | null;
  late: number | null;
  overdueOpen: number | null;
  pendingReassessments: number | null;
  byStep: Partial<Record<CycleStep, number | null>>;
  byUnit: ProtectedGroup<number>[];
};

const ALL_STEPS: CycleStep[] = [
  "criteria_due",
  "part1_waiting",
  "in_period",
  "awaiting_acknowledgement",
  "acknowledged",
  "fiction",
  "objection_filed",
  "objection_resolved",
  "due_change_requested",
];

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

/** Statystyki dla kierownictwa z ukrywaniem małych grup (poniżej progu różnych osób) i wtórnym ukrywaniem dopełnienia. */
export function protectedOfficeStats(minGroup?: number): ProtectedOfficeStats {
  const setting = statsMinGroupSize();
  const min = minGroup ?? setting.value;

  const stepCounts = new Map<CycleStep, number>();
  const stepPeople = new Map<CycleStep, Set<string>>();
  const unitCounts = new Map<string, number>();
  const unitPeople = new Map<string, Set<string>>();
  const overduePeople = new Set<string>();
  const pendingPeople = new Set<string>();
  let overdueOpenCount = 0;
  let pendingReassessmentsCount = 0;

  const unitByPerson = new Map(
    (getDb().query("SELECT id, unit FROM people").all() as { id: string; unit: string | null }[]).map((r) => [r.id, r.unit]),
  );

  let totalCycles = 0;
  for (const latest of latestCycles()) {
    const cycle = pendingReassessmentPredecessor(latest) ?? latest;
    totalCycles++;
    const { step, overdue } = cycleState(cycle.id);
    const state = assessmentState(cycle.id);

    stepCounts.set(step, (stepCounts.get(step) ?? 0) + 1);
    const sp = stepPeople.get(step) ?? new Set<string>();
    sp.add(cycle.person_id);
    stepPeople.set(step, sp);

    const unit = unitByPerson.get(cycle.person_id)?.trim() || "Bez przypisanej komórki";
    unitCounts.set(unit, (unitCounts.get(unit) ?? 0) + 1);
    const up = unitPeople.get(unit) ?? new Set<string>();
    up.add(cycle.person_id);
    unitPeople.set(unit, up);

    if (hasPendingReassessment(state)) {
      pendingReassessmentsCount++;
      pendingPeople.add(cycle.person_id);
      if (state.stage === "draft" && overdue) {
        overdueOpenCount++;
        overduePeople.add(cycle.person_id);
      }
    } else if (!state.snapshot && effectiveDeadline(cycle.id).date < today()) {
      overdueOpenCount++;
      overduePeople.add(cycle.person_id);
    }
  }

  let onTimeCount = 0;
  let lateCount = 0;
  const onTimePeople = new Set<string>();
  const latePeople = new Set<string>();
  for (const { id, person_id } of getDb().query("SELECT id, person_id FROM cycles").all() as { id: string; person_id: string }[]) {
    const s = assessmentInForce(id);
    if (!s.snapshot || !s.approvedOn) continue;
    if (s.approvedOn <= s.snapshot.deadline.date) {
      onTimeCount++;
      onTimePeople.add(person_id);
    } else {
      lateCount++;
      latePeople.add(person_id);
    }
  }

  const protectedTimeliness = protectGroups<number>(
    [
      { key: "onTime", label: "onTime", count: onTimeCount, people: onTimePeople.size, value: onTimeCount },
      { key: "late", label: "late", count: lateCount, people: latePeople.size, value: lateCount },
    ],
    min,
  );
  const byStepGroups: PrivacyGroup<number>[] = ALL_STEPS.map((step) => ({
    key: step,
    label: step,
    count: stepCounts.get(step) ?? 0,
    people: stepPeople.get(step)?.size ?? 0,
    value: stepCounts.get(step) ?? 0,
  }));
  const protectedSteps = protectGroups(byStepGroups, min);
  const byStep: Partial<Record<CycleStep, number | null>> = {};
  for (const g of protectedSteps) byStep[g.key as CycleStep] = g.value;

  const unitGroups: PrivacyGroup<number>[] = [...unitCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "pl"))
    .map(([unit, count]) => ({
      key: unit,
      label: unit,
      count,
      people: unitPeople.get(unit)?.size ?? 0,
      value: count,
    }));
  const byUnit = protectGroups(unitGroups, min);

  return {
    minGroup: min,
    settingLabel: setting.label,
    hasData: totalCycles + onTimeCount + lateCount + overdueOpenCount > 0,
    onTime: protectedTimeliness[0].value,
    late: protectedTimeliness[1].value,
    overdueOpen: protectOne(overduePeople.size, overdueOpenCount, min),
    pendingReassessments: protectOne(pendingPeople.size, pendingReassessmentsCount, min),
    byStep,
    byUnit,
  };
}
