import type { Person } from "../people";
import { PageHeader } from "./components";
import { Layout } from "./layout";

export type SuggestionSourcesData = {
  intro: string;
  places: { place: string; model: string; prototype: string }[];
  never: string[];
  conditions: string[];
};

export function SuggestionSourcesView(props: { viewer: Person; today: string; data: SuggestionSourcesData; modeLabel: string }) {
  const d = props.data;
  const works = (t: string) => t.startsWith("działa");
  return (
    <Layout title="Skąd biorą się podpowiedzi" person={props.viewer} today={props.today}>
      <PageHeader title="Skąd biorą się podpowiedzi" lead={d.intro} />
      <div class="st ok" role="status">
        <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        <div><b>Teraz działa: {props.modeLabel}</b></div>
      </div>
      <section class="card" aria-labelledby="h-src-places">
        <h2 id="h-src-places">Sześć miejsc na podpowiedź</h2>
        <div class="hr-scroll">
          <table class="hr-table src-table" aria-labelledby="h-src-places">
            <thead>
              <tr>
                <th scope="col">Miejsce</th>
                <th scope="col">Model w tle</th>
                <th scope="col">W prototypie</th>
              </tr>
            </thead>
            <tbody>
              {d.places.map((p) => (
                <tr class="hr-card src-row">
                  <th scope="row">{p.place}</th>
                  <td data-label="Model w tle">{p.model}</td>
                  <td data-label="W prototypie" class={works(p.prototype) ? "src-on" : "src-off"}>{p.prototype}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div class="src-cols">
        <section class="card" aria-labelledby="h-src-never">
          <h2 id="h-src-never">Czego model nigdy nie robi</h2>
          <ul class="points" aria-label="Czego model nigdy nie robi">{d.never.map((t) => <li><span>{t}</span></li>)}</ul>
        </section>
        <section class="card" aria-labelledby="h-src-cond">
          <h2 id="h-src-cond">Warunki w każdym miejscu</h2>
          <ul class="points">{d.conditions.map((t) => <li><span>{t}</span></li>)}</ul>
        </section>
      </div>
    </Layout>
  );
}
