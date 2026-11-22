import type { Card } from "../content";
import type { Person } from "../people";
import type { BeforeMeetingSummary, Item } from "../hr-partner/partner";
import { NoteItem } from "./components/note-item";
import { Layout, formatDate } from "./layout";
import { TaskChangeForm } from "./task-change";

function Items(props: { items: Item[]; label: string }) {
  return (
    <ul class="note-list" aria-label={props.label}>
      {props.items.map((it) => (
        <li class="note-item">
          <p>{it.text}</p>
          {it.prompt ? <p class="cap">{it.prompt}</p> : null}
          {it.action ? <div class="btns"><a class="btn" href={it.action.href}>{it.action.label}</a></div> : null}
        </li>
      ))}
    </ul>
  );
}

export function BeforeMeetingView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  titleName: string;
  card: Card;
  summary: BeforeMeetingSummary;
}) {
  const s = props.summary;
  return (
    <Layout title="Przed rozmową z pracownikiem" person={props.viewer} today={props.today}>
      <section class="card hdr">
        <p class="voice src">Przygotowanie do rozmowy · z Twoich notatek</p>
        <h1>Przed rozmową z {props.titleName}</h1>
        <p class="cap">{props.card.purpose}</p>
      </section>
      {s.boundary ? (
        <section class="card b-sec">
          <h2>Zmiana zadań</h2>
          <div class="st info"><div><b>{s.boundarySentence}</b></div></div>
          <h3>Notatki sprzed zmiany zadań</h3>
          {s.before.length ? <ul class="note-list">{s.before.map((n) => <NoteItem note={n} />)}</ul> : <p class="cap">Brak notatek sprzed zmiany.</p>}
          <h3>Notatki po zmianie zadań</h3>
          <ul class="note-list">{s.after.map((n) => <NoteItem note={n} />)}</ul>
          {s.bothSides.length ? <Items items={s.bothSides} label="Pytania o kryteria" /> : null}
        </section>
      ) : null}
      {s.pendingQuestion ? (
        <section class="card q-hero">
          <h2>{s.pendingQuestion.prompt}</h2>
          <p class="cap">W notatce z {formatDate(s.pendingQuestion.note.date)} zaznaczono zmianę zadań, a pytanie czeka na odpowiedź.</p>
          <TaskChangeForm note={s.pendingQuestion.note} />
        </section>
      ) : null}
      {s.criteriaWithoutNotes.length ? (
        <section class="card b-sec">
          <h2>Kryteria bez notatek</h2>
          <Items items={s.criteriaWithoutNotes} label="Kryteria bez notatek" />
        </section>
      ) : null}
      <section class="card b-sec">
        <h2>Informacja zwrotna</h2>
        <Items items={[s.feedback]} label="Informacja zwrotna" />
      </section>
      {s.team.length ? (
        <section class="card b-sec">
          <h2>Zespół</h2>
          <Items items={s.team} label="Zespół" />
        </section>
      ) : null}
      <div class="btns"><a class="btn" href={`/cycles/${props.cycleId}/part1`}>Wróć do cyklu</a></div>
    </Layout>
  );
}
