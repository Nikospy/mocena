import { formatDate } from "../views/layout";
import type { Note } from "./repo";

/** Jedna linia do wstawienia w pole tekstowe: kryterium, data, treść. Bez oceny i bez słowa od systemu (decyzja 10f). */
export function formatNoteForInsert(note: Pick<Note, "date" | "text">, criterionName: string): string {
  return `${criterionName}, ${formatDate(note.date)}: ${note.text}`;
}
