import type { Absence } from "../cycles";
import type { Person } from "../people";
import { Layout, formatDate } from "./layout";

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
      <section class="card">
        <h1>Wpisz nieobecność: {props.personName}</h1>
        <p class="cap">System zapisuje tylko daty. Rodzaju nieobecności nie podajesz.</p>
        <form method="post" action={`/cycles/${props.cycleId}/absences`} class="abs-form">
          <div class="dates">
            <div>
              <label class="lbl" for="from">Od</label>
              <input class="area" type="date" id="from" name="from" value={v.from} aria-invalid={e.from ? "true" : undefined} />
              {e.from ? <p class="st bad" role="alert">{e.from}</p> : null}
            </div>
            <div>
              <label class="lbl" for="to">Do</label>
              <input class="area" type="date" id="to" name="to" value={v.to} aria-invalid={e.to ? "true" : undefined} />
              {e.to ? <p class="st bad" role="alert">{e.to}</p> : null}
            </div>
          </div>
          <label class="cb">
            <input type="checkbox" name="excused" value="1" checked={v.excused} />
            <span class="box">
              <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <span>Nieobecność usprawiedliwiona</span>
          </label>
          <button class="btn primary" type="submit">
            Zapisz nieobecność
          </button>
        </form>
      </section>
      <section class="card" aria-labelledby="h-abs">
        <h2 id="h-abs">Wpisane nieobecności</h2>
        {props.absences.length === 0 ? (
          <p class="cap">Nie wpisano jeszcze żadnej nieobecności.</p>
        ) : (
          <ul class="plain-list">
            {props.absences.map((a) => (
              <li>
                {formatDate(a.date_from)}–{formatDate(a.date_to)}, {a.excused === 1 ? "usprawiedliwiona" : "nieusprawiedliwiona"}
              </li>
            ))}
          </ul>
        )}
        <p>
          <a class="btn text" href={`/cycles/${props.cycleId}/timeline`}>
            Oś czasu
          </a>
        </p>
      </section>
    </Layout>
  );
}
