import { rules } from "../engine/rules";
import type { AssessmentResult } from "../engine/scoring";
import { visibleEvents } from "../events";
import { currentGrade } from "../people";

export type AssessmentDraft = {
  scores: Record<string, number>;
  justification: string;
  developmentConclusions: string;
  objectionRecipient?: string;
  interviewDate: string | null;
  gradeRequest: { attached: boolean; motivation: string };
};

export type AssessmentSnapshot = {
  scores: Record<string, number>;
  justification: string;
  developmentConclusions: string;
  objectionRecipient?: string;
  interviewDate: string;
  gradeRequest: { attached: boolean; motivation: string; targetGrade: number | null };
  sheet: string;
  criteria: { id: string; name: string; kind: "mandatory" | "additional"; score: number }[];
  result: Pick<AssessmentResult, "mean" | "overallLevel" | "outcome" | "reasons" | "justificationRequired">;
  periodFrom: string;
  periodTo: string;
  deadline: { date: string; basis: string[] };
  grade: number | null;
  gradeAwardedOn: string | null;
  rulesVersion: { version: string; effectiveFrom: string; act: string };
  confirmation: { place: string; date: string; name: string };
};

/** Adresat sprzeciwu w dopełniaczu, do zdań „sprzeciw do …”: arkusz A z pola oceniającego, pozostałe z reguł. Jedyne źródło tej formy. */
export function objectionRecipientFor(sheet: string | null, recipient?: string): string | null {
  return sheet === "A" ? recipient?.trim() || null : rules.deadlines.objectionDays.toGenitive;
}

export const OBJECTION_OUTCOME_TEXT = {
  changed: "uwzględniony, zmiana oceny",
  redone: "uwzględniony, ponowne sporządzenie oceny",
  rejected: "nieuwzględniony",
} as const;

/** Wniesiony sprzeciw i jego rozstrzygnięcie (zdarzenia `objection_filed`, `objection_resolved`). */
export type ObjectionFacts = { filedOn: string; resolvedOn: string | null; outcome: keyof typeof OBJECTION_OUTCOME_TEXT | null };

export type Acknowledgement = { place: string; date: string; name: string; objectionDeadline: string };
export type Fiction = { reason: "could_not" | "would_not"; deliveryMethod: "in_person" | "post" | "email"; deliveredOn: string; objectionDeadline: string };

export type AssessmentStage = "no_part1" | "draft" | "approved" | "acknowledged" | "fiction";

export type AssessmentStateData = {
  stage: AssessmentStage;
  draft: AssessmentDraft | null;
  snapshot: AssessmentSnapshot | null;
  /** Dzień zatwierdzenia (data zdarzenia). */
  approvedOn: string | null;
  acknowledgement: (Acknowledgement & { eventDate: string }) | null;
  fiction: (Fiction & { eventDate: string }) | null;
  objectionDeadline: string | null;
  objection: ObjectionFacts | null;
};

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9 };

/** Stopień jako liczba 1–9 (w danych bywa zapisany cyfrą rzymską albo arabską). */
export function gradeNumber(g: string | number | null | undefined): number | null {
  if (g === null || g === undefined || g === "") return null;
  if (typeof g === "number") return g;
  const s = String(g).trim().toUpperCase();
  return ROMAN[s] ?? (Number.isFinite(Number(s)) ? Number(s) : null);
}

/** `currentGrade` z `src/people.ts` ze stopniem jako liczbą. */
export function currentGradeNumber(personId: string, opts: { asOf?: string } = {}): { grade: number | null; awardedOn: string | null } {
  const g = currentGrade(personId, opts);
  return { grade: gradeNumber(g.grade), awardedOn: g.awardedOn };
}

export function assessmentState(cycleId: string): AssessmentStateData {
  const ev = visibleEvents(cycleId);
  const empty: AssessmentStateData = {
    stage: "no_part1",
    draft: null,
    snapshot: null,
    approvedOn: null,
    acknowledgement: null,
    fiction: null,
    objectionDeadline: null,
    objection: null,
  };
  if (!ev.some((e) => e.type === "part1_confirmed")) return empty;
  const drafts = ev.filter((e) => e.type === "assessment_draft_saved");
  const approved = ev.find((e) => e.type === "assessment_approved");
  const closing = ev.find((e) => e.type === "assessment_acknowledged" || e.type === "acknowledgement_fiction");
  const s: AssessmentStateData = {
    ...empty,
    stage: "draft",
    draft: drafts.length ? (drafts[drafts.length - 1].payload as AssessmentDraft) : null,
  };
  if (!approved) return s;
  s.stage = "approved";
  s.snapshot = approved.payload as AssessmentSnapshot;
  s.approvedOn = approved.date;
  if (closing?.type === "assessment_acknowledged") {
    s.stage = "acknowledged";
    s.acknowledgement = { ...closing.payload, eventDate: closing.date };
    s.objectionDeadline = closing.payload.objectionDeadline;
  } else if (closing) {
    s.stage = "fiction";
    s.fiction = { ...closing.payload, eventDate: closing.date };
    s.objectionDeadline = closing.payload.objectionDeadline;
  }
  const filed = ev.filter((e) => e.type === "objection_filed").pop();
  const resolved = ev.filter((e) => e.type === "objection_resolved").pop();
  if (filed) s.objection = { filedOn: filed.date, resolvedOn: resolved?.date ?? null, outcome: resolved?.payload.outcome ?? null };
  return s;
}
