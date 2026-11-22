import { GRADES, LEVELS, OUTCOME_LABEL, SHEETS, suggestSheet, type FormErrors, type PersonForm, type PersonRow, type Sort } from "../hr/people";
import type { Person } from "../people";
import { LegalBasis } from "./components";
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
      <section class="card hdr slim">
        <h1>Pracownicy</h1>
        <p class="cap">Dane, z których system liczy arkusz i termin oceny. Termin pochodzi z przepisów, nie z oceny osoby.</p>
      </section>
      {props.deleted ? <p class="st ok" role="status">Usunięto dane pracownika.</p> : null}
      {props.saved ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div><b>Zapisano dane: {props.saved}.</b></div>
        </div>
      ) : null}
      <section class="card people-tools">
        <form method="get" action="/hr/people" role="search" class="abs-form">
          <div>
            <label class="lbl" for="q">Szukaj po imieniu, nazwisku albo stanowisku</label>
            <input class="area" type="search" id="q" name="q" value={props.q} />
          </div>
          <input type="hidden" name="sort" value={props.sort} />
          <div class="hr-actions">
            <button class="btn primary" type="submit">Szukaj</button>
            {props.q ? <a class="btn" href={`/hr/people?sort=${props.sort}`}>Pokaż wszystkich</a> : null}
            <a class="btn" href="/hr/people/new">Dodaj pracownika</a>
          </div>
        </form>
        <nav class="hr-links" aria-label="Sortowanie">
          <span class="cap">Sortuj:</span>
          {SORTS.map((s) => (
            <a class="btn link-chip" href={`/hr/people?sort=${s.id}${props.q ? `&q=${encodeURIComponent(props.q)}` : ""}`} aria-current={props.sort === s.id ? "true" : undefined}>
              {s.label}
            </a>
          ))}
        </nav>
      </section>
      <section class="card">
        <h2>Lista ({props.rows.length})</h2>
        {props.rows.length === 0 ? (
          <p class="cap">Nikt nie pasuje do wyszukiwania.</p>
        ) : (
          <div class="hr-scroll">
            <table class="hr-table people-table">
              <thead>
                <tr>
                  <th scope="col">Imię i nazwisko</th>
                  <th scope="col">Stanowisko</th>
                  <th scope="col">Komórka</th>
                  <th scope="col">Przełożony</th>
                  <th scope="col">Arkusz</th>
                  <th scope="col">Termin najbliższej oceny</th>
                  <th scope="col">Działania</th>
                </tr>
              </thead>
              <tbody>
                {props.rows.map((r) => (
                  <tr class="hr-card">
                    <th scope="row">{r.name}</th>
                    <td data-label="Stanowisko">{r.position || "—"}</td>
                    <td data-label="Komórka">{r.unit || "—"}</td>
                    <td data-label="Przełożony">{r.supervisor || "—"}</td>
                    <td data-label="Arkusz">{r.sheet ?? "—"}</td>
                    <td data-label="Termin najbliższej oceny">
                      {r.deadline ? (
                        <>
                          <span class={`due-pill${r.deadline.date < props.today ? " late" : ""}`}>{formatDate(r.deadline.date)}</span> <LegalBasis basis={r.deadline.basis} />
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td data-label="Działania">
                      <div class="hr-links">
                        <a class="btn link-chip" href={`/hr/people/${r.id}/edit`}>Edytuj</a>
                        <a class="btn link-chip" href={`/people/${r.id}/history`}>Historia ocen</a>
                      </div>
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

function FieldError(props: { text?: string }) {
  return props.text ? <p class="st bad" role="alert">{props.text}</p> : null;
}

function Check(props: { name: string; checked: boolean; label: string }) {
  return (
    <label class="cb">
      <input type="checkbox" name={props.name} value="1" checked={props.checked} />
      <span class="box">
        <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span class="cbt">{props.label}</span>
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
  /** Osoba ma już cykl: data zatrudnienia nie otwiera nowego. */
  hasCycle: boolean;
  hasOpenCycle: boolean;
  personId?: string;
}) {
  const v = props.values;
  const e = props.errors;
  const suggested = suggestSheet(v.position_title);
  return (
    <Layout title={props.title} person={props.viewer} today={props.today}>
      <section class="card form-card">
        <h1>{props.title}</h1>
        {e.form ? <p class="st bad" role="alert">{e.form}</p> : null}
        <form method="post" action={props.action} class="abs-form">
          <div>
            <label class="lbl" for="name">Imię i nazwisko</label>
            <input class="area" type="text" id="name" name="name" value={v.name} aria-invalid={e.name ? "true" : undefined} />
            <FieldError text={e.name} />
          </div>
          <div>
            <label class="lbl" for="position_title">Stanowisko</label>
            <input class="area" type="text" id="position_title" name="position_title" value={v.position_title} aria-invalid={e.position_title ? "true" : undefined} />
            <FieldError text={e.position_title} />
          </div>
          <div>
            <label class="lbl" for="unit">Komórka organizacyjna</label>
            <input class="area" type="text" id="unit" name="unit" value={v.unit} aria-invalid={e.unit ? "true" : undefined} />
            <FieldError text={e.unit} />
          </div>
          <div>
            <label class="lbl" for="sheet">Typ arkusza</label>
            <select class="area" id="sheet" name="sheet" aria-invalid={e.sheet ? "true" : undefined}>
              <option value="">Według stanowiska ({suggested})</option>
              {SHEETS.map((s) => (
                <option value={s} selected={v.sheet === s}>{SHEET_LABEL[s]}</option>
              ))}
            </select>
            <p class="cap">Podpowiedź ze stanowiska: {suggested}. Możesz ją zmienić. Arkusz A ma kierownik urzędu, B osoba kierująca pracownikami, C pozostali.</p>
            <FieldError text={e.sheet} />
          </div>
          <div>
            <label class="lbl" for="supervisor_id">Przełożony (wyznacza oceniającego)</label>
            <select class="area" id="supervisor_id" name="supervisor_id" aria-invalid={e.supervisor_id ? "true" : undefined}>
              <option value="">Wybierz osobę</option>
              {props.supervisors.map((p) => (
                <option value={p.id} selected={v.supervisor_id === p.id}>{p.name}</option>
              ))}
            </select>
            {props.hasOpenCycle ? <p class="cap">Zmiana przełożonego przy trwającym cyklu prowadzi do ekranu zmiany oceniającego. Kryteria zostają bez zmian.</p> : null}
            <FieldError text={e.supervisor_id} />
          </div>
          <Check name="is_appraiser" checked={v.is_appraiser} label="Kieruje pracownikami i może być przełożonym" />
          <Check name="appointed" checked={v.appointed} label="Urzędnik służby cywilnej (mianowany)" />
          <div class="dates">
            <div>
              <label class="lbl" for="grade">Stopień służbowy (urzędnicy)</label>
              <select class="area" id="grade" name="grade" aria-invalid={e.grade ? "true" : undefined}>
                <option value="">Brak</option>
                {GRADES.map((g) => (
                  <option value={String(g)} selected={v.grade === String(g)}>{["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"][g]}</option>
                ))}
              </select>
              <FieldError text={e.grade} />
            </div>
            <div>
              <label class="lbl" for="grade_on">Data przyznania stopnia</label>
              <input class="area" type="date" id="grade_on" name="grade_on" value={v.grade_on} aria-invalid={e.grade_on ? "true" : undefined} />
              <FieldError text={e.grade_on} />
            </div>
          </div>
          {props.hasCycle ? null : (
            <div>
              <label class="lbl" for="hired_on">Data zatrudnienia na czas nieokreślony</label>
              <input class="area" type="date" id="hired_on" name="hired_on" value={v.hired_on} aria-invalid={e.hired_on ? "true" : undefined} />
              <p class="cap">Wystarczy ona albo data ostatniej oceny niżej. Od jednej z nich system liczy termin.</p>
              <FieldError text={e.hired_on} />
            </div>
          )}
          <fieldset class="rule crit-keep">
            <legend class="lbl">Ocena sprzed systemu</legend>
            <p>Ostatnia ocena wystawiona poza systemem. Trafia do historii ocen i wyznacza początek okresu, od którego liczy się termin.</p>
            <div class="dates">
              <div>
                <label class="lbl" for="prev_on">Data oceny</label>
                <input class="area" type="date" id="prev_on" name="prev_on" value={v.prev_on} aria-invalid={e.prev_on ? "true" : undefined} />
                <FieldError text={e.prev_on} />
              </div>
              <div>
                <label class="lbl" for="prev_outcome">Wynik</label>
                <select class="area" id="prev_outcome" name="prev_outcome" aria-invalid={e.prev_outcome ? "true" : undefined}>
                  <option value="">Wybierz wynik</option>
                  <option value="positive" selected={v.prev_outcome === "positive"}>{OUTCOME_LABEL.positive}</option>
                  <option value="negative" selected={v.prev_outcome === "negative"}>{OUTCOME_LABEL.negative}</option>
                </select>
                <FieldError text={e.prev_outcome} />
              </div>
            </div>
            <div>
              <label class="lbl" for="prev_level">Poziom ogólny (jeśli znany)</label>
              <select class="area" id="prev_level" name="prev_level" aria-invalid={e.prev_level ? "true" : undefined}>
                <option value="">Bez poziomu</option>
                {LEVELS.map((l) => (
                  <option value={l} selected={v.prev_level === l}>{l}</option>
                ))}
              </select>
              <FieldError text={e.prev_level} />
            </div>
          </fieldset>
          <button class="btn primary full" type="submit">Zapisz</button>
          <p>
            <a class="btn link-chip" href="/hr/people">Wróć do listy</a>
            {props.personId ? <a class="btn link-chip" href={`/people/${props.personId}/history`}>Historia ocen</a> : null}
            {props.personId && props.viewer.role === "hr" ? <a class="btn link-chip" href={`/hr/people/${props.personId}/delete`}>Usuń dane pracownika</a> : null}
          </p>
        </form>
      </section>
    </Layout>
  );
}
