// Jedyne wymienne miejsce podpowiedzi (AGENTS.md, zasada 5). Dziś reguły; urząd może podłączyć własny model.
import { suggestAdditionalCriteria } from "../engine/criteria";
import type { Sheet } from "../engine/scoring";

export function suggestCriteria(
  sheet: Sheet,
  dutyTypeIds: string[],
): { source: "rules"; items: { criterionId: string; because: string }[] } {
  return { source: "rules", items: suggestAdditionalCriteria(sheet, dutyTypeIds) };
}

import { getDb } from "../db";
import { pickDevelopmentForm } from "../hr-partner/partner";
import { officeSettings, type DevelopmentForm } from "../office-settings";
import { suggestByWords } from "./note-rules";
import { redact } from "./redact";
import type { NoteSuggestion, SuggestionSource } from "./types";

export type { NoteSuggestion, NoteSuggester, SuggestionSource } from "./types";

const NONE: NoteSuggestion = { source: "none", taskChange: null, matched: [] };

/** Tryb podpowiedzi notatek. Prototyp: tylko reguły; konfiguracja nie włącza żadnej usługi. */
export function suggestionMode(): SuggestionSource {
  return "rules";
}

/** Redakcja nazwisk, potem reguły notatki. Nigdy nie rzuca wyjątku. */
export async function suggestForNote(text: string): Promise<NoteSuggestion> {
  try {
    if (!text || !text.trim()) return NONE;
    const names = (getDb().query("SELECT name FROM people").all() as { name: string }[]).map((p) => p.name);
    return suggestByWords(redact(text, names), officeSettings().taskChangeWords);
  } catch {
    return NONE;
  }
}

/** Forma rozwoju z katalogu urzędu dla notatki. Dziś reguła; urząd może podmienić to wejście (miejsce 5 z decyzji 9). */
export function suggestDevelopmentForm(note: { criterion_id: string }): DevelopmentForm {
  return pickDevelopmentForm(note.criterion_id);
}
