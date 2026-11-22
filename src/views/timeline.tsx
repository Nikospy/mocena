import type { Person } from "../people";
import type { TimelineEntry } from "../timeline";
import { LegalBasis } from "./components";
import { Layout, formatDate } from "./layout";

export function TimelineView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  personName: string;
  entries: TimelineEntry[];
  rulesText: string;
  notice?: string;
  canAddAbsence: boolean;
}) {
  return (
    <Layout title={`Oś czasu: ${props.personName}`} person={props.viewer} today={props.today}>
      <section class="card hdr slim" aria-label="Cykl oceny">
        <div class="hdr-id">
          <p class="cap">Oś czasu cyklu oceny</p>
          <h1>{props.personName}</h1>
        </div>
      </section>
      {props.notice ? (
        <p class="st info" role="status">
          {props.notice}
        </p>
      ) : null}
      <section class="rule tl-card" aria-labelledby="h-tl">
        <h2 id="h-tl">Co z tego wynika</h2>
        <p class="cap">Daty wyliczone z przepisu albo wpisane przez człowieka.</p>
        <ol class="tl-list">
          {props.entries.map((e) => (
            <li class={`tl-item ${e.kind}`}>
              <time datetime={e.date}>{formatDate(e.date)}</time>
              <div class="tl-body">
                <b>{e.title}</b>
                {e.struck ? (
                  <span class="tl-cmp">
                    <s class="tl-old">{formatDate(e.struck)}</s> <span class="tl-new">{formatDate(e.date)}</span>
                  </span>
                ) : null}
                {e.detail ? <p class="cap">{e.detail}</p> : null}
                <LegalBasis basis={e.basis} />
              </div>
            </li>
          ))}
        </ol>
        <p class="cap">{props.rulesText}</p>
      </section>
      {props.canAddAbsence ? (
        <p>
          <a class="btn primary" href={`/cycles/${props.cycleId}/absences`}>
            Wpisz kolejną nieobecność
          </a>
        </p>
      ) : null}
    </Layout>
  );
}
