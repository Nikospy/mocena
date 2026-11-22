import { formatDate } from "../views/layout";
import type { Note } from "./repo";

/** Jeden akapit do wstawienia w pole tekstowe: data i treść. Bez oceny i bez słowa od systemu (decyzja 10f). */
export function formatNoteForInsert(note: Pick<Note, "date" | "text">): string {
  return `${formatDate(note.date)}: ${note.text}`;
}
