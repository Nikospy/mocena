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
  if (props.entries.length === 0) return <p>Nie ma jeszcze zatwierdzonych ocen.</p>;
  return (
    <ul class="ct-rows">
      {props.entries.map((h) => {
        return (
          <li>
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
            {h.canOpenSheet ? <p><a href={`/cycles/${h.cycleId}/sheet`}>Arkusz</a></p> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function HistoryView(props: { viewer: Person; today: string; person: Person; entries: Entry[]; previous?: PreviousAssessment[] }) {
  const previous = props.previous ?? [];
  return (
    <Layout title={`Historia ocen: ${props.person.name}`} person={props.viewer} today={props.today}>
      <PageHeader title={<>Historia ocen: {props.person.name}</>} />
      {props.entries.length > 0 || previous.length === 0 ? <HistoryList entries={props.entries} /> : null}
      {previous.length > 0 ? (
        <section class="ct-prev" aria-labelledby="h-prev">
          <h2 id="h-prev">Oceny sprzed systemu</h2>
          <ul class="ct-rows">
            {previous.map((p) => (
              <li>
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
