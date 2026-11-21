import type { CycleLink } from "../cycle-links";
import type { Person } from "../people";
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
};

function CriterionRow(props: { id: string; kind: string; expectation: string; editable: boolean; extra?: string; checkbox?: { checked: boolean } }) {
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
          <p class="kind">{props.kind}</p>
        </div>
      </div>
      {props.editable ? (
        <label class="lbl">
          Oczekiwanie oceniającego
          <textarea class="area" name={`expectation[${props.id}]`} rows={2}>{props.expectation}</textarea>
        </label>
      ) : props.expectation ? (
        <div class="expect">
          <p class="sign">Oczekiwanie oceniającego</p>
          <p>{props.expectation}</p>
        </div>
      ) : null}
    </div>
  );
}

export function Part1View(p: Part1ViewProps) {
  const edit = p.mode === "edit";
  const office = officeSettings();
  const suggested = new Set(p.suggestions.map((s) => s.criterionId));
  const because = new Map(p.suggestions.map((s) => [s.criterionId, s.because]));
  const rest = p.selectable.filter((id) => !suggested.has(id));
  const exp = (id: string) => p.expectations[id] ?? "";
  return (
    <Layout title="Część I oceny" person={p.viewer} today={p.today}>
      <section class="card">
        <h1>Część I oceny: {p.employeeName}</h1>
        <p>
          Arkusz {p.sheet} <LegalBasis basis={p.sheetBasis} />
        </p>
        <p>
          {p.deadline.label}: <b>{formatDate(p.deadline.date)}</b> <LegalBasis basis={p.deadline.basis} />
        </p>
        {p.notice ? <p class="st info">{p.notice}</p> : null}
        {p.errors?.length ? (
          <div class="st bad" role="alert">
            <ul>{p.errors.map((e) => <li>{e}</li>)}</ul>
          </div>
        ) : null}
        {p.links.length ? (
          <ul class="plain-list">
            {p.links.map((l) => <li><a href={l.href}>{l.label}</a></li>)}
          </ul>
        ) : null}
      </section>

      {edit ? (
        <form method="post" action={`/cycles/${p.cycleId}/part1/criteria`}>
          <section class="card sheet">
            <h2>Kryteria obowiązkowe <LegalBasis basis="§ 4" /></h2>
            {p.mandatory.map((m) => <CriterionRow id={m.id} kind="obowiązkowe" expectation={exp(m.id)} editable />)}
            <h2>Kryteria dodatkowe (do 3) <LegalBasis basis="§ 5 ust. 2" /></h2>
            {p.suggestions.length ? (
              <p class="cap">Podpowiedzi z tabeli urzędu „rodzaj obowiązku → kryterium” ({office.label}, nie przepis).</p>
            ) : null}
            {[...p.suggestions.map((s) => s.criterionId), ...rest].map((id) => (
              <CriterionRow
                id={id}
                kind={suggested.has(id) ? "Podpowiedź · ustawienie urzędu" : "do wyboru"}
                extra={because.get(id)}
                expectation={exp(id)}
                editable
                checkbox={{ checked: p.selected.includes(id) }}
              />
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
          <h2>Kryteria obowiązkowe <LegalBasis basis="§ 4" /></h2>
          {p.mandatory.map((m) => <CriterionRow id={m.id} kind="obowiązkowe" expectation={m.expectation ?? ""} editable={false} />)}
          <h2>Kryteria dodatkowe</h2>
          {p.additional.length === 0 ? <p>Brak kryteriów dodatkowych.</p> : null}
          {p.additional.map((m) => <CriterionRow id={m.id} kind="dodatkowe" expectation={m.expectation ?? ""} editable={false} />)}
        </section>
      )}

      {p.state === "submitted" || p.state === "confirmed" ? (
        <section class="card">
          <h2>Potwierdzenie części I</h2>
          <ConfirmationBlock kind="confirmation" {...p.confirmation} />
          {p.canConfirm ? (
            <form method="post" action={`/cycles/${p.cycleId}/part1/confirm`}>
              <button class="btn primary full" type="submit">Potwierdzam rozmowę, kryteria i termin oceny</button>
              <p class="cap">Miejscowość, data i Twoje imię i nazwisko wpiszą się same.</p>
            </form>
          ) : null}
        </section>
      ) : null}
    </Layout>
  );
}

export function OpeningCardView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  card: { title: string; purpose: string };
  basis: string;
  topics: string[];
}) {
  return (
    <Layout title="Karta rozmowy rozpoczynającej" person={props.viewer} today={props.today}>
      <section class="card">
        <h1>{props.card.title}</h1>
        <p>{props.card.purpose}</p>
        <h2>Tematy rozmowy <LegalBasis basis={props.basis} /></h2>
        <ol>{props.topics.map((t) => <li>{t}</li>)}</ol>
        <a class="btn text" href={`/cycles/${props.cycleId}/part1`}>Wróć do części I</a>
      </section>
    </Layout>
  );
}
