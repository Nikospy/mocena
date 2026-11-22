import { expect, test } from "bun:test";
import { formatNoteForInsert } from "./insert";

test("wstawka: kryterium, data, treść, bez oceny przełożonego", () => {
  const note = { date: "2025-02-11", text: "Pismo poszło 11 lutego.", rating: "needs_improvement" } as const;
  expect(formatNoteForInsert(note, "Rzetelność")).toBe("Rzetelność, 11.02.2025: Pismo poszło 11 lutego.");
});
