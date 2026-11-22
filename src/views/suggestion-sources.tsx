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
      <section class="card">
        <h1>Skąd biorą się podpowiedzi</h1>
        <p>{d.intro}</p>
        <p><b>Teraz działa: {props.modeLabel}</b></p>
        <ol class="note-list" aria-label="Miejsca podpowiedzi">
          {d.places.map((p) => (
            <li class="note-item">
              <p class="cap">{p.place}</p>
              <p>Model w tle: {p.model}</p>
              <p class="cap">W prototypie: {p.prototype}</p>
            </li>
          ))}
        </ol>
      </section>
      <section class="card">
        <h2>Czego model nigdy nie robi</h2>
        <ul aria-label="Czego model nigdy nie robi">{d.never.map((t) => <li>{t}</li>)}</ul>
        <h2>Warunki wspólne</h2>
        <ul>{d.conditions.map((t) => <li>{t}</li>)}</ul>
      </section>
    </Layout>
  );
}
