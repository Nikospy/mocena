import type { AssessmentResult } from "../engine/scoring";

type ResultLike = Pick<AssessmentResult, "mean" | "overallLevel" | "outcome">;

/**
 * Wynik słowny. Poziom ogólny wynika ze średniej, więc towarzyszy wynikowi tylko wtedy, gdy mu nie przeczy:
 * przy ocenie negatywnej tylko gdy to średnia ją przesądza (średnia nie wyższa niż 4), a nie ocena cząstkowa „1”.
 */
export function verdictText(r: ResultLike): { verdict: string; level: string | null } {
  const negative = r.outcome === "negative";
  return {
    verdict: negative ? "Ocena negatywna" : "Ocena pozytywna",
    level: !negative || r.mean <= 4 ? r.overallLevel : null,
  };
}
