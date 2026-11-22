// Ocena sporządzona po raz drugi po uwzględnieniu sprzeciwu (art. 83 ust. 4 ustawy).
import { rules } from "../engine/rules";
import { computeAssessment, criterion } from "../engine/scoring";
import type { AssessmentSnapshot } from "./state";


/**
 * Zakaz obniżenia drugiej oceny: wykładnia z poradnika dla urzędów (`rules.objectionRedo.notLower`), nie brzmienie ustawy.
 * Klucze błędów jak na ekranie oceny: `score-<kryterium>` przy ocenie cząstkowej, `h-crits` przy wyniku.
 */
export function redoLoweringErrors(first: AssessmentSnapshot, scores: Record<string, number>, subject = "Ocena sporządzona po raz drugi"): Record<string, string> {
  const NOT_LOWER = `${subject} nie może być niższa niż pierwsza`;
  const errors: Record<string, string> = {};
  for (const [id, before] of Object.entries(first.scores)) {
    const now = scores[id];
    if (now !== undefined && now < before) {
      errors[`score-${id}`] = `${NOT_LOWER}. ${criterion(id).name}: w pierwszej ocenie ${before}, wybierz ${before} albo wyżej.`;
    }
  }
  const complete = Object.keys(first.scores).every((id) => scores[id] !== undefined);
  if (complete && !Object.keys(errors).length) {
    const r = computeAssessment(scores);
    if (r.mean < first.result.mean || (first.result.outcome === "positive" && r.outcome === "negative")) {
      errors["h-crits"] = `${NOT_LOWER}: wynik jest gorszy niż w pierwszej ocenie.`;
    }
  }
  return errors;
}

export const REDO_BASIS = rules.objectionRedo.basis;
