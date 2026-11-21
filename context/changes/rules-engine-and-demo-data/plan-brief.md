# Silnik reguł, dane pokazowe i wybór konta — Plan Brief

> Full plan: `context/changes/rules-engine-and-demo-data/plan.md`. Nazwy dla wszystkich plastrów: rozdział „Kontrakt wspólny dla wszystkich plastrów” w tym samym `plan.md`. Przy rozjeździe wygrywa ten rozdział, a po zbudowaniu F-01 kod.

## What & Why

Fundament pod wszystkie plastry (F-01 w roadmapie): reguły rozporządzenia 2016-470 jako dane z wersją, silnik wyniku i terminów z testami, baza z danymi pokazowymi, wybór konta demonstracyjnego, data systemowa do pokazu i wspólny szkielet ekranu. Bez tego żaden plaster nie ma na czym stanąć.

## Starting Point

Repo ma starter Hono (`src/index.ts`, `GET /`). Silnik i plik reguł są już skopiowane z nazwami po polsku (`reguly/`, `src/silnik/`); 19 testów na przykładach organizatora przechodzi. Trzeba przenieść je na nazwy angielskie, poprawić datę obowiązywania na `2016-04-23` (w kopii jest `2016-04-22`) i zbudować resztę.

## Desired End State

`bun test` przechodzi; `bun run seed` tworzy bazę z wydziałem pokazowym; po wejściu na `/` użytkownik wybiera konto i widzi swój ekran startowy z listą spraw; data systemowa jest widoczna i daje się przesunąć (startowo 2024-12-09).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Reguły | dane w `rules/*.json` z `version` i `effectiveFrom`; kod czyta je przez `src/engine/rules.ts` | reguły są danymi, nie kodem | plan, „Implementation Approach” |
| Data systemowa | w tabeli `settings` (`demo_date`); cały kod pyta o „dziś” przez `today()` | pokaz musi móc przesuwać datę | decyzje 10i |
| Widoczność danych | każde zdarzenie ma datę; odczyty biorą tylko `date <= today()` (`visibleEvents`) | wgrane dane z 2025–2026 odsłaniają się przy przesuwaniu daty | decyzje 10i |
| Zapis z ekranu | `recordEvent` dostaje datę `today()`; `seedEvent` z jawną datą tylko do danych pokazowych i testów | zapis na żywo nigdy nie znika | plan, „Funkcje F-01” |
| Konto | ciasteczko z identyfikatorem osoby; bez hasła i ról poza listą kont pokazowych | pokaz nie wymaga logowania | plan, „What We're NOT Doing” |
| Baza | jeden plik `bun:sqlite`, schemat tworzony przy starcie, dane wgrywa `bun run seed` | prosty start bez serwera bazy | plan, „Implementation Approach” |
| Nieobecność | tylko daty i pole „usprawiedliwiona”, bez rodzaju | decyzja 10m | plan, „Dane pokazowe” |
| Wygląd | tokeny z design systemu autora (decyzja 10b); do czasu jego podpięcia ekran z samego HTML | nie piszemy własnych stylów agenta | plan, „Phase 1”, punkt 3 |

## Scope

**In scope:** przeniesienie silnika i testów na nazwy angielskie (`src/engine/scoring.ts`, `src/engine/deadlines.ts`, `src/engine/rules.ts`); schemat tabel F-01 i `runSeed`; moduł `src/seed/base.ts` (osoby, ustawienia, cykle ze zdarzeniami `cycle_started`); `GET /account`, `POST /account`, `GET /`, `POST /demo/date`; układ z nagłówkiem (konto i data systemowa) i nawigacją; `homeTasks`/`registerHomeTasks` i `cycleLinks`/`registerCycleLinks`; `public/style.css`; `createTestApp`.

**Out of scope:** ekrany cyklu (S-01 i dalej), logowanie hasłem, role poza listą kont pokazowych, edycja danych pracowników, wdrożenie i CI.

## Architecture / Approach

Jedna faza. Reguły w `rules/regulation-2016-470.json`, kod czyta je przez jeden moduł. Funkcje F-01 w `src/db.ts`, `src/people.ts`, `src/cycles.ts`, `src/home-tasks.ts`, `src/cycle-links.ts`; trasy w `src/index.tsx`; testy pomocnicze w `src/test-helpers.ts`. Usuwane po przeniesieniu: `reguly/` i `src/silnik/`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Fundament | silnik i reguły z wersją, baza i `bun run seed`, konto, data systemowa, szkielet ekranu startowego | plan nie podaje ryzyk; zauważony błąd daty w pliku reguł jest już ujęty w planie |

**Prerequisites:** brak w planie.
**Estimated effort:** brak w planie.

## Open Risks & Assumptions

- Plan nie ma sekcji ryzyk. Jedyny znany błąd (data obowiązywania `2016-04-22`) jest w planie opisany i poprawiany na `2016-04-23`.
- Zrzuty ekranu startowego (360 px i 1440 px) wymagają akceptacji autora przed powieleniem wyglądu (zasada 10 w `AGENTS.md`).

## Success Criteria (Summary)

- Automatycznie: `bun test` przechodzi; `bun run seed` wgrywa dane bez błędu; `GET /account` odpowiada, a plik z `public/` jest zwracany.
- Ręcznie: ekran startowy czytelny przy 360 px i 1440 px; autor akceptuje zrzuty przed powieleniem wyglądu.
