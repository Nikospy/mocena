import type { Person } from "../people";
import { ErrorSummary, FieldError, PageHeader, invalid } from "./components";
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
          <ErrorSummary errors={{ appraiser_id: props.error }} />
          <div class="field">
            <label class="lbl" for="appraiser_id">Nowy oceniający</label>
            <FieldError id="appraiser_id" message={props.error} />
            <select class="area" id="appraiser_id" name="appraiser_id" {...invalid("appraiser_id", { appraiser_id: props.error })}>
              <option value="">Wybierz osobę</option>
              {props.candidates.map((p) => (
                <option value={p.id} selected={props.selected === p.id}>{p.name}</option>
              ))}
            </select>
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
