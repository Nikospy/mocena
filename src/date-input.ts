// Pola dat w formularzach: tekst w postaci DD.MM.RRRR, niezależnie od języka przeglądarki.
// Serwer zamienia wpis na RRRR-MM-DD, zanim go sprawdzi; data RRRR-MM-DD przechodzi bez zmian.

/** Format pokazywany w polu i w etykiecie. */
export const DATE_INPUT_FORMAT = "DD.MM.RRRR";

/** Poprawna data kalendarzowa RRRR-MM-DD (bez 31.02 i podobnych). */
export function isIsoDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
}

/**
 * Wpis z pola daty → RRRR-MM-DD. Przyjmuje DD.MM.RRRR, D.M.RRRR, przecinek, ukośnik, myślnik albo spację
 * jako separator (klawiatura numeryczna w telefonie), osiem cyfr DDMMRRRR i RRRR-MM-DD.
 * Wpisu, którego nie rozpozna, nie zmienia (poza obcięciem spacji): sprawdzenie w trasie go odrzuci.
 */
export function isoFromInput(raw: string): string {
  const v = raw.trim();
  const m = /^(\d{1,2})\s*[.,/\- ]\s*(\d{1,2})\s*[.,/\- ]\s*(\d{4})$/.exec(v) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(v);
  if (!m) return v;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** Wartość do pola: RRRR-MM-DD → DD.MM.RRRR; inny wpis (np. błędny) wraca do pola bez zmian. */
export function dateInputValue(v: string | null | undefined): string {
  const s = v ?? "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : s;
}
