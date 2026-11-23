// Jedyne wymienne miejsce podpowiedzi (AGENTS.md, zasada 5). Dziś reguły; urząd może podłączyć własny model.
import { suggestAdditionalCriteria } from "../engine/criteria";
import type { Sheet } from "../engine/scoring";

export function suggestCriteria(
  sheet: Sheet,
  dutyTypeIds: string[],
): { source: "rules"; items: { criterionId: string; because: string }[] } {
  return { source: "rules", items: suggestAdditionalCriteria(sheet, dutyTypeIds) };
}

import { getDb, hasDb } from "../db";
import { pickDevelopmentForm } from "../hr-partner/partner";
import { officeSettings, type DevelopmentForm } from "../office-settings";
import { detectSensitiveData, sensitiveConfirmationToken, suggestByWords } from "./note-rules";
import { redact } from "./redact";
import type { NoteSuggestion, SensitiveMatch, SuggestionSource } from "./types";

export type { NoteSuggestion, NoteSuggester, SensitiveCategory, SensitiveMatch, SuggestionSource } from "./types";
export { detectSensitiveData, sensitiveConfirmationToken } from "./note-rules";

const NONE: NoteSuggestion = { source: "none", taskChange: null, matched: [] };

/** Tryb podpowiedzi notatek. Prototyp: tylko reguły; konfiguracja nie włącza żadnej usługi. */
export function suggestionMode(): SuggestionSource {
  return "rules";
}

function redactBestEffort(text: string): string {
  if (!hasDb()) return text;
  try {
    const names = (getDb().query("SELECT name FROM people").all() as { name: string }[]).map((p) => p.name);
    return redact(text, names);
  } catch {
    return text;
  }
}

/**
 * Strażnik danych szczególnych (art. 9 RODO): działa fail-closed — przy braku słownika rzuca wyjątek
 * zamiast po cichu przepuszczać notatkę bez sprawdzenia.
 */
export function checkSensitiveData(text: string): SensitiveMatch[] {
  if (!text || !text.trim()) return [];
  const dict = officeSettings().sensitiveDataWords;
  if (!dict || typeof dict !== "object") {
    throw new Error("Brak słownika danych wrażliwych (sensitiveDataWords) w ustawieniach urzędu.");
  }
  return detectSensitiveData(redactBestEffort(text), dict);
}

/** Redakcja nazwisk, potem reguły notatki (zmiana zadań + strażnik danych wrażliwych). */
export async function suggestForNote(text: string): Promise<NoteSuggestion> {
  if (!text || !text.trim()) return NONE;
  const redacted = redactBestEffort(text);
  const settings = officeSettings();
  let base: NoteSuggestion;
  try {
    base = suggestByWords(redacted, settings.taskChangeWords);
  } catch {
    base = NONE;
  }
  const sensitiveCategories = checkSensitiveData(text);
  const sensitiveToken = sensitiveCategories.length > 0 ? sensitiveConfirmationToken(text) : undefined;
  return { ...base, sensitiveCategories, ...(sensitiveToken ? { sensitiveToken } : {}) };
}

/** Forma rozwoju z katalogu urzędu dla notatki. Dziś reguła; urząd może podmienić to wejście (miejsce 5 z decyzji 9). */
export function suggestDevelopmentForm(note: { criterion_id: string }): DevelopmentForm {
  return pickDevelopmentForm(note.criterion_id);
}
