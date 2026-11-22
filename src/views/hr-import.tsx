import type { ImportPlan } from "../hr/csv-import";
import type { Person } from "../people";
import { PageHeader } from "./components";
import { Layout } from "./layout";

const STATUS = { ok: "do zapisu", skip: "pominięta", error: "błąd" } as const;

/** Import pracowników z CSV: wczytanie, podgląd z wynikiem sprawdzenia każdego wiersza, zapis dopiero po kliknięciu. */
export function ImportView(props: { viewer: Person; today: string; csv: string; plan?: ImportPlan; imported?: number; header: string[] }) {
  const p = props.plan;
  const ok = p ? p.rows.filter((r) => r.status === "ok").length : 0;
  const counts = p ? { ok, skip: p.rows.filter((r) => r.status === "skip").length, error: p.rows.filter((r) => r.status === "error").length } : null;
  return (
    <Layout title="Import pracowników z CSV" person={props.viewer} today={props.today}>
      <PageHeader
        context="Pracownicy"
        title="Import pracowników z CSV"
        lead="Najpierw sprawdzasz plik, potem zapisujesz osoby. Nic nie zapisuje się bez kliknięcia."
        linksLabel="Pracownicy"
        links={<a href="/hr/people">Wróć do listy pracowników</a>}
      />
      {props.imported !== undefined ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div><b>Zapisano osoby: {props.imported}.</b> Są na liście pracowników.</div>
        </div>
      ) : null}
      <div class="o-grid imp-grid">
        <div class="o-main">
          <section class="card imp-form" aria-labelledby="h-imp">
            <h2 id="h-imp">1. Wczytaj plik</h2>
            <form method="post" action="/hr/people/import" enctype="multipart/form-data" class="person-form">
              <div class="person-field">
                <label class="lbl" for="file">Plik CSV</label>
                <input class="area imp-file" type="file" id="file" name="file" accept=".csv,text/csv" />
              </div>
              <div class="person-field">
                <label class="lbl" for="csv">Albo wklej zawartość pliku</label>
                <textarea class="area" id="csv" name="csv" rows={6} aria-invalid={p?.error ? "true" : undefined} aria-describedby={p?.error ? "csv-err" : undefined}>{props.csv}</textarea>
                {p?.error ? (
                  <p class="hr-err" id="csv-err"><span class="vh">Błąd: </span>{p.error}</p>
                ) : null}
              </div>
              <div class="person-actions">
                <button class={`btn${p && ok > 0 ? "" : " primary"}`} type="submit">Sprawdź plik</button>
              </div>
            </form>
          </section>
        </div>
        <aside class="side" aria-labelledby="h-imp-cols">
          <section class="card imp-cols">
            <h2 id="h-imp-cols">Układ kolumn</h2>
            <p>Taki sam jak w eksporcie zestawienia z ekranu „Stan cykli”, kolumny oddzielone średnikiem:</p>
            <ul class="imp-colnames">{props.header.map((h) => <li>{h}</li>)}</ul>
            <p class="hr-hint">Kolumny stanu i terminów system pomija, bo termin liczy sam. Osoby już wpisane w kartotece są pomijane.</p>
          </section>
        </aside>
      </div>
      {p && !p.error ? (
        <section class="card imp-plan" aria-labelledby="h-plan">
          <h2 id="h-plan">2. Wynik sprawdzenia</h2>
          {counts ? (
            <p>
              Do zapisu: <b class="tnum">{counts.ok}</b> · pominięte: <b class="tnum">{counts.skip}</b> · z błędem: <b class="tnum">{counts.error}</b>
            </p>
          ) : null}
          <ul class="imp-rows">
            {p.rows.map((r) => (
              <li class={`imp-row ${r.status}`}>
                <div>
                  <b>Wiersz {r.line}: {r.name || "(bez nazwiska)"}</b>
                  {r.messages.length ? <p>{r.messages.join(" ")}</p> : null}
                </div>
                <span class="imp-st">{STATUS[r.status]}</span>
              </li>
            ))}
          </ul>
          {ok > 0 ? (
            <form method="post" action="/hr/people/import" class="person-actions">
              <input type="hidden" name="csv" value={props.csv} />
              <input type="hidden" name="confirm" value="1" />
              <button class="btn primary" type="submit">Zapisz osoby do zapisu: {ok}</button>
              <span class="hr-hint">Wiersze pominięte i z błędem nie trafią do kartoteki.</span>
            </form>
          ) : (
            <p>Nie ma wierszy do zapisu. Popraw plik i sprawdź go ponownie.</p>
          )}
        </section>
      ) : null}
    </Layout>
  );
}
