/** Zamienia imiona i nazwiska osób na [osoba]; odmienione formy łapie rdzeń imienia (bez końcowej samogłoski/„a”). */
export function redact(text: string, names: string[]): string {
  const stems = new Set<string>();
  for (const full of names) {
    for (const part of full.split(/\s+/)) {
      const p = part.toLowerCase();
      if (p.length < 3) continue;
      stems.add(p.length > 4 ? p.replace(/(ie|ia|a|i|y|o|e)$/, "") : p);
    }
  }
  let out = text;
  for (const s of stems) {
    const esc = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<![\\p{L}])${esc}[\\p{L}]*`, "giu"), "[osoba]");
  }
  return out;
}
