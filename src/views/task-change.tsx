import type { Card } from "../content";
import type { DevelopmentForm } from "../office-settings";
import type { Note } from "../notes/repo";
import type { Person } from "../people";
import { LegalBasis } from "./components";
import { Layout, formatDate } from "./layout";
import { criterion } from "../engine/scoring";

/** Formularz pytania; używany też na ekranie „Przed rozmową” przy zaległej odpowiedzi. */
export function TaskChangeForm(props: { note: Note; question?: string }) {
  return (
    <form method="post" action={`/notes/${props.note.id}/task-change`} class="btns">
      <button class="btn primary" type="submit" name="answer" value="yes">Tak</button>
      <button class="btn" type="submit" name="answer" value="no">Nie</button>
    </form>
  );
}

export function TaskChangeQuestionView(props: { viewer: Person; today: string; note: Note; error?: string }) {
  const n = props.note;
  return (
    <Layout title="To stała zmiana zadań?" person={props.viewer} today={props.today}>
      <section class="card">
        <h1>To stała zmiana zadań?</h1>
        <p>Zaznaczyłeś przy notatce z {formatDate(n.date)} ({criterion(n.criterion_id).name}) zmianę zadań pracownika.</p>
        {props.error ? <p class="req" role="alert">{props.error}</p> : null}
        <TaskChangeForm note={n} />
        <a class="btn text" href="/notes">Odpowiem później</a>
      </section>
    </Layout>
  );
}

export function TaskChangeCardView(props: { viewer: Person; today: string; note: Note; card: Card; form: DevelopmentForm }) {
  const { card, form } = props;
  return (
    <Layout title={card.title} person={props.viewer} today={props.today}>
      <section class="card">
        <h1>{card.title}</h1>
        <p>{card.purpose}</p>
        {card.legal ? (
          <p>
            {card.legal.text} <LegalBasis basis={card.legal.basis} />
          </p>
        ) : null}
        <h2>Pytania</h2>
        <ul>{card.questions?.map((q) => <li>{q}</li>)}</ul>
        {card.hardSituations?.length ? (
          <>
            <h2>Trudna sytuacja</h2>
            <ul>{card.hardSituations.map((h) => <li><b>{h.situation}</b> {h.whatToDo}</li>)}</ul>
          </>
        ) : null}
        <h2>Forma rozwoju</h2>
        <p class="cap">{card.texts?.formIntro}</p>
        <p><b>{form.name}</b></p>
        <p>{form.description}</p>
        <a class="btn text" href="/notes">Moje notatki</a>
      </section>
    </Layout>
  );
}

export function TaskChangeNoView(props: { viewer: Person; today: string; card: Card }) {
  return (
    <Layout title="Zmiana zadań" person={props.viewer} today={props.today}>
      <section class="card">
        <h1>Dziękujemy</h1>
        <p>{props.card.texts?.no}</p>
        <a class="btn text" href="/notes">Moje notatki</a>
      </section>
    </Layout>
  );
}
