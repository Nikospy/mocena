# Szybkość żywej strony — plan wdrożenia

## Overview

Plaster S-13 (roadmapa M-1, kotwica MS-04). Juror otwiera link raz i ocenia po pierwszych sekundach. Każdy krok przewodnika (`POST /tour/:stop`) odbudowuje dane pokazowe w Durable Object widza. Ten plaster mierzy i skraca czas pierwszego wejścia i kroku przewodnika na Cloudflare Workers, bez zmiany zachowania aplikacji.

Równolegle budują się S-09 (widoki) i S-12 (`first-impression`: `layout.tsx`, `index.tsx`, `<head>`). Ten plaster zmienia tylko:
- `src/worker.ts`, `wrangler.jsonc`;
- `src/tour/state.ts`, ale tylko wydajność, bez zmiany wynikowego stanu danych;
- `src/seed.ts` i `src/seed/*`, ale tylko wydajność, bez zmiany danych;
- nowe pliki `scripts/measure-live.ts` i `public/_headers`.

## Current State Analysis

- `src/worker.ts`: Durable Object z SQLite na widza, wybierany ciasteczkiem `mocena_demo`. Przy pierwszym wejściu woła `runSeed`.
- `applyTourStop` czyści wszystkie tabele i wgrywa dane od nowa w jednej transakcji.
- Statyczne pliki z `public/` (fonty Open Sans, CSS, JS) obsługuje `assets`.

## Desired End State

1. `scripts/measure-live.ts [BASE_URL] [--runs N]` mierzy medianę i p90 czasu:
   - pierwszego `GET /` w nowej sesji;
   - `POST /tour/1`, `POST /tour/4`, `POST /tour/5b` z podążaniem za przekierowaniem;
   - `GET /style.css` i jednego fontu.

   Wynik to tabela w konsoli. Pomiar przed zmianami i po zmianach trafia do raportu i do sekcji „Pomiary” w tym planie.
2. Statyczne zasoby mają nagłówki pamięci podręcznej przez `public/_headers`: fonty `max-age=31536000, immutable`, CSS i JS `max-age=300`, bo nazwy nie mają skrótu.
3. Odbudowa danych w kroku przewodnika i w pierwszym seedzie jest szybsza:
   - wstawianie wsadowe w jednej transakcji;
   - przygotowane zapytania użyte wielokrotnie;
   - jeśli to bezpieczne, migawka stanu bazowego w pamięci obiektu, czyli raz wyliczone wiersze seedu kopiowane do tabel.

   Wynikowy stan danych jest identyczny: testy `src/tour/state.test.ts` i `src/demo-check/run.test.ts` przechodzą bez zmian.
4. Gdy pomiar pokaże, że największy koszt leży gdzie indziej (np. zimny start obiektu), opisujesz to w raporcie z liczbami i zmieniasz tylko to, co mieści się w plikach tego plastra.

## What We're NOT Doing

- Zmiana zachowania, tras, widoków i danych.
- Płatne funkcje Cloudflare.

## Phase 1: Pomiar i przyspieszenie

### Changes Required

Pozycje 1–4.

### Success Criteria

#### Automated Verification
- `bun test src/tour/state.test.ts src/demo-check/run.test.ts` zielone bez zmian w tych testach.
- `bun test src/live-speed.test.ts`: `public/_headers` ma regułę dla `/fonts/*` z `immutable`. `applyTourStop` dla 7 przystanków na bazie testowej trwa w sumie krócej niż przed zmianą (próg zapisany w teście na podstawie pomiaru „przed”, z zapasem 20%).
- `bun test` zielony, `bun run seed` bez błędu, `wrangler deploy --dry-run` przechodzi.

#### Manual Verification
- `bun run scripts/measure-live.ts https://mocena.pietkiewicz-mikolaj.workers.dev` po wdrożeniu: wyniki zapisane w „Pomiary”.

## Pomiary

(uzupełnia wykonawca: przed i po, lokalnie; na żywej stronie król po wdrożeniu)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Pomiar i przyspieszenie

#### Automated

- [ ] 1.1 Testy szybkości i stanu przechodzą: `bun test src/live-speed.test.ts src/tour/state.test.ts src/demo-check/run.test.ts`
- [ ] 1.2 Cały zestaw, dane pokazowe i wersja Cloudflare: `bun test`, `bun run seed`, `wrangler deploy --dry-run`

#### Manual

- [ ] 1.3 Pomiar na żywej stronie po wdrożeniu
