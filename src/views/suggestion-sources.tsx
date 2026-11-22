import type { Person } from "../people";
import { Layout } from "./layout";

export type SuggestionSourcesData = {
  intro: string;
  places: { place: string; model: string; prototype: string }[];
  never: string[];
  conditions: string[];
};

export function SuggestionSourcesView(props: { viewer: Person; today: string; data: SuggestionSourcesData; modeLabel: string }) {
  const d = props.data;
  return (
    <Layout title="Skąd biorą się podpowiedzi" person={props.viewer} today={props.today}>
      <section class="n-state sources">
        <h1 class="n-title">Skąd biorą się podpowiedzi</h1>
        <p>{d.intro}</p>
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div><b>Teraz działa: {props.modeLabel}</b></div>
        </div>
        <ol class="src-list" aria-label="Miejsca podpowiedzi">
          {d.places.map((p) => (
            <li class="hint">
              <p class="voice hint-v"><span>Podpowiedź</span></p>
              <h2>{p.place}</h2>
              <p><span class="lbl">Model w tle:</span> {p.model}</p>
              <p><span class="lbl">W prototypie:</span> {p.prototype}</p>
            </li>
          ))}
        </ol>
        <div class="src-cols">
          <section class="card">
            <h2>Czego model nigdy nie robi</h2>
            <ul class="points" aria-label="Czego model nigdy nie robi">{d.never.map((t) => <li><span>{t}</span></li>)}</ul>
          </section>
          <section class="card">
            <h2>Warunki wspólne</h2>
            <ul class="points">{d.conditions.map((t) => <li><span>{t}</span></li>)}</ul>
          </section>
        </div>
      </section>
    </Layout>
  );
}
