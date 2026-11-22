import { OBJECTION_OUTCOME_TEXT as OUTCOME_TEXT, assessmentState } from "../assessment/state";
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
  /** Drugi termin w wierszu, np. ponowna ocena po ocenie negatywnej (art. 81 ust. 9 ustawy). */
  second?: { label: string; date: string; basis: string[] };
  /** Dalszy ciąg opisu stanu: w tabeli zwinięty pod „Szczegóły”. */
  more?: string;
};


const D = rules.deadlines;

/** Po rozstrzygnięciu „ponowne sporządzenie oceny”: termin rozpatrzenia sprzeciwu (14 dni od wniesienia, art. 83 ust. 3 ustawy) obejmuje drugą ocenę. Po jej zatwierdzeniu `null`. */
export function reassessmentDeadline(cycleId: string): { date: string; basis: string[] } | null {
  const s = assessmentState(cycleId);
  if (!s.redo || s.stage !== "draft") return null;
  return { date: objectionReviewDeadline(s.redo.filedOn), basis: [D.objectionReviewDays.basis] };
}

export function cycleState(cycleId: string): CycleState {
  const all = visibleEvents(cycleId);
  const s0 = assessmentState(cycleId);
  // Po zatwierdzeniu drugiej oceny liczą się tylko zdarzenia po rozstrzygnięciu „ponowne sporządzenie”: pierwszy sprzeciw jest historią.
  const cut = s0.redo && s0.stage !== "draft" ? all.findLastIndex((e) => e.type === "objection_resolved" && e.payload.outcome === "redone") : -1;
  const ev = cut >= 0 ? all.slice(cut + 1) : all;
  const last = (type: string) => ev.filter((e) => e.type === type).pop();
  const now = today();
  const second = s0.redo ? " (ocena sporządzona po raz drugi)" : "";

  const resolved = last("objection_resolved");
  if (resolved) {
    const o = resolved.payload.outcome as keyof typeof OUTCOME_TEXT;
    const redo = reassessmentDeadline(cycleId);
    if (o === "redone" && redo) {
      return {
        step: "objection_resolved",
        text: "Sprzeciw rozpatrzony: ponowne sporządzenie oceny. Sprawa u oceniającego",
        more: "Termin rozpatrzenia sprzeciwu obejmuje sporządzenie oceny po raz drugi. Uwzględnienie sprzeciwu nie może obniżyć oceny ani jej elementów. Od ponownej oceny znów przysługuje sprzeciw.",
        deadline: redo,
        deadlineLabel: "Ponowna ocena do",
        overdue: redo.date < now,
        since: resolved.date,
      };
    }
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

  const s = s0;
  if (s.stage === "fiction" && s.fiction) {
    const f = s.fiction;
    return {
      step: "fiction",
      text: `Fikcja zapoznania wpisana ${formatDate(f.eventDate)} przez oceniającego${second}: oceniany ${REASON_LABEL[f.reason]}. Kopię arkusza doręczono ${METHOD_LABEL[f.deliveryMethod]} ${formatDate(f.deliveredOn)}`,
      deadline: { date: f.objectionDeadline, basis: [D.objectionDays.basis] },
      deadlineLabel: "Sprzeciw do",
      since: f.eventDate,
    };
  }
  if (s.stage === "acknowledged" && s.acknowledgement) {
    return {
      step: "acknowledged",
      text: `Zapoznanie potwierdzone ${formatDate(s.acknowledgement.eventDate)}${second}`,
      deadline: { date: s.acknowledgement.objectionDeadline, basis: [D.objectionDays.basis] },
      deadlineLabel: "Sprzeciw do",
      since: s.acknowledgement.eventDate,
    };
  }
  if (s.stage === "approved") {
    return {
      step: "awaiting_acknowledgement",
      text: `Ocena zatwierdzona${second}, czeka na potwierdzenie zapoznania`,
      since: s.approvedOn ?? undefined,
      ...(s.redo ? { deadline: s.snapshot?.deadline, deadlineLabel: "Termin ponownej oceny" } : {}),
    };
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
    // Ta sama funkcja silnika co na stronie głównej oceniającego.
    ...(negative ? { second: { label: "Ponowna ocena", ...effectiveDeadline(cycleId) } } : {}),
  };
}
