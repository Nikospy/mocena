# Pytanie HR partnera i przypomnienie o docenianiu — plan wdrożenia

## Overview

Moduł wirtualnego HR partnera bez modelu: jedno pytanie zamknięte po notatce z zaznaczoną zmianą zadań, karta rozmowy i jedna forma rozwoju po „tak”, ekran „Przed rozmową z pracownikiem” złożony z dat, pól i liczby notatek przełożonego, przypomnienie o docenianiu oraz ekran administratora „Skąd biorą się podpowiedzi”. Wszystko na regułach i zdaniach z szablonów; system nie czyta treści notatek.

## Current State Analysis

Plaster stoi na F-01, S-01, S-02 i S-04, których dziś w repo jeszcze nie ma (repo ma starter Hono i silnik z nazwami po polsku). Ten plan opisuje stan po ich wdrożeniu; dokładne nazwy, które zakłada, są w sekcji „Założenia wobec wcześniejszych plastrów”. Po S-04 istnieją: tabela `notes` z polem `task_change`, formularz notatki z polem „Zmiana zadań pracownika” wstępnie zaznaczanym przez adapter w `src/suggestions/`, przycisk „Przekaż pracownikowi” z datą wysłania informacji zwrotnej. Brakuje wszystkiego, co reaguje na te wpisy.

Treści potrzebne temu plastrowi nie istnieją (`context/foundation/demo.md`, sekcja „Czego jeszcze nie ma”): katalog form rozwoju, karta rozmowy po zmianie zadań, karta docenienia, pytania na ekranie „Przed rozmową”. Pisze je wdrażający agent bez przeglądu autora (decyzja 10e), słownictwem organizatora i prostą polszczyzną.

## Desired End State

1. Marek zapisuje z telefonu notatkę z zaznaczonym polem „Zmiana zadań pracownika” i od razu widzi pytanie „To stała zmiana zadań?” z odpowiedziami „Tak” i „Nie” oraz „Odpowiem później”. Po „Tak” widzi kartę „Rozmowa po zmianie zadań” i jedną formę rozwoju z katalogu. Notatka bez zaznaczenia nie wywołuje żadnego pytania. Odpowiedź zapisuje się tylko po kliknięciu.
2. Marek otwiera z ekranu cyklu Piotra „Przed rozmową z pracownikiem” i widzi: swoje notatki sprzed zmiany zadań i po niej, kryteria bez żadnej notatki, kiedy ostatnio przekazał Piotrowi informację zwrotną, zdanie o podwładnych, o których od dawna nie ma notatki (np. „O Marii nie masz jeszcze żadnej notatki.” z przyciskiem „Dopisz notatkę”). Każda pozycja ma pytanie albo proponowane działanie. Przy nazwisku pracownika nie ma etykiety, liczby ani wskaźnika.
3. Gdy od ostatniej rozmowy albo ostatniej informacji zwrotnej minęło więcej dni niż w ustawieniu urzędu, Marek widzi na ekranie startowym przypomnienie o docenianiu z kartą docenienia. Wysłanie informacji zwrotnej (S-04) je zeruje.
4. Administrator widzi ekran „Skąd biorą się podpowiedzi”: tabela sześciu miejsc z decyzji 9, które źródło działa teraz, lista „Czego model nigdy nie robi” i warunki wspólne.

### Key Discoveries:

- Wersja pokazu 90 sekund ma kroki 1, 4 i 5, bez kroku 2. Podział notatek na „przed” i „po” zmianie zadań w kroku 4 nie może więc zależeć od odpowiedzi „Tak” klikniętej w kroku 2. Granicą jest data najwcześniejszej notatki z polem `task_change`, chyba że przełożony odpowiedział na nią „Nie” (`context/foundation/demo.md`, „Wersja 90 sekund”).
- System nie czyta tekstu, więc nie wie, że zmiana zaszła 9.03.2026. Granica to data notatki: 11.03.2026. Notatka z 11.03.2026 trafia do grupy „po zmianie”.
- Notatka z 18.06.2026 („dobrze”, Komunikacja) jest w danych po to, żeby karta docenienia miała co zaproponować do przekazania.
- Zdania po polsku wymagają odmiany imion („z Piotrem”, „o Marii”, „Piotrowi”). Bez modelu odmiana pochodzi z małego pliku form imion dla osób z danych pokazowych, z bezpiecznym zdaniem zastępczym w mianowniku.
- Decyzja 10k sama używa w przykładzie liczby („od 6 miesięcy”). Liczba może wystąpić w zdaniu o tym, czego nie zrobił przełożony; zakaz dotyczy liczb i etykiet przy nazwisku (liczba notatek, wynik, wskaźnik).

## What We're NOT Doing

- Rozpoznawania sygnałów z treści notatek, wskaźnika motywacji, etykiet typu „ryzyko odejścia”, analizy nieobecności, porównywania pracowników, liczby notatek przy nazwisku (decyzje 2, 3, 10k).
- Formularza notatki, listy słów, adaptera podpowiedzi, wysyłki informacji zwrotnej (S-04). Ten plaster tylko czyta ich wyniki i zmienia jedno przekierowanie po zapisie notatki.
- Karty rozmowy rozpoczynającej (S-01) i oceniającej (S-04, FR-017). Ekran „Przed rozmową” tylko do nich linkuje, jeśli istnieją.
- Zapisu formy rozwoju do wniosków rozwojowych oceny; forma jest pokazana, a przełożony sam przenosi ją do arkusza (S-04, FR-021).
- Pola „Od kiedy obowiązuje zmiana” przy odpowiedzi „Tak” (patrz „Open questions”).
- Gałęzi modelu w adapterze (decyzja 10l, S-04, tylko jeśli zostanie czas).
- Stylów: wygląd pochodzi z design systemu autora (decyzja 10b, zasada 10 w `AGENTS.md`).

## Implementation Approach

Cztery fazy. Najpierw czysta logika w `src/hr-partner/` z testami jednostkowymi na danych pokazowych, bez HTML. Wszystkie odczyty tabel innych plastrów idą przez jeden plik `src/hr-partner/data.ts`; jeśli wcześniejszy plaster nazwał coś inaczej, poprawka jest w jednym miejscu. Każda funkcja dostaje `today` jako parametr i pomija wiersze z datą późniejszą (decyzja 10i). Treści leżą w plikach JSON, nie w kodzie: progi i katalog form w `rules/office-settings.json` (oznaczone „ustawienie urzędu”), teksty kart i pytań w `content/cards.json`, tabela miejsc z decyzji 9 w `content/suggestion-sources.json`, formy imion w `content/name-forms.json`.

Jedyny zapis tego plastra to zdarzenie `task_change_answered` w tabeli `events`, powstające wyłącznie z `POST` po kliknięciu. Ekrany używają wspólnego układu `src/views/layout.tsx` i komponentów design systemu; plan nie projektuje wyglądu.

**Kolejność cięcia** (gdy brakuje czasu; kroki 2 i 4 pokazu muszą działać): 1) lista notatek „dobrze” do przekazania w karcie docenienia (zostaje samo zdanie i karta); 2) przypomnienie o docenianiu na ekranie startowym (zostaje pozycja „ostatnia informacja zwrotna” na ekranie „Przed rozmową”); 3) kolumna „Teraz działa” na ekranie „Skąd biorą się podpowiedzi” (zostaje statyczna tabela z decyzji 9); 4) pytanie dla nieodpowiedzianej notatki na ekranie „Przed rozmową”. Nie tniemy: pytania po notatce, karty po „Tak”, podziału przed/po, kryteriów bez notatek, zdania o podwładnych bez notatek.

## Critical Implementation Details

- **Granica zmiany zadań.** `taskChangeBoundary(cycle, notes, answers)` zwraca datę najwcześniejszej notatki przełożonego o tym pracowniku w okresie cyklu z `task_change = 1`, której ostatnia odpowiedź nie jest `no`. Brak takiej notatki: ekran nie dzieli notatek i nie pokazuje sekcji zmiany zadań.
- **Pytanie zaległe.** Na ekranie „Przed rozmową” pytanie „To stała zmiana zadań?” pojawia się przy notatce z `task_change = 1` bez odpowiedzi tylko wtedy, gdy w cyklu nie ma jeszcze odpowiedzi `yes`. Dzięki temu wgrana notatka z 11.03.2026 nie dubluje pytania po odpowiedzi na żywo w kroku 2.
- **Forma rozwoju.** `pickDevelopmentForm(criterionId)`: pierwsza forma z katalogu, której lista `criteria` zawiera kryterium notatki; w przeciwnym razie forma z `default: true`. To jest miejsce 5 z decyzji 9 („dopasowuje formę rozwoju z katalogu”), dziś na regule.
- **Przypomnienie o docenianiu.** Kotwica = późniejsza z dat: ostatnia rozmowa w cyklu (potwierdzenie części I z S-01, a gdy go nie ma, początek cyklu) i ostatnia wysłana informacja zwrotna (S-04). Przypomnienie, gdy `today - kotwica >= appreciationReminderDays`. Zdanie: „Od {data} nie przekazałeś {imię w celowniku} żadnej informacji zwrotnej.”
- **Podwładni bez notatek.** Dla każdego podwładnego przełożonego poza osobą z bieżącego ekranu: brak notatek przełożonego o nim → „O {imię w miejscowniku} nie masz jeszcze żadnej notatki.”; ostatnia notatka starsza niż `teamSilenceMonths` pełnych miesięcy → „O {imię w miejscowniku} nie masz żadnej notatki od {n} miesięcy.” Obie z przyciskiem „Dopisz notatkę”. Liczba notatek nigdy nie jest pokazana.
- **Odmiana imion.** `nameForm(person, case)` czyta `content/name-forms.json` (klucz: imię, przypadki `gen`, `dat`, `ins`, `loc`). Brak wpisu: zdanie zastępcze bez odmiany, np. „Nie masz żadnej notatki o osobie: {imię i nazwisko}.”
- **Kto widzi.** „Przed rozmową” tylko oceniający cyklu, i tylko własne notatki (notatki widzi tylko autor). „Skąd biorą się podpowiedzi” tylko konto administratora. Inne konta: 403.

## Założenia wobec wcześniejszych plastrów

Jeśli wdrożony plaster ma inną nazwę, wdrażający poprawia tylko `src/hr-partner/data.ts` i wpisuje rozbieżność w `## Notes` pliku `change.md`.

- **F-01:** tabele `people` (`id`, `first_name`, `last_name`, `role` z wartością dla administratora, `supervisor_id`), `cycles` (`id`, `employee_id`, `evaluator_id`, `start_date`, `due_date`), `cycle_criteria` (`cycle_id`, `criterion_id`), `events` (`id`, `type`, `cycle_id`, `actor_id`, `date`, `payload` JSON), `settings`; `today()`, `rulesVersion()`, `src/db.ts` (połączenie), `src/views/layout.tsx`; bieżące konto z ciasteczka dostępne w trasach przez wspólny helper F-01 (dalej `currentPerson(c)`); konto administratora; ekran startowy `GET /` z listą spraw, do której można dopisać pozycje.
- **S-01:** lista wszystkich kryteriów cyklu (obowiązkowe z arkusza i wybrane dodatkowe) przez funkcję w rodzaju `getCycleCriteria(cycleId): { id, name }[]`; zdarzenie potwierdzenia części I w `events` (zakładany typ `part_one_confirmed`) z datą rozmowy; ekran cyklu `GET /cycles/:id`, na którym ten plaster dodaje link „Przed rozmową z pracownikiem”; `rules/office-settings.json` (S-01 dodaje tabelę „rodzaj obowiązku → kryterium”, ten plaster dopisuje swoje klucze); `content/cards.json` (S-01 dodaje kartę rozmowy rozpoczynającej).
- **S-02:** nic poza tym, że cykl istnieje i ma oceniającego.
- **S-04:** tabela `notes` (`id`, `author_id`, `person_id`, `criterion_id`, `date`, `text`, `rating` z wartościami „dobrze”/„do poprawy”, `task_change` 0/1); informacja zwrotna z datą wysłania (zakładana tabela `feedback` z `note_id`, `author_id`, `employee_id`, `sent_on`); `POST` zapisu notatki z jednym miejscem przekierowania po zapisie; trasa nowej notatki o osobie (zakładana `GET /notes/new?person=:id`) dla przycisku „Dopisz notatkę”; trasa „Przekaż pracownikowi” dla notatki (zakładana `GET /notes/:id/feedback`); adapter `src/suggestions/` z funkcją zwracającą aktywne źródło `rules` | `local-model` | `none` (zakładana `activeSource()`); karta rozmowy oceniającej w `content/cards.json` (link z „Przed rozmową”, jeśli jest); dane pokazowe z `context/foundation/demo.md` łącznie z notatką z 11.03.2026 (`task_change = 1`) i notatką z 12.11.2026.

## Co ten plaster udostępnia

- **Zdarzenie** `task_change_answered` w `events`: `cycle_id`, `actor_id` (oceniający), `date` = `today()`, `payload` `{ "noteId": number, "answer": "yes" | "no", "developmentFormId": string | null }`.
- **Funkcje** w `src/hr-partner/`: `taskChangeBoundary(cycleId, today): string | null` (data ISO), `beforeMeetingSummary(cycleId, viewerId, today)`, `appreciationReminder(evaluatorId, employeeId, today): { since: string } | null`, `teamWithoutNotes(evaluatorId, exceptPersonId, today)`, `pickDevelopmentForm(criterionId)`, `nameForm(person, case)`. S-06 (historia, wydruk) i S-03 (oś czasu) mogą pokazać datę granicy i odpowiedź „Tak” jako zdarzenie cyklu.
- **Trasy:** `GET /notes/:noteId/task-change`, `POST /notes/:noteId/task-change`, `GET /cycles/:id/before-meeting`, `GET /cycles/:id/appreciation`, `GET /admin/suggestion-sources`.
- **Pliki treści:** klucze `developmentForms`, `appreciationReminderDays`, `teamSilenceMonths` w `rules/office-settings.json`; klucze `taskChange`, `appreciation`, `beforeMeeting` w `content/cards.json`; `content/suggestion-sources.json`; `content/name-forms.json` (formy imion osób z danych pokazowych, do użycia przez inne plastry).

## Phase 1: Treści i logika partnera

### Changes Required:

#### 1. Ustawienia urzędu i treści

**File**: `rules/office-settings.json`, `content/cards.json`, `content/suggestion-sources.json`, `content/name-forms.json`

**Intent**: Dopisać katalog 4–6 form rozwoju (nazwa, jedno zdanie opisu, lista kryteriów, jedna forma `default: true`, np. szkolenie stanowiskowe z nowego zakresu zadań), próg `appreciationReminderDays` (90) i `teamSilenceMonths` (6), z polem `label: "ustawienie urzędu"`. Napisać karty: „Rozmowa po zmianie zadań” (cel, 4–5 pytań o priorytety, to, co można odłożyć, czego pracownik potrzebuje, kiedy kolejna rozmowa; trudna sytuacja: pracownik mówi, że nie zdąży), „Docenienie” (po co, jak powiedzieć o konkretnym fakcie, czego unikać), pytania do pozycji ekranu „Przed rozmową”. Tabela sześciu miejsc, lista „Czego model nigdy nie robi” i warunki wspólne przepisane z decyzji 9. Formy imion dla Piotra, Ewy, Marii, Tomasza i pozostałych osób z danych. Słownictwo organizatora („indywidualny program rozwoju zawodowego”, „informacja zwrotna”, „potwierdzenie”, nigdy „podpis”), zdania krótkie, w drugiej osobie do przełożonego, bez ocen o pracowniku.

**Contract**: Pliki są poprawnym JSON; każda karta ma `title`, `purpose`, `questions[]`; każda forma ma `id`, `name`, `description`, `criteria[]`.

#### 2. Logika partnera

**File**: `src/hr-partner/data.ts`, `src/hr-partner/partner.ts`, `src/hr-partner/partner.test.ts`

**Intent**: `data.ts` to jedyne miejsce, które czyta tabele innych plastrów (notatki autora o osobie do daty, odpowiedzi, kryteria cyklu, data rozmowy, data ostatniej informacji zwrotnej, podwładni). `partner.ts` to czyste funkcje na tych danych: granica zmiany zadań, podział notatek, kryteria bez notatek, kryteria z notatkami po obu stronach granicy, przypomnienie o docenianiu, podwładni bez notatek, wybór formy rozwoju, forma imienia. Każda pozycja zestawienia ma pole `prompt` (pytanie) albo `action` (etykieta i adres przycisku), nigdy żadnego wyniku o pracowniku.

**Contract**: Funkcje z sekcji „Co ten plaster udostępnia”; `beforeMeetingSummary` zwraca `{ boundary, before[], after[], bothSides[], pendingQuestion, criteriaWithoutNotes[], feedback, team[] }`, gdzie każdy element ma `prompt` albo `action`.

### Success Criteria:

#### Automated Verification:

- Testy logiki partnera na danych pokazowych przechodzą: `bun test src/hr-partner`
- Pliki treści i ustawień są poprawnym JSON: `bun test` (test ładujący pliki)

#### Manual Verification:

- Treści kart i pytań czytają się prostą polszczyzną i nie zawierają oceny pracownika

## Phase 2: Pytanie po notatce i karta po „Tak”

### Changes Required:

#### 1. Trasy pytania

**File**: `src/routes/hr-partner.tsx`, `src/views/task-change-question.tsx`, `src/views/task-change-card.tsx`, miejsce przekierowania w trasie zapisu notatki z S-04

**Intent**: Po zapisie notatki z `task_change = 1` trasa S-04 przekierowuje na `GET /notes/:noteId/task-change`; bez zaznaczenia przekierowanie zostaje bez zmian. Ekran pytania: jedno zdanie „To stała zmiana zadań?”, krótkie wyjaśnienie, dlaczego partner pyta („Zaznaczyłeś przy notatce zmianę zadań”), przyciski „Tak” i „Nie” (formularz `POST`) oraz link „Odpowiem później”. Na 360 px przyciski mieszczą się w jednym widoku bez przewijania. `POST` zapisuje `task_change_answered` i dla „Tak” pokazuje kartę „Rozmowa po zmianie zadań” z jedną formą rozwoju, dopiskiem „Katalog form rozwoju: ustawienie urzędu” i zdaniem z podstawą prawną: „Jeśli to zmiana stanowiska z istotną zmianą obowiązków, prawo wymaga nowej rozmowy o kryteriach albo oceny. Sprawdź terminy z kadrami” (art. 81 ust. 6 ustawy, § 9 ust. 1–2 rozporządzenia; decyzja 11e); dla „Nie” krótkie potwierdzenie i powrót. `GET` niczego nie zapisuje. Tylko autor notatki może odpowiedzieć.

**Contract**: `GET /notes/:noteId/task-change` → 200 dla autora notatki z `task_change = 1`, 404 dla notatki bez zaznaczenia, 403 dla innego konta; `POST` z `answer=yes|no` → 200 z kartą albo potwierdzeniem i jednym nowym wierszem w `events`.

### Success Criteria:

#### Automated Verification:

- Notatka z zaznaczeniem prowadzi do pytania, a notatka bez zaznaczenia nie: `bun test src/routes/hr-partner.test.ts`
- `GET` pytania nie dodaje wiersza do `events`, a `POST` dodaje dokładnie jeden: `bun test src/routes/hr-partner.test.ts`

#### Manual Verification:

- Krok 2 pokazu na telefonie 360 px: notatka, pytanie, „Tak”, karta i forma rozwoju; druga notatka bez pola nie wywołuje pytania

## Phase 3: Ekran „Przed rozmową” i przypomnienie o docenianiu

### Changes Required:

#### 1. Ekran „Przed rozmową z pracownikiem”

**File**: `src/routes/hr-partner.tsx`, `src/views/before-meeting.tsx`, link na ekranie cyklu z S-01

**Intent**: `GET /cycles/:id/before-meeting` dla oceniającego cyklu. Tytuł „Przed rozmową z {imię w narzędniku}”. Sekcje w tej kolejności: zmiana zadań (zdanie „Zaznaczyłeś zmianę zadań w notatce z {data}.”, notatki sprzed i po, pod nimi pytanie przy każdym kryterium z notatkami po obu stronach, np. „Przy kryterium „Rzetelność” masz notatki sprzed zmiany zadań i po niej. Zapytaj, co się zmieniło po przejęciu nowych zadań.”; ewentualne zaległe pytanie z przyciskami jak w fazie 2); kryteria bez żadnej notatki z pytaniem do rozmowy i przyciskiem „Dopisz notatkę”; ostatnia informacja zwrotna (zdanie z datą albo „Od rozmowy {data} nie przekazałeś {imię w celowniku} żadnej informacji zwrotnej.” z przyciskiem do karty docenienia); zespół (zdania z decyzji 10k z przyciskiem „Dopisz notatkę”); na końcu link do karty rozmowy oceniającej, jeśli S-04 ją dodał. Każda notatka pokazuje datę, kryterium, pole „dobrze / do poprawy” i tekst przełożonego, bez żadnych dopisków systemu. Sekcja bez danych znika (bez pustych nagłówków). Każde ustawienie urzędu pokazane w zdaniu ma dopisek „ustawienie urzędu”.

**Contract**: `GET /cycles/:id/before-meeting` → 200 dla oceniającego, 403 dla innych; odpowiedź nie zawiera słów z listy zakazanej w teście (`ryzyk`, `wskaźnik`, `motywac`, `ranking`, `%`) ani liczby notatek przy nazwisku.

#### 2. Przypomnienie i karta docenienia

**File**: `src/routes/hr-partner.tsx`, `src/views/appreciation.tsx`, lista spraw ekranu startowego F-01

**Intent**: Na ekranie startowym oceniającego jedna pozycja na podwładnego z należnym przypomnieniem (zdanie z kotwicą, link do karty). `GET /cycles/:id/appreciation` pokazuje kartę „Docenienie” i notatki „dobrze” od kotwicy, których przełożony jeszcze nie przekazał, każda z przyciskiem „Przekaż pracownikowi” prowadzącym do trasy S-04. Wysłanie informacji zwrotnej przesuwa kotwicę, więc przypomnienie znika bez dodatkowego kodu.

**Contract**: `GET /cycles/:id/appreciation` → 200 dla oceniającego; po wysłaniu informacji zwrotnej z datą `today()` `appreciationReminder` zwraca `null`.

### Success Criteria:

#### Automated Verification:

- Ekran „Przed rozmową” dla Piotra przy dacie 2026-11-20 pokazuje podział na 11.03.2026, kryterium „Myślenie analityczne” bez notatek i zdanie o Marii: `bun test src/routes/hr-partner.test.ts`
- Ekran nie zawiera słów z listy zakazanej ani liczby notatek przy nazwisku: `bun test src/routes/hr-partner.test.ts`
- Przypomnienie o docenianiu znika po wysłaniu informacji zwrotnej: `bun test src/hr-partner`

#### Manual Verification:

- Ekran „Przed rozmową z Piotrem” przejrzany wiersz po wierszu: przy żadnym nazwisku nie ma etykiety, liczby ani wskaźnika; każda pozycja ma pytanie albo działanie
- Krok 4 pokazu na komputerze 1440 px czyta się w kilka sekund

## Phase 4: Ekran „Skąd biorą się podpowiedzi”

### Changes Required:

#### 1. Ekran administratora

**File**: `src/routes/admin.tsx`, `src/views/suggestion-sources.tsx`

**Intent**: `GET /admin/suggestion-sources` tylko dla konta administratora. Zdanie wstępne: prototyp działa na regułach, urząd może w tych miejscach włączyć model uruchomiony u siebie. Tabela sześciu miejsc z `content/suggestion-sources.json` (miejsce, co robiłby model w tle, w prototypie) i nad nią „Teraz działa: reguły” z adaptera S-04. Pod tabelą lista „Czego model nigdy nie robi” i warunki wspólne z decyzji 9. Link do ekranu na ekranie startowym administratora.

**Contract**: `GET /admin/suggestion-sources` → 200 dla administratora, 403 dla innych kont; zawiera sześć wierszy i cztery pozycje listy „Czego model nigdy nie robi”.

### Success Criteria:

#### Automated Verification:

- Ekran administratora ma sześć miejsc i listę „Czego model nigdy nie robi”, a inne konta dostają 403: `bun test src/routes/admin.test.ts`
- Cały zestaw testów przechodzi: `bun test`

#### Manual Verification:

- Ekran czytelny na 360 px i 1440 px we wspólnym układzie

## Testing Strategy

Testy jednostkowe `src/hr-partner/partner.test.ts` na danych pokazowych z `context/foundation/demo.md` (seed z S-04 albo te same wiersze wstawione w teście; kryteria cyklu Piotra z wybranymi w kroku 1 „Orientacja na klienta/interesanta” i „Myślenie analityczne”): granica 2026-03-11; po odpowiedzi „no” granicy nie ma; przy dacie 2026-03-10 granicy nie ma (decyzja 10i); „Rzetelność”, „Komunikacja” i „Współpraca” mają notatki po obu stronach (notatka z 11.03.2026 liczy się do „po”); „Myślenie analityczne” nie ma notatek; forma rozwoju dla „Współpracy” i forma domyślna dla kryterium spoza katalogu; przypomnienie przy dacie 2026-11-20 bez wysłanej informacji zwrotnej i jego brak po wysłaniu; Maria bez notatek daje zdanie „jeszcze żadnej”, Ewa z notatką z 03.09.2026 nie daje zdania. Trasy przez `app.request()` w `src/routes/hr-partner.test.ts` i `src/routes/admin.test.ts`: kody 200/403/404, zapis tylko po `POST`, brak pytania po notatce bez zaznaczenia, lista zakazana na ekranie „Przed rozmową”.

## Open questions

Każde ma domyślne rozstrzygnięcie; wdrażający stosuje je bez pytania i wpisuje w `## Notes` pliku `change.md`.

1. **Notatka z 11.03.2026 jest w danych, a w kroku 2 Marek pisze tę samą notatkę na żywo.** Przy dacie systemowej po 11.03.2026 będą dwie podobne notatki. Domyślnie: logika działa na obu (granica z najwcześniejszej, pytanie zaległe znika po „Tak”); prowadzący w kroku 2 ustawia datę 2026-03-10 i pisze krótszą notatkę o przejęciu kolejki. Rozstrzyga autor scenariusza.
2. **Data zmiany zadań.** Granica to data notatki (11.03.2026), nie dzień zmiany z tekstu (9.03.2026). Domyślnie: bez pola „Od kiedy” przy „Tak”; dodać je tylko, jeśli zostanie czas.
3. **Imiona w przypadkach zależnych.** Domyślnie: `content/name-forms.json` w tym plastrze zamiast nowych kolumn w `people`.
4. **„Dopisz notatkę” dla Marii, która może nie mieć cyklu.** Domyślnie: link do formularza notatki o osobie z S-04; jeśli S-04 wymaga cyklu, przycisk prowadzi do ekranu startowego, a zdanie zostaje.
5. **Progi.** Domyślnie 90 dni dla przypomnienia o docenianiu i 6 miesięcy dla podwładnych bez notatek (przykład z decyzji 10k), oba jako „ustawienie urzędu”.
6. **Liczba w zdaniu „od 6 miesięcy”.** Domyślnie dozwolona, bo dotyczy przełożonego, nie pracownika (decyzja 10k sama jej używa); liczby notatek, wyniki i wskaźniki przy nazwisku są zakazane.

## References

- `context/foundation/decisions.md` (decyzje 2, 3, 9, 10e, 10i, 10j, 10k)
- `context/foundation/prd.md` (US-04, FR-015, FR-016, FR-035, FR-036, Access Control, Non-Goals)
- `context/foundation/roadmap.md` (S-05)
- `context/foundation/demo.md` (kroki 2 i 4, wersja 90 sekund, „Ustalenia do scenariusza”, „Notatki do wgrania”, „Czego jeszcze nie ma”)
- `context/changes/rules-engine-and-demo-data/plan.md` (F-01)
- `AGENTS.md` (zasady 4, 5, 7, 8, 10)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Treści i logika partnera

#### Automated

- [ ] 1.1 Testy logiki partnera na danych pokazowych przechodzą: `bun test src/hr-partner`
- [ ] 1.2 Pliki treści i ustawień są poprawnym JSON: `bun test` (test ładujący pliki)

#### Manual

- [ ] 1.3 Treści kart i pytań czytają się prostą polszczyzną i nie zawierają oceny pracownika

### Phase 2: Pytanie po notatce i karta po „Tak”

#### Automated

- [ ] 2.1 Notatka z zaznaczeniem prowadzi do pytania, a notatka bez zaznaczenia nie: `bun test src/routes/hr-partner.test.ts`
- [ ] 2.2 `GET` pytania nie dodaje wiersza do `events`, a `POST` dodaje dokładnie jeden: `bun test src/routes/hr-partner.test.ts`

#### Manual

- [ ] 2.3 Krok 2 pokazu na telefonie 360 px: notatka, pytanie, „Tak”, karta i forma rozwoju; druga notatka bez pola nie wywołuje pytania

### Phase 3: Ekran „Przed rozmową” i przypomnienie o docenianiu

#### Automated

- [ ] 3.1 Ekran „Przed rozmową” dla Piotra przy dacie 2026-11-20 pokazuje podział na 11.03.2026, kryterium „Myślenie analityczne” bez notatek i zdanie o Marii: `bun test src/routes/hr-partner.test.ts`
- [ ] 3.2 Ekran nie zawiera słów z listy zakazanej ani liczby notatek przy nazwisku: `bun test src/routes/hr-partner.test.ts`
- [ ] 3.3 Przypomnienie o docenianiu znika po wysłaniu informacji zwrotnej: `bun test src/hr-partner`

#### Manual

- [ ] 3.4 Ekran „Przed rozmową z Piotrem” przejrzany wiersz po wierszu: przy żadnym nazwisku nie ma etykiety, liczby ani wskaźnika; każda pozycja ma pytanie albo działanie
- [ ] 3.5 Krok 4 pokazu na komputerze 1440 px czyta się w kilka sekund

### Phase 4: Ekran „Skąd biorą się podpowiedzi”

#### Automated

- [ ] 4.1 Ekran administratora ma sześć miejsc i listę „Czego model nigdy nie robi”, a inne konta dostają 403: `bun test src/routes/admin.test.ts`
- [ ] 4.2 Cały zestaw testów przechodzi: `bun test`

#### Manual

- [ ] 4.3 Ekran czytelny na 360 px i 1440 px we wspólnym układzie
