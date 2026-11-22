import { criterion } from "../../engine/scoring";
import { formatNoteForInsert } from "../../notes/insert";
import type { Note } from "../../notes/repo";
import { WARNING_TEXT, type CriterionWarning } from "../../notes/warnings";
import { NoteItem } from "./note-item";

/** Notatki przy jednym kryterium w formularzu oceny, z ostrzeżeniami i polami wyboru dla „Wstaw”. */
export function CriterionNotes(props: { criterionId: string; notes: Note[]; warnings: CriterionWarning[] }) {
  const name = criterion(props.criterionId).name;
  return (
    <div class="crit-notes">
      <div class="warns">
        {props.warnings.map((w) => (
          <div class="st warn" role="note">
            <div>{WARNING_TEXT[w]}</div>
          </div>
        ))}
      </div>
      {props.notes.length === 0 ? (
        <p class="cap">Brak notatek przy tym kryterium</p>
      ) : (
        <ul class="note-list" aria-label={`Notatki: ${name}`}>
          {props.notes.map((n) => (
            <NoteItem note={n} showCriterion={false} insert={formatNoteForInsert(n)} />
          ))}
        </ul>
      )}
    </div>
  );
}
