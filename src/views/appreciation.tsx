import type { Card } from "../content";
import { PageHeader } from "./components";
import type { Note } from "../notes/repo";
import type { Person } from "../people";
import { NoteItem } from "./components/note-item";
import { Layout } from "./layout";
import { WarnIco } from "./assessment";
import { cycleById } from "../cycles";
import { personById } from "../people";

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
  const cycle = cycleById(props.cycleId);
  const subject = cycle ? personById(cycle.person_id) : null;
  const title = subject ? `${card.title}: ${subject.name}` : card.title;
  return (
    <Layout title={title} person={props.viewer} today={props.today}>
      <PageHeader context="Karta rozmowy" title={title} lead={card.purpose} />
      {props.sentence ? <div class="st info"><div><b>{props.sentence}</b></div></div> : null}
      <section class="card b-sec">
        <h2>Jak to zrobić</h2>
        <ul class="note-list">{card.questions?.map((q) => <li class="note-item"><p>{q}</p></li>)}</ul>
        <p class="cap">{card.texts?.avoid}</p>
        {card.hardSituations?.length ? (
          <>
            <h3>Trudna sytuacja</h3>
            <ul class="plain-list">{card.hardSituations.map((h) => <li class="st warn"><WarnIco /><div><b>{h.situation}</b><small>{h.whatToDo}</small></div></li>)}</ul>
          </>
        ) : null}
      </section>
      <section class="card b-sec">
        <h2>Fakty z twoich notatek</h2>
        {props.notes.length === 0 ? (
          <div class="ap-empty">
            <p>{card.texts?.noNotes}</p>
            {subject ? <div class="btns"><a class="btn" href={`/people/${subject.id}/notes/new`}>Dopisz notatkę</a></div> : null}
          </div>
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
      </section>
      <p class="ap-back"><a href={`/cycles/${props.cycleId}/part1`}>Wróć do cyklu oceny</a></p>
    </Layout>
  );
}
