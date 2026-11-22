import { expect, test } from "bun:test";
import { formatNoteForInsert } from "./insert";

test("wstawka: data i treść, bez kryterium, oceny przełożonego i słowa od systemu", () => {
  const note = { date: "2025-02-11", text: "Pismo poszło 11 lutego.", rating: "needs_improvement" } as const;
  expect(formatNoteForInsert(note)).toBe("Notatka z 11.02.2025: „Pismo poszło 11 lutego.”");
});
