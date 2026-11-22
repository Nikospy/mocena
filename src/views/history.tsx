import type { HistoryEntry } from "../hr/history";
import type { Person } from "../people";
import { RulesVersion } from "./components";
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

export function HistoryView(props: { viewer: Person; today: string; person: Person; entries: Entry[] }) {
  return (
    <Layout title="Historia ocen" person={props.viewer} today={props.today}>
      <section class="card hdr slim">
        <h1>Historia ocen</h1>
        <p class="cap">Osoba: {props.person.name}</p>
      </section>
      <HistoryList entries={props.entries} />
    </Layout>
  );
}
