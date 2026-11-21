---
project: "mOcena"
context_type: greenfield
created: 2026-11-21
updated: 2026-11-21
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "wariant produktu"
      decision: "A+: przewodnik procesu na regułach, notatki faktów, HR partner bez modelu językowego"
    - topic: "podpis"
      decision: "potwierdzenie w systemie na koncie ocenianego; wydruk i PDF jako opcja"
    - topic: "fikcja zapoznania"
      decision: "nazwa organizatora; stwierdza sam oceniający (nie mógł / nie chciał), kadry widzą wpis"
    - topic: "zakres pokazu"
      decision: "cały proces od początku cyklu, 5 kroków w 3 minuty"
  frs_drafted: 34
  quality_check_status: accepted
---

> **Nieaktualne w części.** To notatki wejściowe do pierwszej wersji PRD, sprzed decyzji autora z 21.11.2026. Obowiązują `decisions.md` i `prd.md` (wersja 2, 36 wymagań). Różnice dotyczą HR partnera, fikcji zapoznania, podpowiedzi kryteriów i miejsca na model.
>
> Notatki powstały bez sesji pytań: źródłem jest opis wyzwania organizatora i plan budowy uzgodniony z autorem projektu. Treść sekcji odpowiada sekcjom PRD.

# mOcena

## Vision & Problem Statement

Przełożony w służbie cywilnej ocenia podwładnego raz na 24 miesiące, na papierowym arkuszu A, B albo C. Między rozmową rozpoczynającą a rozmową oceniającą nic nie jest zapisywane, więc ocena powstaje z pamięci o ostatnich tygodniach. Oceniający mają kłopot z wyborem kryteriów dodatkowych, sformułowaniem oczekiwań, informacją zwrotną i wnioskami rozwojowymi, a uwagę zabierają terminy i poprawność formularza. Dotyczy to ok. 123 tys. osób w ok. 1743 urzędach.

Ocena nie psuje się przy formularzu, tylko przez 24 miesiące ciszy przed nim. mOcena prowadzi oceniającego, ocenianego i kadry przez cały cykl: od wyboru arkusza i kryteriów, przez notatki o faktach i rozmowy, po potwierdzenie oceny bez papieru. Asystent pilnuje faktów, terminów i przepisów, a decyzję zawsze podejmuje przełożony.

## User & Persona

**Marek Zieliński, naczelnik wydziału w urzędzie.** Kieruje kilkuosobowym zespołem, ocenia każdego co 24 miesiące. Sięga po mOcenę w trzech momentach: gdy zaczyna cykl oceny pracownika, gdy w ciągu okresu coś się wydarzy i chce to zapisać z telefonu, oraz gdy zbliża się termin oceny i musi przygotować rozmowę i arkusz.

### Secondary persona

- **Piotr, oceniany:** na własnym koncie potwierdza rozmowę i kryteria, czyta informację zwrotną, potwierdza zapoznanie się z oceną.
- **Joanna Mazur, kadry (zarządzający):** wpisuje nieobecności i zmiany podległości, potwierdza fikcję zapoznania, dostaje przypomnienia o stopniach służbowych, widzi stan wszystkich cykli.
- **Dyrektor generalny:** widzi stan cykli i liczniki terminowości bez nazwisk.

## Success Criteria

### Primary
- W trzyminutowym pokazie jury widzi cały proces jednej oceny: początek cyklu, wybór arkusza i kryteriów, potwierdzenie ocenianego, okres oceny z notatkami i nieobecnością, ocenę i potwierdzenie zapoznania, bez jednego dokumentu papierowego.
- Z 30 czynności z listy przypadków użycia organizatora co najmniej 16 działa w prototypie, a pozostałe mają widoczny stan albo są jawnie nazwane jako poza prototypem.

### Secondary
- Moduł wirtualnego HR partnera w pokazie reaguje na notatkę przełożonego pytaniem i propozycją działania, a na notatkę bez sygnału nie reaguje.
- Wynik oceny i terminy zgadzają się z przykładowymi arkuszami i zasadami liczenia terminów od organizatora.

### Guardrails
- Asystent nie wystawia ocen cząstkowych i nie pisze zdań o pracowniku: treść arkusza pochodzi od przełożonego.
- Żadne dane o pracownikach nie opuszczają urzędu.
- Prototyp nie wymaga płatnych licencji.
- Wynik oceny (średnia, poziom, pozytywna albo negatywna) jest zawsze zgodny z § 11 rozporządzenia.

## User Stories

### US-01: Oceniający zaczyna cykl i ustala kryteria

- **Given** pracownik zatrudniony na czas nieokreślony, którego cykl oceny właśnie się zaczął
- **When** oceniający otwiera jego cykl
- **Then** widzi arkusz dobrany do stanowiska, kryteria obowiązkowe, podpowiedź kryteriów dodatkowych z uzasadnieniem, pole na oczekiwania i kartę rozmowy rozpoczynającej, a po rozmowie przekazuje część I ocenianemu do potwierdzenia

#### Acceptance Criteria
- Stanowisko bez kierowania pracownikami dostaje arkusz C, stanowisko z bezpośrednim kierowaniem arkusz B, kierownik urzędu arkusz A
- Można wybrać najwyżej 3 kryteria dodatkowe, bez powtórzeń i bez kryteriów obowiązkowych danego arkusza
- Karta rozmowy zawiera cztery tematy z § 5 ust. 1 rozporządzenia
- Termin oceny jest podpowiedziany jako 24 miesiące od początku cyklu

### US-02: Oceniany potwierdza kryteria na własnym koncie

- **Given** część I przekazana przez oceniającego
- **When** oceniany otwiera ją na telefonie i potwierdza
- **Then** miejscowość, data i nazwisko wpisują się same, a kryteria i termin blokują się do edycji

#### Acceptance Criteria
- Przed potwierdzeniem ocenianego nie da się przejść do oceny
- Po potwierdzeniu termin zmienia się tylko w trybie zmiany terminu

### US-03: Kadry wpisują nieobecność, a termin oceny się przesuwa

- **Given** trwający cykl oceny
- **When** kadry wpisują dwie nieobecności rozdzielone tylko dniami wolnymi, razem dłuższe niż miesiąc
- **Then** oś czasu pokazuje jedną ciągłą nieobecność, nowy termin oceny oraz regułę i wersję reguł, z której ten termin wynika

#### Acceptance Criteria
- Nieobecności 05.10–16.10.2026 i 19.10–06.11.2026 są liczone jako jedna, od 05.10 do 06.11
- Termin wypadający w sobotę albo dzień wolny przechodzi na następny dzień roboczy
- Na osi widać też zmianę oceniającego: kryteria zostają bez zmian

### US-04: HR partner pyta przełożonego o zmianę zadań

- **Given** oceniający zapisuje z telefonu notatkę o pracowniku
- **When** notatka wskazuje, że pracownik przejął nowe zadania
- **Then** asystent zadaje jedno pytanie zamknięte, a po odpowiedzi „tak” pokazuje kartę rozmowy i jedną formę rozwoju z katalogu

#### Acceptance Criteria
- Notatka bez takiego sygnału nie wywołuje żadnego pytania
- Nic nie zapisuje się bez kliknięcia przełożonego
- Przy nazwisku pracownika nie pojawia się żadna etykieta ani liczba

### US-05: Oceniający wystawia ocenę, a oceniany ją potwierdza

- **Given** potwierdzoną część I i notatki z okresu oceny
- **When** oceniający po rozmowie oceniającej przyznaje oceny cząstkowe i zatwierdza arkusz
- **Then** wynik liczy się sam, brakujące elementy blokują zatwierdzenie, a oceniany potwierdza zapoznanie się z oceną na własnym koncie

#### Acceptance Criteria
- Jedna ocena cząstkowa „1” daje ocenę negatywną także przy średniej powyżej 4
- Średnia równa dokładnie 4 daje ocenę negatywną
- Ocena negatywna wymaga uzasadnienia; każda ocena wymaga wniosków do indywidualnego programu rozwoju zawodowego
- Ostrzeżenie pojawia się, gdy wszystkie fakty do kryterium pochodzą z ostatniego miesiąca
- Po potwierdzeniu ocenianego widać zegar 7 dni na sprzeciw
- Gdy oceniany nie potwierdza, oceniający może stwierdzić fikcję zapoznania, a kadry ją potwierdzają

## Functional Requirements

### Początek cyklu
- FR-001: System może rozpocząć cykl oceny po zatrudnieniu na czas nieokreślony, mianowaniu albo poprzedniej ocenie i przypomnieć oceniającemu o wyznaczeniu kryteriów w terminie 30 dni (7 dni po ocenie negatywnej). Priority: must-have
- FR-002: Oceniający może zobaczyć arkusz A, B albo C dobrany do rodzaju stanowiska wraz z jego kryteriami obowiązkowymi. Priority: must-have
- FR-003: Oceniający może wybrać do 3 kryteriów dodatkowych z wykazu, widząc podpowiedź wynikającą z rodzajów obowiązków przypisanych do stanowiska, z jednozdaniowym uzasadnieniem. Priority: must-have
- FR-004: Oceniający może zapisać oczekiwania co do sposobu spełniania kryteriów. Priority: must-have
- FR-005: Oceniający może otworzyć kartę przygotowania do rozmowy rozpoczynającej: cel, wymagane tematy, pytania, trudne sytuacje. Priority: must-have
- FR-006: Oceniający może potwierdzić rozmowę i kryteria oraz przekazać część I ocenianemu. Priority: must-have
- FR-007: Oceniany może na własnym koncie potwierdzić rozmowę oraz zapoznanie się z kryteriami i terminem. Priority: must-have

### Okres oceny
- FR-008: Oceniający może z telefonu zapisać notatkę o fakcie, z datą i kryterium, widoczną tylko dla niego. Priority: must-have
- FR-009: Oceniający może wysłać ocenianemu informację zwrotną, a oceniany może ją przeczytać. Priority: must-have
- FR-010: Kadry mogą wpisać nieobecność ocenianego, po której system łączy nieobecności rozdzielone dniami wolnymi i przedłuża termin oceny o czas nieobecności dłuższej niż miesiąc. Priority: must-have
- FR-011: Kadry mogą zarejestrować zmianę oceniającego w trakcie cyklu z zachowaniem kryteriów. Priority: must-have
- FR-012: Oceniający może zmienić termin oceny w przypadkach dopuszczonych ustawą, a oceniany dostaje informację o nowym terminie. Priority: must-have
- FR-013: Oceniany może złożyć wniosek o zmianę terminu po 6 miesiącach, a oceniający może go rozpatrzyć. Priority: nice-to-have
- FR-014: Uczestnik cyklu może zobaczyć oś czasu cyklu z regułą i wersją reguł, z której wynika każdy termin. Priority: must-have

### Wirtualny HR partner
- FR-015: Oceniający może odpowiedzieć na jedno pytanie zamknięte zadane po notatce wskazującej zmianę zadań pracownika i dostać kartę rozmowy oraz formę rozwoju z katalogu. Priority: must-have
- FR-016: Oceniający może zobaczyć przypomnienie, że od ostatniej rozmowy nie przekazał pracownikowi informacji zwrotnej, wraz z kartą docenienia. Priority: must-have
- FR-017: Oceniający może otworzyć kartę przygotowania do rozmowy oceniającej z tematami wymaganymi przepisami. Priority: must-have

### Ocena
- FR-018: Oceniający może przyznać ocenę cząstkową 1, 3, 5, 7 albo 9 każdemu kryterium, widząc przy nim notatki z całego okresu. Priority: must-have
- FR-019: Oceniający może zobaczyć wyliczoną średnią, poziom ogólny i wynik pozytywny albo negatywny z podaniem przepisu. Priority: must-have
- FR-020: Oceniający może zobaczyć ostrzeżenie, gdy fakty do kryterium pochodzą tylko z ostatniego miesiąca albo skrajna ocena nie ma żadnego faktu. Priority: must-have
- FR-021: Oceniający może złożyć uzasadnienie i wnioski do indywidualnego programu rozwoju zawodowego z własnych notatek przypisanych do kryteriów. Priority: must-have
- FR-022: Oceniający może zatwierdzić ocenę dopiero wtedy, gdy są wnioski rozwojowe, uzasadnienie przy ocenie negatywnej i umotywowanie dołączonego wniosku o stopień. Priority: must-have
- FR-023: Oceniający może dołączyć wniosek o kolejny stopień służbowy dla urzędnika mianowanego z oceną pozytywną. Priority: must-have
- FR-024: Oceniany może na własnym koncie potwierdzić zapoznanie się z oceną, od którego liczy się 7 dni na sprzeciw. Priority: must-have
- FR-025: Oceniający może stwierdzić fikcję zapoznania z oceną przez adnotację, a kadry mogą ją potwierdzić. Priority: must-have
- FR-026: Uprawniona osoba może obejrzeć, pobrać i wydrukować arkusz ze wszystkimi polami w układzie wzoru z rozporządzenia. Priority: must-have

### Po ocenie i widoki kadr
- FR-027: Kadry mogą zobaczyć przypomnienie o obowiązkowym stopniu służbowym po dwóch kolejnych ocenach na dwóch najwyższych poziomach od otrzymania ostatniego stopnia, z terminem 30 dni od zapoznania z oceną. Priority: must-have
- FR-028: Kadry mogą zarejestrować uwzględniony sprzeciw jako zmianę oceny albo ponowne sporządzenie oceny. Priority: nice-to-have
- FR-029: Kadry i dyrektor generalny mogą zobaczyć stan wszystkich cykli na jednym ekranie. Priority: must-have
- FR-030: Dyrektor generalny może zobaczyć liczniki terminowości bez nazwisk. Priority: nice-to-have
- FR-031: Oceniający i oceniany mogą zobaczyć historię ocen ocenianego. Priority: must-have
- FR-032: Kadry mogą wprowadzać i edytować dane pracowników, podległość i zastępstwa oraz usuwać dane pracownika. Priority: nice-to-have

### Reguły
- FR-033: Administrator może wymienić zestaw reguł (cykl, terminy, kryteria, przedziały) na nową wersję z datą obowiązywania, a każda ocena zachowuje wersję reguł, w której powstała. Priority: must-have
- FR-034: Prowadzący pokaz może przesunąć datę systemową, żeby pokazać przypomnienia i terminy. Priority: must-have

## Non-Functional Requirements

- Urząd uruchamia produkt bez płatnych licencji i bez specjalistycznego szkolenia, w nie więcej niż 10 krokach instalacji.
- Żadne dane o pracownikach nie opuszczają infrastruktury urzędu.
- Zmiana częstotliwości ocen, długości terminów albo listy kryteriów nie wymaga zmiany programu, tylko nowej wersji reguł.
- Produkt działa na telefonie i na komputerze, w dwóch ostatnich głównych wersjach popularnych przeglądarek.
- Pokaz działa bez dostępu do sieci.
- Kluczowe ekrany da się obsłużyć samą klawiaturą, a tekst ma kontrast co najmniej 4,5:1.
- Każda data i każdy wynik pokazany użytkownikowi ma obok podstawę prawną.

## Business Logic

Ocena okresowa jest negatywna, gdy średnia arytmetyczna ocen cząstkowych nie przekracza 4 punktów albo choć jedna ocena cząstkowa wynosi 1 punkt, a w każdym innym przypadku jest pozytywna.

Regułę zasilają oceny cząstkowe 1, 3, 5, 7 albo 9 przyznane przez oceniającego każdemu kryterium obowiązkowemu arkusza (6 w arkuszu A, po 5 w B i C) i każdemu wybranemu kryterium dodatkowemu (od 0 do 3). Średnia wyznacza poziom ogólny w przedziałach „od 1 do 2”, „powyżej 2 do 4”, „powyżej 4 do 6”, „powyżej 6 do 8”, „powyżej 8 do 9”. Średnia nie jest zaokrąglana. Oceniający widzi wynik od razu przy wypełnianiu arkusza, z nazwą przepisu.

Druga grupa reguł to terminy. Cykl trwa 24 miesiące; kryteria ustala się w 30 dni od początku cyklu albo w 7 dni po ocenie negatywnej; usprawiedliwiona, ciągła nieobecność dłuższa niż miesiąc przedłuża termin o swój czas, a dni wolne między nieobecnościami jej nie przerywają; termin kończący się w sobotę albo dzień wolny przechodzi na następny dzień roboczy; sprzeciw przysługuje w 7 dni od zapoznania się z oceną; po ocenie negatywnej ponowna ocena następuje po 6 miesiącach.

Trzecia grupa to kolejność kroków. Ocena nie może powstać bez potwierdzonej części I. Kryteria i termin blokują się po potwierdzeniu ocenianego. Urzędnik mianowany dostaje kolejny stopień służbowy z mocy prawa po dwóch kolejnych ocenach na jednym z dwóch najwyższych poziomów uzyskanych od otrzymania ostatniego stopnia, w 30 dni od zapoznania z oceną.

## Access Control

Role: oceniający, oceniany, kadry (zarządzający), dyrektor generalny, administrator. Jedna osoba może być jednocześnie oceniającym swoich podwładnych i ocenianym przez swojego przełożonego.

| Możliwość | Oceniający | Oceniany | Kadry | Dyrektor generalny |
|---|---|---|---|---|
| Część I i arkusz oceny podwładnego | edycja do zablokowania | wgląd i potwierdzenie | wgląd | wgląd |
| Notatki robocze (brudnopis) | tylko autor | brak | eksport na wniosek osoby, której dotyczą | brak |
| Informacja zwrotna wysłana ocenianemu | autor | wgląd | brak | brak |
| Nieobecności i zmiany podległości | wgląd w daty | brak | edycja | brak |
| Fikcja zapoznania | adnotacja | brak | potwierdzenie | brak |
| Stan cykli i przypomnienia o stopniach | własny zespół | własny cykl | wszyscy | wszyscy, liczniki bez nazwisk |

Rodzaj nieobecności nie jest widoczny poza kadrami. Pola zablokowane zmienia wyłącznie administrator w trybie korekty błędów. W prototypie logowanie odbywa się przez wybór jednego z kont demonstracyjnych; osoba niezalogowana widzi tylko ekran wyboru konta.

## Non-Goals

- Asystent nie wystawia ocen i nie układa zdań o pracowniku. Uzasadnienie składa się z notatek przełożonego.
- Prototyp nie używa modelu językowego. Zmianę zadań pracownika zaznacza oceniający przy notatce; lista słów tylko podpowiada to zaznaczenie.
- Brak wysyłki e-maili i integracji z elektronicznym systemem zarządzania dokumentacją; powiadomienia są widoczne w produkcie.
- Brak podpisu kwalifikowanego, zaufanego i osobistego; potwierdzenie w systemie nazywamy potwierdzeniem, nie podpisem.
- Brak importu danych z systemu kadrowego; dane pokazowe są wgrane z góry.
- Brak edycji danych pracownika, zastępstw i usuwania danych w prototypie.
- Brak obiegu decyzji o stopniu służbowym i pełnego obiegu sprzeciwu; widać tylko ich stan.
- Brak porównywania pracowników, rankingów i etykiet przy nazwisku.
- Brak gwarancji wierności wydruku 1:1 ze wzorem; jest komplet pól w kolejności wzoru.

## Open Questions

1. **Czy potwierdzenie w systemie wystarcza w prototypie jako odpowiednik podpisu, czy organizator chce zobaczyć podpis zaufany albo obieg w systemie dokumentacji?** — Owner: user (pytanie do mentorów DSC). By: 2026-11-21 wieczór. Block: no (przyjęte: potwierdzenie w systemie).
2. **Co organizator chce zobaczyć w module HR partnera, żeby uznać go za innowacyjny?** — Owner: user (pytanie do mentorów DSC). By: 2026-11-21 wieczór. Block: no (przyjęte: wariant A+ bez modelu).
3. **Czy składanie uzasadnienia z notatek przełożonego organizator uzna za wsparcie w formułowaniu treści oceny?** — Owner: user (pytanie do mentorów DSC). By: 2026-11-21 wieczór. Block: no.
4. **Kto w praktyce stwierdza fikcję zapoznania i co musi być zapisane?** — Owner: user (pytanie do mentorów DSC). Block: no (przyjęte przez autora 2026-11-21: stwierdza sam oceniający, kadry widzą wpis).
5. **Długość slotu pokazu** — znana 2026-11-22 o 14:45. Przyjęte 3 minuty, z wersją 90 sekund i 5 minut.

## Forward: tech stack

- Język i środowisko: TypeScript na Bun. Istnieje gotowy, przetestowany silnik wyniku oceny i terminów w TypeScript (do skopiowania).
- Dane: jedna baza w pliku (`bun:sqlite`). Reguły prawne w pliku JSON z wersją i datą obowiązywania.
- Interfejs: HTML renderowany na serwerze, działa na telefonie i komputerze, styl do druku dla arkusza.
- Uruchomienie: jeden proces, jeden plik bazy, bez płatnych licencji; kontener jako opcja wdrożeniowa.
- Zespół: jedna osoba z agentem, ok. 11 godzin pracy, termin 2026-11-22 11:00.
- Bez CI/CD; bramką jest `bun test` i jeden przebieg pokazu.
