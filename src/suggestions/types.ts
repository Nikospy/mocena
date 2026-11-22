export type SuggestionSource = "rules" | "local-model" | "none";

/** Wynik bez pól na punkty, ocenę, kryterium ani tekst o pracowniku (decyzja 9). */
export interface NoteSuggestion {
  source: SuggestionSource;
  taskChange: boolean | null; // null przy source 'none'
  matched: string[]; // słowa z listy; pusta przy local-model i none
}

export interface NoteSuggester {
  suggest(redactedText: string): Promise<NoteSuggestion>;
}
