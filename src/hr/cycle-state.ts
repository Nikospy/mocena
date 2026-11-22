import { assessmentState } from "../assessment/state";
import { effectiveDeadline } from "../cycles";
import { pendingRequest } from "../deadline-change";
import { part1Status } from "../cycles/part1";
import { criteriaTalkDeadline, objectionReviewDeadline } from "../engine/deadlines";
import { rules } from "../engine/rules";
import { visibleEvents } from "../events";
import { formatDate } from "../views/layout";
import { REASON_LABEL, METHOD_LABEL } from "../views/assessment";
import { today } from "../settings";

export type CycleStep =
  | "criteria_due"
  | "part1_waiting"
  | "in_period"
  | "awaiting_acknowledgement"
  | "acknowledged"
  | "fiction"
  | "objection_filed"
  | "objection_resolved"
  | "due_change_requested";

export type CycleState = {
  step: CycleStep;
  text: string;
  deadline?: { date: string; basis: string[] };
  /** Co oznacza termin, np. „Sprzeciw do”. */
  deadlineLabel?: string;
  /** Termin sporządzenia oceny minął (tylko kroki przed zatwierdzeniem oceny). */
  overdue?: boolean;
  since?: string;
  /** Dalszy ciąg opisu stanu: w tabeli zwinięty pod „Szczegóły”. */
  more?: string;
};

const OUTCOME_TEXT = {
  changed: "uwzględniony, zmiana oceny",
  redone: "uwzględniony, ponowne sporządzenie oceny",
  rejected: "nieuwzględniony",
} as const;

const D = rules.deadlines;

export function cycleState(cycleId: string): CycleState {
  const ev = visibleEvents(cycleId);
  const last = (type: string) => ev.filter((e) => e.type === type).pop();
  const now = today();

  const resolved = last("objection_resolved");
  if (resolved) {
    const o = resolved.payload.outcome as keyof typeof OUTCOME_TEXT;
    return {
      step: "objection_resolved",
      text: `Sprzeciw rozpatrzony: ${OUTCOME_TEXT[o] ?? o}`,
      since: resolved.date,
    };
  }
  const filed = last("objection_filed");
  if (filed) {
    return {
      step: "objection_filed",
      text: `Sprzeciw wniesiony ${formatDate(filed.date)} do ${filed.payload.to}`,
      deadline: { date: objectionReviewDeadline(filed.date), basis: [D.objectionReviewDays.basis] },
      deadlineLabel: "Rozpatrzenie sprzeciwu do",
      since: filed.date,
    };
  }

  const s = assessmentState(cycleId);
  if (s.stage === "fiction" && s.fiction) {
    const f = s.fiction;
    return {
      step: "fiction",
      text: `Fikcja zapoznania wpisana ${formatDate(f.eventDate)} przez oceniającego: oceniany ${REASON_LABEL[f.reason]}. Kopię arkusza doręczono ${METHOD_LABEL[f.deliveryMethod]} ${formatDate(f.deliveredOn)}`,
      deadline: { date: f.objectionDeadline, basis: [D.objectionDays.basis] },
      deadlineLabel: "Sprzeciw do",
      since: f.eventDate,
    };
  }
  if (s.stage === "acknowledged" && s.acknowledgement) {
    return {
      step: "acknowledged",
      text: `Zapoznanie potwierdzone ${formatDate(s.acknowledgement.eventDate)}`,
      deadline: { date: s.acknowledgement.objectionDeadline, basis: [D.objectionDays.basis] },
      deadlineLabel: "Sprzeciw do",
      since: s.acknowledgement.eventDate,
    };
  }
  if (s.stage === "approved") {
    return { step: "awaiting_acknowledgement", text: "Ocena zatwierdzona, czeka na potwierdzenie zapoznania", since: s.approvedOn ?? undefined };
  }

  const dueChange = pendingRequest(cycleId);
  if (dueChange) {
    const d = effectiveDeadline(cycleId);
    return {
      step: "due_change_requested",
      text: "Wniosek ocenianego o zmianę terminu czeka na rozpatrzenie przez oceniającego",
      more: "Po zmianie terminu oceniający zawiadamia pracownika pisemnie, a kopia pisma idzie do arkusza.",
      deadline: { date: d.date, basis: ["art. 81 ust. 8 ustawy", "§ 8 rozporządzenia"] },
      deadlineLabel: "Bieżący termin oceny",
      overdue: d.date < now,
      since: dueChange.date,
    };
  }

  const p1 = part1Status(cycleId);
  if (p1.state === "confirmed") {
    const d = effectiveDeadline(cycleId);
    return { step: "in_period", text: "Okres oceny trwa", deadline: d, deadlineLabel: "Termin oceny", overdue: d.date < now, since: p1.confirmedOn };
  }
  if (p1.state === "submitted") {
    const days = p1.waitingDays ?? 0;
    return {
      step: "part1_waiting",
      text: `Część I czeka na potwierdzenie ocenianego ${days <= 0 ? "od dziś" : days === 1 ? "od 1 dnia" : `od ${days} dni`}`,
      since: p1.submittedOn,
    };
  }
  const started = last("cycle_started");
  const negative = started?.payload.previousOutcome === "negative";
  const from: string = started?.payload.previousAssessmentOn ?? started?.payload.periodStart;
  const date = criteriaTalkDeadline(from, negative);
  return {
    step: "criteria_due",
    text: "Kryteria do wyznaczenia",
    deadline: { date, basis: [negative ? D.criteriaTalkAfterNegativeDays.basis : D.criteriaTalkDays.basis] },
    deadlineLabel: "Rozmowa o kryteriach do",
    overdue: date < now,
    since: started?.date,
  };
}
