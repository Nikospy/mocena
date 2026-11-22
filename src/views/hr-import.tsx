import type { ImportPlan } from "../hr/csv-import";
import type { Person } from "../people";
import { Layout } from "./layout";

const STATUS = { ok: "do zapisu", skip: "pominięta", error: "błąd" } as const;

/** Import pracowników z CSV: wczytanie, podgląd z wynikiem sprawdzenia każdego wiersza, zapis dopiero po kliknięciu. */
export function ImportView(props: { viewer: Person; today: string; csv: string; plan?: ImportPlan; imported?: number; header: string[] }) {
  const p = props.plan;
  const ok = p ? p.rows.filter((r) => r.status === "ok").length : 0;
  return (
    <Layout title="Import pracowników z CSV" person={props.viewer} today={props.today}>
      <section class="card form-card">
        <h1>Import pracowników z CSV</h1>
        <p class="cap">Układ kolumn jest taki sam jak w eksporcie zestawienia: {props.header.join("; ")}. Kolumny stanu i terminów system pomija, bo termin liczy sam. Osoby już wpisane w kartotece są pomijane.</p>
        {props.imported !== undefined ? (
          <p class="st ok" role="status">Zapisano osoby: {props.imported}. Są na liście pracowników.</p>
        ) : null}
        <form method="post" action="/hr/people/import" enctype="multipart/form-data">
          <label class="lbl" for="file">Plik CSV</label>
          <input class="area" type="file" id="file" name="file" accept=".csv,text/csv" />
          <label class="lbl" for="csv">albo wklej zawartość pliku</label>
          <textarea class="area" id="csv" name="csv" rows={6}>{props.csv}</textarea>
          <button class="btn primary full" type="submit">Sprawdź plik</button>
        </form>
      </section>
      {p ? (
        <section class="card" aria-labelledby="h-plan">
          <h2 id="h-plan">Wynik sprawdzenia</h2>
          {p.error ? (
            <p class="st bad" role="alert">{p.error}</p>
          ) : (
            <>
              <ul class="plain-list">
                {p.rows.map((r) => (
                  <li>
                    <b>Wiersz {r.line}: {r.name || "(bez nazwiska)"}</b> <span class="cap">{STATUS[r.status]}</span>
                    {r.messages.length ? <p class="cap">{r.messages.join(" ")}</p> : null}
                  </li>
                ))}
              </ul>
              {ok > 0 ? (
                <form method="post" action="/hr/people/import">
                  <input type="hidden" name="csv" value={props.csv} />
                  <input type="hidden" name="confirm" value="1" />
                  <button class="btn primary" type="submit">Zapisz osoby do zapisu: {ok}</button>
                </form>
              ) : (
                <p class="cap">Nie ma wierszy do zapisu.</p>
              )}
            </>
          )}
        </section>
      ) : null}
      <p><a class="btn text" href="/hr/people">Wróć do listy pracowników</a></p>
    </Layout>
  );
}
