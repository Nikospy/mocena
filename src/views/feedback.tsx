import type { FeedbackMessage } from "../notes/repo";
import type { Person } from "../people";
import { Layout, formatDate } from "./layout";

/** Ekran pracownika: wiadomości od przełożonego. Sama notatka się tu nie pokazuje. */
export function FeedbackView(props: { viewer: Person; today: string; messages: (FeedbackMessage & { sender: string })[] }) {
  return (
    <Layout title="Informacja zwrotna" person={props.viewer} today={props.today}>
      <section class="n-state">
        <h1 class="n-title">Informacja zwrotna</h1>
        {props.messages.length === 0 ? <p class="cap">Nie masz jeszcze informacji zwrotnej.</p> : null}
        {props.messages.map((m) => (
          <article class="card">
            <p class="cap">{m.sender} · {formatDate(m.sent_on)}</p>
            <p class="note-text">{m.text}</p>
          </article>
        ))}
      </section>
    </Layout>
  );
}
