import type { Absence } from "../cycles";
import { DateFormatHint, DateInput, ErrorSummary, FieldError, LegalBasis, PageHeader, invalid } from "./components";
import { isIsoDate } from "../date-input";
import type { Person } from "../people";
import { Layout, formatDate, formatDateLong } from "./layout";

export type AbsenceSummary = {
  merged: { from: string; to: string; days: number; parts: number; counted: boolean; longerThanMonth: boolean }[];
  afterNegative: boolean;
  deadline: string;
  /** Termin przed przedłużeniem; null, gdy nieobecności go nie zmieniły. */
  previous: string | null;
  extensionDays: number;
  basis: string[];
};

const dni = (n: number) => (n === 1 ? "1 dzień" : `${n} dni`);

function mergedSentence(m: AbsenceSummary["merged"][number], afterNegative: boolean): string {
  const range = `${formatDate(m.from)}–${formatDate(m.to)}, ${dni(m.days)}`;
  const head = m.parts > 1 ? `Liczone jako jedna: ${range}, bo dzielą je tylko dni wolne.` : `${range}.`;
  if (afterNegative) return `${head} Nie przedłuża terminu ponownej oceny.`;
  if (m.counted) return `${head} Dłużej niż miesiąc: termin oceny przedłuża się o ${dni(m.days)}.`;
  if (m.longerThanMonth) return `${head} Dłużej niż miesiąc, ale poza okresem, który zmienia termin.`;
  return `${head} Nie dłużej niż miesiąc: termin bez zmian.`;
}

export type AbsenceFormValues = { from: string; to: string; excused: boolean };

export function AbsenceFormView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  personName: string;
  values: AbsenceFormValues;
  errors?: Partial<Record<"from" | "to", string>>;
  absences: Absence[];
  summary?: AbsenceSummary | null;
}) {
  const sum = props.summary;
  const v = props.values;
  const e = props.errors ?? {};
  return (
    <Layout title={`Nieobecność: ${props.personName}`} person={props.viewer} today={props.today}>
      <PageHeader title={<>Wpisz nieobecność: {props.personName}</>} lead="System zapisuje tylko daty. Rodzaju nieobecności nie podajesz." links={<a href={`/cycles/${props.cycleId}/timeline`}>Oś czasu</a>} />
      <div class="o-grid">
      <div class="o-main">
      <section class="card form-card ct-form">
        <form method="post" action={`/cycles/${props.cycleId}/absences`} class="abs-form">
          <ErrorSummary
            errors={{ from: e.from, to: e.to }}
            lead={
              e.from && v.from > props.today ? (
                <>Przewidywaną nieobecność załatwia oceniający przez <a href={`/cycles/${props.cycleId}/deadline-change`}>zmianę terminu oceny</a> (art. 81 ust. 8 pkt 2 ustawy).</>
              ) : undefined
            }
          />
          <div class="dates">
            <div class="field">
              <label class="lbl" for="from">Od<DateFormatHint /></label>
              <FieldError id="from" errors={e} />
              <DateInput id="from" value={v.from} {...invalid("from", e, "from-words")} />
              <p class="date-words" id="from-words" data-date-words-for="from">{isIsoDate(v.from) ? formatDateLong(v.from) : ""}</p>
            </div>
            <div class="field">
              <label class="lbl" for="to">Do<DateFormatHint /></label>
              <FieldError id="to" errors={e} />
              <DateInput id="to" value={v.to} {...invalid("to", e, "to-words")} />
              <p class="date-words" id="to-words" data-date-words-for="to">{isIsoDate(v.to) ? formatDateLong(v.to) : ""}</p>
            </div>
          </div>
          <label class="cb">
            <input type="checkbox" name="excused" value="1" checked={v.excused} />
            <span class="box">
              <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <span class="cbt">Nieobecność usprawiedliwiona</span>
          </label>
          <p class="ct-actions">
            <button class="btn primary" type="submit">
              Zapisz nieobecność
            </button>
          </p>
        </form>
      </section>
      </div>
      <aside class="side ct-side" aria-labelledby="h-abs">
        <h2 id="h-abs" class="ct-side-h">Wpisane nieobecności</h2>
        {props.absences.length === 0 ? (
          <p>Nie wpisano jeszcze żadnej nieobecności.</p>
        ) : (
          <ul class="plain-list">
            {props.absences.map((a) => (
              <li class="abs-row">
                <span class="d">
                  {formatDate(a.date_from)}–{formatDate(a.date_to)}
                </span>
                <span>{a.excused === 1 ? "usprawiedliwiona" : "nieusprawiedliwiona"}</span>
              </li>
            ))}
          </ul>
        )}
        {sum ? (
          <>
            <ul class="plain-list abs-merged">
              {sum.merged.map((m) => (
                <li class="st info">{mergedSentence(m, sum.afterNegative)}</li>
              ))}
            </ul>
            <section class="rule abs-sum" aria-labelledby="h-abs-term">
              <p class="voice rule-v" id="h-abs-term">Reguła · {sum.previous ? "Nowy termin oceny" : sum.afterNegative ? "Termin ponownej oceny" : "Termin oceny"}</p>
              <p class="term-date">
                {sum.previous ? <s class="old">{formatDate(sum.previous)}</s> : null}
                <b class="big">{formatDate(sum.deadline)}</b> <LegalBasis basis={sum.basis.map((b) => b.split(":")[0])} />
              </p>
              <p><a href={`/cycles/${props.cycleId}/timeline`}>Zobacz na osi czasu</a></p>
            </section>
          </>
        ) : null}
      </aside>
      </div>
      <script src="/date-words.js" defer></script>
    </Layout>
  );
}
