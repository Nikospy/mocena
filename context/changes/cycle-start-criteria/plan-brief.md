# Początek cyklu: arkusz, kryteria, oczekiwania, potwierdzenie części I — Plan Brief

> Full plan: `context/changes/cycle-start-criteria/plan.md`

## What & Why

Krok 1 pokazu: Marek zaczyna cykl Piotra (arkusz C, 2 kryteria dodatkowe z podpowiedzią „dlaczego”, oczekiwanie, karta rozmowy, przekazanie), a Piotr potwierdza część I na telefonie. Pokazuje dwie pierwsze trudności organizatora: wybór kryteriów i przygotowanie rozmowy.

## Starting Point

F-01 daje silnik (walidacja kryteriów dodatkowych, terminy 30 dni i 24 miesiące), tabele `people`, `cycles`, `cycle_criteria`, `events`, `settings`, `today()`, konta i układ. Brakuje tabeli obowiązków, karty rozmowy, ekranu części I i potwierdzeń.

## Desired End State

Przy 9.12.2024 Marek ma sprawę z terminem 27.12.2024 (§ 7 pkt 1), wypełnia i przekazuje część I z terminem oceny 27.11.2026; Piotr potwierdza, system wpisuje miejscowość, datę i nazwisko, część I się blokuje. Do potwierdzenia Marek widzi „czeka na potwierdzenie od X dni”.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Źródło podpowiedzi | tabela „rodzaj obowiązku → kryterium” w `rules/office-settings.json`, „ustawienie urzędu” | decyzja autora, bez rozumienia tekstu | decisions 6b |
| Podpowiedzi zaznaczone z góry | nie, tylko na górze listy ze zdaniem „dlaczego” | nic nie zapisuje się bez kliknięcia | Plan |
| Stan części I | tylko ze zdarzeń widocznych przy `today()` | dane odsłaniane datą | decisions 10i |
| Potwierdzenie | kliknięcie na własnym koncie, auto-wpis, słowo „potwierdzenie” | bez podpisu elektronicznego | decisions 5a |
| Brak potwierdzenia | „czeka na potwierdzenie od X dni”, bez wpisu za pracownika | brak podstawy prawnej | decisions 10d |
| Cofnięcie przekazania | brak | prostsze, spójne z blokadą | Plan (pytanie otwarte) |
| Cztery tematy karty | z pliku reguł, nie z `content/cards.json` | to przepis (§ 5 ust. 1) | Plan |

## Scope

**In scope:** dobór arkusza, kryteria obowiązkowe, wybór do 3 dodatkowych z podpowiedzią, oczekiwania, karta rozmowy rozpoczynającej, przekazanie, potwierdzenie, blokada, stan oczekiwania, sprawy na ekranie startowym, dane pokazowe (obowiązki, część I Ewy i Tomasza).

**Out of scope:** ocena (S-02), notatki i adapter (S-04), ekran kadr i wydruk (S-06), nieobecności i oś czasu (S-03), cofnięcie przekazania, pole „cele”, style.

## Architecture / Approach

Czyste funkcje w `src/engine/criteria.ts` (arkusz, podpowiedzi), logika w `src/cycles/part1.ts` (zapis do `cycle_criteria`, zdarzenia `part1_submitted` i `part1_confirmed`, `part1Status`), trasy w `src/routes/cycle-start.tsx` pod `/cycles/:id/part1`, widoki w `src/views/part1.tsx` i `src/views/opening-card.tsx` na wspólnym układzie.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Dane, reguły i podpowiedź | ustawienia urzędu, karta, `sheetForPosition`, `suggestAdditionalCriteria`, seed | nazwy kolumn i identyfikatorów kryteriów po F-01 |
| 2. Część I u oceniającego | ekran, zapis, karta, przekazanie, sprawa na starcie | miejsce na sprawy w ekranie startowym F-01 |
| 3. Potwierdzenie i blokada | potwierdzenie Piotra, blokada, „od X dni” | — |

**Prerequisites:** F-01 skończone (`bun test` i `bun run seed` zielone).
**Estimated effort:** ok. 80 minut jednego agenta (25 + 30 + 20 + 5 na zrzuty).

## Open Risks & Assumptions

- F-01 może nazwać kolumny i funkcje inaczej; plan każe brać nazwy z kodu i dokładać tylko brakujące kolumny.
- Liczba dni oczekiwania stoi w zdaniu o stanie części I, nie przy nazwisku (zasada 7 w `AGENTS.md`).
- Kolejność cięcia jest w planie (sekcja Implementation Approach).

## Success Criteria (Summary)

- Krok 1 pokazu przechodzi na dwóch kontach, przy 1440 px i 360 px.
- `bun test` zielony, w tym test, że żaden ekran nie zawiera słowa „podpis”.
