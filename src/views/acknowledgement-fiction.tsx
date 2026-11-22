import { rules } from "../engine/rules";
import type { Person } from "../people";
import { LegalBasis, PageHeader } from "./components";
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
  const v = p.values ?? { reason: "", deliveryMethod: "in_person", deliveredOn: p.today };
  return (
    <Layout title="Fikcja zapoznania" person={p.viewer} today={p.today}>
      <PageHeader context="Ocena okresowa · zapoznanie" title={<>Stwierdzenie fikcji zapoznania: {p.person.name}</>} />
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
          <p class="lbl" id="l-reason">Powód</p>
          <div class="chips" role="radiogroup" aria-labelledby="l-reason">
            <label class="chip">
              <input type="radio" name="reason" value="could_not" checked={v.reason === "could_not"} />
              <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Oceniany nie mógł potwierdzić zapoznania</span>
            </label>
            <label class="chip">
              <input type="radio" name="reason" value="would_not" checked={v.reason === "would_not"} />
              <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Oceniany nie chciał potwierdzić zapoznania</span>
            </label>
          </div>
          <p class="lbl" id="l-delivery">Jak doręczono kopię arkusza <LegalBasis basis={rules.approval.acknowledgement.basis} /></p>
          <div class="chips" role="radiogroup" aria-labelledby="l-delivery">
            <label class="chip">
              <input type="radio" name="deliveryMethod" value="in_person" checked={v.deliveryMethod === "in_person"} />
              <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Osobiście</span>
            </label>
            <label class="chip">
              <input type="radio" name="deliveryMethod" value="post" checked={v.deliveryMethod === "post"} />
              <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Pocztą</span>
            </label>
            <label class="chip">
              <input type="radio" name="deliveryMethod" value="email" checked={v.deliveryMethod === "email"} />
              <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Pocztą elektroniczną</span>
            </label>
          </div>
          <label class="lbl" for="deliveredOn">Kiedy</label>
          <input class="area date-field" type="date" id="deliveredOn" name="deliveredOn" min={p.approvedOn} max={p.today} value={v.deliveredOn} />
          <div class="btns">
            <button type="submit" class="btn primary">Zapisz wpis</button>
            <a class="btn" href={`/cycles/${p.cycleId}/assessment`}>Wróć bez zapisu</a>
          </div>
        </form>
      </section>
    </Layout>
  );
}
