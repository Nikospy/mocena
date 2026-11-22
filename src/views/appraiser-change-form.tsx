import type { Person } from "../people";
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
}) {
  return (
    <Layout title={`Zmiana oceniającego: ${props.personName}`} person={props.viewer} today={props.today}>
      <section class="card form-card">
        <h1>Zmień oceniającego: {props.personName}</h1>
        <p class="cap">Obecny oceniający: {props.currentName}</p>
        <form method="post" action={`/cycles/${props.cycleId}/appraiser`} class="abs-form">
          <div>
            <label class="lbl" for="appraiser_id">Nowy oceniający</label>
            <select class="area" id="appraiser_id" name="appraiser_id" aria-invalid={props.error ? "true" : undefined}>
              <option value="">Wybierz osobę</option>
              {props.candidates.map((p) => (
                <option value={p.id}>{p.name}</option>
              ))}
            </select>
            {props.error ? <p class="st bad" role="alert">{props.error}</p> : null}
          </div>
          <div class="rule crit-keep">
            <p>Kryteria zostają bez zmian. Nowy oceniający ocenia na podstawie wcześniej wybranych kryteriów ({rules.appraiserChange.basis} rozporządzenia).</p>
            <ul class="plain-list">
              {props.criteria.map((c) => (
                <li>{c.name}</li>
              ))}
            </ul>
          </div>
          <button class="btn primary full" type="submit">
            Zapisz zmianę oceniającego
          </button>
        </form>
      </section>
    </Layout>
  );
}
