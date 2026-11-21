# Ocena z blokadami i potwierdzenie zapoznania — plan wdrożenia

## Overview

Oceniający przyznaje oceny cząstkowe, widzi wynik wyliczony przez silnik z podstawą prawną i zatwierdza ocenę dopiero po uzupełnieniu pól wymaganych przepisami. Oceniany potwierdza zapoznanie z oceną na własnym koncie i widzi zegar 7 dni na sprzeciw. Gdy nie potwierdza, oceniający stwierdza fikcję zapoznania, a kadry widzą ten wpis. To krok, na który patrzy jury (north star w roadmapie).

## Current State Analysis

- Silnik wyniku już jest i ma testy: `src/silnik/ocena.ts` (`wyliczOcene` zwraca sumę, średnią, poziom ogólny, wynik, powody z paragrafem i `uzasadnienieObowiazkowe`), `src/silnik/terminy.ts` (`terminSprzeciwu` = 7 dni od zapoznania, przesunięte na dzień roboczy, art. 83 ust. 1 ustawy). F-01 przenosi je do `src/engine/scoring.ts` i `src/engine/deadlines.ts` z nazwami angielskimi; ten plan używa nazw angielskich, które nada F-01.
- Plik reguł ma skalę (`skalaCzastkowa`), przedziały (`poziomOgolny`), termin sprzeciwu (`terminy.sprzeciwDni`, podstawa „art. 83 ust. 1 ustawy”) i tematy rozmowy oceniającej (§ 10). Nie ma podstaw prawnych blokad zatwierdzenia ani reguł wniosku o stopień (§ 11 ust. 3–5, art. 81 ust. 5 i art. 89 ust. 1 ustawy).
- Ekranów oceny, tras cyklu i zdarzeń oceny nie ma. Tabele, konta, `today()` i układ ekranu daje F-01, cykl i potwierdzoną część I daje S-01.
- Blokady z arkusza (pakiet organizatora, opisany w bazie wiedzy autora): wnioski do indywidualnego programu rozwoju zawodowego (IPRZ) blokują zatwierdzenie zawsze; puste uzasadnienie blokuje tylko przy ocenie negatywnej; puste umotywowanie blokuje, gdy dołączono wniosek o stopień. Wniosek o stopień: „nie dotyczy” dla pracownika, dla urzędnika „nie” przy ocenie negatywnej, a przy pozytywnej wybór „tak / nie”; przy stopniu IX kolejnego nie ma.

## Desired End State

Na koncie Marka, przy cyklu Piotra z potwierdzoną częścią I, ekran oceny pokazuje 7 kryteriów (5 obowiązkowych arkusza C i 2 dodatkowe) z wyborem 1, 3, 5, 7, 9. Po postawieniu „1” przy Rzetelności i „7” przy pozostałych wynik od razu pokazuje średnią 6,14, poziom „powyżej oczekiwań”, ocenę negatywną i zdanie z § 11 ust. 1 pkt 4. Pole uzasadnienia staje się wymagane. Przycisk „Zatwierdź ocenę” bez wniosków do IPRZ zostawia ocenę niezatwierdzoną i mówi, czego brakuje i z jakiego przepisu. Po uzupełnieniu Marek zatwierdza; miejscowość, data i nazwisko wpisują się same, pola się blokują. Na koncie Piotra jest przycisk „Potwierdzam zapoznanie z oceną”; po kliknięciu widać termin sprzeciwu z datą, liczbą dni i przepisem. Zamiast tego Marek może kliknąć „Stwierdź fikcję zapoznania”, zobaczyć ekran skutku („Od dziś biegnie 7 dni na sprzeciw”), wybrać „nie mógł” albo „nie chciał” i zapisać; Joanna widzi ten wpis w podglądzie oceny. `bun test` przechodzi, w tym test wniosku o stopień dla urzędnika mianowanego.

### Key Discoveries:

- `src/silnik/ocena.ts:73` `wyliczOcene` przyjmuje `Record<idKryterium, punkty>` i rzuca wyjątek przy pustym zbiorze i punktach spoza skali; ekran musi więc liczyć wynik tylko wtedy, gdy każde kryterium ma ocenę, a wcześniej pokazywać „brakuje ocen przy: …”.
- `src/silnik/ocena.ts:62` `uzasadnienieObowiazkowe` już niesie regułę § 11 ust. 3; blokada uzasadnienia ma z niej korzystać, nie liczyć jej drugi raz.
- `src/silnik/terminy.ts:101` `terminSprzeciwu` przesuwa koniec na dzień roboczy, więc data może wypaść później niż 7 dni kalendarzowych; ekran pokazuje datę z silnika, a zdanie „7 dni” bierze wartość z pliku reguł.
- Średnia porównywana jest na liczbach całkowitych (`suma <= 4 * liczba`), bez zaokrągleń; na ekranie średnia jest tylko wyświetlana z dwoma miejscami po przecinku.

## What We're NOT Doing

- Notatek przy kryteriach, akcji „Wstaw” w uzasadnieniu, ostrzeżenia „fakty tylko z ostatniego miesiąca” i karty rozmowy oceniającej (S-04; ten plaster daje tylko miejsca na nie w formularzu).
- Ekranu kadr ze stanem cykli, przypomnienia o stopniu obowiązkowym, historii ocen, podglądu i wydruku arkusza (S-06).
- Obiegu sprzeciwu, zmiany oceny po sprzeciwie, decyzji o stopniu (PRD Non-Goals; tylko stan w S-06).
- Automatu, który wpisuje fikcję po upływie czasu, i progu dni przed przyciskiem fikcji (decyzje 5b i 10n).
- Potwierdzania wpisu o fikcji przez kadry (decyzja 5b) i trybu korekty pól zablokowanych przez administratora.
- Rozpoczęcia kolejnego cyklu po zatwierdzonej ocenie.
- Podpisu w jakiejkolwiek formie: przyciski i teksty mówią „potwierdzenie”.
- Własnych stylów: ekrany używają wspólnego układu i komponentów z design systemu autora (decyzja 10b).

## Implementation Approach

Trzy fazy, każda kończy się zielonym `bun test`. Najpierw czysta logika (blokady zatwierdzenia i stan oceny z dziennika zdarzeń), potem formularz oceniającego, na końcu potwierdzenie, fikcja i zegar sprzeciwu.

Stan oceny to wyłącznie wiersze w `events` (bez nowej tabeli), zgodnie z konwencją projektu i decyzją 10i: szkic to ostatnie zdarzenie `assessment_draft_saved` z datą nie późniejszą niż `today()`, a zatwierdzenie, potwierdzenie i fikcja to osobne zdarzenia. Zatwierdzenie zapisuje pełną migawkę oceny (punkty, wynik, teksty, wersja reguł), żeby historia i wydruk (S-06) nie musiały niczego przeliczać, a ocena pamiętała swoją wersję reguł (FR-033).

Wynik liczy wyłącznie silnik na serwerze. Podgląd wyniku przy wypełnianiu idzie przez trasę, która niczego nie zapisuje i zwraca fragment HTML; zapis następuje tylko po kliknięciu „Zapisz” albo „Zatwierdź ocenę” (zasada „nic bez kliknięcia człowieka”). Blokady sprawdza serwer przy zatwierdzeniu; ekran pokazuje te same komunikaty wcześniej, z tej samej funkcji.

Ekrany i nowe komponenty (wszystkie w `src/views/layout.tsx`, wygląd z design systemu autora):

- ekran „Ocena” w trzech trybach: edycja (oceniający przed zatwierdzeniem), podgląd (po zatwierdzeniu: oceniający, oceniany, kadry), brak dostępu albo „ocena jeszcze nie jest zatwierdzona” (oceniany przed zatwierdzeniem);
- ekran skutku fikcji zapoznania;
- komponenty: wiersz kryterium z wyborem punktów, ramka wyniku (średnia, poziom, wynik, przepisy), lista blokad, blok potwierdzenia (miejscowość, data, nazwisko, zablokowane), zegar sprzeciwu, wpis o fikcji.

Kolejność cięcia (gdy zabraknie czasu, od pierwszego do wycięcia): 1) pole wniosku o stopień na ekranie (reguła i test zostają, pokaz go nie używa); 2) podgląd oceny na koncie kadr (wpis o fikcji pokaże S-06); 3) podgląd wyniku na żywo (wynik i blokady odświeżają się po „Zapisz”); 4) pole „data rozmowy oceniającej” (w migawce zostaje `today()`). Nie wycinać: punktów, wyniku z przepisem, blokad uzasadnienia i IPRZ, zatwierdzenia, potwierdzenia ocenianego, zegara sprzeciwu, fikcji zapoznania.

## Założenia wobec wcześniejszych plastrów

Gdy coś z tej listy nie istnieje albo nazywa się inaczej, implementujący dopasowuje się do tego, co jest w kodzie, i dopisuje rozjazd w `## Progress` przy kroku, którego dotyczy. Brakujące pola dodaje w schemacie `src/db.ts` i w `src/seed.ts`.

**F-01:**

- `today(): string` (data RRRR-MM-DD z `settings`), `rulesVersion(): { version, effectiveFrom, act }` z `src/engine/rules.ts`.
- `src/engine/scoring.ts`: odpowiedniki `wyliczOcene` (tu: `computeAssessment(scores: Record<string, number>)` z polami `sum`, `count`, `mean`, `overallLevel`, `outcome: "positive" | "negative"`, `reasons: string[]`, `justificationRequired: boolean`), `mandatoryCriteria(sheet)`, `criterion(id)` z nazwą po polsku, `SCORES = [1, 3, 5, 7, 9]`.
- `src/engine/deadlines.ts`: odpowiednik `terminSprzeciwu` (tu: `objectionDeadline(acknowledgedOn: string): string`).
- Plik reguł `rules/regulation-2016-470.json` z kluczem `deadlines.objectionDays` (`value: 7`, `basis: "art. 83 ust. 1 ustawy"`) i skalą z nazwami poziomów.
- Tabela `events(id, type, cycle_id, actor_id, date, payload)`; funkcje zapisu i odczytu zdarzeń cyklu, które same filtrują `date <= today()` i sortują po `date`, potem `id` (tu: `addEvent(type, cycleId, actorId, payload)` z datą `today()` oraz `cycleEvents(cycleId)`).
- Tabela `people` z kolumnami `id`, `name`, `appointed` (0/1, urzędnik mianowany), `civil_service_grade` (1–9 albo NULL) i `role`. `appointed` i `civil_service_grade` są potrzebne do wniosku o stopień i do stopnia obowiązkowego Tomasza (S-06).
- Konto z ciasteczka: funkcja albo middleware dająca bieżącą osobę (tu: `currentPerson(c)`).
- `src/views/layout.tsx` (`Layout` z tytułem i treścią) oraz ekran startowy `GET /` z listą spraw, do której plastry dokładają pozycje (tu: funkcja `tasksFor(personId)` zbierająca pozycje z modułów).
- Test pomocniczy: świeża baza w pamięci z danymi pokazowymi i ustawioną datą systemową (tu: `createTestApp({ today })`).

**S-01:**

- Tabela `cycles` z `id`, `person_id` (oceniany), `appraiser_id` (bieżący oceniający), `sheet` (`A` / `B` / `C`), `due_date`.
- Tabela `cycle_criteria(cycle_id, criterion_id, kind)` z kryteriami dodatkowymi (i ewentualnie obowiązkowymi). Ten plaster bierze listę jako `mandatoryCriteria(sheet)` plus wiersze `cycle_criteria`, bez powtórzeń, więc działa w obu wariantach.
- Zdarzenie `part1_confirmed` (oceniany potwierdził część I). Bez niego ekran oceny pokazuje „Ocena nie może powstać bez potwierdzonej części I” i nie ma formularza (PRD, Business Logic).
- Miejscowość urzędu do automatycznych potwierdzeń w `rules/office-settings.json` pod kluczem `place`, oznaczona jako „ustawienie urzędu”. Jeśli S-01 jej nie dodał, dodaje ją ten plaster.
- Wzór tras cyklu `/cycles/:id/...` w `src/routes/cycles.tsx` (lub podobnym) i rejestracja modułów tras w `src/index.tsx`.

**Dane pokazowe (F-01):** cykl Piotra (arkusz C, oceniający Marek) z wgranym `part1_confirmed` albo potwierdzanym na żywo w kroku 1; Piotr `appointed = 0`; Tomasz `appointed = 1` ze stopniem; poprzednie oceny Tomasza (12.11.2024 i 12.11.2026) wgrane jako zdarzenia `assessment_approved` i `assessment_acknowledged` w kształcie z sekcji „Co ten plaster udostępnia”. Jeśli F-01 zapisał je inaczej, ten plaster ich nie przerabia, tylko zgłasza rozjazd (należą do S-06).

## Co ten plaster udostępnia

**Zdarzenia** (wszystkie z datą `today()`, `actor_id` = osoba, która kliknęła):

- `assessment_draft_saved`, payload `AssessmentDraft`: `{ scores: Record<criterionId, 1|3|5|7|9>, justification: string, developmentConclusions: string, interviewDate: string | null, gradeRequest: { attached: boolean, motivation: string } }`.
- `assessment_approved`, payload `AssessmentSnapshot`: wszystko z `AssessmentDraft` plus `result` (wynik `computeAssessment`), `criteria: { id, name, kind, score }[]` w kolejności arkusza, `periodFrom` (data `part1_confirmed`), `periodTo` (data zatwierdzenia), `rulesVersion`, `gradeRequest.targetGrade` (stopień o jeden wyższy albo `null`), `confirmation: { place, date, name }` oceniającego.
- `assessment_acknowledged`, payload `{ place, date, name, objectionDeadline }` (actor = oceniany).
- `acknowledgement_fiction`, payload `{ reason: "could_not" | "would_not", objectionDeadline }` (actor = oceniający; etykiety „nie mógł” / „nie chciał”).

**Funkcje:**

- `approvalBlockers(input): Blocker[]` w `src/engine/approval.ts` (czysta), `Blocker = { field, message, basis }`.
- `assessmentState(cycleId): { stage: "no_part1" | "draft" | "approved" | "acknowledged" | "fiction", draft, snapshot, acknowledgement, fiction, objectionDeadline }` w `src/assessment/state.ts`. S-06 bierze stąd stan cyklu do ekranu kadr i migawkę do wydruku; S-03 nie musi tu nic zmieniać.
- `assessmentTasks(personId)`: pozycje listy spraw („Wystaw ocenę: <imię i nazwisko>”, „Zapoznaj się z oceną”), bez wyniku i liczb przy nazwisku.

**Trasy:** `GET /cycles/:id/assessment`, `POST /cycles/:id/assessment` (zapis szkicu), `POST /cycles/:id/assessment/preview` (fragment wyniku i blokad, bez zapisu), `POST /cycles/:id/assessment/approve`, `POST /cycles/:id/assessment/acknowledge`, `GET /cycles/:id/assessment/fiction` (ekran skutku), `POST /cycles/:id/assessment/fiction`.

**Miejsca dla S-04 w formularzu** (`src/views/assessment.tsx`, props `slots`, domyślnie puste): `criterionAside(criterionId)` (notatki przy kryterium i ostrzeżenie FR-020), `justificationTools` (akcja „Wstaw” nad polem uzasadnienia), `conclusionsTools` (to samo nad wnioskami do IPRZ, jeśli S-04 to zrobi), `beforeForm` (link do karty rozmowy oceniającej). Pola formularza mają stałe nazwy `score[<criterionId>]`, `justification`, `developmentConclusions`, `interviewDate`, `gradeRequestAttached`, `gradeMotivation`; pola tekstowe mają `id` równe nazwie, żeby skrypt „Wstaw” mógł dopisać tekst w miejscu kursora.

## Phase 1: Blokady zatwierdzenia i stan oceny

### Changes Required:

#### 1. Podstawy prawne pól oceny w pliku reguł

**File**: `rules/regulation-2016-470.json`

**Intent**: Dopisać sekcję z podstawami prawnymi pól, które blokują zatwierdzenie, i z regułą stopnia, żeby komunikaty brały przepis z danych, nie z kodu (NFR „każdy wynik ma obok podstawę prawną”).

**Contract**: klucz `approval`: `justification.basis = "§ 11 ust. 3"`, `developmentConclusions.basis = "art. 81 ust. 5 ustawy"`, `gradeRequest.basis = "§ 11 ust. 5, art. 89 ust. 1 ustawy"`, `gradeRequest.maxGrade = 9`, `acknowledgement.basis = "§ 12"`. Wersja pliku zostaje bez zmian (dodanie podstaw nie zmienia sposobu liczenia).

#### 2. Reguły zatwierdzenia

**File**: `src/engine/approval.ts`, `src/engine/approval.test.ts`

**Intent**: Jedna czysta funkcja, która dla szkicu, listy kryteriów cyklu i danych ocenianego zwraca listę blokad z komunikatem po polsku i przepisem. Ta sama lista służy podglądowi na ekranie i odmowie zatwierdzenia na serwerze.

**Contract**: `approvalBlockers({ criteria: string[], draft: AssessmentDraft, appointed: boolean, grade: number | null }): Blocker[]`. Blokady:

- brak oceny przy kryterium → „Brakuje oceny cząstkowej: <nazwa kryterium>” (§ 11 ust. 1);
- puste (po przycięciu spacji) `developmentConclusions` → zawsze;
- puste `justification`, gdy wynik jest negatywny (z `justificationRequired`), liczone tylko, gdy są wszystkie oceny;
- `gradeRequest.attached` u osoby nie mianowanej, przy wyniku negatywnym albo przy stopniu równym `maxGrade` → wniosku nie można dołączyć, z powodem;
- `gradeRequest.attached` z pustym `motivation` → brakuje umotywowania.

Pomocniczo `gradeRequestOptions({ appointed, grade, outcome }): "not_applicable" | "no_only" | "yes_or_no"` dla ekranu.

#### 3. Stan oceny z dziennika zdarzeń

**File**: `src/assessment/state.ts`, `src/assessment/state.test.ts`

**Intent**: Złożyć z widocznych zdarzeń cyklu (już przefiltrowanych po `today()`) etap oceny i dane do ekranów, w jednym miejscu, z którego korzystają trasy tego plastra i ekran kadr S-06.

**Contract**: `assessmentState(cycleId)` jak w „Co ten plaster udostępnia”. Kolejność etapów: bez `part1_confirmed` → `no_part1`; potem `draft` (także bez żadnego szkicu); `assessment_approved` → `approved`; pierwsze z `assessment_acknowledged` / `acknowledgement_fiction` → `acknowledged` albo `fiction` i od tej chwili drugie zdarzenie nie jest już przyjmowane. `objectionDeadline` = `objectionDeadline(data potwierdzenia albo fikcji)`. Szkic to ostatnie `assessment_draft_saved` (po dacie, potem `id`). Plus `assessmentTasks(personId)`.

### Success Criteria:

#### Automated Verification:

- Testy reguł zatwierdzenia przechodzą: `bun test src/engine/approval.test.ts`
- Testy stanu oceny przechodzą: `bun test src/assessment/state.test.ts`

## Phase 2: Formularz oceny i zatwierdzenie

### Changes Required:

#### 1. Trasy oceniającego

**File**: `src/routes/assessment.tsx`, rejestracja w `src/index.tsx`

**Intent**: Ekran oceny dla oceniającego cyklu, zapis szkicu, podgląd wyniku bez zapisu i zatwierdzenie. Tylko bieżący oceniający cyklu może zapisywać i zatwierdzać; po zatwierdzeniu każda próba zapisu kończy się odmową, a ekran jest tylko do odczytu.

**Contract**:

- `GET /cycles/:id/assessment`: oceniający widzi formularz (etap `draft`) albo podgląd (dalsze etapy); oceniany widzi podgląd dopiero od `approved`, wcześniej zdanie „Ocena nie jest jeszcze zatwierdzona”; kadry widzą podgląd od `approved`; inni dostają 403. Przy `no_part1` zdanie z Business Logic i brak formularza.
- `POST /cycles/:id/assessment/preview`: przyjmuje pola formularza, zwraca fragment „ramka wyniku + lista blokad”, nic nie zapisuje (test sprawdza, że liczba zdarzeń się nie zmienia).
- `POST /cycles/:id/assessment`: zapisuje `assessment_draft_saved` i przekierowuje na ekran (303). Punkty spoza 1, 3, 5, 7, 9 albo kryterium spoza cyklu → 400.
- `POST /cycles/:id/assessment/approve`: zapisuje szkic z formularza; gdy `approvalBlockers` jest pusta, zapisuje `assessment_approved` z migawką i potwierdzeniem `{ place: office-settings.place, date: today(), name: oceniający }`; w przeciwnym razie odpowiada 422 z formularzem i listą blokad (szkic zostaje zapisany, bo kliknął człowiek).

#### 2. Widok oceny

**File**: `src/views/assessment.tsx`

**Intent**: Jeden widok w trybie edycji i podglądu. W edycji: kryteria w kolejności arkusza (obowiązkowe, potem dodatkowe) z wyborem punktów i nazwą poziomu przy każdej wartości; ramka wyniku pod kryteriami (gdy brakuje ocen, zdanie „Wynik pojawi się, gdy każde kryterium będzie miało ocenę”); pole „Data rozmowy oceniającej” (domyślnie `today()`); uzasadnienie ze zdaniem „Ten tekst przeczyta pracownik” (decyzja 10f) i oznaczeniem „wymagane przy ocenie negatywnej, § 11 ust. 3”, które zmienia się na „wymagane” po wyniku negatywnym; „Wnioski do indywidualnego programu rozwoju zawodowego” zawsze wymagane; wniosek o stopień tylko dla urzędnika mianowanego, według `gradeRequestOptions`, z polem umotywowania i nazwą stopnia docelowego; lista blokad nad przyciskami; przyciski „Zapisz” i „Zatwierdź ocenę”. W podglądzie: te same dane bez pól, blok potwierdzenia oceniającego (miejscowość, data, nazwisko) i miejsce na blok ocenianego z fazy 3. Miejsca `slots` dla S-04 jak w „Co ten plaster udostępnia”.

**Contract**: `AssessmentView({ mode: "edit" | "view", state, criteria, person, viewer, blockers, slots? })`; ramka wyniku jako osobny komponent `ResultPanel({ result | missing })` używany też przez trasę podglądu. Ramka pokazuje średnią (dwa miejsca po przecinku), poziom ogólny, „Ocena pozytywna” albo „Ocena negatywna” i `reasons` z paragrafami, plus nazwę aktu i wersję reguł. Wynik jest tylko na tym ekranie; listy spraw i nagłówki z nazwiskiem nie pokazują wyniku ani liczb.

#### 3. Podgląd wyniku przy wypełnianiu

**File**: `src/views/assessment.tsx` (lub `public/assessment.js`)

**Intent**: Po każdej zmianie punktów albo pól tekstowych formularz wysyła się w tle na `POST /cycles/:id/assessment/preview` i podmienia ramkę wyniku i listę blokad. Gdy w repo jest już htmx (z F-01 albo S-01), użyć go; inaczej kilkanaście linii zwykłego skryptu. Bez skryptu ekran działa: wynik odświeża się po „Zapisz”.

**Contract**: element z `id="assessment-result"` podmieniany odpowiedzią trasy podglądu; skrypt nie zapisuje niczego.

### Success Criteria:

#### Automated Verification:

- Testy tras oceny przechodzą: `bun test src/routes/assessment.test.ts` (scenariusze: ocena „1” przy Rzetelności i „7” przy pozostałych daje w odpowiedzi „Ocena negatywna” i „powyżej oczekiwań”; zatwierdzenie bez wniosków do IPRZ → 422 i brak `assessment_approved`; zatwierdzenie z wnioskami, ale bez uzasadnienia przy wyniku negatywnym → 422; komplet → 303 i migawka z `rulesVersion`; podgląd nie zapisuje zdarzeń; zapis przez osobę inną niż oceniający → 403; zapis po zatwierdzeniu → odmowa; bez `part1_confirmed` brak formularza)
- Test wniosku o stopień przechodzi: urzędnik mianowany z wynikiem pozytywnym i dołączonym wnioskiem bez umotywowania → 422, z umotywowaniem → zatwierdzone ze stopniem docelowym; ten sam wniosek przy wyniku negatywnym albo u pracownika (Piotr) → 422
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Krok 4 pokazu na koncie Marka: po „1” przy Rzetelności wynik zmienia się na negatywny bez przeładowania, uzasadnienie oznacza się jako wymagane, „Zatwierdź ocenę” bez wniosków do IPRZ pokazuje blokadę z przepisem; ekran czytelny przy 360 px i 1440 px w układzie z design systemu

## Phase 3: Potwierdzenie zapoznania, fikcja i zegar sprzeciwu

### Changes Required:

#### 1. Potwierdzenie przez ocenianego

**File**: `src/routes/assessment.tsx`, `src/views/assessment.tsx`

**Intent**: Na koncie ocenianego, w etapie `approved`, pod oceną jest oświadczenie z arkusza („Potwierdzam odbycie rozmowy oceniającej oraz zapoznanie z oceną i wnioskami do indywidualnego programu rozwoju zawodowego.”) i przycisk „Potwierdzam zapoznanie z oceną”. Po kliknięciu miejscowość, data i nazwisko wpisują się same (decyzja 5a), a pod nimi pojawia się zegar sprzeciwu.

**Contract**: `POST /cycles/:id/assessment/acknowledge`: tylko oceniany cyklu i tylko w etapie `approved`, inaczej 403 albo 409; zapisuje `assessment_acknowledged` z `objectionDeadline`. Komponent `ObjectionClock({ deadline, today })`: „Sprzeciw do dyrektora generalnego urzędu możesz złożyć do <DD.MM.RRRR>. Zostało <n> dni. Art. 83 ust. 1 ustawy o służbie cywilnej.” Po upływie terminu: „Termin na sprzeciw minął <DD.MM.RRRR>.” Liczba dni liczona od `today()`, więc przesunięcie daty w pokazie ją zmienia. Zegar widzą oceniany, oceniający i kadry.

#### 2. Fikcja zapoznania

**File**: `src/routes/assessment.tsx`, `src/views/acknowledgement-fiction.tsx`

**Intent**: Oceniający widzi przycisk „Stwierdź fikcję zapoznania” od razu po zatwierdzeniu, dopóki oceniany nie potwierdził (decyzja 10n). Przycisk prowadzi na ekran skutku: „Od dziś biegnie 7 dni na sprzeciw” (liczba z pliku reguł), data końca terminu z silnika, zdanie, że kadry zobaczą wpis, i wymagany wybór „nie mógł potwierdzić” albo „nie chciał potwierdzić”. Zapis tylko po wyborze i kliknięciu „Zapisz wpis”; obok „Wróć bez zapisu”. Po zapisie przycisk ocenianego znika, a w podglądzie oceny jest wpis „Stwierdzono fikcję zapoznania <data>: oceniany nie mógł / nie chciał potwierdzić. Stwierdził: <oceniający>” i zegar sprzeciwu liczony od tego dnia.

**Contract**: `GET /cycles/:id/assessment/fiction` (ekran skutku, tylko oceniający w etapie `approved`), `POST /cycles/:id/assessment/fiction` z `reason` = `could_not` | `would_not`; brak albo inna wartość → 422 z tym samym ekranem i komunikatem „Wybierz, czy oceniany nie mógł, czy nie chciał potwierdzić”; zły etap → 409; zapisuje `acknowledgement_fiction`.

#### 3. Podgląd dla kadr i lista spraw

**File**: `src/routes/assessment.tsx`, ekran startowy F-01

**Intent**: Kadry (Joanna) mają wgląd w zatwierdzoną ocenę z blokiem potwierdzenia albo wpisem o fikcji, bez przycisków (PRD, Access Control). Lista spraw na ekranie startowym dostaje pozycje z `assessmentTasks`: oceniający „Wystaw ocenę: <imię i nazwisko>” (etap `draft`) i „Czeka na potwierdzenie zapoznania: <imię i nazwisko>” (etap `approved`), oceniany „Zapoznaj się z oceną” (etap `approved`). Pełny ekran kadr ze stanem wszystkich cykli robi S-06.

**Contract**: rola kadr z `people.role`; pozycje listy linkują do `/cycles/:id/assessment`; bez wyniku i liczb przy nazwisku.

### Success Criteria:

#### Automated Verification:

- Testy potwierdzenia i fikcji przechodzą: `bun test src/routes/assessment.test.ts` (scenariusze: potwierdzenie przez Piotra przy dacie 2026-11-30 zapisuje zdarzenie i pokazuje termin 07.12.2026; potwierdzenie przez Marka → 403; potwierdzenie przed zatwierdzeniem → 409; fikcja bez wyboru → 422 i brak zdarzenia; fikcja z `would_not` → zdarzenie, a potem potwierdzenie przez Piotra → 409; Joanna widzi wpis o fikcji i nie widzi przycisków; po przesunięciu daty o 3 dni zegar pokazuje mniej dni)
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Krok 5 pokazu: Piotr na telefonie (360 px) potwierdza zapoznanie i widzi zegar sprzeciwu z przepisem; w wariancie 5-minutowym Marek przechodzi przez ekran skutku fikcji, a Joanna widzi wpis
- Na żadnym ekranie nie pada słowo „podpis”, a przy nazwisku ocenianego nie ma wyniku, średniej ani etykiety poza samym ekranem oceny

## Testing Strategy

- **Czysta logika** (`src/engine/approval.test.ts`): każda blokada osobno i komplet bez blokad; uzasadnienie wymagane tylko przy wyniku negatywnym (przypadek „1” przy średniej powyżej 4 i przypadek średniej równej dokładnie 4); uzasadnienie i wnioski złożone z samych spacji traktowane jako puste; wniosek o stopień: pracownik, urzędnik z wynikiem negatywnym, urzędnik ze stopniem IX, urzędnik bez umotywowania, urzędnik z umotywowaniem.
- **Stan oceny** (`src/assessment/state.test.ts`): kolejność etapów; ostatni szkic wygrywa; zdarzenie z datą późniejszą niż `today()` jest niewidoczne (decyzja 10i); po fikcji etap `fiction` i termin sprzeciwu od daty fikcji.
- **Trasy** (`src/routes/assessment.test.ts`) przez `app.request()` na świeżej bazie z danymi pokazowymi, konto ustawiane ciasteczkiem; scenariusze wymienione w kryteriach faz 2 i 3. Wniosek o stopień (FR-023) jest sprawdzany tylko testem, na cyklu urzędnika mianowanego (Tomasz u Anny; gdy jego cykl nie ma `part1_confirmed`, test sam dopisuje cykl i zdarzenie).
- **Ręcznie**: kroki 4 i 5 pokazu na prawdziwej aplikacji, telefon 360 px i komputer 1440 px.

## Open Questions

Żadne nie blokuje; implementujący przyjmuje wartość domyślną.

1. **Czy htmx jest w repo?** Domyślnie: użyć, jeśli F-01 albo S-01 go dodał; inaczej zwykły skrypt w `public/assessment.js` (bez CDN, pokaz działa bez sieci).
2. **Gdzie leży miejscowość urzędu do potwierdzeń?** Domyślnie: `rules/office-settings.json`, klucz `place`, wartość z danych pokazowych (nazwa fikcyjnej miejscowości urzędu), etykieta „ustawienie urzędu”.
3. **Czy po fikcji oceniany może jeszcze potwierdzić?** Domyślnie: nie; pierwsze z dwóch zdarzeń zamyka etap, a oceniany widzi wpis o fikcji i zegar.
4. **Czy kadry widzą szkic przed zatwierdzeniem?** Domyślnie: nie; wgląd od zatwierdzenia (szkic to robocza wersja oceniającego).
5. **Czy „Wstaw” z notatek działa także we wnioskach do IPRZ?** FR-021 i roadmapa S-04 mówią o uzasadnieniu i wnioskach, decyzja 10f tylko o uzasadnieniu. Domyślnie: ten plaster daje miejsce `conclusionsTools`, decyzję podejmuje S-04.
6. **Liczba dni w zegarze, gdy termin przesunął się na dzień roboczy.** Domyślnie: ekran skutku fikcji mówi „7 dni” (zdanie z decyzji 10n), a datę końca podaje z silnika, więc może być późniejsza niż 7 dni kalendarzowych.

## References

- `context/foundation/decisions.md`: 5a, 5b, 10b, 10f, 10i, 10n
- `context/foundation/prd.md`: US-05, FR-018, FR-019, FR-022, FR-023, FR-024, FR-025, Business Logic, Access Control
- `context/foundation/roadmap.md`: S-02
- `context/foundation/demo.md`: kroki 4 i 5, „Ustalenia do scenariusza”
- `context/changes/rules-engine-and-demo-data/plan.md`: F-01 (nazwy, tabele, `today()`, filtr dat)
- `src/silnik/ocena.ts:73` (`wyliczOcene`), `src/silnik/terminy.ts:101` (`terminSprzeciwu`); po F-01 `src/engine/scoring.ts` i `src/engine/deadlines.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Blokady zatwierdzenia i stan oceny

#### Automated

- [ ] 1.1 Testy reguł zatwierdzenia przechodzą: `bun test src/engine/approval.test.ts`
- [ ] 1.2 Testy stanu oceny przechodzą: `bun test src/assessment/state.test.ts`

### Phase 2: Formularz oceny i zatwierdzenie

#### Automated

- [ ] 2.1 Testy tras oceny przechodzą: `bun test src/routes/assessment.test.ts`
- [ ] 2.2 Test wniosku o stopień przechodzi
- [ ] 2.3 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 2.4 Krok 4 pokazu na koncie Marka: wynik negatywny po „1” przy Rzetelności, blokada bez wniosków do IPRZ, 360 px i 1440 px

### Phase 3: Potwierdzenie zapoznania, fikcja i zegar sprzeciwu

#### Automated

- [ ] 3.1 Testy potwierdzenia i fikcji przechodzą: `bun test src/routes/assessment.test.ts`
- [ ] 3.2 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 3.3 Krok 5 pokazu: potwierdzenie Piotra z zegarem sprzeciwu; fikcja z ekranem skutku i wpisem widocznym dla Joanny
- [ ] 3.4 Na żadnym ekranie nie pada słowo „podpis”, a przy nazwisku ocenianego nie ma wyniku ani etykiety poza ekranem oceny
