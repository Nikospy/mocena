# Pytanie HR partnera i przypomnienie o docenianiu — Plan Brief

> Full plan: `context/changes/hr-partner-question/plan.md`

## What & Why

Moduł wirtualnego HR partnera, który organizator ocenia osobno. Bez modelu: partner reaguje tylko na wpisy przełożonego (pole „Zmiana zadań pracownika”, daty notatek, pole „dobrze / do poprawy”, datę informacji zwrotnej) i odpowiada zdaniami z szablonów, pytaniem albo propozycją działania (decyzje 2, 3, 9).

## Starting Point

Po F-01, S-01, S-02 i S-04 są notatki z polem zmiany zadań, adapter podpowiedzi i informacja zwrotna z datą. Nic na nie nie reaguje; brak katalogu form rozwoju i kart.

## Desired End State

Po notatce ze zmianą zadań Marek odpowiada na „To stała zmiana zadań?” i po „Tak” dostaje kartę rozmowy i jedną formę rozwoju. Przed rozmową widzi swoje notatki sprzed zmiany i po niej, kryteria bez notatek, kiedy ostatnio docenił Piotra i zdanie o podwładnych bez notatek. Administrator widzi, skąd biorą się podpowiedzi.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Granica „przed / po” | data najwcześniejszej notatki z polem zmiany zadań, bez odpowiedzi „Nie” | Wersja 90 sekund pomija krok 2, a krok 4 musi mieć podział. |
| Data zmiany | data notatki (11.03.2026), nie 9.03 z tekstu | System nie czyta treści notatek. |
| Forma rozwoju | pierwsza z katalogu pasująca do kryterium notatki, inaczej domyślna | Reguła w miejscu 5 z decyzji 9. |
| Zapis | tylko zdarzenie `task_change_answered` po kliknięciu | „Nic nie zapisuje się bez kliknięcia”. |
| Odmiana imion | `content/name-forms.json` z zdaniem zastępczym | Zdania z decyzji 10k wymagają przypadków. |
| Odczyty cudzych tabel | jeden plik `src/hr-partner/data.ts` | Plany plastrów powstają równolegle; rozbieżność nazw poprawia się w jednym miejscu. |
| Progi | 90 dni docenianie, 6 miesięcy bez notatek, „ustawienie urzędu” | Brak progów w przepisach; 6 miesięcy z przykładu 10k. |

## Scope

**In scope:** pytanie po notatce, karta i forma rozwoju po „Tak”, ekran „Przed rozmową z pracownikiem”, przypomnienie i karta docenienia, ekran „Skąd biorą się podpowiedzi”, treści (katalog, karty, pytania).

**Out of scope:** formularz notatki, lista słów, adapter i informacja zwrotna (S-04); karty rozmowy rozpoczynającej i oceniającej; etykiety, wskaźniki, analiza nieobecności; style.

## Architecture / Approach

Czysta logika w `src/hr-partner/partner.ts` na danych z `data.ts`, każda funkcja z `today` i filtrem dat (decyzja 10i). Trasy w `src/routes/hr-partner.tsx` i `src/routes/admin.tsx`, widoki we wspólnym układzie. Treści w `rules/office-settings.json` i `content/*.json`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Treści i logika | katalog, karty, funkcje z testami | nazwy z wcześniejszych plastrów inne niż zakładane |
| 2. Pytanie po notatce | krok 2 pokazu na telefonie | przekierowanie w trasie S-04 |
| 3. Przed rozmową i docenianie | krok 4 pokazu, FR-016 | słowo albo liczba przy nazwisku |
| 4. Skąd biorą się podpowiedzi | FR-036 | brak — ekran statyczny z jedną wartością z adaptera |

**Prerequisites:** F-01, S-01, S-02, S-04 wdrożone.
**Estimated effort:** ok. 80 minut, jeden agent (25 / 15 / 30 / 10).

## Open Risks & Assumptions

- Notatka z 11.03.2026 jest w danych, a krok 2 pisze ją na żywo: możliwy duplikat (pytanie otwarte 1 w planie).
- Zakładane nazwy tabel i tras S-01 i S-04 są w planie w sekcji „Założenia wobec wcześniejszych plastrów”.

## Success Criteria (Summary)

- Krok 2 i krok 4 pokazu działają; notatka bez pola nie wywołuje pytania.
- Ekran „Przed rozmową” nie ma przy nazwisku etykiety, liczby ani wskaźnika; każda pozycja ma pytanie albo działanie.
- `bun test` przechodzi.
