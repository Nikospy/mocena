import { addMonths } from "../engine/deadlines";
import type { Note } from "./repo";

export type CriterionWarning = "recent_only" | "extreme_without_facts";

export const WARNING_TEXT: Record<CriterionWarning, string> = {
  extreme_without_facts: "Ocena skrajna, a przy tym kryterium nie masz żadnej notatki.",
  recent_only: "Wszystkie notatki przy tym kryterium są z ostatniego miesiąca. Co działo się wcześniej w okresie oceny?",
};

/** Ostrzeżenia przy kryterium (FR-020). Czysta funkcja; nie blokuje zatwierdzenia. */
export function criterionWarnings(p: { notes: Pick<Note, "date">[]; score?: number | null; today: string; windowMonths: number }): CriterionWarning[] {
  const out: CriterionWarning[] = [];
  const edge = addMonths(p.today, -p.windowMonths);
  if (p.notes.length > 0 && p.notes.every((n) => n.date > edge)) out.push("recent_only");
  if ((p.score === 1 || p.score === 9) && p.notes.length === 0) out.push("extreme_without_facts");
  return out;
}
