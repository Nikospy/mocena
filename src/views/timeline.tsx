import type { Person } from "../people";
import type { TimelineEntry } from "../timeline";
import { LegalBasis, RulesVersion, PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

export function TimelineView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  personName: string;
  entries: TimelineEntry[];
  rulesVersion: { version: string; effectiveFrom: string };
  notice?: string;
  canAddAbsence: boolean;
}) {
  return (
    <Layout title={`Oś czasu: ${props.personName}`} person={props.viewer} today={props.today}>
      <PageHeader title={<>Oś czasu: {props.personName}</>} lead="Daty wyliczone z przepisu albo wpisane przez człowieka." />
      {props.notice ? (
        <p class="ct-notice" role="status">
          {props.notice}
        </p>
      ) : null}
      <div class="o-grid">
        <div class="o-main">
          <section class="card tl-card" aria-labelledby="h-tl">
            <h2 id="h-tl">Daty cyklu oceny</h2>
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
                    {e.detail ? <p class="tl-detail">{e.detail}</p> : null}
                    {e.href ? <a href={e.href}>Pismo o zmianie terminu</a> : null}
                    <LegalBasis basis={e.basis} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside class="side" aria-label="Objaśnienie osi czasu">
          <div class="ct-side">
            <h2 class="ct-side-h">Znaczenie punktów</h2>
            <ul class="ct-legend">
              <li><i aria-hidden="true"></i>wpisane przez człowieka</li>
              <li><i class="r" aria-hidden="true"></i>wyliczone z przepisu</li>
            </ul>
            <p class="cap"><RulesVersion version={props.rulesVersion.version} effectiveFrom={props.rulesVersion.effectiveFrom} /></p>
            {props.canAddAbsence ? (
              <p>
                <a class="btn primary" href={`/cycles/${props.cycleId}/absences`}>
                  Wpisz nieobecność
                </a>
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </Layout>
  );
}
