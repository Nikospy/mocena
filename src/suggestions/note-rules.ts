import type { NoteSuggestion } from "./types";

export function suggestByWords(text: string, words: string[]): NoteSuggestion {
  if (!text.trim()) return { source: "none", taskChange: null, matched: [] };
  const lower = text.toLowerCase();
  const matched = words.filter((w) => lower.includes(w.toLowerCase()));
  return { source: "rules", taskChange: matched.length > 0, matched };
}
