// Reguły oceny okresowej z rozporządzenia PRM z 4 kwietnia 2016 r. (Dz.U. 2016 poz. 470).
// Zasada produktu: wynik liczy ten kod, nigdy model językowy.
import { activeRules, rules } from "./rules";

export type Sheet = "A" | "B" | "C";
export type Outcome = "positive" | "negative";

export const POINTS = [1, 3, 5, 7, 9] as const;

export interface Criterion {
  id: string;
  number: number;
  name: string;
  description: string[];
}

/** Kryteria pakietu domyślnego. Identyfikatory są stałe we wszystkich wersjach (zmiana struktury wymaga zmiany programu); nazwy i opisy czytaj przez `allCriteria()` albo `criterion()`. */
export const CRITERIA: Criterion[] = rules.criteria;

/** Kryteria obowiązujących reguł, w chwili wywołania. */
export function allCriteria(): Criterion[] {
  return activeRules().criteria;
}

/** Nazwy ocen cząstkowych (1, 3, 5, 7, 9) obowiązujących reguł, w chwili wywołania. */
export function partialLevelName(points: number): string {
  return activeRules().partialScale.find((s) => s.points === points)?.name ?? "";
}

export function criterion(id: string): Criterion {
  const c = activeRules().criteria.find((x) => x.id === id);
  if (!c) throw new Error(`Nie ma kryterium „${id}” w załączniku nr 1`);
  return c;
}

/** § 4: kryteria obowiązkowe zależą od arkusza (A, B, C). */
export function mandatoryCriteria(sheet: Sheet): string[] {
  return [...activeRules().sheets[sheet].mandatoryCriteria];
}

/** Kryteria, które oceniający może dobrać do danego arkusza (§ 5 ust. 2). */
export function selectableCriteria(sheet: Sheet): string[] {
  const mandatory = new Set(mandatoryCriteria(sheet));
  return activeRules().criteria.map((c) => c.id).filter((id) => !mandatory.has(id));
}

/** Zwraca listę problemów z zestawem kryteriów dodatkowych. Pusta lista = zestaw zgodny z § 5 ust. 2. */
export function validateAdditionalCriteria(sheet: Sheet, ids: string[]): string[] {
  const r = activeRules();
  const problems: string[] = [];
  const mandatory = new Set(mandatoryCriteria(sheet));
  if (ids.length > r.maxAdditionalCriteria) {
    problems.push(`Wybierz najwyżej ${r.maxAdditionalCriteria} kryteria dodatkowe (§ 5 ust. 2). Odznacz pozostałe.`);
  }
  if (new Set(ids).size !== ids.length) {
    problems.push("To samo kryterium dodatkowe wybrano dwa razy. Zaznacz je tylko raz.");
  }
  for (const id of ids) {
    if (!r.criteria.some((c) => c.id === id)) problems.push(`Kryterium „${id}” nie ma w załączniku nr 1.`);
    else if (mandatory.has(id)) problems.push(`Kryterium „${criterion(id).name}” jest już obowiązkowe w arkuszu ${sheet}. Odznacz je na liście dodatkowych.`);
  }
  return problems;
}

export interface AssessmentResult {
  /** Suma i liczba ocen cząstkowych. Średnią porównujemy na liczbach całkowitych, bez zaokrągleń. */
  sum: number;
  count: number;
  mean: number;
  overallLevel: string;
  outcome: Outcome;
  /** Dlaczego wynik jest taki, a nie inny (do pokazania oceniającemu). */
  reasons: string[];
  /** § 11 ust. 3: uzasadnienie jest obowiązkowe przy ocenie negatywnej. */
  justificationRequired: boolean;
}

/**
 * § 11 ust. 1: średnia arytmetyczna ocen cząstkowych, poziom ogólny, ocena pozytywna albo negatywna.
 * Uwaga na dwie pułapki z przepisu:
 * 1. jedna ocena cząstkowa „1” daje ocenę negatywną nawet przy wysokiej średniej (pkt 3 i 4),
 * 2. średnia równa dokładnie 4 to jeszcze „poniżej oczekiwań”, czyli ocena negatywna (pkt 2 lit. b).
 */
export function computeAssessment(scores: Record<string, number>): AssessmentResult {
  const entries = Object.entries(scores);
  if (entries.length === 0) throw new Error("Brak ocen cząstkowych");
  for (const [id, p] of entries) {
    criterion(id);
    if (!(POINTS as readonly number[]).includes(p)) {
      throw new Error(`Ocena cząstkowa za „${id}” musi wynosić 1, 3, 5, 7 albo 9 (jest ${p})`);
    }
  }
  const count = entries.length;
  const sum = entries.reduce((s, [, p]) => s + p, 0);

  // Progi poziomów są w kodzie (§ 11 ust. 1 pkt 2), nazwy poziomów w pakiecie reguł danej wersji.
  const names = activeRules().overallLevels.map((l) => l.name);
  const levelIndex = sum <= 2 * count ? 0 : sum <= 4 * count ? 1 : sum <= 6 * count ? 2 : sum <= 8 * count ? 3 : 4;
  const overallLevel = names[levelIndex];

  const reasons: string[] = [];
  const ones = entries.filter(([, p]) => p === 1).map(([id]) => criterion(id).name);
  const meanTooLow = sum <= 4 * count;
  if (meanTooLow) {
    reasons.push(`Ogólny poziom spełniania kryteriów: ${overallLevel} (§ 11 ust. 1 pkt 4).`);
  }
  if (ones.length > 0) {
    reasons.push(`Ocena cząstkowa „${partialLevelName(1)}” za: ${ones.join(", ")} (§ 11 ust. 1 pkt 4).`);
  }
  const outcome: Outcome = meanTooLow || ones.length > 0 ? "negative" : "positive";
  if (outcome === "positive") {
    reasons.push(`Ogólny poziom: ${overallLevel}, bez oceny cząstkowej „${partialLevelName(1)}” (§ 11 ust. 1 pkt 3).`);
  }

  return {
    sum,
    count,
    mean: sum / count,
    overallLevel,
    outcome,
    reasons,
    justificationRequired: outcome === "negative",
  };
}
