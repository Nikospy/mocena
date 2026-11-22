import { GRADES, LEVELS, OUTCOME_LABEL, SHEETS, suggestSheet, type FormErrors, type PersonForm, type PersonRow, type Sort } from "../hr/people";
import type { Person } from "../people";
import { ErrorSummary as SharedErrorSummary, LegalBasis, PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

const SORTS: { id: Sort; label: string }[] = [
  { id: "name", label: "Imię i nazwisko" },
  { id: "deadline", label: "Termin oceny" },
  { id: "unit", label: "Komórka" },
];
const SHEET_LABEL: Record<string, string> = { A: "A: kierownik urzędu", B: "B: kieruje pracownikami", C: "C: pozostali pracownicy" };

export function PeopleListView(props: { viewer: Person; today: string; rows: PersonRow[]; q: string; sort: Sort; saved?: string; deleted?: boolean }) {
  return (
    <Layout title="Pracownicy" person={props.viewer} today={props.today}>
      <PageHeader
        title="Pracownicy"
        lead="Dane, z których system liczy arkusz i termin oceny. Termin pochodzi z przepisów, nie z oceny osoby."
        extra={
          <p class="btns people-add">
            <a class="btn primary" href="/hr/people/new">Dodaj pracownika</a>
            <a class="btn" href="/hr/people/import">Importuj z CSV</a>
          </p>
        }
      />
      {props.deleted ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div><b>Usunięto dane pracownika.</b></div>
        </div>
      ) : null}
      {props.saved ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div><b>Zapisano dane pracownika: {props.saved}.</b></div>
        </div>
      ) : null}
      <section class="card people-list" aria-labelledby="h-people">
        <h2 id="h-people">Pracownicy ({props.rows.length})</h2>
        <form method="get" action="/hr/people" role="search" class="people-find">
          <div class="people-q">
            <label class="lbl" for="q">Szukaj po imieniu, nazwisku albo stanowisku</label>
            <input class="area" type="search" id="q" name="q" value={props.q} />
          </div>
          <div class="people-sort">
            <label class="lbl" for="sort">Kolejność</label>
            <select class="area" id="sort" name="sort">
              {SORTS.map((s) => (
                <option value={s.id} selected={props.sort === s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div class="people-go">
            <button class="btn" type="submit">Pokaż</button>
            {props.q ? <a class="btn text" href={`/hr/people?sort=${props.sort}`}>Pokaż wszystkich</a> : null}
          </div>
        </form>
        {props.rows.length === 0 ? (
          <div class="people-none">
            <p>Nikt nie pasuje do „{props.q}”. Sprawdź pisownię albo pokaż wszystkich pracowników.</p>
            <p><a href={`/hr/people?sort=${props.sort}`}>Pokaż wszystkich</a></p>
          </div>
        ) : (
          <div class="hr-scroll">
            <table class="hr-table people-table" aria-labelledby="h-people">
              <thead>
                <tr>
                  <th scope="col">Imię i nazwisko</th>
                  <th scope="col">Stanowisko</th>
                  <th scope="col">Komórka</th>
                  <th scope="col">Przełożony</th>
                  <th scope="col">Arkusz</th>
                  <th scope="col">Termin oceny</th>
                </tr>
              </thead>
              <tbody>
                {props.rows.map((r) => (
                  <tr class="hr-card">
                    <th scope="row"><a href={`/hr/people/${r.id}/edit`}>{r.name}</a></th>
                    <td data-label="Stanowisko">{r.position || <span class="hr-none">brak</span>}</td>
                    <td data-label="Komórka">{r.unit || <span class="hr-none">brak</span>}</td>
                    <td data-label="Przełożony">{r.supervisor || <span class="hr-none">brak</span>}</td>
                    <td data-label="Arkusz">{r.sheet ?? <span class="hr-none">brak</span>}</td>
                    <td data-label="Termin oceny">
                      {r.deadline ? (
                        <>
                          <b class="tnum">{formatDate(r.deadline.date)}</b>
                          {r.deadline.date < props.today ? <span class="hr-late"> po terminie</span> : null}
                          <LegalBasis basis={r.deadline.basis} />
                        </>
                      ) : (
                        <span class="hr-none">brak cyklu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}

function FieldError(props: { id: string; text?: string }) {
  return props.text ? (
    <p class="hr-err" id={`${props.id}-err`}>
      <span class="vh">Błąd: </span>
      {props.text}
    </p>
  ) : null;
}

/** Atrybuty pola z błędem: aria-invalid i powiązanie z komunikatem pod polem. */
const invalid = (id: string, text?: string) => (text ? { "aria-invalid": "true", "aria-describedby": `${id}-err` } : {});

/** Podsumowanie błędów nad formularzem: wspólny komponent z fundamentu; błąd całego formularza (`form`) idzie jako zdanie bez odnośnika. */
export function ErrorSummary(props: { errors: Record<string, string | undefined> }) {
  const { form, ...fields } = props.errors;
  return <SharedErrorSummary errors={form ? { _form: form, ...fields } : fields} />;
}

function Check(props: { name: string; checked: boolean; label: string; hint?: string }) {
  return (
    <label class="cb">
      <input type="checkbox" name={props.name} value="1" checked={props.checked} />
      <span class="box">
        <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span class="cbt">
        {props.label}
        {props.hint ? <small>{props.hint}</small> : null}
      </span>
    </label>
  );
}

export function PersonFormView(props: {
  viewer: Person;
  today: string;
  action: string;
  title: string;
  values: PersonForm;
  errors: FormErrors;
  supervisors: Person[];
  canSkipCycle?: boolean;
  /** Osoba ma już cykl: data zatrudnienia nie otwiera nowego. */
  hasCycle: boolean;
  hasOpenCycle: boolean;
  personId?: string;
  units?: string[];
}) {
  const v = props.values;
  const e = props.errors;
  const suggested = suggestSheet(v.position_title);
  const editing = !!props.personId;
  return (
    <Layout title={props.title} person={props.viewer} today={props.today}>
      <PageHeader
        context="Pracownicy"
        title={props.title}
        lead={editing ? "Zmiany zapisują się dopiero po kliknięciu „Zapisz dane pracownika”." : "Z tych danych system wyznaczy arkusz i policzy termin pierwszej oceny."}
        linksLabel="Pracownik"
        links={editing ? <a href={`/people/${props.personId}/history`}>Historia ocen</a> : undefined}
      />
      <ErrorSummary errors={e} />
      <form method="post" action={props.action} class="person-form" novalidate>
        <section class="card person-sec" aria-labelledby="h-p-who">
          <h2 id="h-p-who">Stanowisko i podległość</h2>
          <div class="person-field">
            <label class="lbl" for="name">Imię i nazwisko</label>
            <input class="area" type="text" id="name" name="name" value={v.name} autocomplete="off" {...invalid("name", e.name)} />
            <FieldError id="name" text={e.name} />
          </div>
          <div class="person-field">
            <label class="lbl" for="position_title">Stanowisko</label>
            <input class="area" type="text" id="position_title" name="position_title" value={v.position_title} {...invalid("position_title", e.position_title)} />
            <FieldError id="position_title" text={e.position_title} />
          </div>
          <div class="person-field">
            <label class="lbl" for="unit">Komórka organizacyjna</label>
            <select class="area" id="unit" name="unit" {...invalid("unit", e.unit)}>
              <option value="">Wybierz komórkę</option>
              {(props.units ?? []).map((u) => (
                <option value={u} selected={v.unit === u}>{u}</option>
              ))}
            </select>
            <FieldError id="unit" text={e.unit} />
          </div>
          <div class="person-field">
            <label class="lbl" for="sheet">Arkusz</label>
            <p class="hr-hint" id="sheet-hint">Podpowiedź ze stanowiska: arkusz {suggested}. Arkusz A ma kierownik urzędu, B osoba kierująca pracownikami, C pozostali.</p>
            <select class="area" id="sheet" name="sheet" aria-describedby={e.sheet ? "sheet-hint sheet-err" : "sheet-hint"} aria-invalid={e.sheet ? "true" : undefined}>
              <option value="">Według stanowiska ({suggested})</option>
              {SHEETS.map((s) => (
                <option value={s} selected={v.sheet === s}>{SHEET_LABEL[s]}</option>
              ))}
            </select>
            <FieldError id="sheet" text={e.sheet} />
          </div>
          <div class="person-field">
            <label class="lbl" for="supervisor_id">Przełożony (wyznacza oceniającego)</label>
            {props.hasOpenCycle ? <p class="hr-hint" id="supervisor_id-hint">Zmiana przełożonego przy trwającym cyklu prowadzi do ekranu zmiany oceniającego. Kryteria zostają bez zmian.</p> : null}
            <select class="area" id="supervisor_id" name="supervisor_id" aria-describedby={[props.hasOpenCycle ? "supervisor_id-hint" : "", e.supervisor_id ? "supervisor_id-err" : ""].filter(Boolean).join(" ") || undefined} aria-invalid={e.supervisor_id ? "true" : undefined}>
              <option value="">Wybierz osobę</option>
              {props.supervisors.map((p) => (
                <option value={p.id} selected={v.supervisor_id === p.id}>{p.name}</option>
              ))}
            </select>
            <FieldError id="supervisor_id" text={e.supervisor_id} />
          </div>
          <Check name="is_appraiser" checked={v.is_appraiser} label="Kieruje pracownikami i może być przełożonym" />
          {props.canSkipCycle ? (
            <p class="hr-hint">Aby dodać osobę kierującą zespołem bez otwierania jej oceny, zaznacz pole powyżej. Zostaw puste pola przełożonego, daty zatrudnienia i ostatniej oceny.</p>
          ) : null}
        </section>

        <section class="card person-sec" aria-labelledby="h-p-grade">
          <h2 id="h-p-grade">Służba cywilna</h2>
          <Check name="appointed" checked={v.appointed} label="Urzędnik mianowany" />
          <div class="dates">
            <div class="person-field">
              <label class="lbl" for="grade">Stopień służbowy (tylko urzędnik mianowany)</label>
              <select class="area" id="grade" name="grade" {...invalid("grade", e.grade)}>
                <option value="">Brak</option>
                {GRADES.map((g) => (
                  <option value={String(g)} selected={v.grade === String(g)}>{["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"][g]}</option>
                ))}
              </select>
              <FieldError id="grade" text={e.grade} />
            </div>
            <div class="person-field">
              <label class="lbl" for="grade_on">Data przyznania stopnia</label>
              <input class="area" type="date" id="grade_on" name="grade_on" value={v.grade_on} {...invalid("grade_on", e.grade_on)} />
              <FieldError id="grade_on" text={e.grade_on} />
            </div>
          </div>
        </section>

        <section class="card person-sec" aria-labelledby="h-p-dates">
          <h2 id="h-p-dates">Od czego liczyć termin oceny</h2>
          {props.hasCycle ? (
            <p>Pracownik ma już cykl oceny, więc termin liczy się z tego cyklu. Data zatrudnienia nie otwiera nowego.</p>
          ) : (
            <div class="person-field">
              <label class="lbl" for="hired_on">Data zatrudnienia na czas nieokreślony</label>
              <p class="hr-hint" id="hired_on-hint">Wystarczy ona albo data ostatniej oceny niżej. Od jednej z nich system liczy termin.</p>
              <input class="area" type="date" id="hired_on" name="hired_on" value={v.hired_on} aria-describedby={e.hired_on ? "hired_on-hint hired_on-err" : "hired_on-hint"} aria-invalid={e.hired_on ? "true" : undefined} />
              <FieldError id="hired_on" text={e.hired_on} />
            </div>
          )}
          <fieldset class="person-prev">
            <legend><h3>Ocena sprzed systemu</h3></legend>
            <p>Ostatnia ocena wystawiona poza systemem. Trafia do historii ocen i wyznacza początek okresu, od którego liczy się termin.</p>
            <div class="dates">
              <div class="person-field">
                <label class="lbl" for="prev_on">Data oceny</label>
                <input class="area" type="date" id="prev_on" name="prev_on" value={v.prev_on} {...invalid("prev_on", e.prev_on)} />
                <FieldError id="prev_on" text={e.prev_on} />
              </div>
              <div class="person-field">
                <label class="lbl" for="prev_outcome">Wynik</label>
                <select class="area" id="prev_outcome" name="prev_outcome" {...invalid("prev_outcome", e.prev_outcome)}>
                  <option value="">Wybierz wynik</option>
                  <option value="positive" selected={v.prev_outcome === "positive"}>{OUTCOME_LABEL.positive}</option>
                  <option value="negative" selected={v.prev_outcome === "negative"}>{OUTCOME_LABEL.negative}</option>
                </select>
                <FieldError id="prev_outcome" text={e.prev_outcome} />
              </div>
            </div>
            <div class="person-field">
              <label class="lbl" for="prev_level">Poziom ogólny (jeśli znany)</label>
              <select class="area" id="prev_level" name="prev_level" {...invalid("prev_level", e.prev_level)}>
                <option value="">Bez poziomu</option>
                {LEVELS.map((l) => (
                  <option value={l} selected={v.prev_level === l}>{l}</option>
                ))}
              </select>
              <FieldError id="prev_level" text={e.prev_level} />
            </div>
          </fieldset>
        </section>

        <div class="person-actions">
          <button class="btn primary" type="submit">Zapisz dane pracownika</button>
          <a class="btn text" href="/hr/people">Wróć do listy pracowników</a>
        </div>
      </form>
      {props.personId && props.viewer.role === "hr" ? (
        <section class="person-danger" aria-labelledby="h-p-del">
          <h2 id="h-p-del">Usuwanie danych</h2>
          <p>Usuwa kartotekę, oceny i notatki tej osoby. Przed usunięciem system pokaże, czego nie da się odzyskać.</p>
          <p><a href={`/hr/people/${props.personId}/delete`}>Usuń dane pracownika</a></p>
        </section>
      ) : null}
    </Layout>
  );
}
