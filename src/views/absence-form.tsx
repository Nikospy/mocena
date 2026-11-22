import type { Absence } from "../cycles";
import { ErrorSummary, FieldError, PageHeader, invalid } from "./components";
import type { Person } from "../people";
import { Layout, formatDate, formatDateLong } from "./layout";

export type AbsenceFormValues = { from: string; to: string; excused: boolean };

export function AbsenceFormView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  personName: string;
  values: AbsenceFormValues;
  errors?: Partial<Record<"from" | "to", string>>;
  absences: Absence[];
}) {
  const v = props.values;
  const e = props.errors ?? {};
  return (
    <Layout title={`Nieobecność: ${props.personName}`} person={props.viewer} today={props.today}>
      <PageHeader title={<>Wpisz nieobecność: {props.personName}</>} lead="System zapisuje tylko daty. Rodzaju nieobecności nie podajesz." links={<a href={`/cycles/${props.cycleId}/timeline`}>Oś czasu</a>} />
      <div class="o-grid">
      <div class="o-main">
      <section class="card form-card ct-form">
        <form method="post" action={`/cycles/${props.cycleId}/absences`} class="abs-form">
          <ErrorSummary errors={{ from: e.from, to: e.to }} />
          <div class="dates">
            <div class="field">
              <label class="lbl" for="from">Od</label>
              <FieldError id="from" errors={e} />
              <input class="area" type="date" id="from" name="from" value={v.from} {...invalid("from", e, "from-words")} />
              <p class="date-words" id="from-words" data-date-words-for="from">{v.from ? formatDateLong(v.from) : ""}</p>
            </div>
            <div class="field">
              <label class="lbl" for="to">Do</label>
              <FieldError id="to" errors={e} />
              <input class="area" type="date" id="to" name="to" value={v.to} {...invalid("to", e, "to-words")} />
              <p class="date-words" id="to-words" data-date-words-for="to">{v.to ? formatDateLong(v.to) : ""}</p>
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
      </aside>
      </div>
      <script src="/date-words.js" defer></script>
    </Layout>
  );
}
