import type { FeedbackMessage } from "../notes/repo";
import { PageHeader } from "./components";
import type { Person } from "../people";
import { Layout, formatDate } from "./layout";

/** Ekran pracownika: wiadomości od przełożonego. Sama notatka się tu nie pokazuje. */
export function FeedbackView(props: { viewer: Person; today: string; messages: (FeedbackMessage & { sender: string })[] }) {
  return (
    <Layout title="Informacja zwrotna" person={props.viewer} today={props.today}>
      <section class="n-state">
        <PageHeader title="Informacja zwrotna" />
        {props.messages.length === 0 ? <p class="cap">Nie masz jeszcze informacji zwrotnej.</p> : null}
        {props.messages.map((m) => (
          <article class="card fb-msg">
            <p class="note-text">{m.text}</p>
            <p class="sign">
              <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
              {m.sender} · {formatDate(m.sent_on)}
            </p>
          </article>
        ))}
      </section>
    </Layout>
  );
}
