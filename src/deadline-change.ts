import { actsAsAppraiser } from "./substitutions";
// Zmiana terminu oceny (art. 81 ust. 8 ustawy), pismo (§ 8 rozporządzenia), wniosek ocenianego i jego rozpatrzenie.
import { openCycle, type Cycle } from "./cycles";
import { addMonths } from "./engine/deadlines";
import { rules } from "./engine/rules";
import { visibleEvents, type AppEvent } from "./events";
import type { Person } from "./people";
import { today } from "./settings";

/** Reguły zmiany terminu oceny z obowiązującego pakietu, czytane przy użyciu. */
export const DC: typeof rules.deadlineChange = new Proxy({} as typeof rules.deadlineChange, {
  get: (_t, prop) => Reflect.get(rules.deadlineChange, prop),
});
export type DeadlineCase = (typeof DC.cases)[number];

export function deadlineCase(n: number): DeadlineCase | undefined {
  return DC.cases.find((c) => c.n === n);
}

export type Blocked = null | { code: "closed" | "approved" | "negative" | "six_months"; message: string };

function startedPayload(cycleId: string) {
  return visibleEvents(cycleId).filter((e) => e.type === "cycle_started").pop()?.payload;
}

/** Warunek ze wszystkich 4 przypadków: od ostatniej oceny (albo początku okresu przy pierwszej) minęło więcej niż 6 miesięcy. */
export function sixMonthsPassed(cycle: Cycle): { ok: boolean; since: string; earliest: string } {
  const since: string = startedPayload(cycle.id)?.previousAssessmentOn ?? cycle.period_start;
  const earliest = addMonths(since, DC.minMonths);
  return { ok: today() > earliest, since, earliest };
}

/** Dlaczego zmiana terminu jest niedostępna w tym cyklu; `null`, gdy można. */
export function deadlineChangeBlocked(cycle: Cycle): Blocked {
  if (openCycle(cycle.person_id)?.id !== cycle.id) return { code: "closed", message: "Cykl jest zamknięty, terminu już się nie zmienia." };
  const ev = visibleEvents(cycle.id);
  if (ev.some((e) => e.type === "assessment_approved")) return { code: "approved", message: "Ocena jest już zatwierdzona, jej termin się nie zmienia." };
  const p = startedPayload(cycle.id);
  if (p?.previousOutcome === "negative" && p.previousAcknowledgedOn) {
    return { code: "negative", message: "To ocena ponowna po negatywnej: jej terminu nie zmienia się na podstawie art. 81 ust. 8 (termin wynika z art. 81 ust. 9 ustawy)." };
  }
  const six = sixMonthsPassed(cycle);
  if (!six.ok) {
    return { code: "six_months", message: `Od ostatniej oceny (${since(six.since)}) nie minęło jeszcze ${DC.minMonths} miesięcy, więc zmiana terminu jest niedozwolona. Najwcześniej od ${since(addDay(six.earliest))}.` };
  }
  return null;
}

function since(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
function addDay(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

export type RequestState = { request: AppEvent; decision: AppEvent | null };

/** Ostatni wniosek ocenianego i decyzja oceniającego (przyjęcie to `deadline_changed` z `requestId`, odrzucenie to `deadline_change_rejected`). */
export function requestState(cycleId: string): RequestState | null {
  const ev = visibleEvents(cycleId);
  const request = ev.filter((e) => e.type === "due_change_requested").pop();
  if (!request) return null;
  const decision = ev.find((e) => (e.type === "deadline_changed" || e.type === "deadline_change_rejected") && e.payload.requestId === request.id) ?? null;
  return { request, decision };
}

export function pendingRequest(cycleId: string): AppEvent | null {
  const s = requestState(cycleId);
  return s && !s.decision ? s.request : null;
}

export const canChangeDeadline = (viewer: Person, cycle: Cycle): boolean => actsAsAppraiser(cycle.appraiser_id, viewer.id) && deadlineChangeBlocked(cycle) === null;
export const canRequestChange = (viewer: Person, cycle: Cycle): boolean =>
  viewer.id === cycle.person_id && deadlineChangeBlocked(cycle) === null && pendingRequest(cycle.id) === null;

export function newDeadlineError(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return "Wybierz nowy termin z kalendarza.";
  if (date <= today()) return "Wybierz nowy termin późniejszy niż dzisiejsza data.";
  return null;
}
