import { getDb } from "./db";
import { visibleEvents } from "./events";
import { addDays, toWorkingDay } from "./engine/deadlines";
import { assessmentDeadline, type CycleKind } from "./engine/absences";
import { rules, rulesVersion } from "./engine/rules";
import { today } from "./settings";

export type Cycle = { id: string; person_id: string; appraiser_id: string; period_start: string; sheet: string | null };

export function cycleById(id: string): Cycle | null {
  return (getDb().query("SELECT * FROM cycles WHERE id = ?").get(id) as Cycle | null) ?? null;
}

export type Absence = { id: number; person_id: string; date_from: string; date_to: string; excused: number; recorded_on: string; recorded_by: string };

/** Nieobecności z `recorded_on` nie późniejszym niż `asOf` (domyślnie `today()`), ta sama granica co `visibleEvents`. */
export function visibleAbsences(personId: string, opts: { asOf?: string } = {}): Absence[] {
  return getDb()
    .query("SELECT * FROM absences WHERE person_id = ? AND recorded_on <= ? ORDER BY date_from, id")
    .all(personId, opts.asOf ?? today()) as Absence[];
}

export type CycleDeadlineDetails = ReturnType<typeof assessmentDeadline> & {
  kind: CycleKind;
  basis: string[];
  rules: ReturnType<typeof rulesVersion>;
  /** Ostatnia widoczna zmiana terminu przez oceniającego (art. 81 ust. 8 ustawy); zastępuje termin bazowy. */
  change: { eventId: number; case: number; from: string; to: string } | null;
};

/** Jedyne źródło terminu otwartego cyklu: termin bazowy, nieobecności widoczne w `asOf`, podstawy prawne. */
export function cycleDeadlineDetails(cycleId: string, opts: { asOf?: string } = {}): CycleDeadlineDetails {
  const cycle = cycleById(cycleId);
  if (!cycle) throw new Error(`Brak cyklu ${cycleId}`);
  const p = visibleEvents(cycleId, opts).filter((e) => e.type === "cycle_started").pop()?.payload;
  const kind: CycleKind = p?.previousOutcome === "negative" && p.previousAcknowledgedOn ? "after_negative" : "regular";
  const absences = visibleAbsences(cycle.person_id, opts).map((a) => ({ id: a.id, from: a.date_from, to: a.date_to, excused: a.excused === 1 }));
  const r = assessmentDeadline({ kind, periodStart: cycle.period_start, previousAcknowledgedOn: p?.previousAcknowledgedOn ?? null }, absences);
  const D = rules.deadlines;
  const changeEv = kind === "regular" ? visibleEvents(cycleId, opts).filter((e) => e.type === "deadline_changed").pop() : undefined;
  const change = changeEv ? { eventId: changeEv.id, case: Number(changeEv.payload.case), from: String(changeEv.payload.oldDeadline), to: String(changeEv.payload.newDeadline) } : null;
  if (change) {
    const raw = addDays(change.to, r.extensionDays);
    r.deadline = toWorkingDay(raw);
    r.movedToWorkingDay = r.deadline !== raw;
  }
  const basis =
    kind === "after_negative"
      ? [D.reassessmentAfterNegativeMonths.basis]
      : [
          change ? `art. 81 ust. 8 pkt ${change.case} ustawy` : D.assessmentEveryMonths.basis,
          ...(r.extensionDays > 0 ? [`${D.longAbsenceOverMonths.basis}: termin przedłużony o czas usprawiedliwionej nieobecności dłuższej niż miesiąc`] : []),
          ...(r.movedToWorkingDay ? ["art. 115 Kodeksu cywilnego"] : []),
        ];
  return { ...r, kind, basis, rules: rulesVersion(), change };
}

export function effectiveDeadline(cycleId: string, opts: { asOf?: string } = {}): { date: string; basis: string[] } {
  const d = cycleDeadlineDetails(cycleId, opts);
  return { date: d.deadline, basis: d.basis };
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
