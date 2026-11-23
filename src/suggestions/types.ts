export type SuggestionSource = "rules" | "local-model" | "none";

export type SensitiveCategory = "health" | "family" | "religion";

export interface SensitiveMatch {
  category: SensitiveCategory;
  label: string;
  matched: string[];
}

/** Wynik bez pól na punkty, ocenę, kryterium ani tekst o pracowniku (decyzja 9). */
export interface NoteSuggestion {
  source: SuggestionSource;
  taskChange: boolean | null; // null przy source 'none'
  matched: string[]; // słowa z listy; pusta przy local-model i none
  sensitiveCategories?: SensitiveMatch[]; // wykryte kategorie danych szczególnych (art. 9 RODO)
  sensitiveToken?: string; // skrót treści wiążący świadome potwierdzenie z aktualnym tekstem
}

export interface NoteSuggester {
  suggest(redactedText: string): Promise<NoteSuggestion>;
}
