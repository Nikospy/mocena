import type { Child } from "hono/jsx";
import type { Card } from "../content";
import type { Person } from "../people";
import { LegalBasis, PageHeader } from "./components";
import { Layout } from "./layout";
import { WarnIco } from "./assessment";

export function AssessmentCardView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  card: Card;
  basis: string;
  topics: string[];
  invitation?: Child;
}) {
  const { questions, hardSituations } = props.card;
  return (
    <Layout title="Karta rozmowy oceniającej" person={props.viewer} today={props.today}>
      <PageHeader context="Karta rozmowy" title={props.card.title} lead={props.card.purpose} />
      <section class="rule">
        <p class="voice rule-v"><span class="pg" aria-hidden="true">§</span><span><b>Tematy rozmowy</b> · z przepisu</span></p>
        <ol class="b-ol">{props.topics.map((t) => <li>{t}</li>)}</ol>
        <p><LegalBasis basis={props.basis} /></p>
      </section>
      <section class="card b-sec">
        {questions?.length ? (
          <>
            <h2>Pytania</h2>
            <ul class="note-list">{questions.map((q) => <li class="note-item"><p>{q}</p></li>)}</ul>
          </>
        ) : null}
        {hardSituations?.length ? (
          <>
            <h2>Trudne sytuacje</h2>
            <ul class="plain-list">{hardSituations.map((h) => <li class="st warn"><WarnIco /><div><b>{h.situation}</b><small>{h.whatToDo}</small></div></li>)}</ul>
          </>
        ) : null}
        <div class="btns"><a class="btn primary" href={`/cycles/${props.cycleId}/assessment`}>Notatki przy kryteriach</a></div>
      </section>
      {props.invitation}
    </Layout>
  );
}
