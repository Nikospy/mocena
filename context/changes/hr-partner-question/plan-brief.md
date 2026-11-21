# Pytanie HR partnera i przypomnienie o docenianiu — Plan Brief

> Full plan: `context/changes/hr-partner-question/plan.md`

## What & Why

Moduł wirtualnego HR partnera, który organizator ocenia osobno. Bez modelu: partner reaguje tylko na wpisy przełożonego (pole „Zmiana zadań pracownika”, daty notatek, pole „dobrze / do poprawy”, datę informacji zwrotnej) i odpowiada zdaniami z szablonów, pytaniem albo propozycją działania (decyzje 2, 3, 9).

## Starting Point

Po F-01, S-01, S-02 i S-04 są notatki z polem zmiany zadań (`notes.task_change`), adapter podpowiedzi (`suggestionMode()`) i informacja zwrotna z datą (`feedback_messages`, odczyt przez `lastFeedbackDate`). Nic na nie nie reaguje; brak katalogu form rozwoju i kart. Nazwy pochodzą z kontraktu wspólnego w planie F-01.

## Desired End State

Po notatce ze zmianą zadań Marek odpowiada na „To stała zmiana zadań?” i po „Tak” dostaje kartę rozmowy i jedną formę rozwoju. Przed rozmową widzi swoje notatki sprzed zmiany i po niej, kryteria bez notatek, kiedy ostatnio docenił Piotra i zdanie o podwładnych bez notatek. Administrator widzi, skąd biorą się podpowiedzi.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Granica „przed / po” | data najwcześniejszej notatki z polem zmiany zadań, bez odpowiedzi „Nie”; „Tak” nie jest warunkiem | Wersja 90 sekund pomija krok 2, a krok 4 musi mieć podział. |
| Duplikat notatki z 11.03.2026 | opcja seeda `--live-step-2` w pełnym pokazie; w wersji 90 s granicę daje wgrana notatka | Ustalenie kontraktu i `demo.md`; obie drogi dają granicę 11.03.2026. |
| Odpowiedź przy notatce bez cyklu | `task_change_answered` z pustym `cycle_id`, odczyt przez `visibleEvents(null)` po `payload.noteId` | Maria nie ma cyklu (`openCycle` zwraca `null`); kontrakt tak to definiuje. |
| Część I Piotra w testach i próbach | `createTestApp({ today, seedOptions: { afterStep1: true } })`, w pełnym pokazie z `liveStep2: true`; ręcznie `bun run seed -- --after-step-1 --live-step-2` | Domyślne dane zostawiają Piotra bez części I; żaden test nie przepisuje wgranych danych. |
| Data zmiany | data notatki (11.03.2026), nie 9.03 z tekstu | System nie czyta treści notatek. |
| Forma rozwoju | `suggestDevelopmentForm(note)` w `src/suggestions/index.ts`: pierwsza z katalogu pasująca do kryterium notatki, inaczej jedyna forma z `default: true` | Miejsce 5 z decyzji 9 w jednym wymiennym miejscu podpowiedzi (zasada 5). |
| „Przekaż pracownikowi” w karcie docenienia | tylko gdy istnieją wszystkie trzy trasy informacji zwrotnej S-04 (faza 3): `GET /notes/:id/feedback`, `POST /notes/:id/feedback`, `GET /feedback` | Bez nich karta nie ma tego działania. |
| Zapis | tylko zdarzenie `task_change_answered` przez `recordEvent` po kliknięciu | „Nic nie zapisuje się bez kliknięcia”. |
| Odnośniki | `registerCycleLinks` na `GET /cycles/:id/part1`, `registerHomeTasks` na `GET /` | Wspólne miejsca z kontraktu, bez ręcznego wpisywania adresów. |
| Odmiana imion | `content/name-forms.json` z zdaniem zastępczym | Zdania z decyzji 10k wymagają przypadków. |
| Odczyty cudzych danych | jeden plik `src/hr-partner/data.ts`, tylko przez `notesAbout`, `noteById`, `lastFeedbackDate`, `cycleCriteria`, `visibleEvents` | Rozbieżność z kodem poprawia się w jednym miejscu. |
| Progi | 90 dni docenianie, 6 miesięcy bez notatek, „ustawienie urzędu” | Brak progów w przepisach; 6 miesięcy z przykładu 10k. |

## Scope

**In scope:** wersja minimalna: pytanie po notatce, karta (ze zdaniem o podstawie prawnej, decyzja 11e) i forma rozwoju po „Tak”, ekran „Przed rozmową z pracownikiem”. Po niej, do cięcia: przypomnienie i karta docenienia, ekran „Skąd biorą się podpowiedzi” (może być statyczny). Treści: katalog, karty, pytania.

**Out of scope:** formularz notatki, lista słów, adapter i informacja zwrotna (S-04); karty rozmowy rozpoczynającej i oceniającej; etykiety, wskaźniki, analiza nieobecności; style.

## Architecture / Approach

Czysta logika w `src/hr-partner/partner.ts` na danych z `data.ts`, każda funkcja z `today` i filtrem dat (decyzja 10i). Trasy w `src/routes/hr-partner.tsx` i `src/routes/admin.tsx`, widoki we wspólnym układzie. Po zapisie notatki S-04 woła `afterNoteSaved(note)`, które dla `task_change = 1` prowadzi na pytanie. „Dopisz notatkę” prowadzi do `/people/:personId/notes/new`, także dla Marii. Treści w `rules/office-settings.json` i `content/*.json`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Pytanie po notatce (minimalna) | krok 2 pokazu na telefonie, katalog i karta | `afterNoteSaved` w trasie S-04 |
| 2. Przed rozmową (minimalna) | krok 4 pokazu w obu wariantach danych | słowo albo liczba przy nazwisku |
| 3. Docenianie | FR-016, przypomnienie na ekranie startowym | brak; pierwsze do cięcia po fazie 4 |
| 4. Skąd biorą się podpowiedzi | FR-036, strona może być statyczna | brak; pierwsze do cięcia |

**Prerequisites:** F-01, S-01, S-02, S-04 wdrożone.
**Estimated effort:** wersja minimalna ok. 50 minut (25 / 25), całość ok. 75 minut (+15 / +10), jeden agent.

## Open Risks & Assumptions

- Plaster dopisuje trasy w `src/index.tsx`, klucze w `content/cards.json` i `rules/office-settings.json` oraz wejście w `src/suggestions/index.ts`, bez zmiany cudzych kluczy.
- Nazwy z kontraktu i z planów S-01 i S-04 są w planie w sekcji „Założenia wobec wcześniejszych plastrów”.

## Success Criteria (Summary)

- Krok 2 (2026-03-11) i krok 4 (2026-11-21) pokazu działają, krok 4 w obu wariantach danych; notatka bez pola nie wywołuje pytania.
- Ekran „Przed rozmową” nie ma przy nazwisku etykiety, liczby ani wskaźnika; każda pozycja ma pytanie albo działanie.
- `bun test` przechodzi.
