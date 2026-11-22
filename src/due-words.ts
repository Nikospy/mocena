// Przypomnienie słowami przy sprawie z terminem: w ciągu 7 dni albo po terminie. Liczone z dat, bez dni roboczych.

export const DUE_SOON_DAYS = 7;

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function days(n: number): string {
  if (n === 1) return "1 dzień";
  return `${n} dni`;
}

/** „Termin mija dziś.”, „Do terminu zostały 3 dni.”, „Termin minął 2 dni temu.”; `null`, gdy termin dalej niż 7 dni. */
export function dueWords(due: string, today: string): string | null {
  const n = daysBetween(today, due);
  if (n < 0) return `Termin minął ${days(-n)} temu.`;
  if (n === 0) return "Termin mija dziś.";
  if (n === 1) return "Termin mija jutro.";
  if (n <= DUE_SOON_DAYS) return `Do terminu zostało ${days(n)}.`;
  return null;
}
