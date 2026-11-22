import rulesJson from "../../rules/regulation-2016-470.json";
import { CODE_LICENSE } from "../content";
import type { Person } from "../people";
import { PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

/** Treść strony „Wdrożenie i dane”: tylko fakty z repo i z kodu (README, tech-stack, decisions, plik reguł, trasy). Strona tekstowa jak dokument. */
export function AboutPage(props: { person: Person | null; today: string }) {
  return (
    <Layout title="Wdrożenie i dane" person={props.person} today={props.today}>
      <article class="hr-docpage">
        <PageHeader title="Wdrożenie i dane" lead="Jak uruchomić mOcenę w urzędzie, jakie dane przetwarza, kto je widzi i czego w prototypie nie ma." />

        <section aria-labelledby="a-run">
          <h2 id="a-run">Uruchomienie u siebie</h2>
          <p>
            <code>bun install &amp;&amp; bun run seed &amp;&amp; bun run dev</code>
          </p>
          <ul>
            <li>Wystarczy darmowe środowisko Bun: bez serwera bazy, bez dodatkowego sprzętu, bez płatnych licencji i usług.</li>
            <li>Dane trzyma jeden plik bazy SQLite na komputerze. Aplikacja uruchomiona lokalnie nie wysyła danych do żadnej usługi zewnętrznej.</li>
            <li><code>bun run seed</code> wgrywa dane pokazowe; bez niego baza jest pusta.</li>
            <li>Wersja w internecie (Cloudflare Workers) działa tylko na czas zawodów. W urzędzie aplikacja działa lokalnie, bez chmury.</li>
          </ul>
        </section>

        <section aria-labelledby="a-rules">
          <h2 id="a-rules">Reguły zamiast modelu</h2>
          <p>
            Przepisy są w pliku <code>rules/regulation-2016-470.json</code>: wersja <b>{String(rulesJson.version)}</b>, rozporządzenie obowiązuje od{" "}
            <b>{formatDate(String(rulesJson.effectiveFrom))}</b>. Ustawienia urzędu są osobno, w <code>rules/office-settings.json</code>, i są tak oznaczone na ekranach.
          </p>
          <ul>
            <li>Zmiana przepisów to nowa wersja pliku reguł. Każda wystawiona ocena zapamiętuje wersję, w której powstała, i pokazuje ją arkusz.</li>
            <li>Silnik liczy terminy i wynik z dat i pól. Treści notatek nie czyta.</li>
          </ul>
        </section>

        <section aria-labelledby="a-hr">
          <h2 id="a-hr">Dane kadrowe</h2>
          <h3>Jest w prototypie</h3>
          <ul>
            <li>Lista pracowników z arkuszami, podległością i wyszukiwaniem. Pracowników dodają kadry w aplikacji: formularzem albo importem z pliku CSV. Dane pokazowe wgrywa skrypt.</li>
            <li>Eksport zestawienia cykli do pliku CSV i eksport jednej zatwierdzonej oceny do pliku JSON (dla systemu kadrowego).</li>
            <li>Zaproszenie na rozmowę jako plik kalendarza <code>.ics</code> albo gotowa wiadomość w programie pocztowym. System nie przechowuje adresów e-mail i sam nie wysyła poczty.</li>
          </ul>
          <h3>Nie ma w prototypie</h3>
          <p>
            Integracji z systemem kadrowym, z EZD (obieg pism i kopii arkusza) ani z serwerem poczty urzędu. Przy wdrożeniu te trzy miejsca urząd podłącza u siebie.
          </p>
        </section>

        <section aria-labelledby="a-data">
          <h2 id="a-data">Ochrona danych</h2>
          <h3>Jakie dane przetwarza</h3>
          <p>
            Notatki przełożonego o faktach z pracy, daty nieobecności (bez ich rodzaju), oceny i uzasadnienia, do których oceniający może wstawić swoje notatki, informacje zwrotne
            przekazane pracownikowi oraz dane kadrowe: imię i nazwisko, stanowisko i podległość.
          </p>
          <h3>Kto co widzi</h3>
          <ul aria-label="Kto co widzi">
            <li>Notatkę widzi tylko jej autor. Oceniający widzi cykle osób, które ocenia.</li>
            <li>Do arkusza trafiają tylko te fragmenty notatek, które oceniający sam wstawił do uzasadnienia oceny. Pozostałych notatek nie widzą ani pracownik, ani kadry; na wniosek pracownika wydaje je urząd.</li>
            <li>Pracownik widzi własny arkusz, potwierdzenia i informacje zwrotne, które mu przekazano.</li>
            <li>Kadry widzą stany cykli, nieobecności, arkusze, listę pracowników i zestawienie.</li>
            <li>Administrator widzi ekran „Skąd biorą się podpowiedzi”, wersję przepisów, listę pracowników i zastępstwa, korektę błędów w zatwierdzonych arkuszach i datę systemową.</li>
          </ul>
          <h3>Zasady</h3>
          <ul>
            <li>Przy nazwisku nie ma etykiet ani wskaźników, a system nie porównuje pracowników. Nic nie zapisuje się bez kliknięcia człowieka.</li>
            <li>Podpowiedzi przechodzą przez jedno wymienne miejsce w kodzie (adapter). Do podpowiedzi trafia treść notatki bez nazwisk; model nie proponuje punktów i nie pisze tekstu o pracowniku.</li>
          </ul>
          <h3>Ciasteczka pokazu</h3>
          <p>
            <code>person_id</code> (wybrane konto pokazowe), <code>mocena_demo</code> (sesja wersji pokazowej, każdy widz ma osobne dane), <code>mocena_tour</code> (otwarty krok przewodnika). Wdrożenie w urzędzie zastępuje je logowaniem.
          </p>
          <h3>Urząd musi jeszcze dodać</h3>
          <ul>
            <li>Logowanie i konta zgodne ze swoją polityką (dziś konta pokazowe są bez hasła).</li>
            <li>Okres przechowywania notatek i ocen. Jak długo przechowywać notatki po zakończeniu cyklu, ustala urząd; prototyp sam ich nie usuwa.</li>
            <li>Administratora danych i tryb wydawania pracownikowi jego notatek na wniosek.</li>
          </ul>
        </section>

        <section aria-labelledby="a-code">
          <h2 id="a-code">Kod</h2>
          <ul>
            <li>Repozytorium: <a href="https://github.com/Nikospy/mocena">github.com/Nikospy/mocena</a>.</li>
            <li>Licencja kodu: {CODE_LICENSE}.</li>
            <li>Font: Open Sans, licencja SIL Open Font License (plik OFL.txt w <code>public/fonts/</code>).</li>
          </ul>
        </section>
      </article>
    </Layout>
  );
}
