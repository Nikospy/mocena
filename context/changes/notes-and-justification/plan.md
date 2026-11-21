# Notatki o faktach i uzasadnienie z notatek — plan wdrożenia

## Overview

Plaster S-04, czyli teza produktu (decyzja 1): przełożony przez 24 miesiące zapisuje z telefonu krótkie notatki o faktach przy kryteriach, a przy ocenie ma je pod ręką. Plaster daje tabelę notatek z danymi pokazowymi, formularz notatki z polem „Zmiana zadań pracownika” wstępnie zaznaczanym przez adapter podpowiedzi, informację zwrotną dla pracownika, notatki i ostrzeżenia przy każdym kryterium w formularzu oceny, wstawianie zaznaczonych notatek do uzasadnienia i wniosków rozwojowych oraz kartę rozmowy oceniającej.

**Kolejność cięcia** (gdy brakuje czasu; kroki 2 i 4 pokazu działają do końca listy): 1) faza 4, czyli gałąź modelu (i tak opcjonalna); 2) ostrzeżenie „skrajna ocena bez faktu” (pokaz go nie wywołuje); 3) ekran pracownika „Informacja zwrotna” (zostaje wysyłka i data wysłania, której potrzebuje S-05); 4) pole daty w formularzu notatki (data = `today()` bez wyboru); 5) przycisk „Wstaw do wniosków rozwojowych” (zostaje „Wstaw do uzasadnienia”). Nie tniemy: tabeli i danych notatek, wstępnego zaznaczenia pola, notatek przy kryteriach, ostrzeżenia „fakty tylko z ostatniego miesiąca”, „Wstaw do uzasadnienia”, karty rozmowy oceniającej.

## Current State Analysis

- Kodu tego plastra nie ma. Repo ma starter Hono (`src/index.ts`) i silnik pod polskimi nazwami (`reguly/`, `src/silnik/`); F-01 przenosi go na nazwy angielskie (`rules/regulation-2016-470.json`, `src/engine/`).
- Plik reguł ma już identyfikatory kryteriów (`reguly/rozporzadzenie-2016-470.json:142–281`, np. `rzetelnosc`, `orientacja-na-klienta`, `wykorzystywanie-wiedzy`) i tematy rozmowy oceniającej z § 10 (`reguly/rozporzadzenie-2016-470.json:298–305`, klucz `rozmowaOceniajaca`; po F-01 zakładamy `assessmentConversation.topics`). Karta rozmowy bierze tematy stąd, nie z kopii.
- Plan F-01 (`context/changes/rules-engine-and-demo-data/plan.md`) każe seedowi wziąć „notatki” z `demo.md`, ale jego schemat nie ma tabeli notatek. Tabelę i wgranie notatek robi ten plaster (sekcja „Dane pokazowe” w fazie 1).
- `public/` jest pusty; htmx nie jest wgrany. Plaster nie zakłada htmx: dwa małe skrypty bez zależności (`public/note-form.js`, `public/insert-notes.js`).
- Tabela notatek do wgrania: `context/foundation/demo.md`, sekcja „Notatki do wgrania” (16 wierszy: Piotr 9, Ewa 4, Tomasz 3).

## Desired End State

Marek na telefonie (360 px) zapisuje notatkę o Piotrze; gdy w tekście jest słowo z listy, pole „Zmiana zadań pracownika” zaznacza się samo z dopiskiem, skąd ta podpowiedź, a Marek może je odznaczyć. Na liście „Moje notatki” przy notatce jest „Przekaż pracownikowi”; Piotr widzi wysłany (poprawiony) tekst, a samej notatki nie widzi na swoim koncie (decyzja 11c: w interfejsie nie ma słowa „prywatna”). W formularzu oceny Piotra (data systemowa 23.11.2026) przy każdym kryterium widać notatki Marka z okresu oceny z datą i polem „dobrze / do poprawy”; przy „Wykorzystywanie wiedzy i doskonalenie zawodowe” widać ostrzeżenie „fakty tylko z ostatniego miesiąca”; zaznaczone notatki przycisk „Wstaw” dopisuje z datą do pola uzasadnienia, nad którym stoi „Ten tekst przeczyta pracownik”. Karta rozmowy oceniającej pokazuje trzy tematy z § 10. `bun test` przechodzi.

### Key Discoveries:

- Kryteria w notatkach pokazowych mają nazwy urzędowe; seed rozwiązuje je na identyfikatory przez wyszukanie po nazwie w pliku reguł (`reguly/rozporzadzenie-2016-470.json:142–281`), a nie przez wpisane na sztywno id, bo F-01 może przetłumaczyć identyfikatory.
- Notatka 12.11.2026 (Piotr, „Wykorzystywanie wiedzy…”) jest jedyną przy tym kryterium (decyzja 10c, `demo.md` „Ustalenia do scenariusza”), a inne kryteria Piotra mają notatki starsze niż miesiąc: ostrzeżenie pojawi się dokładnie w jednym miejscu.
- „Orientacja na klienta/interesanta” nie jest kryterium obowiązkowym arkusza C (`reguly/…json:668–676`). Notatka Ewy z 12.12.2024 trafi pod swoje kryterium tylko, gdy F-01 wgra je Ewie jako dodatkowe; inaczej ląduje w bloku „Notatki przy innych kryteriach”.

## Założenia wobec wcześniejszych plastrów

Nazwy poniżej to założenia. Gdy zbudowany kod używa innych, implementujący bierze nazwy z kodu i nie zmienia zachowania.

- **F-01, tabele:** `people(id, name, …, supervisor_id)` — `supervisor_id` wskazuje bezpośredniego przełożonego (Marek dla Ewy, Piotra i Marii; Anna dla Tomasza); `cycles(id, person_id, assessor_id, period_start, due_date, …)` — `period_start` to początek 24-miesięcznego okresu (dla Piotra 2024-11-27); `cycle_criteria(cycle_id, criterion_id, …)`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings`.
- **F-01, funkcje i trasy:** `today(): string` (ISO `YYYY-MM-DD`); `db` z `src/db.ts` (schemat tworzony przy starcie); `currentAccount(c)` albo równoważny odczyt osoby z ciasteczka; układ `src/views/layout.tsx`; `GET /` z listą spraw zależną od roli; `POST /demo/date`; skrypt `src/seed.ts` (`bun run seed`); loader reguł w `src/engine/rules.ts` z listą kryteriów (`id`, `name`) i tematami `assessmentConversation.{basis, topics}`.
- **S-01:** `rules/office-settings.json` istnieje (tabela „rodzaj obowiązku → kryterium”) i ma loader `officeSettings()`; `content/cards.json` z kartą rozmowy rozpoczynającej i widok karty `src/views/card.tsx`. Gdy któregoś brak, ten plaster dodaje go w tym samym miejscu.
- **S-02:** formularz oceny `GET /cycles/:id/assessment` w `src/routes/assessment.tsx` z widokiem `src/views/assessment.tsx`, który renderuje blok na każde kryterium cyklu i zna zapisane oceny cząstkowe (`scores: Record<criterionId, 1|3|5|7|9>`); pola tekstowe `<textarea name="justification" id="justification">` i `<textarea name="development_conclusions" id="development-conclusions">`. Zapis formularza należy do S-02; ten plaster niczego w nim nie zapisuje.

## Co ten plaster udostępnia

Dla S-05 (HR partner), S-06 i S-03:

- **Tabela `notes`:** `id`, `author_id`, `subject_id`, `cycle_id` (może być null), `criterion_id`, `date` (ISO), `text`, `rating` (`good` | `needs_improvement` | null), `task_change` (0/1, wartość kliknięta przez człowieka), `suggested_task_change` (0/1/null, co podpowiedział adapter), `suggestion_source` (`rules` | `local-model` | `none`), `created_at`.
- **Tabela `feedback_messages`:** `id`, `note_id`, `author_id`, `recipient_id`, `sent_on` (ISO, = `today()` przy wysyłce), `text`.
- **Funkcje w `src/notes/repo.ts`:** `notesByAuthor(authorId)`, `notesAbout(subjectId, { authorId, from? })`, `notesForCycle(cycleId, authorId)`, `noteById(id)`, `lastNoteDate(authorId, subjectId)`, `lastFeedbackDate(authorId, recipientId)`, `feedbackFor(recipientId)`. Każda zwraca tylko wiersze z datą `<= today()` (decyzja 10i).
- **Adapter w `src/suggestions/index.ts`:** `suggestForNote(text): Promise<NoteSuggestion>` i `suggestionMode(): 'rules' | 'local-model' | 'off'` (dla ekranu „Skąd biorą się podpowiedzi”, FR-036).
- **Punkt zaczepienia po zapisie notatki:** `afterNoteSaved(note): string` w `src/routes/notes.tsx` zwraca adres przekierowania (dziś `/notes?saved=<id>`). S-05 podmienia go dla notatek z `task_change = 1`, żeby zadać pytanie „To stała zmiana zadań?”.
- **Trasa „Dopisz notatkę”:** `GET /people/:personId/notes/new` działa także dla osoby bez cyklu (Maria, decyzja 10k).
- **Komponenty:** `NoteItem` (notatka z datą, kryterium, oceną przełożonego, znacznikiem zmiany zadań) i `CriterionNotes` (notatki przy kryterium z ostrzeżeniami i „Wstaw”).
- **Ustawienia urzędu** w `rules/office-settings.json`: `taskChangeWords`, `recentFactsWindowMonths`, `suggestions.{mode, localModelUrl, timeoutMs}`.

## What We're NOT Doing

- Pytania HR partnera po notatce, ekranu „Przed rozmową”, przypomnienia o docenianiu, ekranu „Skąd biorą się podpowiedzi” (S-05).
- Edycji i usuwania notatek, wyszukiwania, filtrów, eksportu notatek dla kadr (PRD, Access Control) — poza prototypem.
- Żadnej podpowiedzi kryterium, ostrzeżenia o danych o zdrowiu ani „podobna notatka już jest” (decyzja 9, miejsca 2–4: tylko na ekranie S-05).
- Automatycznego wstawiania notatek do uzasadnienia i jakiegokolwiek zdania pisanego przez system o pracowniku (decyzja 10f).
- Liczb, podsumowań „dobrze / do poprawy” ani etykiet przy nazwisku pracownika na żadnej liście (zasada 7 w `AGENTS.md`).
- Modelu językowego. Faza 4 dodaje tylko gałąź, która woła lokalną usługę, i test na atrapie; domyślnie wyłączona.
- Stylów: wygląd pochodzi z design systemu autora (decyzja 10b).
- Wgranych informacji zwrotnych (notatka z 18.06.2026 sugeruje, że Marek jej nie przekazał; to zasila przypomnienie S-05).

## Implementation Approach

Notatki to osobna tabela, a nie wiersze `events`, bo mają własne pola i są odczytywane przy każdym kryterium; każdy odczyt filtruje `date <= today()`, tak jak `events`. Notatka należy do osoby (`subject_id`), a `cycle_id` jest dopisywany przy zapisie, gdy osoba ma otwarty cykl; dzięki temu „Dopisz notatkę” działa też dla Marii. Notatki widzi tylko autor.

Podpowiedzi przechodzą przez jedno miejsce, `src/suggestions/index.ts`: usuwa z tekstu imiona i nazwiska osób z tabeli `people`, wybiera implementację według `suggestions.mode` i zwraca źródło oraz podpowiedź pola. Formularz pyta o podpowiedź skryptem w trakcie pisania i zaznacza pole tylko, dopóki człowiek go nie dotknął. Serwer zapisuje dokładnie to, co człowiek wysłał w polu `task_change`, a obok, do wglądu, wynik adaptera policzony ponownie z tekstu.

„Wstaw” działa w przeglądarce: serwer renderuje przy każdej notatce gotowy fragment tekstu (`Kryterium, DD.MM.RRRR: treść`), a skrypt dopisuje zaznaczone fragmenty na końcu pola S-02. Nic nie zapisuje się samo; zapis robi przycisk S-02.

## Phase 1: Dane notatek i adapter podpowiedzi

### Overview

Tabela, dane pokazowe, odczyty z filtrem daty, ustawienia urzędu i adapter z regułami. Bez ekranów. Około 25 minut.

### Changes Required:

#### 1. Schemat

**File**: `src/db.ts`

**Intent**: Dopisać tabele `notes` i `feedback_messages` do schematu tworzonego przy starcie, z indeksem po `(subject_id, date)` i `(author_id, date)`.

**Contract**: Kolumny jak w „Co ten plaster udostępnia”. `rating` z CHECK na `good` / `needs_improvement` / NULL. `suggestion_source` NOT NULL, domyślnie `none`.

#### 2. Odczyty i zapisy notatek

**File**: `src/notes/repo.ts`

**Intent**: Jedno miejsce dostępu do notatek i informacji zwrotnych; każda funkcja odczytu dokleja warunek `date <= today()` (dla wiadomości `sent_on <= today()`).

**Contract**: Funkcje z sekcji „Co ten plaster udostępnia” oraz `addNote({ authorId, subjectId, criterionId, date, text, rating, taskChange, suggestion })` i `sendFeedback({ noteId, authorId, text })` (odbiorca = `subject_id` notatki, `sent_on = today()`). `notesForCycle` zwraca notatki autora o osobie z cyklu z datą od `cycles.period_start` do `today()`, posortowane rosnąco po dacie.

#### 3. Ustawienia urzędu

**File**: `rules/office-settings.json`

**Intent**: Dopisać listę słów wstępnie zaznaczających pole „Zmiana zadań pracownika”, próg „ostatni miesiąc” i tryb adaptera. Każdy nowy klucz ma opis z dopiskiem „ustawienie urzędu”, bo nie pochodzi z przepisów (decyzja 10e: treść piszemy przy budowie, autor jej osobno nie przegląda).

**Contract**: `taskChangeWords: string[]` — rdzenie porównywane jako podciąg tekstu po zamianie na małe litery, np. `przejął`, `przejęła`, `przejmuje`, `przejęcie`, `po odejściu`, `kolejkę`, `nowy zakres`, `nowe zadania`, `zakres obowiązków`, `zastępuje`, `zastępstw`; `recentFactsWindowMonths: 1`; `suggestions: { mode: "rules", localModelUrl: "http://127.0.0.1:8089/suggest", timeoutMs: 800 }`.

#### 4. Adapter podpowiedzi

**File**: `src/suggestions/types.ts`, `src/suggestions/redact.ts`, `src/suggestions/rules.ts`, `src/suggestions/index.ts`

**Intent**: Jedno wymienne miejsce na podpowiedzi (zasada 5 w `AGENTS.md`, decyzje 9 i 10l). `index.ts` usuwa nazwiska, wybiera implementację według trybu i nigdy nie rzuca wyjątku do trasy. Reguły szukają słów z listy i zwracają też znalezione słowa, żeby ekran mógł powiedzieć, skąd podpowiedź.

**Contract**:

```ts
export type SuggestionSource = 'rules' | 'local-model' | 'none';
export interface NoteSuggestion {
  source: SuggestionSource;
  taskChange: boolean | null; // null przy source 'none'
  matched: string[];          // słowa z listy; pusta przy local-model i none
}
export interface NoteSuggester { suggest(redactedText: string): Promise<NoteSuggestion> }
export function suggestForNote(text: string): Promise<NoteSuggestion>; // redakcja + wybór implementacji
export function suggestionMode(): 'rules' | 'local-model' | 'off';
```

Kształt wyniku nie ma pól na punkty, ocenę „dobrze / do poprawy”, kryterium ani tekst o pracowniku; to ograniczenie z decyzji 9 trzyma typ, nie dyscyplina. `redact(text, names)` zamienia imiona i nazwiska wszystkich osób z `people` (bez rozróżniania wielkości liter, także odmienione formy przez dopasowanie rdzenia imienia, np. `Piotr` łapie `Piotra`) na `[osoba]`. Tryb `off` albo pusty tekst daje `{ source: 'none', taskChange: null, matched: [] }`.

#### 5. Dane pokazowe

**File**: `src/notes/seed-notes.ts`, wywołanie z `src/seed.ts`

**Intent**: Wgrać 16 notatek z tabeli „Notatki do wgrania” w `context/foundation/demo.md`, dosłownie, z datami z przyszłości względem startowej daty systemowej 2024-12-09 (odsłania je przesuwanie daty, decyzja 10i). Bez informacji zwrotnych.

**Contract**: Na każdy wiersz jeden rekord `notes`: `author_id` = Marek Zieliński dla Ewy i Piotra, Anna Kwiatkowska dla Tomasza; `subject_id` po imieniu; `criterion_id` przez wyszukanie nazwy kryterium w pliku reguł (brak dopasowania = błąd seeda, nie cichy pominięty wiersz); `date` z kolumny „Data” w ISO; `rating`: „dobrze” → `good`, „do poprawy” → `needs_improvement`; `task_change = 1` tylko dla 11.03.2026 (Piotr, Współpraca), reszta 0; `suggested_task_change = NULL`, `suggestion_source = 'none'`; `cycle_id` = cykl osoby obejmujący datę notatki, gdy F-01 go wgrał, inaczej NULL. Teksty notatek są kopiowane bez zmian, bo z nich składa się uzasadnienie w kroku 4.

### Success Criteria:

#### Automated Verification:

- Testy odczytów, adaptera i danych pokazowych przechodzą: `bun test src/notes src/suggestions`
- Dane pokazowe wgrywają się bez błędu i dają 16 notatek: `bun run seed`

#### Manual Verification:

- Słowa w `taskChangeWords` łapią tekst z kroku 2 pokazu i nie łapią drugiej notatki z tego kroku

---

## Phase 2: Formularz notatki, moje notatki, informacja zwrotna

### Overview

Ekrany przełożonego i pracownika na wspólnym układzie. Formularz notatki działa na telefonie 360 px. Około 25 minut.

### Changes Required:

#### 1. Trasy notatek

**File**: `src/routes/notes.tsx` (podpięte w `src/index.tsx`)

**Intent**: Zapis notatki tylko przez bezpośredniego przełożonego osoby (`people.supervisor_id`); odczyt i wysyłka tylko przez autora. Zapis to jedyny moment, w którym coś trafia do bazy, i dzieje się po kliknięciu „Zapisz notatkę”.

**Contract**:
- `GET /people/:personId/notes/new` — formularz; 403, gdy konto nie jest przełożonym tej osoby.
- `POST /people/:personId/notes` — pola `criterion_id` (wymagane), `text` (wymagany, po przycięciu 1–2000 znaków), `date` (domyślnie `today()`, nie później niż `today()`), `rating` (`good` | `needs_improvement` | brak), `task_change` (checkbox). Serwer liczy `suggestForNote(text)` ponownie i zapisuje jego wynik w `suggested_task_change` i `suggestion_source`, a w `task_change` wyłącznie wartość z formularza. Błąd walidacji: formularz wraca z wpisanymi wartościami i komunikatem przy polu („Wpisz, co się wydarzyło.”, „Wybierz kryterium.”, „Data nie może być późniejsza niż dziś.”). Sukces: przekierowanie na `afterNoteSaved(note)`.
- `POST /suggestions/note` — przyjmuje `text`, zwraca JSON `NoteSuggestion`; nic nie zapisuje.
- `GET /notes` — „Moje notatki”: notatki zalogowanego autora pogrupowane po osobie, od najnowszej, przy każdej osobie przycisk „Dopisz notatkę”; przy każdej notatce „Przekaż pracownikowi”.
- `GET /notes/:id/feedback` — tekst notatki w polu do poprawy, nad polem „To zobaczy pracownik. Notatka zostaje tylko u Ciebie.”; 404 dla notatki innego autora.
- `POST /notes/:id/feedback` — zapis wiadomości z poprawionym tekstem (wymagany), przekierowanie na `/notes` z potwierdzeniem „Wysłano pracownikowi”.
- `GET /feedback` — „Informacja zwrotna”: wiadomości do zalogowanej osoby, od najnowszej, z nadawcą i datą.

Lista kryteriów w formularzu: kryteria otwartego cyklu osoby (z `cycle_criteria`), a pod nimi pozostałe kryteria z pliku reguł w grupie „Inne kryteria”; osoba bez cyklu dostaje pełną listę.

#### 2. Widoki i komponenty

**File**: `src/views/note-form.tsx`, `src/views/notes-list.tsx`, `src/views/feedback.tsx`, `src/views/components/note-item.tsx`

**Intent**: Nowe komponenty na wspólnym układzie `src/views/layout.tsx`, z tokenami i komponentami z design systemu autora (decyzja 10b; bez własnych stylów). Formularz notatki to jedna kolumna mieszcząca się na 360 px, bez przewijania w poziomie.

**Contract**:
- `NoteForm`: wybór kryterium, data, pole tekstu, wybór „dobrze” / „do poprawy” bez wartości domyślnej (wypełnia wyłącznie przełożony, decyzja 3 pkt 3), checkbox „Zmiana zadań pracownika” z linią podpowiedzi, przycisk „Zapisz notatkę”.
- `SuggestionHint` (linia pod checkboxem): przy `rules` — „Zaznaczone na podstawie listy słów (ustawienie urzędu): „przejął”. Możesz odznaczyć.”; przy `local-model` — „Zaznaczone przez model uruchomiony w urzędzie. Możesz odznaczyć.”; przy braku podpowiedzi linii nie ma.
- `NoteItem`: data, nazwa kryterium, ocena przełożonego, znacznik „zmiana zadań”, tekst, akcje przekazane przez rodzica.
- Lista „Moje notatki” i ekran „Informacja zwrotna”: nagłówek osoby to samo imię i nazwisko, bez liczby notatek i bez podsumowań.
- Nawigacja układu: „Notatki” dla osób, które mają podwładnych; „Informacja zwrotna” dla każdego konta.

#### 3. Podpowiedź w trakcie pisania

**File**: `public/note-form.js`

**Intent**: Kilkanaście linii bez zależności: po przerwie w pisaniu (ok. 600 ms) wysyła tekst do `POST /suggestions/note` i zaznacza albo odznacza checkbox oraz pokazuje `SuggestionHint`, ale tylko dopóki człowiek nie kliknął checkboxa. Po pierwszym kliknięciu skrypt przestaje zmieniać pole. Bez JavaScriptu checkbox działa ręcznie.

**Contract**: Skrypt nie wysyła formularza i nie zapisuje niczego. Serwowany z `public/` bez CDN (pokaz działa bez sieci).

### Success Criteria:

#### Automated Verification:

- Testy tras notatek i informacji zwrotnej przechodzą: `bun test src/routes/notes.test.ts`

#### Manual Verification:

- Na telefonie 360 px pole „Zmiana zadań pracownika” zaznacza się w trakcie pisania z linią „listy słów”; po odznaczeniu nie wraca
- Druga notatka z kroku 2 zapisuje się z pustym polem i bez linii podpowiedzi
- „Przekaż pracownikowi”: Piotr widzi poprawiony tekst w „Informacja zwrotna”, a nie widzi notatki

---

## Phase 3: Notatki przy kryteriach, ostrzeżenia, „Wstaw” i karta rozmowy oceniającej

### Overview

Wpięcie w formularz oceny S-02 i karta z FR-017. Około 25 minut.

### Changes Required:

#### 1. Ostrzeżenia FR-020

**File**: `src/notes/warnings.ts`

**Intent**: Czysta funkcja bez bazy. Ostrzeżenie „fakty tylko z ostatniego miesiąca”: przy kryterium jest co najmniej jedna notatka i wszystkie mają datę późniejszą niż `today()` minus `recentFactsWindowMonths` miesięcy kalendarzowych (notatka dokładnie sprzed miesiąca jest już „starsza”). Ostrzeżenie „skrajna ocena bez faktu”: ocena cząstkowa 1 albo 9 przy kryterium bez żadnej notatki. Ostrzeżenia nie blokują zatwierdzenia (blokady należą do S-02, FR-022).

**Contract**: `criterionWarnings({ notes, score, today, windowMonths }): Array<'recent_only' | 'extreme_without_facts'>`. Teksty: „Wszystkie notatki przy tym kryterium są z ostatniego miesiąca. Co działo się wcześniej w okresie oceny?” oraz „Ocena skrajna, a przy tym kryterium nie masz żadnej notatki.”

#### 2. Formatowanie do wstawienia

**File**: `src/notes/insert.ts`

**Intent**: Zamienia notatkę na jedną linię tekstu z nazwą kryterium i datą, bez żadnego dodanego słowa o pracowniku (decyzja 10f).

**Contract**: `formatNoteForInsert(note, criterionName): string` → `Rzetelność, 11.02.2025: Pismo do gminy poszło 11 lutego, …`. Pole `rating` nie trafia do tekstu.

#### 3. Notatki przy kryterium w formularzu oceny

**File**: `src/views/components/criterion-notes.tsx`, wpięcie w `src/views/assessment.tsx` i `src/routes/assessment.tsx` (S-02), `public/insert-notes.js`

**Intent**: W bloku każdego kryterium formularza S-02: notatki autora z okresu oceny (`notesForCycle`) jako `NoteItem` z checkboxem, ostrzeżenia z `criterionWarnings`, stan pusty „Brak notatek przy tym kryterium” i dwa przyciski „Wstaw do uzasadnienia” i „Wstaw do wniosków rozwojowych”. Notatki o kryteriach spoza cyklu w osobnym bloku „Notatki przy innych kryteriach” pod listą kryteriów. Nad polami `justification` i `development_conclusions` zdanie „Ten tekst przeczyta pracownik” (jeśli S-02 go nie dodał). Skrypt dopisuje na końcu wskazanego pola fragmenty zaznaczonych notatek, każdy w nowej linii, i odznacza je; nie zapisuje formularza.

**Contract**: Każdy checkbox notatki niesie `data-insert="<formatNoteForInsert>"`; przyciski mają `type="button"` i `data-target="justification"` albo `data-target="development-conclusions"`. Kontroler S-02 przekazuje do widoku `notesByCriterion` i `warningsByCriterion`. Widzi to tylko oceniający cyklu (`cycles.assessor_id`), a notatki pochodzą wyłącznie od niego.

#### 4. Karta rozmowy oceniającej (FR-017)

**File**: `content/cards.json`, trasa w `src/routes/notes.tsx` albo w module kart S-01, widok `src/views/card.tsx` (S-01, użyty ponownie)

**Intent**: Karta przygotowania do rozmowy oceniającej: cel, trzy tematy z § 10 wzięte z pliku reguł z podstawą prawną, pytania pomocnicze i trudne sytuacje (treść pisana przy budowie, decyzja 10e), na dole link „Notatki przy kryteriach” do formularza oceny. Wejście z formularza oceny i z ekranu cyklu.

**Contract**: `GET /cycles/:id/cards/assessment-conversation`; klucz `assessmentConversation: { goal, questions[], difficultSituations[] }` w `content/cards.json`; tematy i `basis` (`§ 10`) z `assessmentConversation` w pliku reguł, nie z kopii w `cards.json`.

### Success Criteria:

#### Automated Verification:

- Testy ostrzeżeń, formatowania i wpięcia w formularz przechodzą: `bun test`

#### Manual Verification:

- Przy dacie 23.11.2026 formularz oceny Piotra pokazuje notatki przy kryteriach i jedno ostrzeżenie „z ostatniego miesiąca”
- „Wstaw do uzasadnienia” dopisuje zaznaczone notatki z datami; nic nie zapisuje się bez przycisku S-02
- Karta rozmowy oceniającej pokazuje trzy tematy z § 10

---

## Phase 4 (opcjonalna): Gałąź modelu uruchomionego w urzędzie

### Overview

Pierwsza rzecz do zrobienia, jeśli zostanie czas przed 07:00 (decyzja 10l). Domyślnie wyłączona. Około 10–15 minut.

### Changes Required:

#### 1. Implementacja `local-model`

**File**: `src/suggestions/local-model.ts`, wybór w `src/suggestions/index.ts`

**Intent**: Gdy `suggestions.mode = "local-model"`, adapter wysyła zredagowany tekst do lokalnej usługi i przyjmuje tylko wartość z zamkniętej listy. Gdy usługa nie odpowie w `timeoutMs`, odpowie błędem albo czymś spoza listy, wynik dają reguły (`source: 'rules'`).

**Contract**: `POST <localModelUrl>` z JSON `{ "text": "<zredagowany tekst>" }`; oczekiwana odpowiedź `{ "taskChange": true | false }`; przerwanie przez `AbortSignal.timeout(timeoutMs)`. Adres musi być lokalny (`127.0.0.1` albo `localhost`); inny adres = tryb reguł (dane nie wychodzą poza komputer, zasada 8).

### Success Criteria:

#### Automated Verification:

- Test na atrapie lokalnej usługi przechodzi: `bun test src/suggestions/local-model.test.ts`

## Testing Strategy

Jedna reguła, jeden test, na najtańszej warstwie, która ją naprawdę wykonuje. Trasy przez `app.request()` na bazie wgranej seedem w pamięci albo w pliku tymczasowym, z datą ustawioną przez `POST /demo/date`.

| Reguła | Test |
|---|---|
| R1. Odczyt notatek i wiadomości pokazuje tylko daty `<= today()`: przy 2024-12-09 notatek Piotra nie ma, przy 2026-11-23 jest ich 9 | `src/notes/repo.test.ts` |
| R2. Seed: 16 notatek, `task_change = 1` tylko 11.03.2026, każda nazwa kryterium rozwiązana na id | `src/notes/repo.test.ts` |
| R3. Reguły: „Od dziś przejął kolejkę wniosków po koleżance, która odeszła 9 marca.” → `rules`, `true`, `matched` niepuste; „Na odprawie sam zgłosił, że pismo do gminy wyjdzie w piątek, i wyszło w piątek.” → `rules`, `false`; pusty tekst → `none` | `src/suggestions/rules.test.ts` |
| R4. Do implementacji nie trafia imię ani nazwisko (podstawiona implementacja zapisuje, co dostała; tekst „Piotra Wójcika” dochodzi jako `[osoba]`) | `src/suggestions/index.test.ts` |
| R5. Zapisuje się wybór człowieka: POST z tekstem z R3 i bez `task_change` daje `task_change = 0`, `suggested_task_change = 1`, `suggestion_source = 'rules'` | `src/routes/notes.test.ts` |
| R6. Notatki widzi tylko autor: Piotr na `/notes` nie widzi tekstu notatki Marka; `GET /notes/:id/feedback` cudzej notatki → 404; POST notatki o osobie, której konto nie jest przełożonym → 403 | `src/routes/notes.test.ts` |
| R7. Informacja zwrotna: Piotr na `/feedback` widzi poprawiony tekst z datą `today()`, a nie oryginał notatki | `src/routes/notes.test.ts` |
| R8. Ostrzeżenia: jedna notatka 2026-11-12 przy dziś 2026-11-23 → `recent_only`; notatka 2026-10-23 (dokładnie miesiąc) → brak; ocena 1 bez notatek → `extreme_without_facts`; ocena 1 z notatką → brak | `src/notes/warnings.test.ts` |
| R9. Format wstawki: `Rzetelność, 11.02.2025: <tekst>` bez oceny przełożonego | `src/notes/insert.test.ts` |
| R10. Wpięcie (dym): formularz oceny Piotra przy 2026-11-23 zawiera fragment notatki z 04.08.2025, znacznik ostrzeżenia `recent_only` przy `wykorzystywanie-wiedzy`, zdanie „Ten tekst przeczyta pracownik”; karta zawiera „§ 10” | `src/routes/assessment.test.ts` (dopisany do testu S-02) |
| R11 (faza 4). Atrapa `Bun.serve` na losowym porcie: odpowiada → `local-model`; odpowiada po czasie dłuższym niż `timeoutMs` → `rules`; tryb `rules` → atrapa nie dostaje żadnego żądania | `src/suggestions/local-model.test.ts` |

Skryptów przeglądarki (`note-form.js`, `insert-notes.js`) nie testujemy automatycznie; sprawdza je przebieg ręczny z faz 2 i 3.

### Manual Testing Steps:

1. `bun run seed`, konto Marek, data 10.03.2026, telefon 360 px: notatka o Piotrze z tekstem z R3 (pole zaznacza się samo), potem druga z neutralnym tekstem (pole puste).
2. „Moje notatki” → „Przekaż pracownikowi” → popraw tekst → wyślij; konto Piotr → „Informacja zwrotna”.
3. Data 23.11.2026, konto Marek, formularz oceny Piotra: ostrzeżenie przy „Wykorzystywanie wiedzy…”, „Wstaw do uzasadnienia” przy „Rzetelności”, karta rozmowy oceniającej.

## Open questions

Każde ma przyjętą wartość domyślną; implementujący nie czeka na odpowiedź.

1. **Krok 2 pokazu a wgrana notatka z 11.03.2026.** Krok 2 każe pisać notatkę o przejęciu kolejki na żywo, a ta sama treść jest wgrana z datą 11.03.2026 (potrzebna wersji 90-sekundowej, która pomija krok 2). Domyślnie: wgrana notatka zostaje; prowadzący w kroku 2 ustawia datę 10.03.2026 i pisze krótszą notatkę z R3. Wtedy przy Piotrze są dwie notatki ze zmianą zadań, obie po 9.03.2026.
2. **Ocena „dobrze / do poprawy” obowiązkowa?** Domyślnie nie: pole bez wartości domyślnej, można zapisać notatkę bez oceny.
3. **Data notatki.** Domyślnie edytowalna, nie późniejsza niż `today()`; bez dolnej granicy.
4. **„Ostatni miesiąc” liczony od `today()`**, nie od terminu oceny. Domyślnie od `today()`, bo przy ocenie data systemowa jest blisko terminu.
5. **Ostrzeżenie „skrajna ocena bez faktu”** pojawia się po zapisaniu ocen cząstkowych przez S-02 (przy renderze), nie w trakcie wybierania. Domyślnie tak, bez dodatkowego skryptu.
6. **Notatki Ewy a zmiana oceniającego.** Tabela w `demo.md` przypisuje Markowi notatkę o Ewie z 12.12.2024, a jej cykl zaczął poprzedni naczelnik. Domyślnie seed wpisuje autora zgodnie z tabelą (Marek); data przejęcia wydziału przez Marka w danych F-01/S-03 powinna być wcześniejsza niż 12.12.2024.

## References

- `context/foundation/decisions.md` (decyzje 1, 3, 9, 10c, 10e, 10f, 10i, 10j, 10l)
- `context/foundation/prd.md` (FR-008, FR-009, FR-017, FR-020, FR-021; US-04; Access Control)
- `context/foundation/roadmap.md` (S-04)
- `context/foundation/demo.md` (kroki 2 i 4, „Ustalenia do scenariusza”, „Notatki do wgrania”)
- `context/changes/rules-engine-and-demo-data/plan.md` (F-01: schemat, `today()`, seed, układ)
- `reguly/rozporzadzenie-2016-470.json:142–281` (kryteria), `:298–305` (tematy § 10)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Dane notatek i adapter podpowiedzi

#### Automated

- [ ] 1.1 Testy odczytów, adaptera i danych pokazowych przechodzą: `bun test src/notes src/suggestions`
- [ ] 1.2 Dane pokazowe wgrywają się bez błędu i dają 16 notatek: `bun run seed`

#### Manual

- [ ] 1.3 Słowa w `taskChangeWords` łapią tekst z kroku 2 pokazu i nie łapią drugiej notatki z tego kroku

### Phase 2: Formularz notatki, moje notatki, informacja zwrotna

#### Automated

- [ ] 2.1 Testy tras notatek i informacji zwrotnej przechodzą: `bun test src/routes/notes.test.ts`

#### Manual

- [ ] 2.2 Na telefonie 360 px pole „Zmiana zadań pracownika” zaznacza się w trakcie pisania z linią „listy słów”; po odznaczeniu nie wraca
- [ ] 2.3 Druga notatka z kroku 2 zapisuje się z pustym polem i bez linii podpowiedzi
- [ ] 2.4 „Przekaż pracownikowi”: Piotr widzi poprawiony tekst w „Informacja zwrotna”, a nie widzi notatki

### Phase 3: Notatki przy kryteriach, ostrzeżenia, „Wstaw” i karta rozmowy oceniającej

#### Automated

- [ ] 3.1 Testy ostrzeżeń, formatowania i wpięcia w formularz przechodzą: `bun test`

#### Manual

- [ ] 3.2 Przy dacie 23.11.2026 formularz oceny Piotra pokazuje notatki przy kryteriach i jedno ostrzeżenie „z ostatniego miesiąca”
- [ ] 3.3 „Wstaw do uzasadnienia” dopisuje zaznaczone notatki z datami; nic nie zapisuje się bez przycisku S-02
- [ ] 3.4 Karta rozmowy oceniającej pokazuje trzy tematy z § 10

### Phase 4 (opcjonalna): Gałąź modelu uruchomionego w urzędzie

#### Automated

- [ ] 4.1 Test na atrapie lokalnej usługi przechodzi: `bun test src/suggestions/local-model.test.ts`
