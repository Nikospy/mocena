# Notatki o faktach i uzasadnienie z notatek — plan wdrożenia

## Overview

Plaster S-04, czyli teza produktu (decyzja 1): przełożony przez 24 miesiące zapisuje z telefonu krótkie notatki o faktach przy kryteriach, a przy ocenie ma je pod ręką. Plaster daje tabelę notatek z danymi pokazowymi, formularz notatki z polem „Zmiana zadań pracownika” wstępnie zaznaczanym przez adapter podpowiedzi, notatki i ostrzeżenie przy każdym kryterium w formularzu oceny, wstawianie zaznaczonych notatek do uzasadnienia, kartę rozmowy oceniającej, a po wersji minimalnej: informację zwrotną dla pracownika, drugie „Wstaw” (do wniosków rozwojowych) i gałąź modelu.

**Wersja minimalna (fazy 1 i 2, około 50 minut).** Formularz notatki na telefonie z wstępnie zaznaczanym polem, notatki przy kryteriach w formularzu oceny S-02, jedno „Wstaw” do uzasadnienia, ostrzeżenie „fakty tylko z ostatniego miesiąca”, karta rozmowy oceniającej z odnośnikami z ekranu wejściowego cyklu i z formularza oceny. Na niej działają kroki 2 i 4 pokazu. Wszystko później jest dokładką.

**Kolejność cięcia** (co odpada pierwsze, gdy brakuje czasu; wersja minimalna nie jest cięta): 1) faza 4, czyli gałąź modelu (i tak opcjonalna, decyzja 10l); 2) ostrzeżenie „skrajna ocena bez faktu” (pokaz go nie wywołuje); 3) ekran pracownika „Informacja zwrotna” (`GET /feedback`); 4) pole daty w formularzu notatki (data = `today()` bez wyboru); 5) drugi przycisk „Wstaw do wniosków rozwojowych”; 6) „Przekaż pracownikowi” z datą wysłania (potrzebna S-05 do przypomnienia o docenianiu; bez niej `lastFeedbackDate` zwraca `null`). Nie tniemy niczego z wersji minimalnej.

## Current State Analysis

- Kodu tego plastra nie ma. Repo ma starter Hono (`src/index.ts`) i silnik pod polskimi nazwami (`reguly/`, `src/silnik/`); F-01 przenosi go na nazwy angielskie (`rules/regulation-2016-470.json`, `src/engine/`), a wejście aplikacji na `src/index.tsx`.
- Plik reguł ma identyfikatory kryteriów (`reguly/rozporzadzenie-2016-470.json:142–281`, np. `rzetelnosc`, `orientacja-na-klienta`, `wykorzystywanie-wiedzy`); kontrakt zostawia je bez zmian. Tematy rozmowy oceniającej z § 10 są w kluczu `rozmowaOceniajaca` (`:298–305`); po F-01 klucz to `assessmentConversation` z polami `basis` i `topics` (nazwa z recenzji, ustalenie 5). Karta rozmowy bierze tematy stąd, nie z kopii.
- `public/` jest pusty; htmx nie jest wgrany. Plaster nie zakłada htmx: dwa małe skrypty bez zależności (`public/note-form.js`, `public/insert-notes.js`), serwowane lokalnie przez `serveStatic` z F-01.
- Tabela notatek do wgrania: `context/foundation/demo.md`, sekcja „Notatki do wgrania” (16 wierszy: Piotr 9, Ewa 4, Tomasz 3). F-01 notatek nie wgrywa; robi to moduł tego plastra.

## Desired End State

Marek na telefonie (360 px) zapisuje notatkę o Piotrze; gdy w tekście jest słowo z listy, pole „Zmiana zadań pracownika” zaznacza się samo z dopiskiem, skąd ta podpowiedź, a Marek może je odznaczyć. W formularzu oceny Piotra (data systemowa 21.11.2026, krok 4 pokazu) przy każdym kryterium widać notatki Marka z okresu oceny z datą i polem „dobrze / do poprawy”; przy „Wykorzystywanie wiedzy i doskonalenie zawodowe” widać ostrzeżenie „fakty tylko z ostatniego miesiąca”; zaznaczone notatki przycisk „Wstaw do uzasadnienia” dopisuje z datą do pola uzasadnienia S-02, nad którym stoi „Ten tekst przeczyta pracownik”; pole da się dalej edytować, a nic się nie zapisuje przed przyciskiem formularza. Karta rozmowy oceniającej pokazuje trzy tematy z § 10. Po wersji minimalnej: przy notatce jest „Przekaż pracownikowi”; Piotr widzi wysłany (poprawiony) tekst, a samej notatki nie widzi na swoim koncie (decyzja 11c: w interfejsie nie ma słowa „prywatna”). `bun test` przechodzi.

### Key Discoveries:

- Kryteria w notatkach pokazowych mają nazwy urzędowe. Kontrakt zostawia identyfikatory kryteriów bez zmian, więc moduł danych trzyma stałą mapę „nazwa z `demo.md` → identyfikator”, a test sprawdza każdą pozycję przez `criterion(id)` (nazwa musi się zgadzać; brak = błąd, nie cichy pominięty wiersz).
- Notatka 12.11.2026 (Piotr, „Wykorzystywanie wiedzy…”) jest jedyną przy tym kryterium (decyzja 10c, `demo.md` „Ustalenia do scenariusza”), a inne kryteria Piotra mają notatki starsze niż miesiąc od 21.11.2026: ostrzeżenie pojawi się dokładnie w jednym miejscu.
- „Orientacja na klienta/interesanta” nie jest kryterium obowiązkowym arkusza C (`reguly/…json:668–676`). U Piotra jest dodatkowe z kroku 1 (decyzja 10i). Notatka Ewy z 12.12.2024 trafi pod swoje kryterium tylko, gdy `src/seed/part1.ts` (S-01) wpisze je Ewie do `cycle_criteria`; inaczej ląduje w bloku „Notatki przy innych kryteriach”.

## Założenia wobec wcześniejszych plastrów

Wszystkie nazwy pochodzą z rozdziału „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`. Gdy zbudowany kod F-01 różni się od kontraktu, wygrywa kod, a zachowanie tego plastra się nie zmienia.

- **F-01, tabele:** `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade)`; `cycles(id, person_id, appraiser_id, period_start, sheet)` — `period_start` to początek 24-miesięcznego okresu (dla Piotra 2024-11-27); `cycle_criteria(cycle_id, criterion_id, kind, expectation)`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings(key, value)`.
- **F-01, funkcje:** `today()`, `currentPerson(c)`, `visibleEvents(cycleId)` (cykl jest widoczny od swojego zdarzenia `cycle_started`), `registerHomeTasks(fn)`, `registerCycleLinks(fn)`, `rulesVersion()`, `createTestApp({ today })` w `src/test-helpers.ts`; silnik: `criterion(id)` w `src/engine/scoring.ts`, `addMonths` w `src/engine/deadlines.ts`.
- **F-01, uruchomienie:** `bun run seed` uruchamia `src/seed.ts`, który woła moduły z `src/seed/`; pliki z `public/` przez `serveStatic`.
- **Daty pokazu:** krok 1 2024-12-09, krok 2 2026-03-11, krok 3 2026-11-10, krok 4 2026-11-21, krok 5 2026-11-22.
- **S-01:** `content/cards.json` i `card(id)`; ten plaster dopisuje klucz `assessment`. Ekran wejściowy cyklu to `GET /cycles/:id/part1` z `cycleLinks`. `cycle_criteria` danego cyklu wypełnione po `part1_submitted`. `rules/office-settings.json` z `officeSettings()`; ten plaster dopisuje klucze.
- **S-02:** formularz `GET/POST /cycles/:id/assessment`; widok przyjmuje props `slots` (domyślnie puste): `criterionAside(criterionId)`, `justificationTools`, `conclusionsTools`, `beforeForm`. Pola tekstowe `justification` i `developmentConclusions` mają `id` równe `name`. Zdanie „Ten tekst przeczyta pracownik” nad uzasadnieniem stawia S-02. Zapis formularza należy do S-02; ten plaster niczego w nim nie zapisuje.

## Co ten plaster udostępnia

Dla S-05 (HR partner), S-06 i S-03:

- **Tabela `notes`** (kontrakt): `id`, `author_id`, `subject_id`, `cycle_id` (może być null), `criterion_id`, `date` (ISO, data faktu wybrana przez człowieka, nie później niż `today()`), `text`, `rating` (`good` | `needs_improvement` | null), `task_change` (0/1, wartość kliknięta przez człowieka), `suggested_task_change` (0/1/null, co podpowiedział adapter), `suggestion_source` (`rules` | `local-model` | `none`), `created_at` (ISO, data systemowa `today()` w chwili kliknięcia „Zapisz notatkę”; w danych pokazowych równa `date`).
- **Tabela `feedback_messages`** (kontrakt): `id`, `note_id`, `author_id`, `recipient_id`, `sent_on` (ISO, `today()` przy wysyłce), `text`.
- **Widoczność:** jedna granica `date <= today()` dla notatek i `sent_on <= today()` dla wiadomości (decyzja 10i, ustalenie 11 recenzji). Widoczność liczy się od daty faktu (`date`), nigdy od `created_at`.
- **Funkcje dla S-05** w `src/notes/repo.ts`: `notesAbout(subjectId, { authorId, from? })` (notatki autora o osobie, rosnąco po dacie), `notesByAuthor(authorId)` (wszystkie notatki autora, od najnowszej), `lastFeedbackDate(authorId, recipientId)` (ISO albo `null`). Poza tym `notesForCycle(cycleId, authorId)` i `noteById(id)`. Każda zwraca tylko wiersze widoczne według granicy wyżej.
- **Adapter** w `src/suggestions/index.ts`: `suggestForNote(text): Promise<NoteSuggestion>` (wejście dla notatki) i `suggestionMode(): 'rules' | 'local-model' | 'none'` (dla ekranu „Skąd biorą się podpowiedzi”, FR-036). Wejście dla reguł kryteriów (S-01) leży w tym samym module jako osobne wejście (szczegóły w fazie 1, punkt 4).
- **Punkt zaczepienia po zapisie notatki:** `afterNoteSaved(note): string` w `src/routes/notes.tsx` zwraca adres przekierowania (dziś `/notes?saved=<id>`). S-05 podmienia go dla notatek z `task_change = 1`, żeby zadać pytanie „To stała zmiana zadań?”.
- **Trasa „Dopisz notatkę”:** `GET /people/:personId/notes/new` działa także dla osoby bez cyklu (Maria, decyzja 10k).
- **Trasy** (kontrakt): `GET /people/:personId/notes/new`, `POST /people/:personId/notes`, `GET /notes`, `GET/POST /notes/:id/feedback`, `GET /feedback`, `POST /suggestions/note`, `GET /cycles/:id/cards/assessment-conversation`.
- **Dane pokazowe:** `src/seed/notes.ts` (16 notatek z `demo.md`), wołany z `src/seed.ts`; opcja `--live-step-2` pomija notatkę z 11.03.2026.
- **Karta:** klucz `assessment` w `content/cards.json`.
- **Komponenty:** `NoteItem` (notatka z datą, kryterium, oceną przełożonego, znacznikiem zmiany zadań) i `CriterionNotes` (notatki przy kryterium z ostrzeżeniami i „Wstaw”).
- **Ustawienia urzędu** w `rules/office-settings.json`: `taskChangeWords`, `recentFactsWindowMonths`. Bez klucza włączającego model ani adresu usługi.

## What We're NOT Doing

- Pytania HR partnera po notatce, ekranu „Przed rozmową”, przypomnienia o docenianiu, ekranu „Skąd biorą się podpowiedzi” (S-05).
- Edycji i usuwania notatek, wyszukiwania, filtrów, eksportu notatek dla kadr (PRD, Access Control) — poza prototypem.
- Żadnej podpowiedzi kryterium, ostrzeżenia o danych o zdrowiu ani „podobna notatka już jest” (decyzja 9, miejsca 2–4: tylko na ekranie S-05).
- Automatycznego wstawiania notatek do uzasadnienia i jakiegokolwiek zdania pisanego przez system o pracowniku (decyzja 10f).
- Liczb, podsumowań „dobrze / do poprawy” ani etykiet przy nazwisku pracownika na żadnej liście (zasada 7 w `AGENTS.md`).
- Modelu językowego i jakiegokolwiek połączenia z usługą. Faza 4 dodaje tylko gałąź w kodzie, sprawdzaną testem z podstawioną atrapą; konfiguracja prototypu nie może jej przełączyć na prawdziwą usługę.
- Stylów: wygląd pochodzi z design systemu autora (decyzja 10b).
- Wgranych informacji zwrotnych (notatka z 18.06.2026 sugeruje, że Marek jej nie przekazał; to zasila przypomnienie S-05).

## Implementation Approach

Notatki to osobna tabela, a nie wiersze `events`, bo mają własne pola i są odczytywane przy każdym kryterium; każdy odczyt filtruje `date <= today()`, tak jak `visibleEvents`. Data faktu (`date`) i data zapisu przez człowieka (`created_at`) są osobnymi kolumnami: pierwsza decyduje o widoczności i o miejscu w okresie oceny, druga mówi, kiedy kliknięto „Zapisz notatkę”. Notatka należy do osoby (`subject_id`), a `cycle_id` jest dopisywany przy zapisie, gdy osoba ma widoczny cykl; dzięki temu „Dopisz notatkę” działa też dla Marii.

Dostęp (ustalenie 17 recenzji): zapis notatki o osobie z widocznym cyklem wolno temu, kto jest `cycles.appraiser_id` tego cyklu; o osobie bez cyklu — temu, kto jest jej `people.supervisor_id`. Odczyt notatki i wysyłka informacji zwrotnej tylko przez autora (`notes.author_id`), także po zmianie oceniającego: nowy oceniający nie widzi notatek poprzedniego, a poprzedni dalej widzi swoje.

Podpowiedzi przechodzą przez jedno miejsce, `src/suggestions/index.ts`: usuwa z tekstu imiona i nazwiska osób z tabeli `people`, woła reguły notatki i zwraca źródło oraz podpowiedź pola. Formularz pyta o podpowiedź skryptem w trakcie pisania i zaznacza pole tylko, dopóki człowiek go nie dotknął. Serwer zapisuje dokładnie to, co człowiek wysłał w polu `task_change`, a obok, do wglądu, wynik adaptera policzony ponownie z tekstu.

„Wstaw” działa w przeglądarce: serwer renderuje przy każdej notatce gotowy fragment tekstu (`Kryterium, DD.MM.RRRR: treść`), a skrypt dopisuje zaznaczone fragmenty na końcu pola S-02. Nic nie zapisuje się samo; zapis robi przycisk S-02.

## Phase 1: Dane notatek i adapter podpowiedzi (wersja minimalna)

### Overview

Tabele, dane pokazowe, odczyty z jedną granicą daty, ustawienia urzędu i adapter z regułami. Bez ekranów. Około 20 minut.

### Changes Required:

#### 1. Schemat

**File**: `src/db.ts`

**Intent**: Dopisać tabele `notes` i `feedback_messages` z kontraktu do schematu tworzonego przy starcie, z indeksami `(subject_id, date)` i `(author_id, date)`.

**Contract**: Kolumny jak w „Co ten plaster udostępnia”. `rating` z CHECK na `good` / `needs_improvement` / NULL. `suggestion_source` NOT NULL, domyślnie `none`. `created_at` NOT NULL.

#### 2. Odczyty i zapisy notatek

**File**: `src/notes/repo.ts`

**Intent**: Jedno miejsce dostępu do notatek i informacji zwrotnych; każda funkcja odczytu dokleja warunek `date <= today()` (dla wiadomości `sent_on <= today()`). Bez innych filtrów daty w widokach.

**Contract**: Funkcje z sekcji „Co ten plaster udostępnia” oraz `addNote({ authorId, subjectId, criterionId, date, text, rating, taskChange, suggestion })` (`created_at = today()`, `cycle_id` = widoczny cykl osoby albo NULL) i `sendFeedback({ noteId, authorId, text })` (odbiorca = `subject_id` notatki, `sent_on = today()`). `notesForCycle` zwraca notatki autora o osobie z cyklu z datą od `cycles.period_start` do `today()`, rosnąco po dacie. Funkcja `canWriteNoteAbout(actorId, personId)` w tym samym pliku: widoczny cykl osoby → `cycles.appraiser_id`, brak cyklu → `people.supervisor_id`.

#### 3. Ustawienia urzędu

**File**: `rules/office-settings.json`

**Intent**: Dopisać listę słów wstępnie zaznaczających pole „Zmiana zadań pracownika” i próg „ostatni miesiąc”. Każdy nowy klucz ma opis z dopiskiem „ustawienie urzędu”, bo nie pochodzi z przepisów (decyzja 10e).

**Contract**: `taskChangeWords: string[]` — rdzenie porównywane jako podciąg tekstu po zamianie na małe litery, np. `przejął`, `przejęła`, `przejmuje`, `przejęcie`, `po odejściu`, `kolejkę`, `nowy zakres`, `nowe zadania`, `zakres obowiązków`, `zastępuje`, `zastępstw`; `recentFactsWindowMonths: 1`. Żadnego klucza trybu modelu ani adresu usługi.

#### 4. Adapter podpowiedzi

**File**: `src/suggestions/types.ts`, `src/suggestions/redact.ts`, `src/suggestions/note-rules.ts`, `src/suggestions/index.ts`

**Intent**: Jedno wymienne miejsce na podpowiedzi (zasada 5 w `AGENTS.md`, decyzje 9 i 10l), z osobnymi wejściami dla notatki i dla reguł kryteriów (ustalenie 18 recenzji). `index.ts` usuwa nazwiska, woła reguły notatki i nigdy nie rzuca wyjątku do trasy. Reguły zwracają też znalezione słowa, żeby ekran mógł powiedzieć, skąd podpowiedź. Wejście kryteriów to `suggestCriteria(sheet, dutyTypeIds)`, które S-01 utworzył już w `src/suggestions/index.ts` (kontrakt wspólny); ten plaster tylko dopisuje obok wejście notatki.

**Contract**:

```ts
export type SuggestionSource = 'rules' | 'local-model' | 'none';
export interface NoteSuggestion {
  source: SuggestionSource;
  taskChange: boolean | null; // null przy source 'none'
  matched: string[];          // słowa z listy; pusta przy local-model i none
}
export interface NoteSuggester { suggest(redactedText: string): Promise<NoteSuggestion> }
export function suggestForNote(text: string): Promise<NoteSuggestion>; // redakcja + reguły notatki
export function suggestionMode(): 'rules' | 'local-model' | 'none';  // w prototypie zawsze 'rules'
```

Kształt wyniku nie ma pól na punkty, ocenę „dobrze / do poprawy”, kryterium ani tekst o pracowniku; to ograniczenie z decyzji 9 trzyma typ, nie dyscyplina. `redact(text, names)` zamienia imiona i nazwiska wszystkich osób z `people` (bez rozróżniania wielkości liter, także odmienione formy przez dopasowanie rdzenia imienia, np. `Piotr` łapie `Piotra`) na `[osoba]`. Pusty tekst daje `{ source: 'none', taskChange: null, matched: [] }`.

#### 5. Dane pokazowe

**File**: `src/seed/notes.ts`, wywołanie z `src/seed.ts`

**Intent**: Wgrać 16 notatek z tabeli „Notatki do wgrania” w `context/foundation/demo.md`, dosłownie, z datami z przyszłości względem startowej daty systemowej 2024-12-09 (odsłania je przesuwanie daty, decyzja 10i). Bez informacji zwrotnych. Z opcją `--live-step-2` moduł pomija jedną notatkę z 11.03.2026 (Piotr, Współpraca), bo w kroku 2 Marek pisze ją na żywo.

**Contract**: `seedNotes(db, { liveStep2 }: { liveStep2: boolean })`; `src/seed.ts` przekazuje `liveStep2 = process.argv.includes('--live-step-2')` (gdy F-01 tego nie czyta, ten plaster dopisuje tę jedną linię). Na każdy wiersz jeden rekord `notes`: `author_id` = Marek Zieliński dla Ewy i Piotra, Anna Kwiatkowska dla Tomasza; `subject_id` po imieniu; `criterion_id` ze stałej mapy nazw (sprawdzanej testem przez `criterion(id)`); `date` z kolumny „Data” w ISO; `created_at = date`; `rating`: „dobrze” → `good`, „do poprawy” → `needs_improvement`; `task_change = 1` tylko dla 11.03.2026, reszta 0; `suggested_task_change = NULL`, `suggestion_source = 'none'`; `cycle_id` = cykl osoby z najpóźniejszym `period_start <= date`, gdy jest, inaczej NULL. Teksty notatek są kopiowane bez zmian, bo z nich składa się uzasadnienie w kroku 4.

### Success Criteria:

#### Automated Verification:

- Testy odczytów, dostępu, adaptera i danych pokazowych przechodzą: `bun test src/notes src/suggestions src/seed`
- Dane pokazowe wgrywają się bez błędu i dają 16 notatek, a z `--live-step-2` 15: `bun run seed` i `bun run seed -- --live-step-2`

#### Manual Verification:

- Słowa w `taskChangeWords` łapią tekst notatki z 11.03.2026 i nie łapią drugiej notatki z kroku 2

---

## Phase 2: Formularz notatki, notatki przy kryteriach, „Wstaw do uzasadnienia” i karta (wersja minimalna)

### Overview

Ekran przełożonego na telefonie i wpięcie w formularz oceny S-02. Na końcu tej fazy działają kroki 2 i 4 pokazu. Około 30 minut.

### Changes Required:

#### 1. Trasy notatek

**File**: `src/routes/notes.tsx` (podpięte w `src/index.tsx`)

**Intent**: Zapis notatki według `canWriteNoteAbout`; odczyt tylko przez autora. Zapis to jedyny moment, w którym coś trafia do bazy, i dzieje się po kliknięciu „Zapisz notatkę”.

**Contract**:
- `GET /people/:personId/notes/new` — formularz; 403, gdy `canWriteNoteAbout` zwraca fałsz. Działa dla osoby bez cyklu (Maria).
- `POST /people/:personId/notes` — pola `criterion_id` (wymagane), `text` (wymagany, po przycięciu 1–2000 znaków), `rating` (`good` | `needs_improvement` | brak), `task_change` (checkbox); data faktu = `today()` (pole daty dochodzi w fazie 3). Ta sama kontrola dostępu co przy GET (403). Serwer liczy `suggestForNote(text)` ponownie i zapisuje jego wynik w `suggested_task_change` i `suggestion_source`, a w `task_change` wyłącznie wartość z formularza. Błąd walidacji: formularz wraca z wpisanymi wartościami i komunikatem przy polu („Wpisz, co się wydarzyło.”, „Wybierz kryterium.”). Sukces: przekierowanie na `afterNoteSaved(note)`.
- `POST /suggestions/note` — przyjmuje `text`, zwraca JSON `NoteSuggestion`; nic nie zapisuje.
- `GET /notes` — „Moje notatki”: `notesByAuthor` zalogowanego autora pogrupowane po osobie, od najnowszej; przy każdej osobie, o której konto może pisać (także Maria), przycisk „Dopisz notatkę” do `/people/:personId/notes/new`.

Lista kryteriów w formularzu: kryteria widocznego cyklu osoby (z `cycle_criteria`), a pod nimi pozostałe kryteria z pliku reguł w grupie „Inne kryteria”; osoba bez cyklu dostaje pełną listę.

Wejście do ekranów przez `registerHomeTasks`: oceniający i przełożeni dostają na `GET /` pozycję „Notatki o zespole” prowadzącą do `/notes`.

#### 2. Widoki i podpowiedź w trakcie pisania

**File**: `src/views/note-form.tsx`, `src/views/notes-list.tsx`, `src/views/components/note-item.tsx`, `public/note-form.js`

**Intent**: Komponenty na wspólnym układzie F-01, z tokenami i komponentami z design systemu autora (decyzja 10b; bez własnych stylów). Formularz notatki to jedna kolumna mieszcząca się na 360 px, bez przewijania w poziomie. Skrypt: kilkanaście linii bez zależności; po przerwie w pisaniu (ok. 600 ms) wysyła tekst do `POST /suggestions/note`, zaznacza albo odznacza checkbox i pokazuje linię podpowiedzi, ale tylko dopóki człowiek nie kliknął checkboxa. Po pierwszym kliknięciu skrypt przestaje zmieniać pole. Bez JavaScriptu checkbox działa ręcznie.

**Contract**:
- `NoteForm`: wybór kryterium, pole tekstu, wybór „dobrze” / „do poprawy” bez wartości domyślnej (wypełnia wyłącznie przełożony, decyzja 3 pkt 3), checkbox „Zmiana zadań pracownika” z linią podpowiedzi, przycisk „Zapisz notatkę”.
- `SuggestionHint` (linia pod checkboxem): przy `rules` — „Zaznaczone na podstawie listy słów (ustawienie urzędu): „przejął”. Możesz odznaczyć.”; przy `local-model` — „Zaznaczone przez model uruchomiony w urzędzie. Możesz odznaczyć.”; przy braku podpowiedzi linii nie ma.
- `NoteItem`: data, nazwa kryterium, ocena przełożonego, znacznik „zmiana zadań”, tekst, akcje przekazane przez rodzica.
- Lista „Moje notatki”: nagłówek osoby to samo imię i nazwisko, bez liczby notatek i bez podsumowań.
- `public/note-form.js` nie wysyła formularza i nie zapisuje niczego; serwowany z `public/` bez CDN.

#### 3. Ostrzeżenie „fakty tylko z ostatniego miesiąca” (FR-020)

**File**: `src/notes/warnings.ts`

**Intent**: Czysta funkcja bez bazy. Ostrzeżenie: przy kryterium jest co najmniej jedna notatka i wszystkie mają datę późniejszą niż `addMonths(today, -recentFactsWindowMonths)` (notatka dokładnie sprzed miesiąca jest już „starsza”). Ostrzeżenie nie blokuje zatwierdzenia (blokady należą do S-02, FR-022).

**Contract**: `criterionWarnings({ notes, score, today, windowMonths }): Array<'recent_only' | 'extreme_without_facts'>`; w tej fazie zwraca tylko `recent_only` (drugi rodzaj dochodzi w fazie 3, sygnatura się nie zmienia). Tekst: „Wszystkie notatki przy tym kryterium są z ostatniego miesiąca. Co działo się wcześniej w okresie oceny?”

#### 4. Formatowanie do wstawienia

**File**: `src/notes/insert.ts`

**Intent**: Zamienia notatkę na jedną linię tekstu z nazwą kryterium i datą, bez żadnego dodanego słowa o pracowniku (decyzja 10f).

**Contract**: `formatNoteForInsert(note, criterionName): string` → `Rzetelność, 11.02.2025: Pismo do gminy poszło 11 lutego, …`. Pole `rating` nie trafia do tekstu.

#### 5. Notatki przy kryterium i „Wstaw do uzasadnienia”

**File**: `src/views/components/criterion-notes.tsx`, `src/notes/assessment-slots.tsx`, przekazanie `slots` w `src/routes/assessment.tsx` (S-02), `public/insert-notes.js`

**Intent**: Wypełnić istniejące `slots` widoku oceny S-02, bez nowych propsów. `criterionAside(criterionId)`: notatki zalogowanego oceniającego z okresu oceny (`notesForCycle(cycleId, viewer.id)`) przy tym kryterium jako `NoteItem` z checkboxem, ostrzeżenie z `criterionWarnings`, stan pusty „Brak notatek przy tym kryterium”. Notatki o kryteriach spoza `cycle_criteria` w osobnym bloku „Notatki przy innych kryteriach” na końcu listy kryteriów (przez ostatni `criterionAside` albo `beforeForm`, zależnie od tego, co S-02 renderuje). `justificationTools`: przycisk „Wstaw do uzasadnienia”. `beforeForm`: odnośnik „Karta rozmowy oceniającej”. Skrypt dopisuje na końcu pola `justification` fragmenty zaznaczonych notatek, każdy w nowej linii, odznacza je i wysyła zdarzenie `input` na polu (pole zachowuje się jak po wpisaniu ręcznym); formularza nie wysyła i nic nie zapisuje.

**Contract**: `assessmentSlots({ cycleId, viewer }): Slots` w `src/notes/assessment-slots.tsx` (kontroler S-02 przekazuje wynik jako `slots`). Każdy checkbox notatki niesie `data-insert="<formatNoteForInsert>"`; przycisk ma `type="button"` i `data-target="justification"`. Sloty są puste, gdy `viewer.id` nie jest `cycles.appraiser_id` cyklu; notatki pochodzą wyłącznie od zalogowanego autora.

#### 6. Karta rozmowy oceniającej (FR-017)

**File**: `content/cards.json` (klucz `assessment`), `src/routes/notes.tsx`, `src/views/assessment-card.tsx`, rejestracja w `registerCycleLinks`

**Intent**: Karta przygotowania do rozmowy oceniającej: cel, trzy tematy z § 10 wzięte z pliku reguł z podstawą prawną, pytania pomocnicze i trudne sytuacje (treść pisana przy budowie, decyzja 10e), na dole link „Notatki przy kryteriach” do formularza oceny. Wejście z ekranu wejściowego cyklu (`GET /cycles/:id/part1`, przez `registerCycleLinks`) i z formularza oceny (slot `beforeForm`). Oba odnośniki należą do wersji minimalnej (ustalenie 4 recenzji). Własny widok, bez zależności od widoku karty S-01.

**Contract**: `GET /cycles/:id/cards/assessment-conversation` (tylko `cycles.appraiser_id`, inaczej 403); treść z `card('assessment')` w kształcie karty S-01 (`{ title, purpose, questions: string[], hardSituations: [{ situation, whatToDo }] }`); tematy i podstawa (`§ 10`) z `assessmentConversation.{basis, topics}` w pliku reguł, nie z kopii w `cards.json`. `registerCycleLinks` dodaje „Karta rozmowy oceniającej” tylko dla oceniającego cyklu.

### Success Criteria:

#### Automated Verification:

- Testy tras notatek, dostępu, ostrzeżenia, formatowania, slotów i karty przechodzą: `bun test src/routes/notes.test.ts src/notes`
- Test DOM „Wstaw” przechodzi: `bun test src/notes/insert-notes.dom.test.ts`

#### Manual Verification:

- Krok 2 (data 2026-03-11, dane z `--live-step-2`), telefon 360 px: pole „Zmiana zadań pracownika” zaznacza się w trakcie pisania notatki z 11.03.2026 z linią „listy słów”; po odznaczeniu nie wraca; druga notatka zapisuje się z pustym polem i bez linii podpowiedzi
- Krok 4 (data 2026-11-21): formularz oceny Piotra pokazuje notatki przy kryteriach, notatkę z 04.08.2025 przy „Orientacja na klienta/interesanta”, puste „Myślenie analityczne” i jedno ostrzeżenie „z ostatniego miesiąca”
- „Wstaw do uzasadnienia” dopisuje zaznaczone notatki z datami; pole da się dalej poprawić; nic nie zapisuje się bez przycisku S-02
- Karta rozmowy oceniającej otwiera się z ekranu cyklu i z formularza oceny i pokazuje trzy tematy z § 10

---

## Phase 3: Informacja zwrotna, drugie „Wstaw”, data notatki i ostrzeżenie o ocenie skrajnej

### Overview

Dokładki po wersji minimalnej, w odwrotnej kolejności cięcia: najpierw to, co odpada ostatnie. Około 25 minut.

### Changes Required:

#### 1. „Przekaż pracownikowi”

**File**: `src/routes/notes.tsx`, `src/views/feedback-form.tsx`

**Intent**: Przy każdej notatce na liście „Moje notatki” przycisk „Przekaż pracownikowi”. Otwiera tekst notatki do poprawy; wysyłka zapisuje wiadomość z `sent_on = today()` (decyzja 10j). Data wysłania zasila `lastFeedbackDate` dla S-05.

**Contract**:
- `GET /notes/:id/feedback` — tekst notatki w polu do poprawy, nad polem „To zobaczy pracownik. Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje.” (decyzja 11c, bez słowa „prywatna”); 404 dla notatki innego autora.
- `POST /notes/:id/feedback` — zapis wiadomości z poprawionym tekstem (wymagany), tylko autor (inaczej 404), przekierowanie na `/notes` z potwierdzeniem „Wysłano pracownikowi”.

#### 2. Drugie „Wstaw” — do wniosków rozwojowych

**File**: `src/notes/assessment-slots.tsx`, `public/insert-notes.js`

**Intent**: Slot `conclusionsTools` z przyciskiem „Wstaw do wniosków rozwojowych”; ten sam skrypt, inny cel.

**Contract**: przycisk `type="button"`, `data-target="developmentConclusions"`.

#### 3. Data notatki

**File**: `src/views/note-form.tsx`, `src/routes/notes.tsx`

**Intent**: Pole daty faktu, domyślnie `today()`, nie później niż `today()`, bez dolnej granicy. `created_at` zostaje `today()` niezależnie od wybranej daty.

**Contract**: pole `date`; błąd „Data nie może być późniejsza niż dziś.”

#### 4. Ekran pracownika „Informacja zwrotna”

**File**: `src/routes/notes.tsx`, `src/views/feedback.tsx`

**Intent**: Wiadomości do zalogowanej osoby, od najnowszej, z nadawcą i datą. Wejście przez `registerHomeTasks`: pozycja „Informacja zwrotna” dla osoby, która ma co najmniej jedną widoczną wiadomość.

**Contract**: `GET /feedback`; nagłówek bez liczby wiadomości.

#### 5. Ostrzeżenie „skrajna ocena bez faktu”

**File**: `src/notes/warnings.ts`

**Intent**: Ocena cząstkowa 1 albo 9 przy kryterium bez żadnej notatki. Liczone przy renderze z zapisanych ocen S-02, bez dodatkowego skryptu.

**Contract**: `criterionWarnings` zwraca też `extreme_without_facts`; tekst „Ocena skrajna, a przy tym kryterium nie masz żadnej notatki.”

### Success Criteria:

#### Automated Verification:

- Testy informacji zwrotnej, drugiego „Wstaw”, daty i ostrzeżenia skrajnego przechodzą: `bun test src/routes/notes.test.ts src/notes`

#### Manual Verification:

- „Przekaż pracownikowi”: Piotr widzi poprawiony tekst w „Informacja zwrotna”, a nie widzi notatki

---

## Phase 4 (opcjonalna): Gałąź modelu uruchomionego w urzędzie

### Overview

Pierwsza rzecz do zrobienia, jeśli zostanie czas przed 07:00 (decyzja 10l), i pierwsza do cięcia. Około 10–15 minut.

### Changes Required:

#### 1. Implementacja `local-model` sprawdzana atrapą

**File**: `src/suggestions/local-model.ts`, punkt podstawienia w `src/suggestions/index.ts`

**Intent**: Gałąź, przez którą urząd podłączy model uruchomiony u siebie. Przyjmuje funkcję wywołania usługi podaną w kodzie, wysyła zredagowany tekst i przyjmuje tylko wartość z zamkniętej listy. Gdy funkcja nie odpowie w czasie, odpowie błędem albo czymś spoza listy, wynik dają reguły (`source: 'rules'`). Prototyp nie ma żadnego klucza w ustawieniach ani adresu usługi, więc konfiguracją nie da się włączyć prawdziwej usługi (ustalenie 18 recenzji, zasada 8). Sprawdza ją wyłącznie test z podstawioną atrapą.

**Contract**: `localModelSuggester(call: (redactedText: string) => Promise<unknown>, timeoutMs = 800): NoteSuggester`; poprawna odpowiedź `{ taskChange: true | false }`; `setNoteSuggester(s: NoteSuggester | null)` w `index.ts` (używany tylko w testach i przy przyszłym podłączeniu w urzędzie); `suggestionMode()` zwraca `'local-model'` tylko po podstawieniu, inaczej `'rules'`.

### Success Criteria:

#### Automated Verification:

- Test z podstawioną atrapą przechodzi: `bun test src/suggestions/local-model.test.ts`

## Testing Strategy

Jedna reguła, jeden test, na najtańszej warstwie, która ją naprawdę wykonuje. Trasy przez `app.request()` na aplikacji z `createTestApp({ today })`; daty z tabeli „Daty pokazu” kontraktu.

| Reguła | Test | Faza |
|---|---|---|
| R1. Jedna granica `date <= today()`: notatka 2026-11-12 niewidoczna przy 2026-11-11, widoczna przy 2026-11-12 i 2026-11-13; przy 2024-12-09 notatek Piotra nie ma, przy 2026-11-21 jest ich 9 | `src/notes/repo.test.ts` | 1 |
| R2. Data faktu osobno od daty zapisu: notatka z `date` wcześniejszą niż `today()` ma `created_at = today()`; widoczność liczy się od `date` | `src/notes/repo.test.ts` | 1 (data wybierana od fazy 3) |
| R3. Seed: 16 notatek, `task_change = 1` tylko 11.03.2026, każda nazwa kryterium zgodna z `criterion(id)`; z `liveStep2: true` 15 notatek i brak notatki z 11.03.2026 | `src/seed/notes.test.ts` | 1 |
| R4. Reguły: tekst notatki z 11.03.2026 → `rules`, `true`, `matched` niepuste; „Na odprawie sam zgłosił, że pismo do gminy wyjdzie w piątek, i wyszło w piątek.” → `rules`, `false`; pusty tekst → `none` | `src/suggestions/note-rules.test.ts` | 1 |
| R5. Do reguł nie trafia imię ani nazwisko (podstawiona implementacja zapisuje, co dostała; tekst „Piotra Wójcika” dochodzi jako `[osoba]`) | `src/suggestions/index.test.ts` | 1 |
| R6. Zapisuje się wybór człowieka: POST z tekstem z R4 i bez `task_change` daje `task_change = 0`, `suggested_task_change = 1`, `suggestion_source = 'rules'` | `src/routes/notes.test.ts` | 2 |
| R7. Dostęp po zmianie oceniającego: test ustawia `cycles.appraiser_id` cyklu Piotra na Annę; Anna może zapisać notatkę o Piotrze, Marek dostaje 403; Marek dalej widzi swoje dawne notatki na `/notes`; Anna nie widzi ich ani na `/notes`, ani w slotach formularza oceny; Marek o Marii (bez cyklu, `supervisor_id`) może pisać, Anna o Marii dostaje 403 | `src/routes/notes.test.ts` | 2 |
| R8. Notatki widzi tylko autor: Piotr na `/notes` nie widzi tekstu notatki Marka; `GET /notes/:id/feedback` cudzej notatki → 404 | `src/routes/notes.test.ts` | 2 (feedback od fazy 3) |
| R9. Ostrzeżenie: jedna notatka 2026-11-12 przy dziś 2026-11-21 → `recent_only`; notatka 2026-10-21 (dokładnie miesiąc) → brak | `src/notes/warnings.test.ts` | 2 |
| R10. Format wstawki: `Rzetelność, 11.02.2025: <tekst>` bez oceny przełożonego | `src/notes/insert.test.ts` | 2 |
| R11. Wpięcie (dym): formularz oceny Piotra przy 2026-11-21 zawiera fragment notatki z 04.08.2025, znacznik `recent_only` przy `wykorzystywanie-wiedzy`, brak notatek przy „Myślenie analityczne”, odnośnik do karty; karta zawiera „§ 10” i trzy tematy; ekran `GET /cycles/:id/part1` ma odnośnik do karty dla Marka, a dla Piotra nie | `src/routes/assessment.test.ts` (dopisany do testu S-02) | 2 |
| R12. „Wstaw” na DOM: HTML formularza z `app.request()` ładowany do `happy-dom` (licencja MIT, zależność tylko do testów) z `public/insert-notes.js`; zaznaczone dwie z trzech notatek, klik „Wstaw do uzasadnienia” → pole `justification` zawiera dokładnie te dwa fragmenty, niezaznaczonego nie ma; potem wpisanie tekstu do pola działa; formularz nie dostał `submit`, nie było żądania na `POST /cycles/:id/assessment`, a w bazie nie przybyło `assessment_draft_saved` | `src/notes/insert-notes.dom.test.ts` | 2 |
| R13. Informacja zwrotna: Piotr na `/feedback` widzi poprawiony tekst z datą `today()`, a nie oryginał notatki; `lastFeedbackDate(Marek, Piotr)` zwraca tę datę; ekran wysyłki nie zawiera słowa „prywatna” | `src/routes/notes.test.ts` | 3 |
| R14. Ostrzeżenie skrajne: ocena 1 bez notatek → `extreme_without_facts`; ocena 1 z notatką → brak | `src/notes/warnings.test.ts` | 3 |
| R15. Gałąź modelu na atrapie: atrapa odpowiada `{ taskChange: true }` → `local-model`; odpowiada po czasie dłuższym niż `timeoutMs` → `rules`; odpowiada spoza listy → `rules`; bez podstawienia atrapa nie dostaje żadnego wywołania, a `suggestionMode()` to `'rules'` | `src/suggestions/local-model.test.ts` | 4 |

Skrypt `note-form.js` (podpowiedź w trakcie pisania) sprawdza przebieg ręczny z fazy 2. Słowa „podpis”, liczby przy nazwisku i zapis bez kliknięcia sprawdzają R6, R8, R12 i R13 na wynikowym HTML i w bazie.

### Manual Testing Steps:

1. `bun run seed -- --live-step-2`, konto Marek, data 2026-03-11, telefon 360 px: notatka o Piotrze z tekstem notatki z 11.03.2026 (pole zaznacza się samo), potem druga z neutralnym tekstem (pole puste).
2. Data 2026-11-21, konto Marek: ekran cyklu Piotra → karta rozmowy oceniającej → formularz oceny: notatka z 04.08.2025, puste „Myślenie analityczne”, ostrzeżenie przy „Wykorzystywanie wiedzy…”, „Wstaw do uzasadnienia” przy „Rzetelności”, poprawka wstawionego tekstu, brak zapisu przed „Zapisz”.
3. (Faza 3) „Moje notatki” → „Przekaż pracownikowi” → popraw tekst → wyślij; konto Piotr → „Informacja zwrotna”.

## Open questions

Każde ma przyjętą wartość domyślną; implementujący nie czeka na odpowiedź.

1. **Ocena „dobrze / do poprawy” obowiązkowa?** Domyślnie nie: pole bez wartości domyślnej, można zapisać notatkę bez oceny.
2. **„Ostatni miesiąc” liczony od `today()`**, nie od terminu oceny. Domyślnie od `today()`, bo przy ocenie data systemowa jest blisko terminu.
3. **Notatki Ewy a zmiana oceniającego.** Tabela w `demo.md` przypisuje Markowi notatkę o Ewie z 12.12.2024; Marek przejął wydział 5.12.2024 (`demo.md`, „Ustalenia do scenariusza”). Seed wpisuje autora zgodnie z tabelą. Czy Marek jest `cycles.appraiser_id` cyklu Ewy przed zbudowaniem S-03, zależy od `src/seed/base.ts`; gdy nie jest, Marek nie dopisze nowej notatki o Ewie i nie zobaczy jej notatek w formularzu oceny Ewy. Pokaz tego nie używa.

## References

- `context/changes/rules-engine-and-demo-data/plan.md` (rozdział „Kontrakt wspólny dla wszystkich plastrów”)
- `context/foundation/decisions.md` (decyzje 1, 3, 9, 10c, 10e, 10f, 10i, 10j, 10k, 10l, 11c)
- `context/foundation/prd.md` (FR-008, FR-009, FR-017, FR-020, FR-021; US-04; Access Control)
- `context/foundation/roadmap.md` (S-04)
- `context/foundation/demo.md` (kroki 2 i 4, „Ustalenia do scenariusza”, „Notatki do wgrania”)
- `context/changes/assessment-and-confirmation/plan.md` (S-02: `slots` i nazwy pól)
- `reguly/rozporzadzenie-2016-470.json:142–281` (kryteria), `:298–305` (tematy § 10)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Dane notatek i adapter podpowiedzi (wersja minimalna)

#### Automated

- [ ] 1.1 Testy odczytów, dostępu, adaptera i danych pokazowych przechodzą: `bun test src/notes src/suggestions src/seed`
- [ ] 1.2 Dane pokazowe wgrywają się bez błędu i dają 16 notatek, a z `--live-step-2` 15: `bun run seed` i `bun run seed -- --live-step-2`

#### Manual

- [ ] 1.3 Słowa w `taskChangeWords` łapią tekst notatki z 11.03.2026 i nie łapią drugiej notatki z kroku 2

### Phase 2: Formularz notatki, notatki przy kryteriach, „Wstaw do uzasadnienia” i karta (wersja minimalna)

#### Automated

- [ ] 2.1 Testy tras notatek, dostępu, ostrzeżenia, formatowania, slotów i karty przechodzą: `bun test src/routes/notes.test.ts src/notes`
- [ ] 2.2 Test DOM „Wstaw” przechodzi: `bun test src/notes/insert-notes.dom.test.ts`

#### Manual

- [ ] 2.3 Krok 2 (data 2026-03-11, dane z `--live-step-2`), telefon 360 px: pole „Zmiana zadań pracownika” zaznacza się w trakcie pisania notatki z 11.03.2026 z linią „listy słów”; po odznaczeniu nie wraca; druga notatka zapisuje się z pustym polem i bez linii podpowiedzi
- [ ] 2.4 Krok 4 (data 2026-11-21): formularz oceny Piotra pokazuje notatki przy kryteriach, notatkę z 04.08.2025 przy „Orientacja na klienta/interesanta”, puste „Myślenie analityczne” i jedno ostrzeżenie „z ostatniego miesiąca”
- [ ] 2.5 „Wstaw do uzasadnienia” dopisuje zaznaczone notatki z datami; pole da się dalej poprawić; nic nie zapisuje się bez przycisku S-02
- [ ] 2.6 Karta rozmowy oceniającej otwiera się z ekranu cyklu i z formularza oceny i pokazuje trzy tematy z § 10

### Phase 3: Informacja zwrotna, drugie „Wstaw”, data notatki i ostrzeżenie o ocenie skrajnej

#### Automated

- [ ] 3.1 Testy informacji zwrotnej, drugiego „Wstaw”, daty i ostrzeżenia skrajnego przechodzą: `bun test src/routes/notes.test.ts src/notes`

#### Manual

- [ ] 3.2 „Przekaż pracownikowi”: Piotr widzi poprawiony tekst w „Informacja zwrotna”, a nie widzi notatki

### Phase 4 (opcjonalna): Gałąź modelu uruchomionego w urzędzie

#### Automated

- [ ] 4.1 Test z podstawioną atrapą przechodzi: `bun test src/suggestions/local-model.test.ts`
