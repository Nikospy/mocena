# Pytanie HR partnera i przypomnienie o docenianiu — plan wdrożenia

## Overview

Moduł wirtualnego HR partnera bez modelu: jedno pytanie zamknięte po notatce z zaznaczoną zmianą zadań, karta rozmowy i jedna forma rozwoju po „tak”, ekran „Przed rozmową z pracownikiem” złożony z dat i pól notatek przełożonego, przypomnienie o docenianiu oraz ekran administratora „Skąd biorą się podpowiedzi”. Wszystko na regułach i zdaniach z szablonów; system nie czyta treści notatek. Przy nazwisku nie ma liczby notatek ani żadnego wskaźnika (decyzja 10k).

Najpierw powstaje **wersja minimalna** (fazy 1 i 2, ok. 50 minut): pytanie po notatce z kartą i jedną formą rozwoju, potem ekran „Przed rozmową”. Przypomnienie o docenianiu (faza 3) i ekran administratora (faza 4) powstają po niej i są pierwsze do cięcia.

## Current State Analysis

Plaster stoi na F-01, S-01, S-02 i S-04, których dziś w repo jeszcze nie ma (repo ma starter Hono i silnik z nazwami po polsku). Ten plan opisuje stan po ich wdrożeniu i używa wyłącznie nazw z rozdziału „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md` oraz nazw, które S-01 i S-04 udostępniają w swoich planach (lista w „Założenia wobec wcześniejszych plastrów”). Po S-04 istnieją: tabela `notes` z polem `task_change`, formularz notatki z polem „Zmiana zadań pracownika” wstępnie zaznaczanym przez adapter w `src/suggestions/index.ts`, a od fazy 3 S-04 także przycisk „Przekaż pracownikowi” z datą wysłania w `feedback_messages` (trasy `GET /notes/:id/feedback`, `POST /notes/:id/feedback` i `GET /feedback`, budowane i cięte razem; ta faza S-04 jest na jego liście cięcia). Domyślne dane zostawiają Piotra bez części I; część I Piotra po kroku 1 daje opcja `afterStep1` w `runSeed`. Brakuje wszystkiego, co reaguje na te wpisy.

Treści potrzebne temu plastrowi nie istnieją (`context/foundation/demo.md`, sekcja „Czego jeszcze nie ma”): katalog form rozwoju, karta rozmowy po zmianie zadań, karta docenienia, pytania na ekranie „Przed rozmową”. Pisze je wdrażający agent bez przeglądu autora (decyzja 10e), słownictwem organizatora i prostą polszczyzną.

## Desired End State

1. Marek zapisuje z telefonu notatkę z zaznaczonym polem „Zmiana zadań pracownika” i od razu widzi pytanie „To stała zmiana zadań?” z odpowiedziami „Tak” i „Nie” oraz „Odpowiem później”. Po „Tak” widzi kartę „Rozmowa po zmianie zadań” ze zdaniem o podstawie prawnej (decyzja 11e) i jedną formę rozwoju z katalogu. Notatka bez zaznaczenia nie wywołuje żadnego pytania. Odpowiedź zapisuje się tylko po kliknięciu.
2. Marek otwiera z ekranu wejściowego cyklu Piotra (`GET /cycles/:id/part1`) „Przed rozmową z pracownikiem” i widzi: swoje notatki sprzed zmiany zadań i po niej, kryteria bez żadnej notatki, kiedy ostatnio przekazał Piotrowi informację zwrotną, zdanie o podwładnych, o których od dawna nie ma notatki (np. „O Marii nie masz jeszcze żadnej notatki.” z przyciskiem „Dopisz notatkę”). Każda pozycja ma pytanie albo proponowane działanie. Przy nazwisku pracownika nie ma etykiety, liczby ani wskaźnika.
3. Gdy od ostatniej rozmowy albo ostatniej informacji zwrotnej minęło więcej dni niż w ustawieniu urzędu, Marek widzi na ekranie startowym przypomnienie o docenianiu z kartą docenienia. Wysłanie informacji zwrotnej (S-04) je zeruje.
4. Administrator widzi ekran „Skąd biorą się podpowiedzi”: tabela sześciu miejsc z decyzji 9, które źródło działa teraz, lista „Czego model nigdy nie robi” i warunki wspólne.

### Key Discoveries:

- Wersja pokazu 90 sekund ma kroki 1, 4 i 5, bez kroku 2. Podział notatek na „przed” i „po” zmianie zadań w kroku 4 nie może więc zależeć od odpowiedzi „Tak” klikniętej w kroku 2. Granicą jest data najwcześniejszej notatki z polem `task_change`, chyba że przełożony odpowiedział na nią „Nie” (`context/foundation/demo.md`, „Wersja 90 sekund”).
- Dwa warianty danych dają tę samą granicę 11.03.2026 (kontrakt, „Dane pokazowe”). Pełny pokaz i wersja 5-minutowa: `bun run seed -- --live-step-2` pomija wgraną notatkę z 11.03.2026, krok 2 idzie przy dacie systemowej 2026-03-11, a notatka napisana na żywo jest jedyną notatką ze zmianą zadań. Wersja 90-sekundowa: dane domyślne, granicę daje wgrana notatka z 11.03.2026, bez kliknięcia „Tak”.
- System nie czyta tekstu, więc nie wie, że zmiana zaszła 9.03.2026. Granica to data notatki: 11.03.2026. Notatka z 11.03.2026 trafia do grupy „po zmianie”.
- Notatka z 18.06.2026 (`rating = good`, Komunikacja) jest w danych po to, żeby karta docenienia miała co zaproponować do przekazania.
- Zdania po polsku wymagają odmiany imion („z Piotrem”, „o Marii”, „Piotrowi”). Bez modelu odmiana pochodzi z małego pliku form imion dla osób z danych pokazowych, z bezpiecznym zdaniem zastępczym w mianowniku. `people.name` to pełne imię i nazwisko; klucz w pliku form to pierwszy wyraz `people.name`.
- Decyzja 10k sama używa w przykładzie liczby („od 6 miesięcy”). Liczba może wystąpić w zdaniu o tym, czego nie zrobił przełożony; zakaz dotyczy liczb i etykiet przy nazwisku (liczba notatek, wynik, wskaźnik).
- Cykl osoby pochodzi tylko z `openCycle(personId)` (F-01). Maria nie ma w danych pokazowych żadnego cyklu, więc `openCycle` zwraca dla niej `null`, a notatka o niej ma `cycle_id = null`. Odpowiedź na pytanie przy takiej notatce zapisuje się jako `task_change_answered` z pustym `cycle_id` i jest odnajdywana przez `visibleEvents(null)` po `payload.noteId`; tak definiuje to kontrakt.

## What We're NOT Doing

- Rozpoznawania sygnałów z treści notatek, wskaźnika motywacji, etykiet typu „ryzyko odejścia”, analizy nieobecności, porównywania pracowników, liczby notatek przy nazwisku (decyzje 2, 3, 10k).
- Formularza notatki, listy słów, adaptera podpowiedzi, wysyłki informacji zwrotnej (S-04). Ten plaster tylko czyta ich wyniki przez funkcje S-04 i podmienia adres w `afterNoteSaved(note)`.
- Karty rozmowy rozpoczynającej (S-01) i oceniającej (S-04, FR-017). Ekran „Przed rozmową” tylko linkuje do `GET /cycles/:id/cards/assessment-conversation`.
- Zapisu formy rozwoju do wniosków rozwojowych oceny; forma jest pokazana, a przełożony sam przenosi ją do arkusza (S-04, FR-021).
- Pola „Od kiedy obowiązuje zmiana” przy odpowiedzi „Tak” (patrz „Open questions”).
- Gałęzi modelu w adapterze (decyzja 10l, S-04, tylko jeśli zostanie czas).
- Stylów: wygląd pochodzi z design systemu autora (decyzja 10b, zasada 10 w `AGENTS.md`).

## Implementation Approach

Cztery fazy; fazy 1 i 2 to wersja minimalna. Czysta logika w `src/hr-partner/partner.ts` z testami na danych pokazowych, bez HTML. Wszystkie odczyty cudzych danych idą przez jeden plik `src/hr-partner/data.ts`, który woła wyłącznie funkcje z kontraktu i z planów S-01 i S-04: notatki o osobie przez `notesAbout`, pojedynczą notatkę przez `noteById`, datę ostatniej informacji zwrotnej przez `lastFeedbackDate`, kryteria cyklu przez `cycleCriteria`, cykl osoby przez `openCycle(personId)`, zdarzenia przez `visibleEvents(cycleId)` (dla notatki bez cyklu `visibleEvents(null)`). Żadne zapytanie do tabel `notes` ani `feedback_messages` nie powstaje w tym plastrze. Funkcje S-04 zwracają tylko wiersze z datą `<= today()` (decyzja 10i); czyste funkcje w `partner.ts` dostają `today` jako parametr, żeby testy mogły sprawdzić granicę dnia.

Treści leżą w plikach JSON, nie w kodzie: progi i katalog form w `rules/office-settings.json` (oznaczone „ustawienie urzędu”, odczyt przez `officeSettings()`), teksty kart i pytań w `content/cards.json` pod kluczami `taskChange`, `appreciation`, `beforeMeeting` (odczyt przez `card(id)`), tabela miejsc z decyzji 9 w `content/suggestion-sources.json`, formy imion w `content/name-forms.json`. Dwa ostatnie pliki są wewnętrzne dla tego plastra. W plikach wspólnych plaster tylko dopisuje: klucze `taskChange`, `appreciation`, `beforeMeeting` w `content/cards.json` i klucze `developmentForms`, `appreciationReminderDays`, `teamSilenceMonths` w `rules/office-settings.json`, bez zmiany innych kluczy; w `src/index.tsx` dopisuje import i montowanie tras z `src/routes/hr-partner.tsx` i `src/routes/admin.tsx`; w `src/suggestions/index.ts` dopisuje wejście `suggestDevelopmentForm(note)`.

Podpowiedź formy rozwoju przechodzi przez jedno wymienne miejsce podpowiedzi (zasada 5): trasy wołają wyłącznie `suggestDevelopmentForm(note)` z `src/suggestions/index.ts`, które dziś owija wewnętrzną regułę `pickDevelopmentForm` z `src/hr-partner/partner.ts`.

Jedyny zapis tego plastra to zdarzenie `task_change_answered` przez `recordEvent`, powstające wyłącznie z `POST` po kliknięciu. Odnośniki: na ekranie wejściowym cyklu przez `registerCycleLinks`, na ekranie startowym przez `registerHomeTasks`. Ekrany używają wspólnego układu `src/views/layout.tsx` i komponentów design systemu; plan nie projektuje wyglądu.

**Kolejność cięcia** (gdy brakuje czasu; kroki 2 i 4 pokazu muszą działać). Najpierw zawsze powstaje wersja minimalna (fazy 1 i 2). Tniemy od końca:

1. Faza 4, ekran „Skąd biorą się podpowiedzi”: najpierw zostaje strona statyczna z tabelą sześciu miejsc i listą z decyzji 9, bez wiersza „Teraz działa” z `suggestionMode()`; przy dalszym braku czasu ekran wypada, a w `## Notes` pliku `change.md` zostaje wpis.
2. Faza 3, przycisk „Przekaż pracownikowi” przy notatkach w karcie docenienia. Warunek niezależny od czasu: przycisk i jego test powstają tylko wtedy, gdy w kodzie są wszystkie trzy trasy informacji zwrotnej S-04 (faza 3): `GET /notes/:id/feedback`, `POST /notes/:id/feedback` i `GET /feedback`. Bez tych tras karta nie ma tego działania i nie wpisuje adresu na sztywno.
3. Faza 3, lista notatek `good` do przekazania w karcie docenienia (zostaje samo zdanie i karta).
4. Faza 3 w całości: przypomnienie na ekranie startowym i karta docenienia. Zostaje zdanie o ostatniej informacji zwrotnej na ekranie „Przed rozmową” (faza 2), z pytaniem zamiast przycisku do karty.

Nie tniemy (wersja minimalna): pytania po notatce, karty po „Tak” z jedną formą rozwoju, podziału przed/po, kryteriów bez notatek, zdania o podwładnych bez notatek, odnośnika „Przed rozmową” na ekranie wejściowym cyklu.

## Critical Implementation Details

- **Granica zmiany zadań.** `taskChangeBoundary(notes, answers, cycle, today)` zwraca datę najwcześniejszej notatki przełożonego o tym pracowniku z datą od `cycles.period_start` do `today`, z `task_change = 1`, której ostatnia odpowiedź nie jest `no`. Kliknięcie „Tak” nie jest warunkiem. Brak takiej notatki: ekran nie dzieli notatek i nie pokazuje sekcji zmiany zadań.
- **Odpowiedzi.** Odpowiedź na notatkę to ostatnie (według `(date, id)`) zdarzenie `task_change_answered` z `payload.noteId` równym `notes.id`. Dla notatki z `cycle_id` zdarzenie ma ten sam `cycle_id`; dla notatki z `cycle_id = null` zdarzenie ma puste `cycle_id`. W obu przypadkach odczyt jest po `payload.noteId`, nigdy po samym `cycle_id`.
- **Pytanie zaległe.** Na ekranie „Przed rozmową” pytanie „To stała zmiana zadań?” pojawia się przy notatce z `task_change = 1` bez żadnej odpowiedzi, z tymi samymi przyciskami co w fazie 1. Ekran pokazuje tylko notatki oglądającego, więc przyciski zawsze wysyła autor notatki. W wersji 90-sekundowej pokazuje się więc przy wgranej notatce z 11.03.2026; w pełnym pokazie notatka z kroku 2 ma już odpowiedź „Tak” i pytania nie ma.
- **Forma rozwoju.** Trasy wołają tylko `suggestDevelopmentForm(note)` z `src/suggestions/index.ts`. Dziś to wejście owija wewnętrzne `pickDevelopmentForm(criterionId)`: pierwsza forma z katalogu `developmentForms`, której lista `criteria` zawiera kryterium notatki; w przeciwnym razie forma z `default: true`. W katalogu dokładnie jedna forma ma `default: true`. To jest miejsce 5 z decyzji 9 („dopasowuje formę rozwoju z katalogu”), dziś na regule; urząd podmienia je w tym jednym wejściu.
- **Data rozmowy.** Ostatnia rozmowa w cyklu to data zdarzenia `part1_submitted` (data rozmowy o kryteriach według S-01), a nie `part1_confirmed`, które jest potwierdzeniem ocenianego. Brak `part1_submitted`: kotwicą jest `cycles.period_start`.
- **Przypomnienie o docenianiu (faza 3).** Kotwica = późniejsza z dat: data rozmowy (wyżej) i `lastFeedbackDate(appraiserId, personId)`. Przypomnienie, gdy `today - kotwica >= appreciationReminderDays`. Zdanie: „Od {data} nie przekazałeś {imię w celowniku} żadnej informacji zwrotnej.” Notatki do przekazania w karcie: notatki przełożonego o pracowniku z `rating = good` i datą późniejszą niż kotwica; nie potrzeba odczytu pojedynczych wiadomości, bo kotwica zawiera już datę ostatniej wysłanej.
- **Przypomnienie a cykl.** Pozycję na ekranie startowym i kartę docenienia dostaje tylko podwładny z cyklem z `openCycle(personId)`, bo karta ma adres `/cycles/:id/appreciation`. Maria bez cyklu nie ma przypomnienia; ma tylko zdanie w sekcji zespołu.
- **Podwładni bez notatek.** Dla każdej osoby z `people.supervisor_id` = przełożony, poza osobą z bieżącego ekranu: brak notatek przełożonego o niej (`notesAbout(subjectId, { authorId })` puste) → „O {imię w miejscowniku} nie masz jeszcze żadnej notatki.”; najnowsza notatka starsza niż `teamSilenceMonths` pełnych miesięcy → „O {imię w miejscowniku} nie masz żadnej notatki od {n} miesięcy.” Obie z przyciskiem „Dopisz notatkę” do `GET /people/:personId/notes/new`, także dla Marii bez cyklu. Przycisk pokazuje się tylko, gdy `canWriteNoteAbout(viewer, subjectId)` z S-04 zwraca prawdę (po zmianie oceniającego przełożony, który nie jest oceniającym otwartego cyklu, widzi zdanie bez przycisku); test sprawdza oba przypadki. Liczba notatek nigdy nie jest pokazana.
- **Odmiana imion.** `nameForm(person, case)` czyta `content/name-forms.json` (klucz: pierwszy wyraz `people.name`, przypadki `gen`, `dat`, `ins`, `loc`). Brak wpisu: zdanie zastępcze bez odmiany, np. „Nie masz żadnej notatki o osobie: {people.name}.”
- **Kto widzi.** Pytanie po notatce i odpowiedź na nie: tylko autor notatki (`notes.author_id`), nie „oceniający cyklu”. Po zmianie oceniającego poprzedni oceniający zachowuje dostęp do pytania przy swojej notatce, a nowy go nie zyskuje. „Przed rozmową” i karta docenienia: tylko `cycles.appraiser_id` cyklu, i tylko własne notatki (`notesAbout` z `authorId` = oglądający). „Skąd biorą się podpowiedzi”: tylko konto z `people.role = 'admin'`. Inne konta: 403. Konto z `currentPerson(c)`.
- **Kody odpowiedzi (zasady wspólne tras).** Obie trasy `/notes/:noteId/task-change` czytają notatkę przez `noteById(noteId)` z S-04 i sprawdzają w tej kolejności: `null` (notatki nie ma albo jej data jest późniejsza niż `today()`) → 404; `notes.author_id` inny niż `currentPerson(c)` → 403; notatka bez `task_change = 1` → 404. Udany `POST` (zapisuje zdarzenie) odpowiada 303 na `GET /notes/:noteId/task-change`, który po odpowiedzi „Tak” pokazuje kartę z formą rozwoju, a po „Nie” krótkie potwierdzenie. `answer` spoza `yes` i `no`: 422 z formularzem pytania. Ponowny `POST` dla notatki, która ma już odpowiedź: 409. Żaden z tych błędów niczego nie zapisuje.

## Założenia wobec wcześniejszych plastrów

Wyłącznie nazwy z kontraktu wspólnego (F-01) oraz z sekcji „Co ten plaster udostępnia” planów S-01 i S-04. Gdy zbudowany kod różni się od kontraktu, wygrywa kod, poprawka jest tylko w `src/hr-partner/data.ts`, a rozbieżność trafia do `## Notes` pliku `change.md`.

- **F-01, tabele:** `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade, grade_awarded_on)` z rolami `appraiser`, `employee`, `hr`, `admin`; `cycles(id, person_id, appraiser_id, period_start, sheet)`; `events(id, type, cycle_id, actor_id, date, payload)` z pustym `cycle_id` dozwolonym.
- **F-01, funkcje:** `today()`, `currentPerson(c)`, `recordEvent(type, cycleId, actorId, payload)`, `visibleEvents(cycleId)` (porządek `(date, id)`, granica `date <= today()`; `visibleEvents(null)` zwraca zdarzenia bez cyklu), `openCycle(personId)` w `src/cycles.ts` (jedyne źródło cyklu osoby, `null` dla Marii), `registerHomeTasks(fn)` (lista `homeTasks(person)` na `GET /`), `registerCycleLinks(fn)` (lista `cycleLinks(cycle, person)` na `GET /cycles/:id/part1`), `createTestApp({ today, seedOptions })` w `src/test-helpers.ts`; układ `src/views/layout.tsx`; montowanie tras w `src/index.tsx`.
- **F-01, dane:** `bun run seed` (`runSeed(db, options)` w `src/seed.ts`) z opcjami `--after-step-1` (`afterStep1`) i `--live-step-2` (`liveStep2`, pomija wgraną notatkę z 11.03.2026); daty pokazu z kontraktu: krok 2 = 2026-03-11, krok 4 = 2026-11-21. Maria nie ma żadnego cyklu.
- **S-01:** zdarzenie `part1_submitted` (data zdarzenia = data rozmowy); `cycleCriteria(cycleId)` w `src/cycles/part1.ts`; ekran wejściowy cyklu `GET /cycles/:id/part1`; `rules/office-settings.json` z `officeSettings()` i `content/cards.json` z `card(id)` (ten plaster dopisuje klucze); moduł `src/seed/part1.ts`, który z opcją `afterStep1` wgrywa część I Piotra przekazaną i potwierdzoną 2024-12-09, z kryteriami dodatkowymi `orientacja-na-klienta` i `myslenie-analityczne`.
- **S-02:** nic poza tym, że cykl istnieje i ma oceniającego.
- **S-04:** tabela `notes` (`subject_id`, `cycle_id` może być null, `rating` = `good` | `needs_improvement` | null, `task_change` 0/1) i `feedback_messages`, czytane wyłącznie przez `notesAbout(subjectId, { authorId, from? })`, `noteById(id)` (notatka albo `null`, bez sprawdzania uprawnień w środku) i `lastFeedbackDate(authorId, recipientId)` z `src/notes/repo.ts`; `afterNoteSaved(note)` w `src/routes/notes.tsx` (adres przekierowania po zapisie); `suggestionMode()` z `src/suggestions/index.ts`, zwracające `rules`, `local-model` albo `none`; trasy `GET /people/:personId/notes/new`, `POST /people/:personId/notes` (notatka dostaje cykl z `openCycle`), `GET /cycles/:id/cards/assessment-conversation`; trasy `GET /notes/:id/feedback`, `POST /notes/:id/feedback` i `GET /feedback` tylko wtedy, gdy S-04 zbuduje swoją fazę 3 (powstają razem); moduł danych `src/seed/notes.ts` z 16 notatkami z `demo.md`.

## Co ten plaster udostępnia

Zgodnie z kontraktem wspólnym:

- **Zdarzenie** `task_change_answered` w `events`: `cycle_id` = `notes.cycle_id` (puste dla notatki bez cyklu), `actor_id` = autor notatki, `date` = `today()`, `payload` `{ noteId, answer, developmentFormId }`, gdzie `answer` to `"yes"` albo `"no"`, a `developmentFormId` to identyfikator formy z katalogu albo `null`. S-06 i S-03 mogą pokazać je jako zdarzenie cyklu.
- **Trasy:** `GET/POST /notes/:noteId/task-change`, `GET /cycles/:id/before-meeting`, `GET /cycles/:id/appreciation`, `GET /admin/suggestion-sources`.
- **Klucze w plikach wspólnych:** `taskChange`, `appreciation`, `beforeMeeting` w `content/cards.json`; `developmentForms`, `appreciationReminderDays`, `teamSilenceMonths` w `rules/office-settings.json`. Inne klucze zostają bez zmian.
- **Wejście podpowiedzi:** `suggestDevelopmentForm(note)` w `src/suggestions/index.ts`.
- **Montowanie:** import i montowanie tras w `src/index.tsx`.

Funkcje w `src/hr-partner/` (`taskChangeBoundary`, `beforeMeetingSummary`, `appreciationReminder`, `teamWithoutNotes`, `pickDevelopmentForm`, `nameForm`) oraz pliki `content/suggestion-sources.json` i `content/name-forms.json` są wewnętrzne; inne plastry na nich nie polegają.

## Phase 1: Pytanie po notatce i karta po „Tak” (wersja minimalna, ok. 25 min)

### Changes Required:

#### 1. Treści do pytania

**File**: `rules/office-settings.json`, `content/cards.json`

**Intent**: Dopisać katalog 4–6 form rozwoju `developmentForms` (nazwa, jedno zdanie opisu, lista kryteriów, jedna forma `default: true`, np. szkolenie stanowiskowe z nowego zakresu zadań) z polem `label: "ustawienie urzędu"`. Napisać kartę `taskChange` „Rozmowa po zmianie zadań”: cel, 4–5 pytań o priorytety, to, co można odłożyć, czego pracownik potrzebuje, kiedy kolejna rozmowa; trudna sytuacja: pracownik mówi, że nie zdąży; zdanie z podstawą prawną z decyzji 11e. Słownictwo organizatora („indywidualny program rozwoju zawodowego”, „informacja zwrotna”, „potwierdzenie”, nigdy „podpis”), zdania krótkie, w drugiej osobie do przełożonego, bez ocen o pracowniku.

**Contract**: Pliki są poprawnym JSON; karta ma kształt kart z S-01 (`title`, `purpose`, `questions[]`); każda forma ma `id`, `name`, `description`, `criteria[]`; dokładnie jedna forma ma `default: true`. Dopisane są tylko nowe klucze, istniejące zostają bez zmian.

#### 2. Logika, odczyty i wejście podpowiedzi

**File**: `src/hr-partner/data.ts`, `src/hr-partner/partner.ts`, `src/hr-partner/partner.test.ts`, `src/suggestions/index.ts`

**Intent**: `data.ts`: notatka po `id` przez `noteById(noteId)` z S-04 (bez sprawdzania uprawnień; autora sprawdza trasa po `notes.author_id`), odpowiedzi `task_change_answered` dla notatki przez `visibleEvents(note.cycle_id)` (dla `null` zdarzenia bez cyklu), filtrowane po `payload.noteId`. `partner.ts`: wewnętrzne `pickDevelopmentForm`, ostatnia odpowiedź na notatkę. `src/suggestions/index.ts`: dopisane wejście `suggestDevelopmentForm(note)`, które woła `pickDevelopmentForm(note.criterion_id)`.

**Contract**: Odczyt odpowiedzi działa tak samo dla notatki z cyklem i bez cyklu (po `payload.noteId`). `suggestDevelopmentForm(note)` zwraca jedną formę z katalogu, nigdy `null`. Test sprawdza, że w `developmentForms` jest dokładnie jedna forma z `default: true`, i pada przy zerze albo dwóch.

#### 3. Trasy pytania

**File**: `src/routes/hr-partner.tsx`, `src/views/task-change-question.tsx`, `src/views/task-change-card.tsx`, `afterNoteSaved(note)` w `src/routes/notes.tsx`, montowanie w `src/index.tsx`

**Intent**: `afterNoteSaved(note)` zwraca `/notes/:noteId/task-change` dla notatki z `task_change = 1`; dla pozostałych adres S-04 zostaje bez zmian. Ekran pytania: jedno zdanie „To stała zmiana zadań?”, krótkie wyjaśnienie, dlaczego partner pyta („Zaznaczyłeś przy notatce zmianę zadań”), przyciski „Tak” i „Nie” (formularz `POST`) oraz link „Odpowiem później”. Na 360 px przyciski mieszczą się w jednym widoku bez przewijania. `POST` zapisuje `task_change_answered` przez `recordEvent('task_change_answered', note.cycle_id, note.author_id, { noteId, answer, developmentFormId })` (aktor to autor notatki, który jest zalogowaną osobą; nie bieżący oceniający cyklu), gdzie `developmentFormId` dla „Tak” pochodzi z `suggestDevelopmentForm(note)`, a dla „Nie” jest `null`, i odpowiada 303 na `GET /notes/:noteId/task-change`. `GET` notatki z odpowiedzią „Tak” pokazuje kartę „Rozmowa po zmianie zadań” z jedną formą rozwoju, dopiskiem „Katalog form rozwoju: ustawienie urzędu” i zdaniem z podstawą prawną: „Jeśli to zmiana stanowiska z istotną zmianą obowiązków, prawo wymaga nowej rozmowy o kryteriach albo oceny. Sprawdź terminy z kadrami” (art. 81 ust. 6 ustawy, § 9 ust. 1–2 rozporządzenia; decyzja 11e); dla „Nie” krótkie potwierdzenie i powrót; bez odpowiedzi pytanie. `GET` niczego nie zapisuje. Tylko autor notatki (`notes.author_id`) może zobaczyć pytanie i odpowiedzieć, także po zmianie oceniającego; nowy oceniający dostaje 403. Trasy montuje dopisany import w `src/index.tsx`.

**Contract**: `GET /notes/:noteId/task-change` → 200 dla autora notatki z `task_change = 1` (pytanie, karta albo potwierdzenie według odpowiedzi), 404, gdy `noteById` zwraca `null` albo notatka nie ma zaznaczenia, 403 dla konta innego niż `notes.author_id`. `POST` z `answer=yes|no` → 303 na `GET /notes/:noteId/task-change` i jeden nowy wiersz w `events` z `actor_id = notes.author_id`; inna wartość `answer` → 422 bez zapisu; brak notatki → 404 bez zapisu; inne konto → 403 bez zapisu; notatka z odpowiedzią → 409 bez zapisu. Dla notatki z `cycle_id = null` nowy wiersz ma puste `cycle_id` i `payload.noteId` = id notatki.

### Success Criteria:

#### Automated Verification:

- Notatka z zaznaczeniem prowadzi do pytania, a notatka bez zaznaczenia nie (`createTestApp({ today: '2026-03-11', seedOptions: { afterStep1: true, liveStep2: true } })`): `bun test src/routes/hr-partner.test.ts`
- `GET` pytania nie dodaje wiersza do `events`; `POST` dodaje dokładnie jeden z `actor_id` = autor notatki i odpowiada 303; błędne `answer` daje 422, nieistniejąca notatka 404, cudze konto 403 (także oceniający cyklu, który nie jest autorem: test ustawia `cycles.appraiser_id` cyklu Piotra na Annę i Anna dostaje 403, a Marek dalej odpowiada), powtórny `POST` 409, wszystkie bez zapisu: `bun test src/routes/hr-partner.test.ts`
- Odpowiedź na notatkę o Marii (bez cyklu) zapisuje zdarzenie z pustym `cycle_id` i jest odnajdywana przez `visibleEvents(null)` po `payload.noteId`; test sam zapisuje tę notatkę przez `POST /people/:personId/notes` na danych F-01, S-01 i S-04, bez danych dokładanych przez późniejsze plastry: `bun test src/routes/hr-partner.test.ts`
- `suggestDevelopmentForm` daje formę dla „Współpracy” i formę domyślną dla kryterium spoza katalogu; w `developmentForms` jest dokładnie jedna forma z `default: true` (test pada przy zerze i przy dwóch); pliki treści są poprawnym JSON: `bun test src/hr-partner`

#### Manual Verification:

- Krok 2 pokazu na telefonie 360 px (dane z `bun run seed -- --after-step-1 --live-step-2` albo z odtworzonym krokiem 1, data systemowa 2026-03-11): notatka, pytanie, „Tak”, karta ze zdaniem o podstawie prawnej i forma rozwoju; druga notatka bez pola nie wywołuje pytania
- Karta „Rozmowa po zmianie zadań” czyta się prostą polszczyzną i nie zawiera oceny pracownika

## Phase 2: Ekran „Przed rozmową z pracownikiem” (wersja minimalna, ok. 25 min)

### Changes Required:

#### 1. Treści i logika ekranu

**File**: `content/cards.json`, `rules/office-settings.json`, `content/name-forms.json`, `src/hr-partner/data.ts`, `src/hr-partner/partner.ts`, `src/hr-partner/partner.test.ts`

**Intent**: Klucz `beforeMeeting` w `content/cards.json` z pytaniami do pozycji ekranu; próg `teamSilenceMonths` (6) z `label: "ustawienie urzędu"`; formy imion dla Piotra, Ewy, Marii, Tomasza i pozostałych osób z danych. `data.ts` dokłada: notatki przełożonego o osobie od `period_start` (`notesAbout(personId, { authorId, from: period_start })`), kryteria cyklu (`cycleCriteria`), datę rozmowy (`part1_submitted` z `visibleEvents(cycleId)`), `lastFeedbackDate`, podwładnych (`people.supervisor_id`) i ich najnowszą notatkę od przełożonego (`notesAbout`). `partner.ts`: granica zmiany zadań, podział notatek, kryteria bez notatek, kryteria z notatkami po obu stronach granicy, pytanie zaległe, podwładni bez notatek, forma imienia. Każda pozycja zestawienia ma pole `prompt` (pytanie) albo `action` (etykieta i adres przycisku), nigdy żadnego wyniku o pracowniku.

**Contract**: `beforeMeetingSummary` zwraca `{ boundary, before[], after[], bothSides[], pendingQuestion, criteriaWithoutNotes[], feedback, team[] }`, gdzie każdy element ma `prompt` albo `action`.

#### 2. Ekran i odnośnik

**File**: `src/routes/hr-partner.tsx`, `src/views/before-meeting.tsx`, rejestracja w `registerCycleLinks`

**Intent**: Odnośnik „Przed rozmową z pracownikiem” na ekranie wejściowym cyklu `GET /cycles/:id/part1` przez `registerCycleLinks`, widoczny tylko dla `cycles.appraiser_id`. `GET /cycles/:id/before-meeting` dla oceniającego cyklu. Tytuł „Przed rozmową z {imię w narzędniku}”. Sekcje w tej kolejności: zmiana zadań (zdanie „Zaznaczyłeś zmianę zadań w notatce z {data}.”, notatki sprzed i po, pod nimi pytanie przy każdym kryterium z notatkami po obu stronach, np. „Przy kryterium „Rzetelność” masz notatki sprzed zmiany zadań i po niej. Zapytaj, co się zmieniło po przejęciu nowych zadań.”; ewentualne zaległe pytanie z przyciskami jak w fazie 1); kryteria bez żadnej notatki z pytaniem do rozmowy i przyciskiem „Dopisz notatkę” (`/people/:personId/notes/new`); ostatnia informacja zwrotna (zdanie z datą albo „Od rozmowy {data} nie przekazałeś {imię w celowniku} żadnej informacji zwrotnej.” z pytaniem, a po fazie 3 z przyciskiem do karty docenienia); zespół (zdania z decyzji 10k z przyciskiem „Dopisz notatkę” do `/people/:personId/notes/new`, także dla Marii bez cyklu); na końcu link do `GET /cycles/:id/cards/assessment-conversation`. Każda notatka pokazuje datę, kryterium, pole „dobrze / do poprawy” i tekst przełożonego, bez żadnych dopisków systemu. Sekcja bez danych znika (bez pustych nagłówków). Każde ustawienie urzędu pokazane w zdaniu ma dopisek „ustawienie urzędu”.

**Contract**: `GET /cycles/:id/before-meeting` → 200 dla oceniającego, 403 dla innych; odpowiedź nie zawiera słów z listy zakazanej w teście (`ryzyk`, `wskaźnik`, `motywac`, `ranking`, `%`) ani liczby notatek przy nazwisku. `cycleLinks(cycle, person)` dla oceniającego zawiera adres `/cycles/:id/before-meeting`.

### Success Criteria:

#### Automated Verification:

- Logika na danych pokazowych: granica 2026-03-11, brak granicy po „no” i przy dacie 2026-03-10, „Rzetelność”, „Komunikacja” i „Współpraca” po obu stronach, „Myślenie analityczne” bez notatek, zdanie o Marii i brak zdania o Ewie: `bun test src/hr-partner`
- Wersja 90 sekund (`createTestApp({ today: '2026-11-21', seedOptions: { afterStep1: true } })`, bez kroków 2–3): ekran „Przed rozmową” dla Piotra pokazuje podział na 11.03.2026 bez kliknięcia „Tak” i zaległe pytanie przy notatce z 11.03.2026: `bun test src/routes/hr-partner.test.ts`
- Pełny pokaz (`createTestApp({ today: '2026-03-11', seedOptions: { afterStep1: true, liveStep2: true } })`): notatka z zaznaczeniem zapisana przy dacie 2026-03-11, „Tak”, przesunięcie daty na 2026-11-21: ekran pokazuje podział na 11.03.2026, jedną notatkę ze zmianą zadań i brak zaległego pytania: `bun test src/routes/hr-partner.test.ts`
- Ekran nie zawiera słów z listy zakazanej ani liczby notatek przy nazwisku; inne konto dostaje 403; ekran wejściowy cyklu ma odnośnik „Przed rozmową”, a przycisk „Dopisz notatkę” przy Marii prowadzi do `/people/:personId/notes/new`: `bun test src/routes/hr-partner.test.ts`

#### Manual Verification:

- Ekran „Przed rozmową z Piotrem” przejrzany wiersz po wierszu: przy żadnym nazwisku nie ma etykiety, liczby ani wskaźnika; każda pozycja ma pytanie albo działanie
- Krok 4 pokazu na komputerze 1440 px (data systemowa 2026-11-21, dane z `bun run seed -- --after-step-1` albo z odtworzonym krokiem 1) czyta się w kilka sekund

## Phase 3: Przypomnienie i karta docenienia (po wersji minimalnej, ok. 15 min)

### Changes Required:

#### 1. Przypomnienie i karta docenienia

**File**: `content/cards.json`, `rules/office-settings.json`, `src/hr-partner/partner.ts`, `src/routes/hr-partner.tsx`, `src/views/appreciation.tsx`, rejestracja w `registerHomeTasks` i `registerCycleLinks`

**Intent**: Karta `appreciation` „Docenienie” (po co, jak powiedzieć o konkretnym fakcie, czego unikać) i próg `appreciationReminderDays` (90) z `label: "ustawienie urzędu"`. `appreciationReminder` według „Critical Implementation Details”. Na ekranie startowym oceniającego, przez `registerHomeTasks`, jedna pozycja na podwładnego z cyklem z `openCycle(personId)` i z należnym przypomnieniem (zdanie z kotwicą, link do karty). Przez `registerCycleLinks` odnośnik do karty docenienia na ekranie wejściowym cyklu, tylko dla `cycles.appraiser_id`. `GET /cycles/:id/appreciation` pokazuje kartę „Docenienie” i notatki `good` od kotwicy. Przycisk „Przekaż pracownikowi” przy każdej z nich, prowadzący do `GET /notes/:id/feedback`, powstaje tylko wtedy, gdy w kodzie są wszystkie trzy trasy informacji zwrotnej S-04 (faza 3): `GET /notes/:id/feedback`, `POST /notes/:id/feedback` i `GET /feedback`; bez nich karta nie ma tego działania (patrz „Kolejność cięcia”). Zdanie o informacji zwrotnej na ekranie „Przed rozmową” dostaje przycisk do karty. Wysłanie informacji zwrotnej przesuwa kotwicę przez `lastFeedbackDate`, więc przypomnienie znika bez dodatkowego kodu.

**Contract**: `GET /cycles/:id/appreciation` → 200 dla oceniającego, 403 dla innych. `appreciationReminder` dostaje datę ostatniej informacji zwrotnej jako parametr i zwraca `null`, gdy ta data równa się `today`.

### Success Criteria:

#### Automated Verification:

- Przypomnienie przy dacie 2026-11-21 bez informacji zwrotnej, z notatką z 18.06.2026 w karcie, i jego brak, gdy data ostatniej informacji zwrotnej równa się `today` (czysta funkcja, bez zapisu do `feedback_messages`): `bun test src/hr-partner`
- Ekran startowy Marka ma pozycję przypomnienia (`createTestApp({ today: '2026-11-21', seedOptions: { afterStep1: true } })`), a karta docenienia daje 403 innemu kontu: `bun test src/routes/hr-partner.test.ts`
- Tylko gdy w kodzie są wszystkie trzy trasy `GET /notes/:id/feedback`, `POST /notes/:id/feedback` i `GET /feedback`: notatka z 18.06.2026 w karcie ma przycisk „Przekaż pracownikowi” do `/notes/:id/feedback`; bez tych tras test nie powstaje, a krok oznacza się jako pominięty z tym powodem: `bun test src/routes/hr-partner.test.ts`

#### Manual Verification:

- Karta „Docenienie” czyta się prostą polszczyzną i nie zawiera oceny pracownika

## Phase 4: Ekran „Skąd biorą się podpowiedzi” (po wersji minimalnej, ok. 10 min)

### Changes Required:

#### 1. Ekran administratora

**File**: `content/suggestion-sources.json`, `src/routes/admin.tsx`, `src/views/suggestion-sources.tsx`, rejestracja w `registerHomeTasks`, montowanie w `src/index.tsx`

**Intent**: Strona może być statyczna. `GET /admin/suggestion-sources` tylko dla konta z rolą `admin`. Zdanie wstępne: prototyp działa na regułach, urząd może w tych miejscach włączyć model uruchomiony u siebie. Tabela sześciu miejsc z `content/suggestion-sources.json` (miejsce, co robiłby model w tle, w prototypie), przepisana z decyzji 9. Nad tabelą „Teraz działa: …” z `suggestionMode()`, które zwraca `rules` („reguły”), `local-model` („model uruchomiony w urzędzie”) albo `none` („podpowiedzi wyłączone”) (pierwsze do cięcia, patrz „Kolejność cięcia”). Pod tabelą lista „Czego model nigdy nie robi” i warunki wspólne z decyzji 9. Odnośnik do ekranu na ekranie startowym administratora przez `registerHomeTasks`.

**Contract**: `GET /admin/suggestion-sources` → 200 dla administratora, 403 dla innych kont; zawiera sześć wierszy i cztery pozycje listy „Czego model nigdy nie robi”.

### Success Criteria:

#### Automated Verification:

- Ekran administratora ma sześć miejsc i listę „Czego model nigdy nie robi”, a inne konta dostają 403: `bun test src/routes/admin.test.ts`
- Cały zestaw testów przechodzi: `bun test`

#### Manual Verification:

- Ekran czytelny na 360 px i 1440 px we wspólnym układzie

## Testing Strategy

Testy jednostkowe `src/hr-partner/partner.test.ts` na danych pokazowych z `src/seed/notes.ts` (albo tych samych wierszach podanych funkcjom wprost; kryteria cyklu Piotra jak po `afterStep1`, z dodatkowymi `orientacja-na-klienta` i `myslenie-analityczne`): granica 2026-03-11; po odpowiedzi „no” granicy nie ma; przy dacie 2026-03-10 granicy nie ma (decyzja 10i); „Rzetelność”, „Komunikacja” i „Współpraca” mają notatki po obu stronach (notatka z 11.03.2026 liczy się do „po”); „Myślenie analityczne” nie ma notatek; forma rozwoju dla „Współpracy” i forma domyślna dla kryterium spoza katalogu przez `suggestDevelopmentForm`; dokładnie jedna forma z `default: true`; przypomnienie przy dacie 2026-11-21 bez informacji zwrotnej i jego brak, gdy data ostatniej informacji zwrotnej równa się `today`; Maria bez notatek daje zdanie „jeszcze żadnej”, Ewa z notatką z 03.09.2026 nie daje zdania.

Trasy przez `app.request()` na `createTestApp({ today, seedOptions })` w `src/routes/hr-partner.test.ts` i `src/routes/admin.test.ts`: kody 200/303/403/404/409/422, zapis tylko po `POST`, brak pytania po notatce bez zaznaczenia, odpowiedź dla notatki o Marii z pustym `cycle_id` odnajdywana przez `visibleEvents(null)` po `payload.noteId` (notatkę o Marii test zapisuje sam przez `POST /people/:personId/notes`), lista zakazana na ekranie „Przed rozmową”, odnośniki z `cycleLinks` i `homeTasks`. Każdy test, który zaczyna w marcu albo listopadzie 2026, bierze `seedOptions: { afterStep1: true }`, żeby Piotr miał potwierdzoną część I. Żaden test nie usuwa ani nie przepisuje wgranych danych. Dwa warianty danych pokazu:

- **Wersja 90 sekund:** `createTestApp({ today: '2026-11-21', seedOptions: { afterStep1: true } })` (kroki 2–3 pominięte); granica 11.03.2026 z wgranej notatki bez kliknięcia „Tak”, zaległe pytanie widoczne.
- **Pełny pokaz:** `createTestApp({ today: '2026-03-11', seedOptions: { afterStep1: true, liveStep2: true } })` (bez wgranej notatki z 11.03.2026), notatka z zaznaczeniem przez `POST /people/:personId/notes`, przekierowanie na pytanie, „Tak” (303), potem `POST /demo/date` na 2026-11-21; granica 11.03.2026, dokładnie jedna notatka ze zmianą zadań, bez zaległego pytania.

Próba ręczna kroków 2 i 4 używa `bun run seed -- --after-step-1 --live-step-2` (pełny pokaz) albo `bun run seed -- --after-step-1` (wersja 90 sekund), albo odtwarza krok 1 klikaniem.

## Open questions

Każde ma domyślne rozstrzygnięcie; wdrażający stosuje je bez pytania i wpisuje w `## Notes` pliku `change.md`.

1. **Data zmiany zadań.** Granica to data notatki (11.03.2026), nie dzień zmiany z tekstu (9.03.2026). Domyślnie: bez pola „Od kiedy” przy „Tak”; dodać je tylko, jeśli zostanie czas.
2. **Imiona w przypadkach zależnych.** Domyślnie: `content/name-forms.json` w tym plastrze zamiast nowych kolumn w `people`.
3. **Progi.** Domyślnie 90 dni dla przypomnienia o docenianiu i 6 miesięcy dla podwładnych bez notatek (przykład z decyzji 10k), oba jako „ustawienie urzędu”.
4. **Liczba w zdaniu „od 6 miesięcy”.** Domyślnie dozwolona, bo dotyczy przełożonego, nie pracownika (decyzja 10k sama jej używa); liczby notatek, wyniki i wskaźniki przy nazwisku są zakazane.

## References

- `context/changes/rules-engine-and-demo-data/plan.md` (rozdział „Kontrakt wspólny dla wszystkich plastrów”)
- `context/changes/cycle-start-criteria/plan.md` (S-01, „Co ten plaster udostępnia”)
- `context/changes/notes-and-justification/plan.md` (S-04, „Co ten plaster udostępnia”)
- `context/foundation/decisions.md` (decyzje 2, 3, 9, 10e, 10i, 10j, 10k, 11c, 11e)
- `context/foundation/prd.md` (US-04, FR-015, FR-016, FR-035, FR-036, Access Control, Non-Goals)
- `context/foundation/roadmap.md` (S-05)
- `context/foundation/demo.md` (kroki 2 i 4, wersja 90 sekund, „Ustalenia do scenariusza”, „Notatki do wgrania”, „Czego jeszcze nie ma”)
- `AGENTS.md` (zasady 4, 5, 7, 8, 10)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Pytanie po notatce i karta po „Tak” (wersja minimalna)

#### Automated

- [x] 1.1 Notatka z zaznaczeniem prowadzi do pytania, a notatka bez zaznaczenia nie (`createTestApp({ today: '2026-03-11', seedOptions: { afterStep1: true, liveStep2: true } })`): `bun test src/routes/hr-partner.test.ts` — c011433
- [x] 1.2 `GET` pytania nie dodaje wiersza do `events`; `POST` dodaje dokładnie jeden z `actor_id` = autor notatki i odpowiada 303; błędne `answer` daje 422, nieistniejąca notatka 404, cudze konto 403 (także oceniający cyklu, który nie jest autorem: test ustawia `cycles.appraiser_id` cyklu Piotra na Annę i Anna dostaje 403, a Marek dalej odpowiada), powtórny `POST` 409, wszystkie bez zapisu: `bun test src/routes/hr-partner.test.ts` — c011433
- [x] 1.3 Odpowiedź na notatkę o Marii (bez cyklu) zapisuje zdarzenie z pustym `cycle_id` i jest odnajdywana przez `visibleEvents(null)` po `payload.noteId`; test sam zapisuje tę notatkę przez `POST /people/:personId/notes` na danych F-01, S-01 i S-04, bez danych dokładanych przez późniejsze plastry: `bun test src/routes/hr-partner.test.ts` — c011433
- [x] 1.4 `suggestDevelopmentForm` daje formę dla „Współpracy” i formę domyślną dla kryterium spoza katalogu; w `developmentForms` jest dokładnie jedna forma z `default: true` (test pada przy zerze i przy dwóch); pliki treści są poprawnym JSON: `bun test src/hr-partner` — c011433

#### Manual

- [ ] 1.5 Krok 2 pokazu na telefonie 360 px (dane z `bun run seed -- --after-step-1 --live-step-2` albo z odtworzonym krokiem 1, data systemowa 2026-03-11): notatka, pytanie, „Tak”, karta ze zdaniem o podstawie prawnej i forma rozwoju; druga notatka bez pola nie wywołuje pytania
- [ ] 1.6 Karta „Rozmowa po zmianie zadań” czyta się prostą polszczyzną i nie zawiera oceny pracownika

### Phase 2: Ekran „Przed rozmową z pracownikiem” (wersja minimalna)

#### Automated

- [x] 2.1 Logika na danych pokazowych: granica 2026-03-11, brak granicy po „no” i przy dacie 2026-03-10, „Rzetelność”, „Komunikacja” i „Współpraca” po obu stronach, „Myślenie analityczne” bez notatek, zdanie o Marii i brak zdania o Ewie: `bun test src/hr-partner` — c011433
- [x] 2.2 Wersja 90 sekund (`createTestApp({ today: '2026-11-21', seedOptions: { afterStep1: true } })`, bez kroków 2–3): ekran „Przed rozmową” dla Piotra pokazuje podział na 11.03.2026 bez kliknięcia „Tak” i zaległe pytanie przy notatce z 11.03.2026: `bun test src/routes/hr-partner.test.ts` — c011433
- [x] 2.3 Pełny pokaz (`createTestApp({ today: '2026-03-11', seedOptions: { afterStep1: true, liveStep2: true } })`): notatka z zaznaczeniem zapisana przy dacie 2026-03-11, „Tak”, przesunięcie daty na 2026-11-21: ekran pokazuje podział na 11.03.2026, jedną notatkę ze zmianą zadań i brak zaległego pytania: `bun test src/routes/hr-partner.test.ts` — c011433
- [x] 2.4 Ekran nie zawiera słów z listy zakazanej ani liczby notatek przy nazwisku; inne konto dostaje 403; ekran wejściowy cyklu ma odnośnik „Przed rozmową”, a przycisk „Dopisz notatkę” przy Marii prowadzi do `/people/:personId/notes/new`: `bun test src/routes/hr-partner.test.ts` — c011433

#### Manual

- [ ] 2.5 Ekran „Przed rozmową z Piotrem” przejrzany wiersz po wierszu: przy żadnym nazwisku nie ma etykiety, liczby ani wskaźnika; każda pozycja ma pytanie albo działanie
- [ ] 2.6 Krok 4 pokazu na komputerze 1440 px (data systemowa 2026-11-21, dane z `bun run seed -- --after-step-1` albo z odtworzonym krokiem 1) czyta się w kilka sekund

### Phase 3: Przypomnienie i karta docenienia

#### Automated

- [x] 3.1 Przypomnienie przy dacie 2026-11-21 bez informacji zwrotnej, z notatką z 18.06.2026 w karcie, i jego brak, gdy data ostatniej informacji zwrotnej równa się `today` (czysta funkcja, bez zapisu do `feedback_messages`): `bun test src/hr-partner` — c011433
- [x] 3.2 Ekran startowy Marka ma pozycję przypomnienia (`createTestApp({ today: '2026-11-21', seedOptions: { afterStep1: true } })`), a karta docenienia daje 403 innemu kontu: `bun test src/routes/hr-partner.test.ts` — c011433
- [x] 3.3 Tylko gdy w kodzie są wszystkie trzy trasy `GET /notes/:id/feedback`, `POST /notes/:id/feedback` i `GET /feedback`: notatka z 18.06.2026 w karcie ma przycisk „Przekaż pracownikowi” do `/notes/:id/feedback`; bez tych tras test nie powstaje, a krok oznacza się jako pominięty z tym powodem: `bun test src/routes/hr-partner.test.ts` — c011433

#### Manual

- [ ] 3.4 Karta „Docenienie” czyta się prostą polszczyzną i nie zawiera oceny pracownika

### Phase 4: Ekran „Skąd biorą się podpowiedzi”

#### Automated

- [x] 4.1 Ekran administratora ma sześć miejsc i listę „Czego model nigdy nie robi”, a inne konta dostają 403: `bun test src/routes/admin.test.ts` — c011433
- [x] 4.2 Cały zestaw testów przechodzi: `bun test` — c011433

#### Manual

- [ ] 4.3 Ekran czytelny na 360 px i 1440 px we wspólnym układzie
