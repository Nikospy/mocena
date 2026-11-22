import type { CycleLink } from "../cycle-links";
import type { Person } from "../people";
import type { TimelineEntry } from "../timeline";
import { LegalBasis, RulesVersion } from "./components";
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
  links?: CycleLink[];
}) {
  return (
    <Layout title={`Oś czasu: ${props.personName}`} person={props.viewer} today={props.today}>
      <section class="card hdr slim" aria-label="Cykl oceny">
        <div class="hdr-top">
          <div class="hdr-id">
            <p class="cap">Oś czasu cyklu oceny</p>
            <h1>{props.personName}</h1>
          </div>
          {props.links?.length ? (
            <div class="hdr-links">
              {props.links.map((l) => <a class="btn text" href={l.href}>{l.label}</a>)}
            </div>
          ) : null}
        </div>
      </section>
      {props.notice ? (
        <p class="st info" role="status">
          {props.notice}
        </p>
      ) : null}
      <section class="rule tl-card" aria-labelledby="h-tl">
        <div class="term-top">
          <div class="voice rule-v">
            <span class="pg" aria-hidden="true">§</span>
            <div>
              <h2 id="h-tl">Co z tego wynika</h2>
              <p class="cap">Daty wyliczone z przepisu albo wpisane przez człowieka.</p>
            </div>
          </div>
          <div class="legend" aria-hidden="true">
            <span><i></i>wpisał człowiek</span>
            <span><i class="r"></i>wyliczone z przepisu</span>
          </div>
        </div>
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
                {e.href ? <a class="btn link-chip" href={e.href}>Pismo o zmianie terminu</a> : null}
                <LegalBasis basis={e.basis} />
              </div>
            </li>
          ))}
        </ol>
        <p class="cap"><RulesVersion version={props.rulesVersion.version} effectiveFrom={props.rulesVersion.effectiveFrom} /></p>
      </section>
      {props.canAddAbsence ? (
        <p class="btns">
          <a class="btn primary" href={`/cycles/${props.cycleId}/absences`}>
            Wpisz kolejną nieobecność
          </a>
        </p>
      ) : null}
    </Layout>
  );
}
