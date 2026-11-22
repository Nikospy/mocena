import { criterion } from "../../engine/scoring";
import type { Note } from "../../notes/repo";
import { formatDate } from "../layout";
import type { Child } from "hono/jsx";

export const RATING_LABEL = { good: "dobrze", needs_improvement: "do poprawy" } as const;

/** Notatka z datą, kryterium, oceną przełożonego i znacznikiem zmiany zadań. `insert` dodaje pole wyboru dla „Wstaw”. */
export function NoteItem(props: { note: Note; showCriterion?: boolean; insert?: string; actions?: Child }) {
  const n = props.note;
  const name = criterion(n.criterion_id).name;
  const body = (
    <>
      <p class="cap note-meta">
        <b>{formatDate(n.date)}</b>
        {props.showCriterion === false ? null : <> · {name}</>}
        {n.rating ? <> · {RATING_LABEL[n.rating]}</> : null}
        {n.task_change ? <> · zmiana zadań</> : null}
      </p>
      <p class="note-text">{n.text}</p>
    </>
  );
  return (
    <li class="note-item">
      {props.insert !== undefined ? (
        <label class="cb">
          <input type="checkbox" data-insert={props.insert} aria-label={`Wybierz notatkę z ${formatDate(n.date)}`} />
          <span class="box">
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <span class="note-body">{body}</span>
        </label>
      ) : (
        body
      )}
      {props.actions ? <div class="btns">{props.actions}</div> : null}
    </li>
  );
}
