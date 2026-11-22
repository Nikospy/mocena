import type { Person } from "../people";
import { PageHeader } from "./components";
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
  return (
    <Layout title="Zastępstwa" person={props.viewer} today={props.today}>
      <PageHeader title="Zastępstwa oceniających" lead="W czasie zastępstwa osoba zastępująca widzi zespół nieobecnego i prowadzi czynności oceniającego." />
      <section class="hint">
        <p class="voice hint-v">Podpowiedź · poradnik KPRM</p>
        <p>To praktyka z poradnika KPRM, nie przepis.</p>
      </section>
      {props.saved ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div><b>Zastępstwo zapisane.</b></div>
        </div>
      ) : null}
      <section class="card form-card">
        <h2>Ustaw zastępstwo</h2>
        <form method="post" action="/hr/substitutions" class="abs-form">
          <div>
            <label class="lbl" for="absent_id">Kto jest nieobecny (oceniający)</label>
            <select class="area" id="absent_id" name="absent_id" aria-invalid={e.absent_id ? "true" : undefined}>
              <option value="">Wybierz osobę</option>
              {props.appraisers.map((p) => (
                <option value={p.id} selected={v.absent_id === p.id}>{p.name}</option>
              ))}
            </select>
            {e.absent_id ? <p class="st bad" role="alert">{e.absent_id}</p> : null}
          </div>
          <div>
            <label class="lbl" for="substitute_id">Kto zastępuje</label>
            <select class="area" id="substitute_id" name="substitute_id" aria-invalid={e.substitute_id ? "true" : undefined}>
              <option value="">Wybierz osobę</option>
              {props.appraisers.filter((p) => p.has_account === 1).map((p) => (
                <option value={p.id} selected={v.substitute_id === p.id}>{p.name}</option>
              ))}
            </select>
            {e.substitute_id ? <p class="st bad" role="alert">{e.substitute_id}</p> : null}
          </div>
          <div class="dates">
            <div>
              <label class="lbl" for="date_from">Od</label>
              <input class="area" type="date" id="date_from" name="date_from" value={v.date_from} aria-invalid={e.date_from ? "true" : undefined} />
              {e.date_from ? <p class="st bad" role="alert">{e.date_from}</p> : null}
            </div>
            <div>
              <label class="lbl" for="date_to">Do</label>
              <input class="area" type="date" id="date_to" name="date_to" value={v.date_to} aria-invalid={e.date_to ? "true" : undefined} />
              {e.date_to ? <p class="st bad" role="alert">{e.date_to}</p> : null}
            </div>
          </div>
          <button class="btn primary full" type="submit">Zapisz zastępstwo</button>
        </form>
      </section>
      <section class="card" aria-labelledby="h-subs">
        <h2 id="h-subs">Trwające i przyszłe zastępstwa</h2>
        {props.list.length === 0 ? (
          <p class="cap">Nie ma trwających ani przyszłych zastępstw.</p>
        ) : (
          <ul class="plain-list">
            {props.list.map((s) => (
              <li class="abs-row">
                <span class="d">
                  {props.nameOf(s.substitute_id)} za {props.nameOf(s.absent_id)}
                </span>{" "}
                <span class="cap">
                  {formatDate(s.date_from)}–{formatDate(s.date_to)} · {s.date_from <= props.today ? "trwa" : "zaczyna się później"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}
