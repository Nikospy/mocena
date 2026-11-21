# Początek cyklu: arkusz, kryteria, oczekiwania, potwierdzenie części I — Plan Brief

> Full plan: `context/changes/cycle-start-criteria/plan.md`. Nazwy: rozdział „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`.

## What & Why

Krok 1 pokazu: Marek zaczyna cykl Piotra (arkusz C, 2 kryteria dodatkowe z podpowiedzią „dlaczego”, oczekiwanie, karta rozmowy, przekazanie), a Piotr potwierdza część I na telefonie. Plaster wgrywa też pełną część I Ewy i Tomasza, na której stoją S-02, S-03, S-04 i S-06.

## Starting Point

F-01 daje silnik (`validateAdditionalCriteria`, `criteriaTalkDeadline`), tabele `people`, `cycles`, `cycle_criteria`, `events`, `settings`, funkcje `today()`, `visibleEvents`, `effectiveDeadline`, `registerHomeTasks`, `registerCycleLinks`, konta, układ i cykle ze zdarzeniami `cycle_started`. Brakuje tabeli obowiązków, karty rozmowy, ekranu części I i potwierdzeń.

## Desired End State

Przy 9.12.2024 Marek ma sprawę z terminem 27.12.2024 (§ 7 pkt 1), wypełnia i przekazuje część I z terminem oceny 27.11.2026 (przed przekazaniem z `effectiveDeadline`, po przekazaniu z `part1_submitted.payload.dueDate` jako „Termin przekazany w części I”); część I jest zablokowana od przekazania (uproszczenie z kontraktu). Piotr potwierdza, system wpisuje miejscowość, datę i nazwisko. Ewa i Tomasz mają po seedzie potwierdzoną część I; z opcją `afterStep1` także Piotr, jak po kroku 1.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Źródło podpowiedzi | tabela „rodzaj obowiązku → kryterium” w `rules/office-settings.json`, „ustawienie urzędu” | decyzja autora, bez rozumienia tekstu | decisions 6b |
| Miejsce podpowiedzi | wejście `suggestCriteria` we wspólnym `src/suggestions/index.ts` | jedno wymienne miejsce | AGENTS.md zasada 5, przegląd 18 |
| Podpowiedzi zaznaczone z góry | nie, tylko na górze listy ze zdaniem „dlaczego” | nic nie zapisuje się bez kliknięcia | Plan |
| Termin oceny | nigdy w `cycles`; ekran części I przed przekazaniem czyta `effectiveDeadline`, po przekazaniu `part1_submitted.payload.dueDate` jako „Termin przekazany w części I” | jedno źródło na każdą sytuację (tabela „Skąd ekran bierze termin oceny”) | kontrakt, przegląd 8 |
| Arkusz | `savePart1` dobiera go z `people.position_kind` przez `sheetForPosition`, bez argumentu; `src/seed/part1.ts` ustawia `position_kind` każdej osobie z `base.ts` | arkusz zawsze wynika ze stanowiska | kontrakt |
| Termin rozmowy o kryteriach | `criteriaTalkDeadline` z danymi `cycle_started` (sporządzenie i wynik poprzedniej oceny) | 7 dni po negatywnej, bez stałej 30 | przegląd 16 |
| Przekazanie | `submitPart1(cycleId, actorId, input)` sprawdza aktora, stan i dane, po czym w jednej transakcji woła `savePart1(cycleId, actorId, input, today())` | brak zapisu połowicznego; dane pokazowe zapisują część I Ewy przez `savePart1` z historycznym aktorem i datą | przegląd 13, kontrakt |
| Kadry | w wersji minimalnej 403 i bez odnośnika; odnośnik „Część I” dla `hr` dopiero z widokiem do odczytu (faza 2) | odnośnik tylko dla ról, które trasa `GET` wpuszcza | kontrakt |
| Stan części I | tylko z `visibleEvents` | dane odsłaniane datą | decisions 10i |
| Potwierdzenie | kliknięcie na własnym koncie, auto-wpis, słowo „potwierdzenie” | bez podpisu elektronicznego | decisions 5a, 11b |
| Brak potwierdzenia | „czeka na potwierdzenie od X dni”, bez wpisu za pracownika | brak podstawy prawnej | decisions 10d |

## Scope

**In scope:** dobór arkusza, kryteria obowiązkowe, wybór do 3 dodatkowych z podpowiedzią, oczekiwania, karta rozmowy rozpoczynającej, przekazanie, potwierdzenie, blokada, `GET /cycles/:id` z odnośnikami cyklu, sprawy na ekranie startowym, `src/seed/part1.ts` z opcją `afterStep1`, stan oczekiwania, widok kadr do odczytu.

**Out of scope:** ocena (S-02), notatki i wejście podpowiedzi dla notatki (S-04), ekran kadr i wydruk (S-06), nieobecności i oś czasu (S-03), cofnięcie przekazania, pole „cele”, style.

## Architecture / Approach

Czyste funkcje w `src/engine/criteria.ts`, wejście podpowiedzi w `src/suggestions/index.ts`, logika w `src/cycles/part1.ts`, trasy w `src/routes/cycle-start.tsx`, jeden widok części I `src/views/part1.tsx` plus `LegalBasis` i `ConfirmationBlock` (od początku z oboma wariantami: `confirmation` i `fiction`; S-02 i S-06 tylko go używają) w `src/views/components.tsx`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Wersja minimalna (ok. 50 min) | krok 1 pokazu do końca na dwóch kontach, seed części I Ewy i Tomasza | nazwy F-01 w kodzie inne niż w kontrakcie |
| 2. Dopełnienie (ok. 15 min, w kolejności cięcia) | „od X dni”, widok kadr, 8 obowiązków, pełna karta, opisy kryteriów | brak czasu: wypada od końca |

**Prerequisites:** F-01 skończone (`bun test` i `bun run seed` zielone).
**Estimated effort:** ok. 70 minut (50 + 15 + 5 na zrzuty).

## Open Risks & Assumptions

- Liczba dni oczekiwania stoi w zdaniu o stanie części I, nie przy nazwisku (zasada 7 w `AGENTS.md`).

## Success Criteria (Summary)

- Krok 1 pokazu przechodzi na dwóch kontach, przy 1440 px i 360 px.
- `bun test` zielony, w tym test transakcji `submitPart1`, testy `savePart1` i opcji `afterStep1`, terminu po ocenie negatywnej, renderowania obu wariantów `ConfirmationBlock` i braku słowa „podpis”.
