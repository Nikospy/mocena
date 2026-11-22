import { rulesVersionLabel } from "../engine/rules";
import type { Person } from "../people";
import { PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

export type RulesInfo = { version: string; effectiveFrom: string; act: string; publisher: string; status: string; url: string; file: string };

/** Strona administratora: wersja pliku reguł, data obowiązywania i sposób wgrania nowej wersji. */
export function RulesVersionView(props: { viewer: Person; today: string; info: RulesInfo }) {
  const i = props.info;
  return (
    <Layout title="Wersja przepisów" person={props.viewer} today={props.today}>
      <PageHeader
        title="Wersja przepisów"
        lead="Terminy, progi i pola arkusza system liczy z jednego pliku reguł. Nic w nim nie zmienia się samo."
        linksLabel="Źródło"
        links={<a href={i.url}>Tekst aktu (serwis Sejmu, ELI)</a>}
      />
      <div class="o-grid">
        <div class="o-main">
          <section class="card hr-doc" aria-labelledby="h-upload">
            <h2 id="h-upload">Jak wgrać nową wersję przepisów</h2>
            <ol class="hr-steps">
              <li>Przygotuj nowy plik reguł z tymi samymi polami co obecny. Zmień pola <code>version</code> i <code>effectiveFrom</code> oraz wartości i podstawy prawne, które zmienił nowy akt.</li>
              <li>Podmień plik <code>{i.file}</code> na serwerze urzędu.</li>
              <li>Uruchom testy poleceniem <code>bun test</code>. Testy silnika sprawdzają terminy, progi i wynik oceny na przykładach z przepisu.</li>
              <li>Uruchom aplikację ponownie. Nowa wersja działa od tej chwili.</li>
            </ol>
            <p>Ocena zatwierdzona wcześniej zachowuje wersję przepisów zapisaną w chwili zatwierdzenia. Arkusz i oś czasu pokazują, według której wersji je policzono.</p>
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
              <div><dt>Plik reguł</dt><dd><code>{i.file}</code></dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </Layout>
  );
}
