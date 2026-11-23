import type { Card } from "../content";
import { PageHeader } from "./components";
import type { Person } from "../people";
import type { AfterHours, BeforeMeetingSummary, Item } from "../hr-partner/partner";
import type { SelfPrepData } from "./self-prep";
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
    <section class="bm-ask" aria-label="Pytanie o pracę po godzinach">
      <h3>{tx(props.card, "afterHours")}</h3>
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
  selfPrep?: (SelfPrepData & { savedOn: string }) | null;
}) {
  const s = props.summary;
  const selfPrepCard = props.selfPrep ? (
    <section class="card b-sec" aria-labelledby="h-self-prep">
      <h2 id="h-self-prep">Wkład ocenianego przed rozmową</h2>
      <p class="cap">
        Zapisano {formatDate(props.selfPrep.savedOn)}. Wpis służy tylko jako materiał do rozmowy i nie trafia automatycznie do arkusza oceny.
      </p>
      {props.selfPrep.achievements ? (
        <>
          <h3>Najważniejsze osiągnięcia w tym okresie</h3>
          <p>{props.selfPrep.achievements}</p>
        </>
      ) : null}
      {props.selfPrep.topics ? (
        <>
          <h3>Tematy i uwagi do rozmowy</h3>
          <p>{props.selfPrep.topics}</p>
        </>
      ) : null}
    </section>
  ) : null;
  return (
    <Layout title="Przed rozmową z pracownikiem" person={props.viewer} today={props.today}>
      <PageHeader
        context="Przygotowanie do rozmowy · z twoich notatek"
        title={<>Przed rozmową z {props.titleName}</>}
        lead={props.card.purpose}
        links={<a href={`/cycles/${props.cycleId}/part1`}>Wróć do części I</a>}
      />
      {(() => {
        const boundary = s.boundary ? (
          <section class="card b-sec">
            <h2>Zmiana zadań</h2>
            <p class="bm-boundary"><b>{s.boundarySentence}</b></p>
            <h3>Notatki sprzed zmiany zadań</h3>
            {s.before.length ? <ul class="note-list">{s.before.map((n) => <NoteItem note={n} />)}</ul> : <p class="cap">Brak notatek sprzed zmiany.</p>}
            <h3>Notatki po zmianie zadań</h3>
            <ul class="note-list">{s.after.map((n) => <NoteItem note={n} id={`note-${n.id}`} />)}</ul>
            {s.bothSides.length ? <Items items={s.bothSides} label="Pytania o kryteria" /> : null}
          </section>
        ) : null;
        const asks = (
          <div class="card bm-asks">
            <h2 class="bm-asks-h">Do zapytania na rozmowie</h2>
            {s.afterHours ? <AfterHoursSection card={props.card} info={s.afterHours} /> : null}
            {s.pendingQuestion ? (
              <section class="bm-ask">
                <h3>{s.pendingQuestion.prompt}</h3>
                <p class="cap">W notatce z {formatDate(s.pendingQuestion.note.date)} zaznaczono zmianę zadań, a pytanie czeka na odpowiedź.</p>
                <TaskChangeForm note={s.pendingQuestion.note} />
              </section>
            ) : null}
            {s.criteriaWithoutNotes.length ? (
              <section class="bm-ask">
                <h3>Kryteria bez notatek</h3>
                <Items items={s.criteriaWithoutNotes} label="Kryteria bez notatek" />
              </section>
            ) : null}
            <section class="bm-ask">
              <h3>Informacja zwrotna</h3>
              <Items items={[s.feedback]} label="Informacja zwrotna" />
            </section>
          </div>
        );
        return boundary || selfPrepCard ? (
          <div class="o-grid">
            <div class="o-main">
              {selfPrepCard}
              {boundary}
            </div>
            <aside class="side first" aria-label="Do zapytania na rozmowie">{asks}</aside>
          </div>
        ) : (
          <div class="bm-single">{asks}</div>
        );
      })()}
    </Layout>
  );
}
