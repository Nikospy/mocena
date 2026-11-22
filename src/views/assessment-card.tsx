import type { Child } from "hono/jsx";
import type { Card } from "../content";
import type { DevelopmentGroup, DevelopmentSummary } from "../notes/development";
import type { Person } from "../people";
import { LegalBasis, PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

export function AssessmentCardView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  card: Card;
  basis: string;
  topics: string[];
  invitation?: Child;
  development?: DevelopmentSummary;
}) {
  const { questions, hardSituations } = props.card;
  return (
    <Layout title="Karta rozmowy oceniającej" person={props.viewer} today={props.today}>
      <PageHeader context="Karta rozmowy" title={props.card.title} lead={props.card.purpose} />
      <div class="o-grid">
        <div class="o-main">
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
                <ul class="hard-list">{hardSituations.map((h) => <li><b>{h.situation}</b><p>{h.whatToDo}</p></li>)}</ul>
              </>
            ) : null}
          </section>
          {props.development ? <DevelopmentSection d={props.development} cycleId={props.cycleId} /> : null}
          {props.invitation}
        </div>
        <aside class="side first" aria-label="Tematy rozmowy z przepisu">
          <section class="rule">
            <p class="voice rule-v"><span class="pg" aria-hidden="true">§</span><span><b>Tematy rozmowy</b> · z przepisu</span></p>
            <ol class="b-ol">{props.topics.map((t) => <li>{t}</li>)}</ol>
            <p><LegalBasis basis={props.basis} /></p>
          </section>
          <a class="btn full" href={`/cycles/${props.cycleId}/assessment`}>Przejdź do oceny</a>
        </aside>
      </div>
    </Layout>
  );
}

function Groups(props: { groups: DevelopmentGroup[]; label: string }) {
  if (!props.groups.length) return <p class="cap">Brak notatek z tym zaznaczeniem.</p>;
  return (
    <>
      {props.groups.map((g) => (
        <>
          <h4>{g.name}</h4>
          <ul class="note-list" aria-label={`${props.label}: ${g.name}`}>
            {g.notes.map((n) => (
              <li class="note-item">
                <p class="note-meta-c"><b>{formatDate(n.date)}</b></p>
                <p class="note-text">„{n.text}”</p>
              </li>
            ))}
          </ul>
        </>
      ))}
    </>
  );
}

/** Część rozwojowa: dosłowne cytaty z notatek przełożonego według jego własnego zaznaczenia „dobrze / do poprawy”. */
function DevelopmentSection(props: { d: DevelopmentSummary; cycleId: string }) {
  const d = props.d;
  return (
    <section class="card b-sec" aria-labelledby="h-dev">
      <p class="voice src">Z Twoich notatek</p>
      <h2 id="h-dev">Część rozwojowa rozmowy</h2>
      <p class="cap">Dosłowne cytaty z Twoich notatek według Twojego zaznaczenia „dobrze / do poprawy”. System nie ocenia treści i nie przyznaje punktów.</p>
      <h3>Co szło dobrze</h3>
      <Groups groups={d.good} label="Co szło dobrze" />
      <h3>Co do poprawy</h3>
      <Groups groups={d.needsImprovement} label="Co do poprawy" />
      {d.unrated ? <p class="cap">Notatki bez zaznaczenia „dobrze / do poprawy”: {d.unrated}. Są na liście notatek przy kryteriach.</p> : null}
    </section>
  );
}
