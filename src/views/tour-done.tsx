import { rules } from "../engine/rules";
import { TourShell } from "./tour-entry";

const SEEN = [
  "Kryteria wybiera oceniający, system podpowiada je z powodem.",
  "Fakty zapisuje się w dniu zdarzenia, nie z pamięci po dwóch latach.",
  "System liczy terminy według przepisu, także po nieobecnościach.",
  "Wynik liczy system według przepisu, oceny cząstkowe stawia oceniający.",
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
          <h2>Warto zobaczyć jeszcze</h2>
          <ul class="e-more">
            <li>
              <span>Oś czasu Ewy: cykl zaczął poprzedni naczelnik, potem wydział przejął Marek. Marek ocenia Ewę według kryteriów, które wyznaczył poprzedni oceniający ({rules.appraiserChange.basis}).</span>
              <form method="post" action="/tour/extra/ewa-timeline"><button class="btn text" type="submit">Otwórz oś czasu Ewy</button></form>
            </li>
            <li>
              <span>Fikcja zapoznania: gdy oceniany nie może albo nie chce potwierdzić zapoznania z oceną, oceniający wpisuje fikcję zapoznania z powodem i sposobem doręczenia kopii arkusza.</span>
              <form method="post" action="/tour/extra/fiction"><button class="btn text" type="submit">Wpisz fikcję zapoznania</button></form>
            </li>
            <li>
              <span>Źródła podpowiedzi: skąd pochodzi każda podpowiedź kryterium i formy rozwoju.</span>
              <form method="post" action="/tour/extra/sources"><button class="btn text" type="submit">Otwórz źródła podpowiedzi</button></form>
            </li>
          </ul>
        </section>
        <div class="e-actions">
          <form method="post" action="/tour/1">
            <button class="btn primary" type="submit">Zacznij pokaz od nowa</button>
          </form>
          <form method="post" action="/tour/end">
            <input type="hidden" name="to" value="/account" />
            <button class="btn text" type="submit">Wybierz konto i klikaj samodzielnie</button>
          </form>
        </div>
        <p class="e-foot">Działa na regułach, bez modelu językowego. Osoby i zdarzenia są fikcyjne.</p>
      </div>
    </TourShell>
  );
}
