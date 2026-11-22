// Część rozwojowa na karcie rozmowy oceniającej: cytaty z notatek przełożonego pogrupowane po polu „dobrze / do poprawy”,
// które wypełnił on sam (decyzja 3). System nie czyta treści notatek, niczego nie streszcza i nie liczy punktów.
import { cycleCriteria } from "../cycles/part1";
import { criterion } from "../engine/scoring";
import { notesForCycle, type Rating } from "./repo";

export type DevelopmentGroup = { criterionId: string; name: string; notes: { id: number; date: string; text: string }[] };
export type DevelopmentSummary = { good: DevelopmentGroup[]; needsImprovement: DevelopmentGroup[]; unrated: number };

export function developmentSummary(cycleId: string, authorId: string): DevelopmentSummary {
  const notes = notesForCycle(cycleId, authorId);
  const order = cycleCriteria(cycleId).map((c) => c.id);
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
  const groups = (rating: Rating): DevelopmentGroup[] => {
    const byCriterion = new Map<string, DevelopmentGroup>();
    for (const n of notes.filter((x) => x.rating === rating)) {
      const g = byCriterion.get(n.criterion_id) ?? { criterionId: n.criterion_id, name: criterionName(n.criterion_id), notes: [] };
      g.notes.push({ id: n.id, date: n.date, text: n.text });
      byCriterion.set(n.criterion_id, g);
    }
    return [...byCriterion.values()].sort((a, b) => rank(a.criterionId) - rank(b.criterionId));
  };
  return { good: groups("good"), needsImprovement: groups("needs_improvement"), unrated: notes.filter((n) => n.rating === null).length };
}

function criterionName(id: string): string {
  try {
    return criterion(id).name;
  } catch {
    return id;
  }
}
