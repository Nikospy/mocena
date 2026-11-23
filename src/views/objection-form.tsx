import { OBJECTION_OUTCOME_TEXT, type AssessmentSnapshot, type ObjectionFacts } from "../assessment/state";
import { verdictText } from "../assessment/verdict";
import { objectionReviewDeadline } from "../engine/deadlines";
import { rules } from "../engine/rules";
import type { Person } from "../people";
import { ErrorSummary, FieldError, LegalBasis, PageHeader, invalid, type FormErrors } from "./components";
import { Layout, formatDate } from "./layout";

export function ObjectionFormView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  recipient: string;
  deadline: string;
  reason?: string;
  errors?: FormErrors;
}) {
  const e = props.errors ?? {};
  return (
    <Layout title="Wniesienie sprzeciwu" person={props.viewer} today={props.today}>
      <PageHeader
        context="Sprzeciw od oceny okresowej"
        title="Wnieś sprzeciw od oceny"
        lead={`Sprzeciw kierujesz do ${props.recipient} w terminie 7 dni od zapoznania się z oceną.`}
        links={<a href={`/cycles/${props.cycleId}/assessment`}>Wróć do oceny</a>}
      />
      <ErrorSummary errors={e} title="Nie wniesiono sprzeciwu" />
      <section class="card rule" aria-labelledby="h-obj-basis">
        <h2 id="h-obj-basis">Termin i skutek sprzeciwu</h2>
        <p>
          Termin wniesienia sprzeciwu upływa <b class="tnum">{formatDate(props.deadline)}</b>. <LegalBasis basis={rules.deadlines.objectionDays.basis} />
        </p>
        <p class="cap">
          Rozpatrujący sprzeciw ma {rules.deadlines.objectionReviewDays.value} dni na rozstrzygnięcie: zmianę oceny, nakazanie ponownego sporządzenia oceny albo nieuwzględnienie sprzeciwu.{" "}
          <LegalBasis basis={rules.deadlines.objectionReviewDays.basis} />
        </p>
      </section>
      <form method="post" action={`/cycles/${props.cycleId}/objection`} class="card" id="objection-form">
        <div class="field">
          <label class="lbl" for="reason">Uzasadnienie sprzeciwu</label>
          <p class="cap" id="reason-hint">Opisz, z którymi ustaleniami lub ocenami cząstkowymi się nie zgadzasz i dlaczego.</p>
          <FieldError id="reason" errors={e} />
          <textarea
            class="area"
            id="reason"
            name="reason"
            rows={6}
            maxLength={4000}
            {...invalid("reason", e, "reason-hint")}
          >
            {props.reason ?? ""}
          </textarea>
        </div>
        <div class="actionbar">
          <button class="btn primary" type="submit">Wnieś sprzeciw</button>
          <a class="btn" href={`/cycles/${props.cycleId}/assessment`}>Anuluj</a>
        </div>
      </form>
    </Layout>
  );
}

export function ObjectionResolveView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  person: Person;
  appraiserName: string;
  recipient?: string;
  snapshot: AssessmentSnapshot;
  objection: ObjectionFacts;
  errors?: FormErrors;
  resolved?: boolean;
}) {
  const o = props.objection;
  const reviewDue = objectionReviewDeadline(o.filedOn);
  const { verdict, level } = verdictText(props.snapshot.result);
  const e = props.errors ?? {};
  const canOpenAssessment = !o.resolvedOn || props.viewer.role === "hr";
  const recipient = props.recipient ?? rules.deadlines.objectionDays.toGenitive;
  return (
    <Layout title={`Sprzeciw: ${props.person.name}`} person={props.viewer} today={props.today}>
      <PageHeader
        context="Rozpatrzenie sprzeciwu · art. 83 ust. 3 ustawy"
        title={<>Sprzeciw od oceny: {props.person.name}</>}
        lead={`Oceniający: ${props.appraiserName}.`}
        links={canOpenAssessment ? <a href={`/cycles/${props.cycleId}/assessment`}>Otwórz ocenę</a> : <a href="/">Wróć do spraw</a>}
      />
      <ErrorSummary errors={e} title="Nie odnotowano wyniku rozpatrzenia" />
      {props.resolved ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div>
            <b>Zapisano rozstrzygnięcie sprzeciwu: {o.outcome ? OBJECTION_OUTCOME_TEXT[o.outcome] : "rozstrzygnięty"}.</b>
          </div>
        </div>
      ) : null}
      <div class="o-grid">
        <div class="o-main">
          <section class="card" aria-labelledby="h-obj-details">
            <h2 id="h-obj-details">Treść sprzeciwu</h2>
            <dl class="hr-facts">
              <div><dt>Adresat sprzeciwu</dt><dd>{recipient}</dd></div>
              <div><dt>Wniesiony dnia</dt><dd class="tnum">{formatDate(o.filedOn)}</dd></div>
              <div><dt>Termin rozpatrzenia</dt><dd class="tnum"><b>{formatDate(reviewDue)}</b> <LegalBasis basis={rules.deadlines.objectionReviewDays.basis} /></dd></div>
              <div><dt>Wynik zaskarżonej oceny</dt><dd>{level ? `${verdict}, ${level}` : verdict}</dd></div>
            </dl>
            {props.snapshot.sheet === "A" ? (
              <p class="cap">W arkuszu A sprzeciw jest kierowany do wskazanego adresata ({recipient}); w systemie decyzję zapisują kadry w imieniu adresata.</p>
            ) : null}
            <h3>Uzasadnienie ocenianego</h3>
            <p>{o.reason ? o.reason : "Sprzeciw odnotowany bez treści uzasadnienia."}</p>
          </section>

          {o.resolvedOn ? (
            <section class="card rule" aria-labelledby="h-obj-done">
              <h2 id="h-obj-done">Sprzeciw rozpatrzony</h2>
              <p>
                Rozstrzygnięcie z dnia <b class="tnum">{formatDate(o.resolvedOn)}</b>:{" "}
                <b>{o.outcome ? OBJECTION_OUTCOME_TEXT[o.outcome] : "rozstrzygnięty"}</b>.{" "}
                <LegalBasis basis={rules.deadlines.objectionReviewDays.basis} />
              </p>
            </section>
          ) : (
            <form method="post" action={`/cycles/${props.cycleId}/objection-outcome`} class="card" id="objection-resolve-form">
              <fieldset class="hr-obj-pick" aria-describedby={e.outcome ? "outcome-error" : undefined}>
                <legend class="lbl">Rozstrzygnięcie sprzeciwu</legend>
                <FieldError id="outcome" errors={e} />
                {[
                  ["changed", "Uwzględniony: zmiana oceny"],
                  ["redone", "Uwzględniony: ponowne sporządzenie oceny"],
                  ["rejected", "Nieuwzględniony"],
                ].map(([value, label], i) => (
                  <label class="cb">
                    <input type="radio" name="outcome" value={value} required={i === 0} id={i === 0 ? "outcome" : undefined} {...invalid("outcome", e)} />
                    <span class="box" aria-hidden="true"></span>
                    <span class="cbt">{label}</span>
                  </label>
                ))}
                <div class="actionbar">
                  <button class="btn primary" type="submit">Zapisz rozstrzygnięcie sprzeciwu</button>
                </div>
              </fieldset>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
