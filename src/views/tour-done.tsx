import { rules } from "../engine/rules";
import { TourShell } from "./tour-entry";

const SEEN = [
  "Kryteria ustala człowiek, system podpowiada z powodem.",
  "Fakty zapisuje się w dniu zdarzenia, nie z pamięci po dwóch latach.",
  "Terminy liczy przepis, także po nieobecnościach.",
  "Wynik liczy przepis, punkty stawia przełożony.",
  "Zapoznanie i sprzeciw mają swoje terminy, a kadry widzą obowiązki urzędu.",
];

export function TourDone(props: { ewaTimeline: string | null }) {
  return (
    <TourShell title="Koniec pokazu">
      <div class="e-done">
        <h1 class="e-h1">Koniec pokazu</h1>
        <section class="card e-card">
          <h2>Co widziałeś</h2>
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
              Oś czasu Ewy ze zmianą oceniającego: oceny dokonuje się na podstawie wcześniej wybranych kryteriów ({rules.appraiserChange.basis}).
              {props.ewaTimeline ? <> <a href={props.ewaTimeline}>Otwórz po wyborze konta kadr</a>.</> : null}
            </li>
            <li>Fikcja zapoznania: gdy pracownik nie potwierdza oceny, można wpisać uznanie zapoznania za dokonane, z powodem i sposobem doręczenia.</li>
            <li>
              Źródła podpowiedzi: <a href="/admin/suggestion-sources">/admin/suggestion-sources</a> (konto administratora).
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
