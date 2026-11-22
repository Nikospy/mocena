import type { Note } from "../notes/repo";
import { PageHeader } from "./components";
import type { Person } from "../people";
import { Layout, formatDate } from "./layout";
import { criterion } from "../engine/scoring";

export function FeedbackFormView(props: { viewer: Person; subject: Person; note: Note; today: string; text: string; error?: string }) {
  const name = criterion(props.note.criterion_id).name;
  return (
    <Layout title="Przekaż pracownikowi" person={props.viewer} today={props.today}>
      <section class="enter">
        <PageHeader title={<>Przekaż pracownikowi: {props.subject.name}</>} />
        <div class="card fb-src">
          <p class="note-meta-c"><b>{formatDate(props.note.date)}</b><span>{name}</span></p>
          <p class="note-text">{props.note.text}</p>
          <p class="privacy">
            <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></svg>
            Twoja notatka. Pracownik zobaczy tylko tekst poniżej.
          </p>
        </div>
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
        <p class="again"><a class="btn text" href="/notes">Notatki o zespole</a></p>
      </section>
    </Layout>
  );
}
