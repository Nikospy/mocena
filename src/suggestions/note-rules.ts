import type { NoteSuggestion, SensitiveCategory, SensitiveMatch } from "./types";

const SENSITIVE_LABELS: Record<SensitiveCategory, string> = {
  health: "zdrowie",
  family: "życie rodzinne",
  religion: "wyznanie lub światopogląd",
};

const SENSITIVE_ORDER: SensitiveCategory[] = ["health", "family", "religion"];

const PL_MAP: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

/** Normalizacja tekstu i słownika: małe litery i zdjęcie polskich znaków diakrytycznych. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => PL_MAP[ch] ?? ch)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesEntry(normalizedText: string, rawEntry: string): boolean {
  const isPrefix = rawEntry.endsWith("*");
  const needle = normalizeForMatch(isPrefix ? rawEntry.slice(0, -1) : rawEntry).trim();
  if (!needle) return false;
  const escaped = escapeRegExp(needle);
  if (isPrefix) {
    return new RegExp(`(?:^|[^a-z0-9])${escaped}`).test(normalizedText);
  }
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(normalizedText);
}

export function suggestByWords(text: string, words: string[]): NoteSuggestion {
  if (!text.trim()) return { source: "none", taskChange: null, matched: [] };
  const lower = text.toLowerCase();
  const matched = words.filter((w) => lower.includes(w.toLowerCase()));
  return { source: "rules", taskChange: matched.length > 0, matched };
}

/** Deterministyczne wykrywanie słów wskazujących na dane szczególne (art. 9 RODO) na liście słów z ustawień urzędu. */
export function detectSensitiveData(
  text: string,
  dict: Record<SensitiveCategory, string[]>,
): SensitiveMatch[] {
  if (!text.trim()) return [];
  const normalized = normalizeForMatch(text);
  const out: SensitiveMatch[] = [];
  for (const category of SENSITIVE_ORDER) {
    const words = dict[category];
    if (!Array.isArray(words)) {
      throw new Error(`Brak listy słów wrażliwych dla kategorii „${category}” w ustawieniach urzędu.`);
    }
    const matched = words.filter((w) => matchesEntry(normalized, w)).map((w) => w.replace(/\*$/, ""));
    if (matched.length > 0) {
      out.push({ category, label: SENSITIVE_LABELS[category], matched });
    }
  }
  return out;
}

/** Deterministyczny skrót treści notatki wiążący potwierdzenie z konkretnym tekstem (działa na Bun i Workers). */
export function sensitiveConfirmationToken(text: string): string {
  const s = text.trim();
  let h1 = 0x811c9dc5;
  let h2 = 5381;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = ((h2 << 5) + h2 + code) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}
