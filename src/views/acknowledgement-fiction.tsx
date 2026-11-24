import { rules } from "../engine/rules";
import { fictionReasonLabel } from "./assessment";
import type { Person } from "../people";
import { DateFormatHint, DateInput, ErrorSummary, FieldError, LegalBasis, PageHeader, invalid, type FormErrors } from "./components";
import { Layout, formatDate } from "./layout";

export type FictionViewProps = {
  viewer: Person;
  person: Person;
  cycleId: string;
  today: string;
  approvedOn: string;
  deadline: string;
  errors?: FormErrors;
  values?: { reason: string; deliveryMethod: string; deliveredOn: string };
};

export function FictionView(p: FictionViewProps) {
  const v = p.values ?? { reason: "", deliveryMethod: "in_person", deliveredOn: p.today };
  const e = p.errors ?? {};
  const assessed = p.person.gender === "f" ? "Oceniana" : "Oceniany";
  return (
    <Layout title="Fikcja zapoznania" person={p.viewer} today={p.today}>
      <PageHeader context="Ocena okresowa · zapoznanie" title={<>Stwierdzenie fikcji zapoznania: {p.person.name}</>} />
      <div class="o-grid">
        <div class="o-main">
      <section class="card b-sec">
        <form method="post" action={`/cycles/${p.cycleId}/assessment/fiction`} class="form-gap">
          <ErrorSummary errors={{ reason: e.reason, deliveryMethod: e.deliveryMethod, deliveredOn: e.deliveredOn }} />
          <div class="field" role="radiogroup" aria-labelledby="l-reason" {...invalid("reason", e)}>
          <p class="lbl" id="l-reason">Powód</p>
          <FieldError id="reason" errors={e} />
          <div class="chips">
            <label class="chip">
              <input type="radio" name="reason" id="reason" value="could_not" checked={v.reason === "could_not"} />
              <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{assessed} {fictionReasonLabel("could_not", p.person.gender)} zapoznania</span>
            </label>
            <label class="chip">
              <input type="radio" name="reason" value="would_not" checked={v.reason === "would_not"} />
              <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{assessed} {fictionReasonLabel("would_not", p.person.gender)} zapoznania</span>
            </label>
          </div>
          </div>
          <div class="field" role="radiogroup" aria-labelledby="l-delivery" {...invalid("deliveryMethod", e)}>
          <p class="lbl" id="l-delivery">Jak doręczono kopię arkusza <LegalBasis basis={rules.approval.acknowledgement.basis} /></p>
          <FieldError id="deliveryMethod" errors={e} />
          <div class="chips">
            <label class="chip">
              <input type="radio" name="deliveryMethod" id="deliveryMethod" value="in_person" checked={v.deliveryMethod === "in_person"} />
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
          </div>
          <div class="field">
          <label class="lbl" for="deliveredOn">Data doręczenia kopii arkusza<DateFormatHint /></label>
          <FieldError id="deliveredOn" errors={e} />
          <DateInput class="area date-field" id="deliveredOn" value={v.deliveredOn} {...invalid("deliveredOn", e)} />
          </div>
          <div class="btns">
            <button type="submit" class="btn primary">Zapisz fikcję zapoznania</button>
            <a class="btn" href={`/cycles/${p.cycleId}/assessment`}>Wróć bez zapisu</a>
          </div>
        </form>
      </section>
        </div>
        <aside class="side first" aria-label="Skutek wpisu">
          <section class="rule">
            <p class="voice rule-v"><span class="pg" aria-hidden="true">§</span><span><b>Skutek wpisu</b> · z przepisu</span></p>
            <p>Urząd przyjmuje dzisiejszy dzień jako dzień zapoznania. Od dziś system liczy {rules.deadlines.objectionDays.value} dni na sprzeciw.</p>
            <p>Koniec terminu na sprzeciw: <b>{formatDate(p.deadline)}</b> <LegalBasis basis={rules.deadlines.objectionDays.basis} /></p>
            <p class="cap">Kadry zobaczą ten wpis.</p>
          </section>
        </aside>
      </div>
      <script src="/date-words.js" defer></script>
    </Layout>
  );
}
