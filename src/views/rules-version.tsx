import type { RulePackDiff, RuleVersionEntry } from "../engine/rule-pack";
import { rulesVersionLabel, type RulePack } from "../engine/rules";
import type { Person } from "../people";
import { PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

export type RulesInfo = { version: string; effectiveFrom: string; act: string; publisher: string; status: string; url: string; file: string | null };
export type RulesPreview = { pack: RulePack; diff: RulePackDiff; rawJson: string };

/** Strona administratora: wersja pliku reguł, pobieranie szablonu, wgranie i walidacja nowelizacji, podgląd skutków i publikacja. */
export function RulesVersionView(props: {
  viewer: Person;
  today: string;
  info: RulesInfo;
  rawJson?: string;
  errors?: string[];
  preview?: RulesPreview;
  published?: { version: string; effectiveFrom: string; scheduled: boolean };
  history?: RuleVersionEntry[];
}) {
  const i = props.info;
  const errors = props.errors ?? [];
  const history = props.history ?? [];
  return (
    <Layout title="Wersja przepisów" person={props.viewer} today={props.today}>
      <PageHeader
        title="Wersja przepisów"
        lead="Terminy, nazwy kryteriów i poziomów system liczy z pakietu reguł. Nowelizację wgrywasz tutaj, a każda ocena zapamiętuje wersję, w której powstała."
        linksLabel="Źródło i szablon"
        links={
          <>
            <a href="/admin/rules/template.json" download>Pobierz szablon aktualnego pakietu (JSON)</a>
            <a href={i.url}>Tekst aktu (serwis Sejmu, ELI)</a>
          </>
        }
      />
      {props.published ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div>
            <b>
              Opublikowano nową wersję przepisów: {rulesVersionLabel(props.published.version)} ({props.published.version}),{" "}
              {props.published.scheduled ? <>zaplanowana na {formatDate(props.published.effectiveFrom)}. Do tego dnia obowiązuje dotychczasowa.</> : <>obowiązuje od {formatDate(props.published.effectiveFrom)}.</>}
            </b>{" "}
            Oceny zatwierdzone wcześniej zostają przy swojej wersji reguł: ich arkusze pokazują dotychczasowe nazwy, skalę i poziomy.
          </div>
        </div>
      ) : null}
      {errors.length > 0 ? (
        <div class="st err" role="alert">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <div>
            <b>Pakiet reguł nie przeszedł walidacji</b>
            <ul>
              {errors.map((err) => (
                <li>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      <div class="o-grid">
        <div class="o-main">
          {props.preview ? (
            <section class="card rule" aria-labelledby="h-preview">
              <h2 id="h-preview">Podgląd zmian przed publikacją</h2>
              <p>
                Nowa wersja: <b>{rulesVersionLabel(props.preview.pack.version)} ({props.preview.pack.version})</b>, obowiązuje od{" "}
                <b class="tnum">{formatDate(props.preview.pack.effectiveFrom)}</b>.
              </p>
              <p>
                {props.preview.diff.scheduled
                  ? <>Wersja jest zaplanowana: do <b class="tnum">{formatDate(props.preview.pack.effectiveFrom)}</b> obowiązuje dotychczasowa.</>
                  : <>Wersja zacznie obowiązywać od razu po publikacji.</>}
              </p>
              <ul>
                <li>
                  <b>{props.preview.diff.openCyclesCount}</b> otwartych cykli (bez zatwierdzonej oceny) przejdzie na nowe wartości; w <b>{props.preview.diff.shiftedDeadlinesCount}</b> z nich zmieni się termin sporządzenia oceny.
                </li>
                <li>
                  <b>{props.preview.diff.closedCyclesCount}</b> cykli z zatwierdzoną oceną zostanie przy wersji zapisanej w ocenie.
                </li>
              </ul>
              {props.preview.diff.changes.length === 0 ? (
                <p class="cap">Pakiet nie wprowadza żadnych zmian wartości względem obecnie obowiązującej wersji.</p>
              ) : (
                <div class="hr-scroll">
                  <table class="hr-table" aria-label="Lista zmienionych wartości reguł">
                    <thead>
                      <tr>
                        <th scope="col">Reguła</th>
                        <th scope="col">Obecnie</th>
                        <th scope="col">Po nowelizacji</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.preview.diff.changes.map((ch) => (
                        <tr>
                          <th scope="row">{ch.label}</th>
                          <td>{ch.from}</td>
                          <td><b>{ch.to}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <form method="post" action="/admin/rules/publish" enctype="multipart/form-data">
                <input type="hidden" name="json" value={props.preview.rawJson} />
                <div class="actionbar">
                  <button class="btn primary" type="submit">Opublikuj nową wersję reguł</button>
                  <a class="btn" href="/admin/rules">Anuluj</a>
                </div>
              </form>
            </section>
          ) : null}

          <section class="card hr-doc" aria-labelledby="h-upload">
            <h2 id="h-upload">Jak wgrać nową wersję przepisów</h2>
            <ol class="hr-steps">
              <li>Pobierz szablon aktualnego pakietu (JSON) powyżej.</li>
              <li>Nadaj nowy identyfikator w polu <code>version</code> (wersji już opublikowanej nie da się zmienić), ustaw <code>effectiveFrom</code> nie wcześniejszy niż data obecnej wersji i zmień terminy, nazwy, opisy lub podstawy prawne.</li>
              <li>Wgraj plik (do 256 KB) albo wklej JSON poniżej. System sprawdzi pakiet i pokaże zmienione wartości oraz skutek dla cykli.</li>
              <li>Kliknij „Opublikuj nową wersję reguł”. Zmiana nie wymaga restartu. Gdy <code>effectiveFrom</code> jest w przyszłości, wersja czeka na ten dzień.</li>
            </ol>
            <p>System zmienia tylko to, co potrafi: terminy, nazwy i opisy kryteriów i poziomów oraz podstawy prawne. Inne kryteria, skala punktów, progi poziomów i arkusze wymagają zmiany programu. Pakiet z błędem system odrzuca z listą powodów, nic nie zapisuje.</p>
            <p>Ocena zatwierdzona wcześniej zachowuje wersję przepisów zapisaną w chwili zatwierdzenia. Jej arkusz pokazuje nazwy i skalę z tamtej wersji.</p>
            <form method="post" action="/admin/rules/preview" enctype="multipart/form-data" id="rules-upload-form">
              <div class="field">
                <label class="lbl" for="rules-file">Plik pakietu reguł (JSON)</label>
                <input class="area" type="file" id="rules-file" name="file" accept=".json,application/json" />
              </div>
              <div class="field">
                <label class="lbl" for="rules-json">Albo wklej treść pakietu JSON</label>
                <textarea class="area" id="rules-json" name="json" rows={8}>{props.rawJson ?? ""}</textarea>
              </div>
              <div class="actionbar">
                <button class={props.preview ? "btn" : "btn primary"} type="submit">Sprawdź i pokaż podgląd zmian</button>
              </div>
            </form>
          </section>

          <section class="card" aria-labelledby="h-history">
            <h2 id="h-history">Wersje reguł</h2>
            <ul class="plain-list">
              {history.map((h) => (
                <li>
                  <b>{h.version}</b>: {h.status === "active" ? "obowiązuje" : h.status === "scheduled" ? "zaplanowana" : "zastąpiona"}, od <span class="tnum">{formatDate(h.effectiveFrom)}</span>
                  {h.publishedOn ? <>, opublikowana <span class="tnum">{formatDate(h.publishedOn)}</span></> : ", wersja wyjściowa z pliku"}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside class="side first" aria-labelledby="h-now">
          <section class="card rule">
            <h2 id="h-now">Obowiązuje teraz</h2>
            <dl class="hr-facts">
              <div><dt>Wersja</dt><dd>{rulesVersionLabel(i.version)} ({i.version})</dd></div>
              <div><dt>Obowiązuje od</dt><dd class="tnum">{formatDate(i.effectiveFrom)}</dd></div>
              <div><dt>Akt</dt><dd>{i.act}, {i.publisher}</dd></div>
              <div><dt>Stan aktu</dt><dd>{i.status}</dd></div>
              {i.file ? <div><dt>Plik reguł</dt><dd><code>{i.file}</code></dd></div> : null}
            </dl>
          </section>
        </aside>
      </div>
    </Layout>
  );
}
