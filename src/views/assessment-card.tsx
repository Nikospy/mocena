import type { Card } from "../content";
import type { Person } from "../people";
import { LegalBasis } from "./components";
import { Layout } from "./layout";

export function AssessmentCardView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  card: Card;
  basis: string;
  topics: string[];
}) {
  const { questions, hardSituations } = props.card;
  return (
    <Layout title="Karta rozmowy oceniającej" person={props.viewer} today={props.today}>
      <section class="card">
        <h1>{props.card.title}</h1>
        <p>{props.card.purpose}</p>
        <h2>Tematy rozmowy <LegalBasis basis={props.basis} /></h2>
        <ol>{props.topics.map((t) => <li>{t}</li>)}</ol>
        {questions?.length ? (
          <>
            <h2>Pytania</h2>
            <ul>{questions.map((q) => <li>{q}</li>)}</ul>
          </>
        ) : null}
        {hardSituations?.length ? (
          <>
            <h2>Trudne sytuacje</h2>
            <ul>{hardSituations.map((h) => <li><b>{h.situation}</b> {h.whatToDo}</li>)}</ul>
          </>
        ) : null}
        <a class="btn text" href={`/cycles/${props.cycleId}/assessment`}>Notatki przy kryteriach</a>
      </section>
    </Layout>
  );
}
