import { OUTCOME_LABEL, type PreviousAssessment } from "../hr/people";
import type { HistoryEntry } from "../hr/history";
import type { Person } from "../people";
import { RulesVersion, PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

type Entry = HistoryEntry & { canOpenSheet: boolean };

function mean2(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export function HistoryList(props: { entries: Entry[] }) {
  if (props.entries.length === 0) return <p>Brak ocen w systemie</p>;
  return (
    <ul class="plain-list hist-list">
      {props.entries.map((h) => {
        return (
          <li class="card">
            <h2>Ocena z {formatDate(h.approvedOn)}</h2>
            <p>
              Arkusz {h.sheet} · {h.outcome === "positive" ? "pozytywna" : "negatywna"} · {h.overallLevel} · średnia {mean2(h.mean)}
            </p>
            <p class="cap">
              {h.acknowledgedOn
                ? h.fiction
                  ? `Fikcja zapoznania stwierdzona ${formatDate(h.acknowledgedOn)}`
                  : `Zapoznanie potwierdzone ${formatDate(h.acknowledgedOn)}`
                : "Zapoznanie jeszcze niepotwierdzone"}
              {" · "}<RulesVersion version={h.rulesVersion.version} effectiveFrom={h.rulesVersion.effectiveFrom} />
            </p>
            {h.canOpenSheet ? <a class="btn link-chip" href={`/cycles/${h.cycleId}/sheet`}>Arkusz</a> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function HistoryView(props: { viewer: Person; today: string; person: Person; entries: Entry[]; previous?: PreviousAssessment[] }) {
  const previous = props.previous ?? [];
  return (
    <Layout title="Historia ocen" person={props.viewer} today={props.today}>
      <PageHeader context={props.person.name} title="Historia ocen" />
      {props.entries.length > 0 || previous.length === 0 ? <HistoryList entries={props.entries} /> : null}
      {previous.length > 0 ? (
        <section aria-labelledby="h-prev">
          <h2 id="h-prev">Ocena sprzed systemu</h2>
          <ul class="plain-list hist-list">
            {previous.map((p) => (
              <li class="card">
                <h3>Ocena z {formatDate(p.on)}</h3>
                <p>
                  {OUTCOME_LABEL[p.outcome]}
                  {p.level ? ` · ${p.level}` : ""}
                </p>
                <p class="cap">Wpisana przez kadry {formatDate(p.recordedOn)}. Ocena wystawiona poza systemem, bez arkusza.</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Layout>
  );
}
