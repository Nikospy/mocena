import { addMonths } from "../engine/deadlines";
import type { Note } from "./repo";

export type CriterionWarning = "recent_only";

export const WARNING_TEXT: Record<CriterionWarning, string> = {
  recent_only: "Wszystkie notatki przy tym kryterium są z ostatniego miesiąca. Co działo się wcześniej w okresie oceny?",
};

/** Ostrzeżenia przy kryterium (FR-020). Czysta funkcja; nie blokuje zatwierdzenia. */
export function criterionWarnings(p: { notes: Pick<Note, "date">[]; score?: number | null; today: string; windowMonths: number }): CriterionWarning[] {
  const out: CriterionWarning[] = [];
  const edge = addMonths(p.today, -p.windowMonths);
  if (p.notes.length > 0 && p.notes.every((n) => n.date > edge)) out.push("recent_only");
  return out;
}
