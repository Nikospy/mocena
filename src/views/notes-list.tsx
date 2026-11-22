import { criterion } from "../engine/scoring";
import { PageHeader } from "./components";
import type { Note } from "../notes/repo";
import type { Person } from "../people";
import { Layout, formatDate } from "./layout";
import { RATING_LABEL } from "./components/note-item";

export type NoteGroup = { person: Person; notes: Note[]; canWrite: boolean; cycleHref?: string };

const OK_ICON = <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

/** Notatka jako mała karta: data, kryterium, ocena przełożonego, zmiana zadań. */
function NoteCard(props: { note: Note }) {
  const n = props.note;
  return (
    <li class="note-item">
      <p class="note-meta-c">
        <b>{formatDate(n.date)}</b>
        <span>{criterion(n.criterion_id).name}</span>
        {n.rating ? <span class={`r-chip ${n.rating === "good" ? "good" : ""}`}>{RATING_LABEL[n.rating]}</span> : null}
        {n.task_change ? <span class="r-chip">zmiana zadań</span> : null}
      </p>
      <p class="note-text">{n.text}</p>
      <div class="btns">
        <a class="btn text" href={`/notes/${n.id}/feedback`}>Przekaż pracownikowi</a>
      </div>
    </li>
  );
}

/** „Notatki o zespole”: grupy po osobie. Przy nazwisku nie ma liczb ani etykiet. */
export function NotesListView(props: { viewer: Person; today: string; groups: NoteGroup[]; saved?: boolean; sent?: boolean }) {
  return (
    <Layout title="Notatki o zespole" person={props.viewer} today={props.today}>
      <section class="n-state notes-team">
        <PageHeader title="Notatki o zespole" />
        {props.saved ? <div class="st ok" role="status">{OK_ICON}<div><b>Zapisano notatkę</b></div></div> : null}
        {props.sent ? <div class="st ok" role="status">{OK_ICON}<div><b>Wysłano pracownikowi</b></div></div> : null}
        {props.groups.length === 0 ? <p class="cap">Nie masz jeszcze notatek.</p> : null}
        {props.groups.map((g) => (
          <section class="card person-notes" aria-label={g.person.name}>
            <div class="pn-head">
              <h2>{g.person.name}</h2>
              {g.canWrite ? (
                <a class="btn primary" href={`/people/${g.person.id}/notes/new`}>
                  <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
                  Dopisz notatkę
                </a>
              ) : null}
              {g.cycleHref ? <a class="btn text" href={g.cycleHref}>Cykl oceny</a> : null}
            </div>
            {g.notes.length > 0 ? (
              <ul class="note-list">
                {g.notes.map((n) => <NoteCard note={n} />)}
              </ul>
            ) : (
              <p class="cap">Nie masz jeszcze notatek o tej osobie.</p>
            )}
          </section>
        ))}
      </section>
    </Layout>
  );
}
