import type { Note } from "../notes/repo";
import type { Person } from "../people";
import { Layout, formatDate } from "./layout";
import { criterion } from "../engine/scoring";

export function FeedbackFormView(props: { viewer: Person; subject: Person; note: Note; today: string; text: string; error?: string }) {
  const name = criterion(props.note.criterion_id).name;
  return (
    <Layout title="Przekaż pracownikowi" person={props.viewer} today={props.today}>
      <section class="enter">
        <h1 class="n-title">Przekaż pracownikowi: {props.subject.name}</h1>
        <p class="cap">Notatka z {formatDate(props.note.date)} · {name}</p>
        <form method="post" action={`/notes/${props.note.id}/feedback`} class="n-form">
          <div class="card hero-field">
            <label for="text"><h2>Tekst dla pracownika</h2></label>
            <p class="cap">To zobaczy pracownik. Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje.</p>
            <textarea id="text" name="text" rows={6} aria-invalid={props.error ? "true" : undefined}>{props.text}</textarea>
            {props.error ? <p class="st bad" role="alert">{props.error}</p> : null}
          </div>
          <div class="actionbar">
            <button class="btn primary full" type="submit">Wyślij pracownikowi</button>
          </div>
        </form>
        <a class="btn text" href="/notes">Moje notatki</a>
      </section>
    </Layout>
  );
}
