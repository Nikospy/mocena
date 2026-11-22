import type { Card } from "../content";
import type { Note } from "../notes/repo";
import type { Person } from "../people";
import { NoteItem } from "./components/note-item";
import { Layout } from "./layout";

export function AppreciationView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  card: Card;
  sentence: string | null;
  notes: Note[];
  /** Przycisk „Przekaż pracownikowi” tylko wtedy, gdy trasy informacji zwrotnej istnieją. */
  canForward: boolean;
}) {
  const { card } = props;
  return (
    <Layout title={card.title} person={props.viewer} today={props.today}>
      <section class="card">
        <h1>{card.title}</h1>
        {props.sentence ? <p><b>{props.sentence}</b></p> : null}
        <p>{card.purpose}</p>
        <h2>Jak to zrobić</h2>
        <ul>{card.questions?.map((q) => <li>{q}</li>)}</ul>
        <p class="cap">{card.texts?.avoid}</p>
        {card.hardSituations?.length ? (
          <ul>{card.hardSituations.map((h) => <li><b>{h.situation}</b> {h.whatToDo}</li>)}</ul>
        ) : null}
      </section>
      <section class="card">
        <h2>Fakty z Twoich notatek</h2>
        {props.notes.length === 0 ? (
          <p>{card.texts?.noNotes}</p>
        ) : (
          <ul class="note-list">
            {props.notes.map((n) => (
              <NoteItem
                note={n}
                actions={props.canForward ? <a class="btn text" href={`/notes/${n.id}/feedback`}>Przekaż pracownikowi</a> : undefined}
              />
            ))}
          </ul>
        )}
        <a class="btn text" href={`/cycles/${props.cycleId}/part1`}>Wróć do cyklu</a>
      </section>
    </Layout>
  );
}
