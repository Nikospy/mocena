import { rules } from "../engine/rules";
import { TourShell } from "./tour-entry";

const SEEN = [
  "Kryteria ustala człowiek, system podpowiada z powodem.",
  "Fakty zapisuje się w dniu zdarzenia, nie z pamięci po dwóch latach.",
  "Terminy liczy przepis, także po nieobecnościach.",
  "Wynik liczy przepis, punkty stawia przełożony.",
  "Zapoznanie i sprzeciw mają swoje terminy, a kadry widzą obowiązki urzędu.",
];

export function TourDone() {
  return (
    <TourShell title="Koniec pokazu">
      <div class="e-done">
        <h1 class="e-h1">Koniec pokazu</h1>
        <section class="card e-card">
          <h2>Co było widać</h2>
          <ol class="e-seen">
            {SEEN.map((t, i) => (
              <li>
                <span class="g-num" aria-hidden="true">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </section>
        <section class="card e-card">
          <h2>W wersji 5-minutowej warto zobaczyć</h2>
          <ul class="e-more">
            <li>
              <span>Oś czasu Ewy: cykl zaczął poprzedni naczelnik, potem wydział przejął Marek. Oceny dokonuje się na podstawie wcześniej wybranych kryteriów ({rules.appraiserChange.basis}).</span>
              <form method="post" action="/tour/extra/ewa-timeline"><button class="btn text" type="submit">Otwórz oś czasu Ewy</button></form>
            </li>
            <li>
              <span>Fikcja zapoznania: gdy oceniany nie potwierdza oceny, oceniający wpisuje uznanie zapoznania za dokonane, z powodem i sposobem doręczenia.</span>
              <form method="post" action="/tour/extra/fiction"><button class="btn text" type="submit">Stwierdź fikcję zapoznania</button></form>
            </li>
            <li>
              <span>Źródła podpowiedzi: skąd pochodzi każda podpowiedź kryterium i formy rozwoju.</span>
              <form method="post" action="/tour/extra/sources"><button class="btn text" type="submit">Pokaż źródła podpowiedzi</button></form>
            </li>
          </ul>
        </section>
        <div class="e-actions">
          <form method="post" action="/tour/1">
            <button class="btn primary" type="submit">Zacznij od nowa</button>
          </form>
          <form method="post" action="/tour/end">
            <input type="hidden" name="to" value="/account" />
            <button class="btn" type="submit">Klikaj samodzielnie</button>
          </form>
        </div>
        <p class="e-foot">Działa na regułach, bez modelu językowego. Osoby i zdarzenia są fikcyjne.</p>
      </div>
    </TourShell>
  );
}
