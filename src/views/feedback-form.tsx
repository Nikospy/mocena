import type { Note } from "../notes/repo";
import { ErrorSummary, FieldError, PageHeader, invalid } from "./components";
import type { Person } from "../people";
import { Layout, formatDate } from "./layout";
import { criterion } from "../engine/scoring";

export function FeedbackFormView(props: { viewer: Person; subject: Person; note: Note; today: string; text: string; error?: string }) {
  const name = criterion(props.note.criterion_id).name;
  const e = { text: props.error };
  return (
    <Layout title={`Informacja zwrotna dla: ${props.subject.name}`} person={props.viewer} today={props.today}>
      <section class="enter fb-page">
        <PageHeader title={<>Informacja zwrotna dla: {props.subject.name}</>} />
        <div class="fb-src">
          <p class="note-meta-c"><b>{formatDate(props.note.date)}</b><span>{name}</span></p>
          <blockquote class="note-text">{props.note.text}</blockquote>
          <p class="privacy">
            <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></svg>
            Zapisana notatka. Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje.
          </p>
        </div>
        <form method="post" action={`/notes/${props.note.id}/feedback`} class="n-form">
          <ErrorSummary errors={e} />
          <div class="card hero-field">
            <label for="text"><h2>Tekst dla pracownika</h2></label>
            <p class="cap" id="text-hint">Ten tekst pracownik zobaczy na swoim koncie.</p>
            <FieldError id="text" errors={e} />
            <textarea id="text" name="text" rows={6} {...invalid("text", e, "text-hint")}>{props.text}</textarea>
          </div>
          <div class="actionbar nf-actions">
            <button class="btn primary" type="submit">Przekaż pracownikowi</button>
          </div>
        </form>
        <p class="nf-back"><a href="/notes">Wróć do notatek o zespole</a></p>
      </section>
    </Layout>
  );
}
