// Nieobecności ocenianego a termin oceny (art. 81 ust. 7 ustawy). Czyste funkcje na datach "RRRR-MM-DD", bez bazy.
import { addDays, addMonths, isDayOff, nextAssessmentDeadline, periodEndAfterNegative, toWorkingDay } from "./deadlines";
import { rules } from "./rules";

export type AbsenceInput = { id?: number; from: string; to: string; excused: boolean };
export type MergedAbsence = { from: string; to: string; days: number; longerThanMonth: boolean; counted: boolean; parts: AbsenceInput[] };
export type CycleKind = "regular" | "after_negative";
export type CycleBasis = { kind: CycleKind; periodStart: string; previousAcknowledgedOn: string | null };

const DAY_MS = 86_400_000;

/** Dni kalendarzowe od `from` do `to` włącznie. */
function inclusiveDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

/** Każdy dzień ściśle między `after` a `before` jest dniem wolnym (pusty odstęp też spełnia warunek). */
function onlyDaysOffBetween(after: string, before: string): boolean {
  for (let d = addDays(after, 1); d < before; d = addDays(d, 1)) if (!isDayOff(d)) return false;
  return true;
}

/** „Dłużej niż miesiąc”: nieobecność zajmuje przedział [from, to + 1 dzień), miesiąc kończy się w `addMonths(from, value)`. */
export function isLongerThanMonth(from: string, to: string): boolean {
  return addDays(to, 1) > addMonths(from, rules.deadlines.longAbsenceOverMonths.value);
}

/** Łączy usprawiedliwione nieobecności nachodzące, stykające się albo rozdzielone samymi dniami wolnymi. */
export function mergeAbsences(absences: AbsenceInput[]): MergedAbsence[] {
  for (const a of absences) {
    addDays(a.from, 0);
    addDays(a.to, 0);
    if (a.to < a.from) throw new Error(`Data końca (${a.to}) jest wcześniejsza niż początku (${a.from})`);
  }
  const sorted = absences.filter((a) => a.excused).sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  const merged: MergedAbsence[] = [];
  for (const a of sorted) {
    const cur = merged[merged.length - 1];
    if (cur && (a.from <= addDays(cur.to, 1) || onlyDaysOffBetween(cur.to, a.from))) {
      if (a.to > cur.to) cur.to = a.to;
      cur.parts.push(a);
    } else {
      merged.push({ from: a.from, to: a.to, days: 0, longerThanMonth: false, counted: false, parts: [a] });
    }
  }
  for (const m of merged) {
    m.days = inclusiveDays(m.from, m.to);
    m.longerThanMonth = isLongerThanMonth(m.from, m.to);
  }
  return merged;
}

export function assessmentDeadline(
  cycle: CycleBasis,
  absences: AbsenceInput[],
  change?: { date: string; knownAbsences: AbsenceInput[] },
): { base: string; extensionDays: number; deadline: string; movedToWorkingDay: boolean; merged: MergedAbsence[] } {
  const merged = mergeAbsences(absences);
  if (cycle.kind === "after_negative") {
    if (!cycle.previousAcknowledgedOn) throw new Error("Ponowna ocena wymaga daty zapoznania z oceną negatywną");
    const date = periodEndAfterNegative(cycle.previousAcknowledgedOn);
    return { base: date, extensionDays: 0, deadline: date, movedToWorkingDay: false, merged };
  }
  let rawEnd = change?.date ?? addMonths(cycle.periodStart, rules.deadlines.assessmentEveryMonths.value);
  // Znane długie okresy uwzględnia pismo. Po połączeniu z nowym wpisem odliczamy tylko ich wspólne dni.
  const known = change ? mergeAbsences(change.knownAbsences).filter((absence) => absence.longerThanMonth) : [];
  let extensionDays = 0;
  for (const m of merged) {
    if (m.to < cycle.periodStart) continue;
    if (m.from > rawEnd) break;
    if (!m.longerThanMonth) continue;
    const from = m.from > cycle.periodStart ? m.from : cycle.periodStart;
    const knownDays = known.filter((absence) => absence.from >= m.from && absence.to <= m.to && absence.to >= from)
      .reduce((days, absence) => days + inclusiveDays(absence.from > from ? absence.from : from, absence.to), 0);
    const days = inclusiveDays(from, m.to) - knownDays;
    if (days === 0) continue;
    rawEnd = addDays(rawEnd, days);
    extensionDays += days;
    m.counted = true;
  }
  const deadline = toWorkingDay(rawEnd);
  return {
    base: change?.date ?? nextAssessmentDeadline(cycle.periodStart, 0),
    extensionDays,
    deadline,
    movedToWorkingDay: deadline !== rawEnd,
    merged,
  };
}
