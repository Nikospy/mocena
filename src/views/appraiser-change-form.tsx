import type { Person } from "../people";
import { PageHeader } from "./components";
import { rules } from "../engine/rules";
import { Layout } from "./layout";

export function AppraiserChangeFormView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  personName: string;
  currentName: string;
  candidates: Person[];
  criteria: { id: string; name: string }[];
  error?: string;
  /** Wstępnie wybrana osoba, np. nowy przełożony z edycji pracownika. */
  selected?: string;
}) {
  return (
    <Layout title={`Zmiana oceniającego: ${props.personName}`} person={props.viewer} today={props.today}>
      <PageHeader title={<>Zmień oceniającego: {props.personName}</>} lead={<>Obecny oceniający: {props.currentName}</>} />
      <div class="o-grid">
      <section class="card form-card ct-form">
        <form method="post" action={`/cycles/${props.cycleId}/appraiser`} class="abs-form">
          <div>
            <label class="lbl" for="appraiser_id">Nowy oceniający</label>
            <select class="area" id="appraiser_id" name="appraiser_id" aria-invalid={props.error ? "true" : undefined}>
              <option value="">Wybierz osobę</option>
              {props.candidates.map((p) => (
                <option value={p.id} selected={props.selected === p.id}>{p.name}</option>
              ))}
            </select>
            {props.error ? <p class="st bad" role="alert">{props.error}</p> : null}
          </div>
          <p class="ct-actions">
            <button class="btn primary" type="submit">
              Zapisz zmianę oceniającego
            </button>
          </p>
        </form>
      </section>
      <aside class="side">
        <section class="rule crit-keep" aria-labelledby="h-keep">
          <h2 id="h-keep">Kryteria zostają bez zmian</h2>
          <p>Nowy oceniający ocenia na podstawie wcześniej wybranych kryteriów ({rules.appraiserChange.basis} rozporządzenia).</p>
          <ul>
            {props.criteria.map((c) => (
              <li>{c.name}</li>
            ))}
          </ul>
        </section>
      </aside>
      </div>
    </Layout>
  );
}
