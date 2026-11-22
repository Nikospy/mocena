import type { Card } from "../content";
import type { DevelopmentForm } from "../office-settings";
import type { Note } from "../notes/repo";
import type { Person } from "../people";
import { LegalBasis, PageHeader } from "./components";
import { Layout, formatDate } from "./layout";
import { criterion } from "../engine/scoring";

/** Formularz pytania; używany też na ekranie „Przed rozmową” przy zaległej odpowiedzi. */
export function TaskChangeForm(props: { note: Note }) {
  return (
    <form method="post" action={`/notes/${props.note.id}/task-change`} class="btns">
      <button class="btn primary" type="submit" name="answer" value="yes">Tak, stała zmiana</button>
      <button class="btn" type="submit" name="answer" value="no">Nie, chwilowe zastępstwo</button>
    </form>
  );
}

export function TaskChangeQuestionView(props: { viewer: Person; today: string; note: Note; card: Card; subjectGenitive: string; error?: string }) {
  const n = props.note;
  const { ifYes, ifNo } = props.card.texts ?? {};
  return (
    <Layout title="To stała zmiana zadań?" person={props.viewer} today={props.today}>
      <PageHeader context={<>Notatka z {formatDate(n.date)}</>} title="To stała zmiana zadań?" />
      <section class="card q-hero">
        <p>W tej notatce zaznaczono zmianę zadań {props.subjectGenitive}.</p>
        <blockquote class="note-quote">
          <p class="note-text">{n.text}</p>
          <p class="cap">{criterion(n.criterion_id).name} · {formatDate(n.date)}</p>
        </blockquote>
        <ul class="plain-list outcomes">
          {ifYes ? <li>{ifYes}</li> : null}
          {ifNo ? <li>{ifNo}</li> : null}
        </ul>
        {props.error ? <p class="req" role="alert">{props.error}</p> : null}
        <TaskChangeForm note={n} />
        <a class="btn text b-later" href="/notes">Zdecyduję później</a>
      </section>
    </Layout>
  );
}

export function TaskChangeCardView(props: { viewer: Person; today: string; note: Note; card: Card; form: DevelopmentForm }) {
  const { card, form } = props;
  return (
    <Layout title={card.title} person={props.viewer} today={props.today}>
      <PageHeader context="Karta rozmowy" title={card.title} lead={card.purpose} />
      <div class="o-grid">
        <div class="o-main">
          <section class="card b-sec">
            <h2>Pytania</h2>
            <ul class="note-list">{card.questions?.map((q) => <li class="note-item"><p>{q}</p></li>)}</ul>
            {card.hardSituations?.length ? (
              <>
                <h2>Trudna sytuacja</h2>
                <ul class="hard-list">{card.hardSituations.map((h) => <li><b>{h.situation}</b><p>{h.whatToDo}</p></li>)}</ul>
              </>
            ) : null}
            <h2>Forma rozwoju</h2>
            <p>{card.texts?.formIntro}</p>
            <p><b>{form.name}</b></p>
            <p>{form.description}</p>
          </section>
        </div>
        <aside class="side first" aria-label="Przepis">
          {card.legal ? (
            <section class="rule">
              <p class="voice rule-v"><span class="pg" aria-hidden="true">§</span><span><b>Co mówi przepis</b></span></p>
              <p>{card.legal.text}</p>
              <p><LegalBasis basis={card.legal.basis} /></p>
            </section>
          ) : null}
          <a class="btn full" href="/notes">Zamknij</a>
        </aside>
      </div>
    </Layout>
  );
}

export function TaskChangeNoView(props: { viewer: Person; today: string; card: Card }) {
  return (
    <Layout title="Zmiana zadań" person={props.viewer} today={props.today}>
      <PageHeader title="Dziękujemy" lead={props.card.texts?.no} />
      <section>
        <div class="btns"><a class="btn" href="/notes">Notatki o zespole</a></div>
      </section>
    </Layout>
  );
}
