import rulesJson from "../../rules/regulation-2016-470.json";
import { CODE_LICENSE } from "../content";
import type { Person } from "../people";
import { PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

/** Treść strony „Wdrożenie i dane”: tylko fakty z repo (README, tech-stack, decisions, plik reguł). */
export function AboutPage(props: { person: Person | null; today: string }) {
  return (
    <Layout title="Wdrożenie i dane" person={props.person} today={props.today}>
      <section class="n-state">
        <PageHeader title="Wdrożenie i dane" lead="Jak uruchomić mOcenę w urzędzie, jakie dane przetwarza, kto je widzi i czego w prototypie nie ma." />

        <section class="card">
          <h2>Uruchomienie u siebie</h2>
          <p>
            <code>bun install &amp;&amp; bun run seed &amp;&amp; bun run dev</code>
          </p>
          <ul class="points">
            <li><span>Wystarczy darmowe środowisko Bun: bez serwera bazy, bez dodatkowego sprzętu, bez płatnych licencji i usług.</span></li>
            <li><span>Dane trzyma jeden plik bazy SQLite na komputerze. Aplikacja uruchomiona lokalnie nie wysyła danych do żadnej usługi zewnętrznej.</span></li>
            <li><span><code>bun run seed</code> wgrywa dane pokazowe; bez niego baza jest pusta.</span></li>
            <li><span>Wersja na workers.dev to wdrożenie pokazowe na zawody. Wdrożenie w urzędzie działa lokalnie, bez chmury.</span></li>
          </ul>
        </section>

        <section class="card">
          <h2>Reguły zamiast modelu</h2>
          <p>
            Przepisy są w pliku <code>rules/regulation-2016-470.json</code>: wersja <b>{String(rulesJson.version)}</b>, rozporządzenie obowiązuje od{" "}
            <b>{formatDate(String(rulesJson.effectiveFrom))}</b>. Ustawienia urzędu są osobno, w <code>rules/office-settings.json</code>, i są tak oznaczone na ekranach.
          </p>
          <ul class="points">
            <li><span>Zmiana przepisów to nowa wersja pliku reguł. Każda wystawiona ocena zapamiętuje wersję, w której powstała, i pokazuje ją arkusz.</span></li>
            <li><span>Silnik liczy terminy i wynik z dat i pól. Treści notatek nie czyta.</span></li>
          </ul>
        </section>

        <section class="card">
          <h2>Dane kadrowe</h2>
          <p><span class="lbl">Jest w prototypie:</span> lista pracowników z arkuszami, podległością i wyszukiwaniem (wgrana skryptem danych pokazowych) oraz eksport zestawienia do pliku CSV.</p>
          <p>
            <span class="lbl">Nie ma w prototypie:</span> integracji z systemem kadrowym (dziś dane pracowników wstawia skrypt), z EZD (obieg pism i kopii arkusza) ani z pocztą
            (zaproszenia na rozmowy to karta z datą, bez e-maila). Przy wdrożeniu te trzy miejsca urząd podłącza u siebie.
          </p>
        </section>

        <section class="card">
          <h2>Ochrona danych</h2>
          <p>
            <span class="lbl">Jakie dane przetwarza:</span> notatki przełożonego o faktach z pracy, daty nieobecności (bez ich rodzaju), oceny i uzasadnienia złożone z notatek,
            informacje zwrotne wysłane pracownikowi oraz dane kadrowe: imię i nazwisko, stanowisko i podległość.
          </p>
          <ul class="points" aria-label="Kto co widzi">
            <li><span>Oceniający widzi swoje notatki i cykle osób, które ocenia.</span></li>
            <li><span>Pracownik widzi własny arkusz i potwierdzenia oraz informacje zwrotne, które mu wysłano. Treści notatek nie widzi; na wniosek wydaje je urząd.</span></li>
            <li><span>Kadry widzą stany cykli, nieobecności, arkusze i zestawienie — bez treści notatek.</span></li>
            <li><span>Administrator widzi ekran podpowiedzi i datę systemową.</span></li>
          </ul>
          <ul class="points">
            <li><span>Przy nazwisku nie ma etykiet ani wskaźników, a system nie porównuje pracowników. Nic nie zapisuje się bez kliknięcia człowieka.</span></li>
            <li><span>Podpowiedzi przechodzą przez jedno wymienne miejsce w kodzie (adapter). Do podpowiedzi notatki trafia treść bez nazwisk; model nie proponuje punktów i nie pisze tekstu o pracowniku.</span></li>
          </ul>
          <p><span class="lbl">Ciasteczka pokazu:</span> <code>person_id</code> (wybrane konto pokazowe), <code>mocena_demo</code> (sesja wersji pokazowej, każdy widz ma osobne dane), <code>mocena_tour</code> (otwarty krok przewodnika). Wdrożenie w urzędzie zastępuje je logowaniem.</p>
          <p>
            <span class="lbl">Urząd musi jeszcze dodać:</span> logowanie i konta zgodne ze swoją polityką (dziś konta pokazowe są bez hasła), retencję — ile lat trzyma notatki i oceny —
            oraz administratora danych i tryb wydawania pracownikowi jego notatek na wniosek.
          </p>
        </section>

        <section class="card">
          <h2>Kod</h2>
          <ul class="points">
            <li><span>Repozytorium: <a href="https://github.com/Nikospy/mocena">github.com/Nikospy/mocena</a>.</span></li>
            <li><span>Licencja kodu: {CODE_LICENSE}.</span></li>
            <li><span>Font: Open Sans, licencja SIL Open Font License (plik OFL.txt w <code>public/fonts/</code>).</span></li>
          </ul>
        </section>
      </section>
    </Layout>
  );
}
