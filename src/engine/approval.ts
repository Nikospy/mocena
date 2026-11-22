// Blokady zatwierdzenia oceny. Czysta logika: ta sama lista służy ekranowi i odmowie na serwerze.
import type { AssessmentDraft } from "../assessment/state";
import { rules } from "./rules";
import { computeAssessment, criterion, POINTS, type Outcome } from "./scoring";

/** `items`: nazwy kryteriów zebrane w jednej linii (np. „Brakuje ocen cząstkowych: 7”). */
export type Blocker = { field: string; message: string; basis: string; items?: string[] };
export type GradeRequestOption = "not_applicable" | "no_only" | "yes_or_no";

const A = rules.approval;

export function gradeRequestOptions(p: { appointed: boolean; grade: number | null; outcome: Outcome | null }): GradeRequestOption {
  if (!p.appointed) return "not_applicable";
  if (p.outcome === "negative" || (p.grade !== null && p.grade >= A.gradeRequest.maxGrade)) return "no_only";
  return "yes_or_no";
}

function nameOf(id: string): string {
  try {
    return criterion(id).name;
  } catch {
    return id;
  }
}

export function approvalBlockers(input: { criteria: string[]; draft: AssessmentDraft; appointed: boolean; grade: number | null; sheet?: string | null }): Blocker[] {
  const { criteria, draft, appointed, grade } = input;
  const out: Blocker[] = [];
  const scoresBasis = "§ 11 ust. 1";
  const set = new Set(criteria);
  const scale = POINTS as readonly number[];

  let complete = true;
  const missing: string[] = [];
  for (const id of criteria) {
    const v = draft.scores[id];
    if (v === undefined) {
      complete = false;
      missing.push(nameOf(id));
    } else if (!scale.includes(v)) {
      complete = false;
      out.push({ field: `score[${id}]`, message: `Ocena cząstkowa za „${nameOf(id)}” musi wynosić 1, 3, 5, 7 albo 9`, basis: scoresBasis });
    }
  }
  if (missing.length) {
    out.unshift({ field: "scores", message: `Brakuje ocen cząstkowych: ${missing.length}`, basis: scoresBasis, items: missing });
  }
  for (const id of Object.keys(draft.scores)) {
    if (!set.has(id)) {
      complete = false;
      out.push({ field: `score[${id}]`, message: `Ocena dotyczy kryterium spoza tego cyklu: ${nameOf(id)}`, basis: scoresBasis });
    }
  }

  const outcome = complete && criteria.length > 0 ? computeAssessment(draft.scores) : null;

  if (!draft.developmentConclusions.trim()) {
    out.push({
      field: "developmentConclusions",
      message: "Wpisz wnioski do indywidualnego programu rozwoju zawodowego",
      basis: A.developmentConclusions.basis,
    });
  }
  if (outcome?.justificationRequired && !draft.justification.trim()) {
    out.push({ field: "justification", message: "Przy ocenie negatywnej uzasadnienie jest wymagane", basis: A.justification.basis });
  }
  if (input.sheet === "A" && !draft.objectionRecipient?.trim()) {
    out.push({ field: "objectionRecipient", message: "Wpisz, do kogo przysługuje sprzeciw.", basis: "załącznik nr 2 do rozporządzenia" });
  }
  if (draft.gradeRequest.attached) {
    const opt = gradeRequestOptions({ appointed, grade, outcome: outcome?.outcome ?? null });
    if (opt === "not_applicable") {
      out.push({ field: "gradeRequest", message: "Wniosku o stopień nie można dołączyć: osoba nie jest urzędnikiem mianowanym", basis: A.gradeRequest.basis });
    } else if (opt === "no_only") {
      const why = outcome?.outcome === "negative" ? "ocena jest negatywna" : "osoba ma już najwyższy stopień";
      out.push({ field: "gradeRequest", message: `Wniosku o stopień nie można dołączyć: ${why}`, basis: A.gradeRequest.basis });
    }
    if (!draft.gradeRequest.motivation.trim()) {
      out.push({ field: "gradeMotivation", message: "Brakuje umotywowania wniosku o stopień", basis: A.gradeRequest.basis });
    }
  }
  return out;
}
