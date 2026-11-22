import type { Card } from "../content";
import { PageHeader } from "./components";
import type { Person } from "../people";
import type { AfterHours, BeforeMeetingSummary, Item } from "../hr-partner/partner";
import { NoteItem } from "./components/note-item";
import { Layout, formatDate } from "./layout";
import { TaskChangeForm } from "./task-change";

function tx(card: Card, key: string): string {
  const t = card.texts?.[key];
  if (!t) throw new Error(`Karta „${card.title}” nie ma tekstu „${key}”`);
  return t;
}

/** Pytanie o pracę po godzinach: własne wpisy przełożonego po zmianie zadań, bez etykiety przy nazwisku. */
function AfterHoursSection(props: { card: Card; info: AfterHours }) {
  return (
    <section class="card q-hero" aria-label="Pytanie o pracę po godzinach">
      <h2>{tx(props.card, "afterHours")}</h2>
      <p>{tx(props.card, "afterHoursAsk")}</p>
      <p class="cap">
        {tx(props.card, "afterHoursLead")}{" "}
        {props.info.notes.map((n, i) => (
          <>
            {i > 0 ? ", " : ""}
            <a href={`#note-${n.id}`}>z {formatDate(n.date)}</a>
          </>
        ))}
      </p>
      {props.info.cardHref ? (
        <div class="btns">
          <a class="btn" href={props.info.cardHref}>{tx(props.card, "afterHoursCard")}</a>
        </div>
      ) : null}
    </section>
  );
}

/** To samo pytanie przy kilku pozycjach pada raz, pod listą; przy jednej pozycji stoi przy niej. */
function Items(props: { items: Item[]; label: string }) {
  const prompts = new Set(props.items.map((it) => it.prompt).filter((p): p is string => !!p));
  const shared = props.items.length > 1 && prompts.size === 1 ? [...prompts][0] : null;
  return (
    <>
      <ul class="note-list" aria-label={props.label}>
        {props.items.map((it) => (
          <li class="note-item">
            <p>{it.text}</p>
            {it.prompt && !shared ? <p class="cap">{it.prompt}</p> : null}
            {it.action ? <div class="btns"><a class="btn" href={it.action.href}>{it.action.label}</a></div> : null}
          </li>
        ))}
      </ul>
      {shared ? <p class="cap shared-prompt">{shared}</p> : null}
    </>
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
      <PageHeader context="Przygotowanie do rozmowy · z Twoich notatek" title={<>Przed rozmową z {props.titleName}</>} lead={props.card.purpose} />
      {s.boundary ? (
        <section class="card b-sec">
          <h2>Zmiana zadań</h2>
          <div class="st info"><div><b>{s.boundarySentence}</b></div></div>
          <h3>Notatki sprzed zmiany zadań</h3>
          {s.before.length ? <ul class="note-list">{s.before.map((n) => <NoteItem note={n} />)}</ul> : <p class="cap">Brak notatek sprzed zmiany.</p>}
          <h3>Notatki po zmianie zadań</h3>
          <ul class="note-list">{s.after.map((n) => <NoteItem note={n} id={`note-${n.id}`} />)}</ul>
          {s.bothSides.length ? <Items items={s.bothSides} label="Pytania o kryteria" /> : null}
        </section>
      ) : null}
      {s.afterHours ? <AfterHoursSection card={props.card} info={s.afterHours} /> : null}
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
      <div class="btns"><a class="btn" href={`/cycles/${props.cycleId}/part1`}>Wróć do cyklu</a></div>
    </Layout>
  );
}
