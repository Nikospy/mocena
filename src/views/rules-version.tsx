import { rulesVersionLabel } from "../engine/rules";
import type { Person } from "../people";
import { Layout, formatDate } from "./layout";

export type RulesInfo = { version: string; effectiveFrom: string; act: string; publisher: string; status: string; url: string; file: string };

/** Strona administratora: wersja pliku reguł, data obowiązywania i sposób wgrania nowej wersji. */
export function RulesVersionView(props: { viewer: Person; today: string; info: RulesInfo }) {
  const i = props.info;
  return (
    <Layout title="Wersja przepisów" person={props.viewer} today={props.today}>
      <section class="card">
        <h1>Wersja przepisów</h1>
        <p class="cap">Terminy, progi i pola arkusza system liczy z jednego pliku reguł. Nic w nim nie zmienia się samo.</p>
        <div class="sheet-field">
          <span class="lbl">Wersja</span>
          <p>{rulesVersionLabel(i.version)} ({i.version})</p>
        </div>
        <div class="sheet-field">
          <span class="lbl">Obowiązuje od</span>
          <p>{formatDate(i.effectiveFrom)}</p>
        </div>
        <div class="sheet-field">
          <span class="lbl">Akt</span>
          <p>{i.act}, {i.publisher}</p>
        </div>
        <div class="sheet-field">
          <span class="lbl">Stan aktu</span>
          <p>{i.status}</p>
        </div>
        <div class="sheet-field">
          <span class="lbl">Plik reguł</span>
          <p><code>{i.file}</code></p>
        </div>
        <p><a href={i.url}>Tekst aktu (serwis Sejmu, ELI)</a></p>
      </section>
      <section class="card" aria-labelledby="h-upload">
        <h2 id="h-upload">Jak wgrać nową wersję przepisów</h2>
        <ol class="b-ol">
          <li>Przygotuj nowy plik reguł z tymi samymi polami co obecny. Zmień pola <code>version</code> i <code>effectiveFrom</code> oraz wartości i podstawy prawne, które zmienił nowy akt.</li>
          <li>Podmień plik <code>{i.file}</code> na serwerze urzędu.</li>
          <li>Uruchom testy poleceniem <code>bun test</code>. Testy silnika sprawdzają terminy, progi i wynik oceny na przykładach z przepisu.</li>
          <li>Uruchom aplikację ponownie. Nowa wersja działa od tej chwili.</li>
        </ol>
        <p class="cap">Ocena zatwierdzona wcześniej zachowuje wersję przepisów zapisaną w chwili zatwierdzenia. Arkusz i oś czasu pokazują, według której wersji je policzono.</p>
      </section>
    </Layout>
  );
}
