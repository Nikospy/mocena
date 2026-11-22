import type { Card } from "../content";
import { PageHeader } from "./components";
import type { Note } from "../notes/repo";
import type { Person } from "../people";
import { NoteItem } from "./components/note-item";
import { Layout } from "./layout";
import { WarnIco } from "./assessment";

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
      <PageHeader context="Karta rozmowy" title={card.title} lead={card.purpose} />
      {props.sentence ? <div class="st info"><div><b>{props.sentence}</b></div></div> : null}
      <section class="card b-sec">
        <h2>Jak to zrobić</h2>
        <ul class="note-list">{card.questions?.map((q) => <li class="note-item"><p>{q}</p></li>)}</ul>
        <p class="cap">{card.texts?.avoid}</p>
        {card.hardSituations?.length ? (
          <ul class="plain-list">{card.hardSituations.map((h) => <li class="st warn"><WarnIco /><div><b>{h.situation}</b><small>{h.whatToDo}</small></div></li>)}</ul>
        ) : null}
      </section>
      <section class="card b-sec">
        <h2>Fakty z Twoich notatek</h2>
        {props.notes.length === 0 ? (
          <p>{card.texts?.noNotes}</p>
        ) : (
          <ul class="note-list">
            {props.notes.map((n) => (
              <NoteItem
                note={n}
                actions={props.canForward ? <a class="btn" href={`/notes/${n.id}/feedback`}>Przekaż pracownikowi</a> : undefined}
              />
            ))}
          </ul>
        )}
        <div class="btns"><a class="btn" href={`/cycles/${props.cycleId}/part1`}>Wróć do cyklu</a></div>
      </section>
    </Layout>
  );
}
