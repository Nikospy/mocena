import type { Note } from "../notes/repo";
import type { Person } from "../people";
import { Layout } from "./layout";
import { NoteItem } from "./components/note-item";

export type NoteGroup = { person: Person; notes: Note[]; canWrite: boolean };

/** „Moje notatki”: grupy po osobie. Przy nazwisku nie ma liczb ani etykiet. */
export function NotesListView(props: { viewer: Person; today: string; groups: NoteGroup[]; saved?: boolean; sent?: boolean }) {
  return (
    <Layout title="Moje notatki" person={props.viewer} today={props.today}>
      <section class="n-state">
        <h1 class="n-title">Moje notatki</h1>
        {props.saved ? <div class="st ok" role="status"><div><b>Zapisano notatkę</b></div></div> : null}
        {props.sent ? <div class="st ok" role="status"><div><b>Wysłano pracownikowi</b></div></div> : null}
        {props.groups.length === 0 ? <p class="cap">Nie masz jeszcze notatek.</p> : null}
        {props.groups.map((g) => (
          <section class="card" aria-label={g.person.name}>
            <h2>{g.person.name}</h2>
            {g.canWrite ? <a class="btn" href={`/people/${g.person.id}/notes/new`}>Dopisz notatkę</a> : null}
            {g.notes.length > 0 ? (
              <ul class="note-list">
                {g.notes.map((n) => <NoteItem note={n} />)}
              </ul>
            ) : null}
          </section>
        ))}
      </section>
    </Layout>
  );
}
