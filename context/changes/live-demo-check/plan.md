# Automatyczne sprawdzenie pokazu — plan wdrożenia

## Overview

Plaster S-10 (roadmapa M-1, kotwica MS-04). Karta kamienia wymaga „dwóch pełnych przebiegów pokazu bez błędu”. Ten plaster daje skrypt, który przechodzi cały pokaz z `context/foundation/demo.md` tak jak człowiek: wysyła te same formularze i trzyma ciasteczka. Po każdym kroku sprawdza, czy na ekranie jest to, co opisuje kolumna „Co widać”. Działa na aplikacji w teście (`app.request`) i na dowolnym adresie (`BASE_URL`), w tym na żywej stronie.

Równolegle powstają S-08 (`guided-demo-tour`, pliki `src/tour/*`, `layout.tsx`, `index.tsx`) i S-09 (`review-polish`, widoki). Ten plaster ich nie zmienia. Teksty ekranów mogą się zmienić w S-09, więc sprawdzenia opierają się na faktach (daty, liczby, nazwiska, stany, kody HTTP, adresy), a nie na pełnych zdaniach interfejsu.

## Current State Analysis

- Trasy pokazu: `/account`, `POST /demo/restart`, `POST /demo/date`, część I, notatki, pytanie HR partnera, nieobecności, oś czasu, ocena, zapoznanie, `/hr`, arkusz. Nazwy tras i pól bierzesz z kodu (`src/routes/*`) i z kontraktu w `context/changes/rules-engine-and-demo-data/plan.md`.
- Na Cloudflare każdy widz ma własną bazę wybraną ciasteczkiem `mocena_demo`. Skrypt musi to ciasteczko zachować przez cały przebieg.

## Desired End State

1. `scripts/demo-check.ts` (Bun, bez zależności spoza repo, sam `fetch` i własny słoik ciasteczek). Uruchomienie: `bun run demo-check [BASE_URL] [--runs 2]`. Domyślny adres: `http://localhost:3000`.
2. Rdzeń przebiegu w `src/demo-check/run.ts` jako funkcja `runDemo(fetcher)`, gdzie `fetcher` to `fetch` z adresem albo `app.request`. Ta sama logika służy testowi i skryptowi.
3. Przebieg (każdy w świeżej sesji: `POST /demo/restart`):
   - **Krok 1:** Marek, 2024-12-09. Rozpoczyna cykl Piotra, wybiera „Orientacja na klienta/interesanta” i „Myślenie analityczne”, wpisuje oczekiwanie, przekazuje. Sprawdzenia: termin rozmowy 27.12.2024, arkusz C. Potem Piotr potwierdza część I. Sprawdzenia: kryteria zablokowane, data potwierdzenia.
   - **Krok 2:** 2026-03-11. Marek pisze notatkę o przejęciu kolejki wniosków z kryterium Rzetelność. Sprawdzenia: podpowiedź pola zmiany zadań jest zaznaczona, po zapisie pytanie o stałą zmianę zadań, po „tak” karta rozmowy. Druga notatka bez sygnału (inne kryterium niż „Myślenie analityczne”): bez pytania.
   - **Krok 3:** 2026-11-10. Joanna wpisuje 05.10–16.10.2026 i 19.10–06.11.2026. Sprawdzenia na osi czasu Piotra: jedna nieobecność 05.10–06.11.2026 i nowy termin oceny (wartość z silnika).
   - **Krok 4:** 2026-11-21. Marek otwiera „Przed rozmową”, kartę rozmowy oceniającej i formularz. Sprawdzenia: ostrzeżenie „tylko ostatni miesiąc” przy „Wykorzystywanie wiedzy…”, „Myślenie analityczne” bez notatek. Stawia oceny z „1” przy Rzetelności. Sprawdzenia: wynik negatywny; zatwierdzenie bez wniosków i uzasadnienia daje 422 z zachowanymi danymi; po uzupełnieniu zatwierdzenie przechodzi.
   - **Krok 5:** 2026-11-22. Piotr potwierdza zapoznanie. Sprawdzenie: termin sprzeciwu 30.11.2026. Joanna na `/hr`: karta stopnia Tomasza z terminem 14.12.2026, arkusz Piotra otwiera się (200) i ma przycisk druku.
   - **Dodatki wersji 5-minutowej:** oś czasu Ewy ze zmianą oceniającego; „Odnotuj przyznanie stopnia” usuwa kartę Tomasza; w osobnej świeżej sesji stwierdzenie fikcji zapoznania na przygotowanej ocenie (o ile trasa na to pozwala; jeśli nie, krok zgłasza „pominięte” z powodem i nie jest błędem).
4. Po każdym kroku skrypt sprawdza też, że żadna odpowiedź nie ma kodu 5xx, nieoczekiwanego 4xx ani słowa „podpis”. Wynik to jedna linia na krok (`✓ krok 3: …` / `✗ krok 3: oczekiwano …, było …`) i kod wyjścia 1 przy błędzie. `--runs 2` przechodzi pokaz dwa razy, każdy w nowej sesji.

## What We're NOT Doing

- Bez przeglądarki: wygląd sprawdza człowiek na zrzutach (decyzja 13b).
- Przewodnik pokazu (S-08) sprawdzi się w fazie 2, po jego scaleniu. Ten job buduje tylko fazę 1.

## Phase 1: Przebieg pokazu bez przewodnika

### Changes Required

1. `src/demo-check/run.ts` z `runDemo(fetcher)` i słoikiem ciasteczek.
2. `scripts/demo-check.ts` i skrypt `demo-check` w `package.json`.
3. `src/demo-check/run.test.ts`: `runDemo` na `app.request` przechodzi bez błędu dwa razy z rzędu.

### Success Criteria

#### Automated Verification
- `bun test src/demo-check/run.test.ts` zielony.
- `bun test` zielony, `bun run seed` bez błędu, `wrangler deploy --dry-run` przechodzi.

#### Manual Verification
- `bun run demo-check https://mocena.pietkiewicz-mikolaj.workers.dev --runs 2` przechodzi na żywej stronie.

## Phase 2: Przewodnik pokazu (po scaleniu S-08)

### Changes Required

1. Przebieg przewodnika: `POST /tour/1` … `/tour/5b`, `/tour/done`. Na każdym przystanku: 303 na ekran przystanku, ekran ma tytuł przystanku i formularz „Dalej”, a dane są w stanie z tabeli „Stany danych” planu `guided-demo-tour`.

### Success Criteria

#### Automated Verification
- `bun test src/demo-check/run.test.ts` obejmuje przewodnik.

#### Manual Verification
- Oba przebiegi (zwykły i przewodnik) dwa razy z rzędu na żywej stronie.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Przebieg pokazu bez przewodnika

#### Automated

- [x] 1.1 Test przebiegu pokazu przechodzi: `bun test src/demo-check/run.test.ts` — 91ae85c
- [x] 1.2 Cały zestaw, dane pokazowe i wersja Cloudflare: `bun test`, `bun run seed`, `wrangler deploy --dry-run` — 91ae85c

#### Manual

- [ ] 1.3 `bun run demo-check <żywy adres> --runs 2` przechodzi

### Phase 2: Przewodnik pokazu (po scaleniu S-08)

#### Automated

- [ ] 2.1 Test obejmuje przewodnik: `bun test src/demo-check/run.test.ts`

#### Manual

- [ ] 2.2 Oba przebiegi dwa razy z rzędu na żywej stronie
