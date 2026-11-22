import { rules } from "../engine/rules";
import type { Person } from "../people";
import { LegalBasis } from "./components";
import { Layout, formatDate } from "./layout";

export type FictionViewProps = {
  viewer: Person;
  person: Person;
  cycleId: string;
  today: string;
  approvedOn: string;
  deadline: string;
  errors?: string[];
  values?: { reason: string; deliveryMethod: string; deliveredOn: string };
};

export function FictionView(p: FictionViewProps) {
  const v = p.values ?? { reason: "", deliveryMethod: "", deliveredOn: "" };
  return (
    <Layout title="Fikcja zapoznania" person={p.viewer} today={p.today}>
      <section class="card hdr">
        <p class="voice src">Ocena okresowa · zapoznanie</p>
        <h1>Stwierdzenie fikcji zapoznania: {p.person.name}</h1>
      </section>
      <section class="card b-sec">
        <div class="st info">
          <div>
            <b>
              Urząd przyjmuje dzisiejszy dzień jako dzień zapoznania. Od dziś system liczy {rules.deadlines.objectionDays.value} dni na sprzeciw.
            </b>
            <small>
              Koniec terminu na sprzeciw: {formatDate(p.deadline)} <LegalBasis basis={rules.deadlines.objectionDays.basis} />
            </small>
            <small>Kadry zobaczą ten wpis.</small>
          </div>
        </div>
        {p.errors?.length ? (
          <div class="st bad" role="alert">
            <ul>{p.errors.map((e) => <li>{e}</li>)}</ul>
          </div>
        ) : null}
        <form method="post" action={`/cycles/${p.cycleId}/assessment/fiction`} class="form-gap">
          <p class="lbl">Powód</p>
          <div class="seg col">
            <label>
              <input type="radio" name="reason" value="could_not" checked={v.reason === "could_not"} />
              <span>Oceniany nie mógł potwierdzić zapoznania</span>
            </label>
            <label>
              <input type="radio" name="reason" value="would_not" checked={v.reason === "would_not"} />
              <span>Oceniany nie chciał potwierdzić zapoznania</span>
            </label>
          </div>
          <p class="lbl">Jak doręczono kopię arkusza <LegalBasis basis={rules.approval.acknowledgement.basis} /></p>
          <div class="seg col">
            <label>
              <input type="radio" name="deliveryMethod" value="in_person" checked={v.deliveryMethod === "in_person"} />
              <span>Osobiście</span>
            </label>
            <label>
              <input type="radio" name="deliveryMethod" value="post" checked={v.deliveryMethod === "post"} />
              <span>Pocztą</span>
            </label>
            <label>
              <input type="radio" name="deliveryMethod" value="email" checked={v.deliveryMethod === "email"} />
              <span>Pocztą elektroniczną</span>
            </label>
          </div>
          <label class="lbl" for="deliveredOn">Kiedy</label>
          <input class="area" type="date" id="deliveredOn" name="deliveredOn" min={p.approvedOn} max={p.today} value={v.deliveredOn} />
          <div class="btns">
            <button type="submit" class="btn primary">Zapisz wpis</button>
            <a class="btn" href={`/cycles/${p.cycleId}/assessment`}>Wróć bez zapisu</a>
          </div>
        </form>
      </section>
    </Layout>
  );
}
