import type { Person } from "../people";
import { PageHeader } from "./components";
import { ErrorSummary } from "./hr-people";
import type { Substitution } from "../substitutions";
import { Layout, formatDate } from "./layout";

export type SubstitutionValues = { absent_id: string; substitute_id: string; date_from: string; date_to: string };

export function SubstitutionsView(props: {
  viewer: Person;
  today: string;
  appraisers: Person[];
  values: SubstitutionValues;
  errors?: Partial<Record<keyof SubstitutionValues, string>>;
  list: Substitution[];
  nameOf: (id: string) => string;
  saved?: boolean;
}) {
  const v = props.values;
  const e = props.errors ?? {};
  const inv = (id: keyof SubstitutionValues) => (e[id] ? { "aria-invalid": "true", "aria-describedby": `${id}-err` } : {});
  const err = (id: keyof SubstitutionValues) =>
    e[id] ? (
      <p class="hr-err" id={`${id}-err`}>
        <span class="vh">Błąd: </span>
        {e[id]}
      </p>
    ) : null;
  return (
    <Layout title="Zastępstwa" person={props.viewer} today={props.today}>
      <PageHeader title="Zastępstwa oceniających" lead="W czasie zastępstwa osoba zastępująca widzi zespół nieobecnego i prowadzi czynności oceniającego." />
      {props.saved ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div><b>Zastępstwo zapisane.</b> Jest na liście trwających i przyszłych zastępstw.</div>
        </div>
      ) : null}
      <ErrorSummary errors={e} />
      <div class="o-grid subs-grid">
        <div class="o-main">
          <section class="card subs-form" aria-labelledby="h-subs-new">
            <h2 id="h-subs-new">Ustaw zastępstwo</h2>
            <form method="post" action="/hr/substitutions" class="person-form" novalidate>
              <div class="person-field">
                <label class="lbl" for="absent_id">Nieobecny oceniający</label>
                <select class="area" id="absent_id" name="absent_id" {...inv("absent_id")}>
                  <option value="">Wybierz osobę</option>
                  {props.appraisers.map((p) => (
                    <option value={p.id} selected={v.absent_id === p.id}>{p.name}</option>
                  ))}
                </select>
                {err("absent_id")}
              </div>
              <div class="person-field">
                <label class="lbl" for="substitute_id">Osoba zastępująca</label>
                <select class="area" id="substitute_id" name="substitute_id" {...inv("substitute_id")}>
                  <option value="">Wybierz osobę</option>
                  {props.appraisers.filter((p) => p.has_account === 1).map((p) => (
                    <option value={p.id} selected={v.substitute_id === p.id}>{p.name}</option>
                  ))}
                </select>
                {err("substitute_id")}
              </div>
              <div class="dates subs-dates">
                <div class="person-field">
                  <label class="lbl" for="date_from">Od</label>
                  <input class="area" type="date" id="date_from" name="date_from" value={v.date_from} {...inv("date_from")} />
                  {err("date_from")}
                </div>
                <div class="person-field">
                  <label class="lbl" for="date_to">Do</label>
                  <input class="area" type="date" id="date_to" name="date_to" value={v.date_to} {...inv("date_to")} />
                  {err("date_to")}
                </div>
              </div>
              <div class="person-actions">
                <button class="btn primary" type="submit">Zapisz zastępstwo</button>
              </div>
            </form>
          </section>
        </div>
        <aside class="side subs-side" aria-label="Zastępstwa i podstawa">
          <section class="card" aria-labelledby="h-subs">
            <h2 id="h-subs">Trwające i przyszłe zastępstwa</h2>
            {props.list.length === 0 ? (
              <p>Nie ma trwających ani przyszłych zastępstw.</p>
            ) : (
              <ul class="subs-list">
                {props.list.map((s) => (
                  <li>
                    <p>
                      Nieobecny oceniający: <b>{props.nameOf(s.absent_id)}</b>
                    </p>
                    <p>
                      Zastępuje: <b>{props.nameOf(s.substitute_id)}</b>
                    </p>
                    <p class="cap">
                      <span class="tnum">{formatDate(s.date_from)}–{formatDate(s.date_to)}</span> · {s.date_from <= props.today ? "trwa" : "zaczyna się później"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p class="subs-src">
            Zastępstwa to praktyka z poradnika Kancelarii Prezesa Rady Ministrów (KPRM), nie przepis.
          </p>
        </aside>
      </div>
    </Layout>
  );
}
