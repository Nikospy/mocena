import type { Child } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime";
import type { CycleLink } from "../cycle-links";
import type { Person } from "../people";
import type { Card } from "../content";
import { officeSettings } from "../office-settings";
import { criterion } from "../engine/scoring";
import { ConfirmationBlock, ErrorSummary, LegalBasis, PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

export type Part1ViewProps = {
  viewer: Person;
  today: string;
  cycleId: string;
  employeeName: string;
  mode: "edit" | "read";
  canConfirm: boolean;
  sheet: string;
  sheetBasis: string;
  state: "not_started" | "draft" | "submitted" | "confirmed";
  mandatory: { id: string; expectation: string | null }[];
  additional: { id: string; expectation: string | null }[];
  suggestions: { criterionId: string; because: string }[];
  selectable: string[];
  selected: string[];
  expectations: Record<string, string>;
  deadline: { label: string; date: string; basis: string[] };
  confirmation?: { name: string; place: string; date: string };
  links: CycleLink[];
  errors?: string[];
  notice?: string;
  /** Sukces po zapisie kryteriów (bez przekazania). */
  saved?: boolean;
  /** Oceniający widzi, że przekazana część I czeka na ocenianego: data przekazania i osoba w dopełniaczu. */
  waiting?: { submittedOn: string; appraiseeGenitive: string };
};

function Chevron() {
  return <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6" /></svg>;
}

function CriterionRow(props: { id: string; kind?: string; expectation: string; editable: boolean; extra?: string; checkbox?: { checked: boolean } }) {
  const c = criterion(props.id);
  return (
    <div class="crit">
      <div class="crit-row">
        <div>
          {props.checkbox ? (
            <label class="cb">
              <input type="checkbox" name="additional" value={props.id} checked={props.checkbox.checked} />
              <span class="box"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
              <span>
                <span class="cbt">{c.name}</span>
                {props.extra ? <small>{props.extra}</small> : props.kind ? <small>{props.kind}</small> : null}
              </span>
            </label>
          ) : (
            <h3>{c.name}</h3>
          )}
          {props.kind && !props.checkbox ? <p class="kind">{props.kind}</p> : null}
          <details class="disc">
            <summary>Opis kryterium <Chevron /></summary>
            <ul>{c.description.map((d) => <li>{d}</li>)}</ul>
          </details>
        </div>
      </div>
      {props.editable ? (
        <details class="disc exp-field" open={props.expectation !== ""}>
          <summary>Oczekiwanie oceniającego <Chevron /></summary>
          <textarea class="area" name={`expectation[${props.id}]`} rows={2} aria-label={`Oczekiwanie oceniającego: ${c.name}`}>{props.expectation}</textarea>
        </details>
      ) : props.expectation ? (
        <div class="expect">
          <p class="sign">Oczekiwanie oceniającego</p>
          <p>{props.expectation}</p>
        </div>
      ) : null}
    </div>
  );
}

const STEPS = ["Kryteria", "Okres oceny", "Rozmowa oceniająca", "Ocena", "Zapoznanie"];

function Steps(props: { current: number }) {
  return (
    <ol class="steps5" aria-label="Etapy cyklu oceny">
      {STEPS.map((label, i) => (
        <li class={i < props.current ? "done" : i === props.current ? "cur" : ""} aria-current={i === props.current ? "step" : undefined}>
          <span class="dot">
            <span class="n">{i + 1}</span>
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export function Part1View(p: Part1ViewProps) {
  const edit = p.mode === "edit";
  const office = officeSettings();
  const suggested = new Set(p.suggestions.map((s) => s.criterionId));
  const because = new Map(p.suggestions.map((s) => [s.criterionId, s.because]));
  const rest = p.selectable.filter((id) => !suggested.has(id));
  const exp = (id: string) => p.expectations[id] ?? "";
  const stepIdx = p.state === "confirmed" ? 1 : 0;
  const mandatoryHead = (
    <div class="list-h">
      <h2>Kryteria obowiązkowe <LegalBasis basis="§ 4" /></h2>
      <p class="cap">Wynikają z arkusza {p.sheet}, który system dobrał do stanowiska ocenianego. Oceniający ich nie wybiera.</p>
    </div>
  );
  const term = (
    <section class="rule p1-term">
      <p class="voice rule-v">Reguła · {p.deadline.label}</p>
      <p class="term-date">
        <b class="big">{formatDate(p.deadline.date)}</b> <LegalBasis basis={p.deadline.basis} />
      </p>
    </section>
  );
  const links = p.links.map((l) => <a href={l.href}>{l.label}</a>);
  return (
    <Layout title="Część I oceny" person={p.viewer} today={p.today}>
      <PageHeader
        context={<>Ocena okresowa · arkusz {p.sheet} <LegalBasis basis={p.sheetBasis} /></>}
        title={<>Część I oceny: {p.employeeName}</>}
        linksLabel="Cykl oceny"
        links={links.length ? <CycleLinks links={links} /> : undefined}
      />
      <Steps current={stepIdx} />

      {p.notice ? <p class="st info">{p.notice}</p> : null}
      {p.waiting ? <p class="st info">Przekazano {formatDate(p.waiting.submittedOn)}. Czeka na potwierdzenie {p.waiting.appraiseeGenitive}.</p> : null}
      {p.saved && !p.errors?.length ? (
        <div class="st ok" role="status"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg><div><b>Zapisano szkic części I</b><small>Ocenianemu przekażesz ją przyciskiem „Potwierdzam rozmowę i przekazuję część I”.</small></div></div>
      ) : null}
      <ErrorSummary
        errors={Object.fromEntries((p.errors ?? []).map((m, i) => [edit ? `e${i}` : `_${i}`, m]))}
        title={edit ? "Popraw wybór kryteriów dodatkowych" : "Nie zapisano"}
        fields={Object.fromEntries((p.errors ?? []).map((_, i) => [`e${i}`, "p1-extra-h"]))}
      />

      {edit ? (
        <form class="p1-form" method="post" action={`/cycles/${p.cycleId}/part1/criteria`}>
          <div class="o-grid">
            <div class="o-main">
              <section class="card sheet">
                {mandatoryHead}
                {p.mandatory.map((m) => <CriterionRow id={m.id} kind="obowiązkowe" expectation={exp(m.id)} editable />)}
              </section>
              <section class="p1-extra">
                <div class="list-h"><h2 id="p1-extra-h" tabindex={-1}>Kryteria dodatkowe (do 3) <LegalBasis basis="§ 5 ust. 2" /></h2></div>
                {p.errors?.length ? <div class="p1-errs">{p.errors.map((m) => <p class="field-err"><span class="vh">Błąd: </span>{m}</p>)}</div> : null}
                {p.suggestions.length ? (
                  <div class="hint">
                    <p class="voice hint-v">Podpowiedź · ustawienie urzędu</p>
                    <p class="cap">Podpowiedzi z tabeli urzędu „rodzaj obowiązku → kryterium” ({office.label}, nie przepis). Do oceny trafią tylko zaznaczone.</p>
                    {p.suggestions.map((s) => (
                      <CriterionRow
                        id={s.criterionId}
                        extra={because.get(s.criterionId)}
                        expectation={exp(s.criterionId)}
                        editable
                        checkbox={{ checked: p.selected.includes(s.criterionId) }}
                      />
                    ))}
                  </div>
                ) : null}
                {rest.length ? (
                  <div class="card sheet">
                    <h3 class="p1-rest-h">Pozostałe kryteria dodatkowe</h3>
                    {rest.map((id) => (
                      <CriterionRow id={id} expectation={exp(id)} editable checkbox={{ checked: p.selected.includes(id) }} />
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
            <aside class="side p1-side" aria-label="Termin i przekazanie">
              {term}
              <div class="decide">
                <button class="btn primary full" type="submit" formaction={`/cycles/${p.cycleId}/part1/submit`}>
                  Potwierdzam rozmowę i przekazuję część I
                </button>
                <button class="btn full" type="submit">Zapisz szkic części I</button>
              </div>
            </aside>
          </div>
        </form>
      ) : (
        <div class="o-grid">
          <div class="o-main">
            <section class="card sheet">
              {mandatoryHead}
              {p.mandatory.map((m) => <CriterionRow id={m.id} kind="obowiązkowe" expectation={m.expectation ?? ""} editable={false} />)}
              <div class="list-h p1-add-h"><h2>Kryteria dodatkowe</h2></div>
              {p.additional.length === 0 ? <p>Brak kryteriów dodatkowych.</p> : null}
              {p.additional.map((m) => <CriterionRow id={m.id} kind="dodatkowe" expectation={m.expectation ?? ""} editable={false} />)}
            </section>
          </div>
          <aside class="side first" aria-label="Termin i potwierdzenie">
            {term}
            {p.state === "submitted" || p.state === "confirmed" ? (
              <section class="card p1-confirmation">
                <h2>Potwierdzenie części I</h2>
                <ConfirmationBlock kind="confirmation" {...p.confirmation} />
                {p.canConfirm ? <p class="cap">Miejscowość, data i Twoje imię i nazwisko wpiszą się same.</p> : null}
              </section>
            ) : null}
            {p.canConfirm ? (
              <form method="post" action={`/cycles/${p.cycleId}/part1/confirm`} class="actionbar part1-confirm">
                <button class="btn primary full" type="submit">Potwierdzam rozmowę, kryteria i termin oceny</button>
              </form>
            ) : null}
          </aside>
        </div>
      )}
    </Layout>
  );
}

/** Odnośniki cyklu: na komputerze jeden rząd, na telefonie dwa pierwsze i reszta w menu „Więcej”. */
function CycleLinks(props: { links: JSX.Element[] }) {
  const head = props.links.slice(0, 2);
  const tail = props.links.slice(2);
  return (
    <>
      <span class="pl-wide">{props.links}</span>
      <span class="pl-narrow">
        {head}
        {tail.length ? (
          <details class="pl-more">
            <summary>Więcej <Chevron /></summary>
            <div class="pl-menu">{tail}</div>
          </details>
        ) : null}
      </span>
    </>
  );
}

export function OpeningCardView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  card: Card;
  basis: string;
  topics: string[];
  invitation?: Child;
}) {
  const { questions, hardSituations } = props.card;
  return (
    <Layout title="Karta rozmowy o kryteriach" person={props.viewer} today={props.today}>
      <PageHeader
        context="Karta rozmowy"
        title={props.card.title}
        lead={props.card.purpose}
        links={<a href={`/cycles/${props.cycleId}/part1`}>Wróć do części I</a>}
      />
      <div class="o-grid">
        <div class="o-main">
          <section class="card b-sec">
            {questions?.length ? (
              <>
                <h2>Pytania</h2>
                <ul class="note-list">{questions.map((q) => <li class="note-item"><p>{q}</p></li>)}</ul>
              </>
            ) : null}
            {hardSituations?.length ? (
              <>
                <h2>Trudne sytuacje</h2>
                <ul class="hard-list">{hardSituations.map((h) => <li><b>{h.situation}</b><p>{h.whatToDo}</p></li>)}</ul>
              </>
            ) : null}
          </section>
          {props.invitation}
        </div>
        <aside class="side first" aria-label="Tematy rozmowy z przepisu">
          <section class="rule">
            <p class="voice rule-v"><span class="pg" aria-hidden="true">§</span><span><b>Tematy rozmowy</b> · z przepisu</span></p>
            <ol class="b-ol">{props.topics.map((t) => <li>{t}</li>)}</ol>
            <p><LegalBasis basis={props.basis} /></p>
          </section>
        </aside>
      </div>
    </Layout>
  );
}
