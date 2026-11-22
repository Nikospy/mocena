import type { Child } from "hono/jsx";
import type { CycleLink } from "../cycle-links";
import type { Person } from "../people";
import type { Card } from "../content";
import { officeSettings } from "../office-settings";
import { criterion } from "../engine/scoring";
import { ConfirmationBlock, LegalBasis } from "./components";
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
              <span class="box" />
              <span>
                <span class="cbt">{c.name}</span>
                {props.extra ? <small>{props.extra}</small> : null}
              </span>
            </label>
          ) : (
            <h3>{c.name}</h3>
          )}
          {props.kind ? <p class="kind">{props.kind}</p> : null}
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

const STEPS = ["Kryteria", "Okres oceny", "Rozmowa", "Ocena", "Zapoznanie"];

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
  return (
    <Layout title="Część I oceny" person={p.viewer} today={p.today}>
      <section class="card hdr" aria-label="Cykl oceny">
        <div class={p.links.length > 3 ? "hdr-top many" : "hdr-top"}>
          <div class="hdr-id">
            <p class="cap">Część I oceny · arkusz {p.sheet} <LegalBasis basis={p.sheetBasis} /></p>
            <h1>{p.employeeName}</h1>
          </div>
          {p.links.length ? (
            <div class="hdr-links">
              {p.links.map((l) => <a class="btn text" href={l.href}>{l.label}</a>)}
            </div>
          ) : null}
        </div>
        <Steps current={stepIdx} />
      </section>

      <section class="rule">
        <p class="voice rule-v">Reguła · {p.deadline.label}</p>
        <p class="term-date">
          <b class="big">{formatDate(p.deadline.date)}</b> <LegalBasis basis={p.deadline.basis} />
        </p>
      </section>
      {p.notice ? <p class="st info">{p.notice}</p> : null}
      {p.waiting ? <p class="st info">Przekazano {formatDate(p.waiting.submittedOn)}. Czeka na potwierdzenie {p.waiting.appraiseeGenitive}.</p> : null}
      {p.errors?.length ? (
        <div class="st bad" role="alert">
          <ul>{p.errors.map((e) => <li>{e}</li>)}</ul>
        </div>
      ) : null}

      {edit ? (
        <form class="p1-form" method="post" action={`/cycles/${p.cycleId}/part1/criteria`}>
          <section class="card sheet">
            {mandatoryHead}
            {p.mandatory.map((m) => <CriterionRow id={m.id} kind="obowiązkowe" expectation={exp(m.id)} editable />)}
          </section>
          <div class="list-h"><h2>Kryteria dodatkowe (do 3) <LegalBasis basis="§ 5 ust. 2" /></h2></div>
          {p.suggestions.length ? (
            <section class="hint">
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
            </section>
          ) : null}
          <section class="card sheet">
            {rest.map((id) => (
              <CriterionRow id={id} kind="do wyboru" expectation={exp(id)} editable checkbox={{ checked: p.selected.includes(id) }} />
            ))}
          </section>
          <div class="btns">
            <button class="btn" type="submit">Zapisz</button>
            <button class="btn primary" type="submit" formaction={`/cycles/${p.cycleId}/part1/submit`}>
              Potwierdzam rozmowę i przekazuję część I
            </button>
          </div>
        </form>
      ) : (
        <section class="card sheet">
          {mandatoryHead}
          {p.mandatory.map((m) => <CriterionRow id={m.id} kind="obowiązkowe" expectation={m.expectation ?? ""} editable={false} />)}
          <div class="list-h"><h2>Kryteria dodatkowe</h2></div>
          {p.additional.length === 0 ? <p>Brak kryteriów dodatkowych.</p> : null}
          {p.additional.map((m) => <CriterionRow id={m.id} kind="dodatkowe" expectation={m.expectation ?? ""} editable={false} />)}
        </section>
      )}

      {p.state === "submitted" || p.state === "confirmed" ? (
        <section class="card">
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
    </Layout>
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
    <Layout title="Karta rozmowy rozpoczynającej" person={props.viewer} today={props.today}>
      <section class="card hdr">
        <div class="hdr-top">
          <div class="hdr-id">
            <p class="cap">Karta rozmowy</p>
            <h1>{props.card.title}</h1>
            <p>{props.card.purpose}</p>
          </div>
          <div class="hdr-links">
            <a class="btn text" href={`/cycles/${props.cycleId}/part1`}>Wróć do części I</a>
          </div>
        </div>
      </section>
      <section class="rule">
        <p class="voice rule-v">Reguła · Tematy rozmowy <LegalBasis basis={props.basis} /></p>
        <ol class="topics">{props.topics.map((t) => <li>{t}</li>)}</ol>
      </section>
      <section class="card">
        {questions?.length ? (
          <>
            <h2>Pytania</h2>
            <ul>{questions.map((q) => <li>{q}</li>)}</ul>
          </>
        ) : null}
        {hardSituations?.length ? (
          <>
            <h2>Trudne sytuacje</h2>
            <ul>{hardSituations.map((h) => <li><b>{h.situation}</b> {h.whatToDo}</li>)}</ul>
          </>
        ) : null}
      </section>
      {props.invitation}
    </Layout>
  );
}
