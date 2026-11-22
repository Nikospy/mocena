# Materiały dla jury — plan wdrożenia

## Overview

Plaster S-11 (roadmapa M-1, kotwica MS-05). Juror dostaje dwie rzeczy zgodne z działającą wersją:
- README repo z linkiem do żywej wersji;
- prezentację do 15 slajdów w wyglądzie mOceny, gotową do zapisu jako PDF z przeglądarki.

Nagranie i teksty formularza zgłoszenia robi autor z królem osobno, nie w tym plastrze. Teksty idą pod nazwiskiem autora, więc przed oddaniem przegląda je autor.

Równolegle powstają S-08, S-09 i S-10. Ten plaster zmienia tylko `README.md`, `docs/pitch/*` i dodaje skrypt `pitch` w `package.json`. Nie zmienia kodu aplikacji.

## Źródła treści

Treść bierzesz z repo, niczego nie wymyślasz:
- `context/foundation/decisions.md`: teza (sekcja 1), zakazy, decyzja 13;
- `context/foundation/prd.md`: problem, kryteria sukcesu, wymagania;
- `context/foundation/demo.md`: 5 kroków;
- `context/foundation/tech-stack.md`;
- `rules/regulation-2016-470.json` i `src/engine/*`: przepisy, które silnik naprawdę liczy;
- `context/design/README.md`: trzy głosy.

Liczby (testy, przepisy, czynności z listy organizatora) podajesz tylko takie, które da się sprawdzić w repo. Liczbę testów bierzesz z wyniku `bun test`.

Zakazy treści:
- „potwierdzenie”, nigdy „podpis”;
- nie piszemy, że system ocenia, rozumie notatki albo proponuje punkty;
- bez modelu językowego w prototypie; jest tylko wymienne miejsce na model uruchomiony w urzędzie;
- bez materiałów organizatora wklejonych do repo;
- bez prywatnych ścieżek, adresów e-mail i nazwisk spoza danych pokazowych.

## Desired End State

### README.md (po polsku, na górze dwa zdania po angielsku)

1. Nazwa i jedno zdanie, które rozbraja przekonanie „asystent ocen to AI, które pisze ocenę”.
2. **Zobacz na żywo:** https://mocena.pietkiewicz-mikolaj.workers.dev. Dopisek: „Kliknij »Rozpocznij pokaz«: 5 kroków, ok. 3 minut. Każdy widz ma własne dane pokazowe.”
3. Co robi, w 5 punktach według kroków pokazu, każdy z przepisem z silnika.
4. Czego nie robi (zakazy z decyzji): nie pisze oceny, nie proponuje punktów, nie porównuje pracowników, nie ma etykiet przy nazwisku.
5. Jak działa: reguły w jednym pliku z wersją, silnik terminów i wyniku, adapter podpowiedzi, dane tylko u widza. Diagram mermaid z linią `%% focus: <węzeł>` na początku bloku.
6. Uruchomienie lokalne (`bun install`, `bun run seed`, `bun run dev`, `bun test`) i wdrożenie (`bun run deploy`).
7. Podstawa prawna (zostaje z obecnego README).
8. Struktura repo w 6–8 linijkach i odnośnik do `context/` (decyzje, PRD, roadmapa).
9. Licencja: zostaje to, co jest; jeśli nic nie ma, nie dodajesz licencji (decyzja autora).

### Prezentacja `docs/pitch/index.html`

- Jeden plik HTML, slajdy 16:9 jeden pod drugim, wydruk A4 poziomo, każdy slajd na osobnej stronie (`@page`, `break-after`).
- Style z `public/rodzina.css` i `public/style.css` (ścieżki względne) oraz własny `<style>` tylko na tokenach. Fonty z `public/fonts/`.
- Do 15 slajdów:
  1. tytuł i teza;
  2. problem: dwa lata pracy, pamięć ostatnich tygodni, papier i terminy;
  3. dla kogo: oceniający, oceniany, kadry;
  4. zasada: asystent, nie autor oceny, punkty stawia człowiek;
  5–9. po jednym slajdzie na krok pokazu, każdy ze zrzutem ekranu i przepisem;
  10. trzy głosy interfejsu: człowiek, reguła, podpowiedź;
  11. pod spodem: reguły z wersją, silnik, testy, dane tylko u widza, gotowość na model urzędu przez adapter;
  12. czego świadomie nie robimy;
  13. co dalej we wdrożeniu (z PRD: poza prototypem);
  14. zobacz na żywo (adres, QR jako SVG wygenerowany w repo bez usług zewnętrznych albo sam adres dużym krojem).
- Zrzuty: `docs/pitch/shots/*.png` robi skrypt `scripts/pitch-shots.ts`. Uruchamia aplikację lokalnie, przechodzi pokaz przez `POST` formularzy jak w `demo.md` i zapisuje zrzuty przez Playwright, jeśli jest dostępny (`import("playwright")`). Gdy Playwrighta nie ma, skrypt kończy się czytelnym komunikatem, a slajdy pokazują ramkę z podpisem ekranu zamiast zrzutu. Zrzuty odświeży król po scaleniu S-08 i S-09.
- `bun run pitch` wypisuje ścieżkę pliku do otwarcia. PDF zapisuje się z przeglądarki (Drukuj → PDF).

## What We're NOT Doing

- Nagranie, formularz zgłoszenia, publikacja.
- Zmiany w aplikacji.

## Phase 1: README i prezentacja

### Changes Required

1. `README.md` według sekcji wyżej.
2. `docs/pitch/index.html` (14–15 slajdów) i `scripts/pitch-shots.ts`.
3. `src/pitch.test.ts`: README zawiera adres żywej wersji i „Rozpocznij pokaz”; README i prezentacja nie zawierają słowa „podpis”, ścieżek `/Users/` ani znaku `@` w adresie e-mail; prezentacja ma od 10 do 15 elementów slajdu.

### Success Criteria

#### Automated Verification
- `bun test src/pitch.test.ts` zielony.
- `bun test` zielony, `bun run seed` bez błędu, `wrangler deploy --dry-run` przechodzi.

#### Manual Verification
- Podgląd wydruku prezentacji w Chromium: każdy slajd na osobnej stronie A4 poziomo, nic nie wystaje.
- Autor czyta README i slajdy przed oddaniem.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: README i prezentacja

#### Automated

- [x] 1.1 Test materiałów przechodzi: `bun test src/pitch.test.ts` — 92df7d2
- [x] 1.2 Cały zestaw, dane pokazowe i wersja Cloudflare: `bun test`, `bun run seed`, `wrangler deploy --dry-run` — 92df7d2

#### Manual

- [ ] 1.3 Podgląd wydruku prezentacji: slajd na stronę, nic nie wystaje
- [ ] 1.4 Autor przeczytał README i slajdy
