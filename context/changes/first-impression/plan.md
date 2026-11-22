# Pierwsze wrażenie: podgląd linku, ikona, strony błędów, dostępność — plan wdrożenia

## Overview

Plaster S-12 (roadmapa M-1, kotwica MS-01, decyzja 13). Juror najczęściej dostaje link w czacie albo w formularzu. Dziś link nie ma podglądu, karta przeglądarki nie ma ikony, nieznany adres pokazuje surowe „404 Not Found”, a klawiatura nie ma skrótu do treści. Ten plaster to naprawia w wyglądzie mOceny.

Równolegle buduje się S-09 (`review-polish`, widoki ekranów). Ten plaster zmienia tylko:
- `src/views/layout.tsx` (sekcja `<head>` i link „Przejdź do treści”);
- `src/views/tour-entry.tsx` i `src/views/tour-done.tsx` (sekcja `<head>`);
- `src/index.tsx` (`app.notFound`, `app.onError`);
- nowe pliki `src/views/error-page.tsx`, `src/views/head.tsx`, `public/favicon.svg`, `public/og.png` (albo `og.svg` + png), `public/robots.txt`;
- własną sekcję `/* first-impression */` na końcu `public/style.css`.

## Desired End State

1. **Wspólny `<head>`** (`src/views/head.tsx`) we wszystkich układach:
   - `lang="pl"` na `<html>`;
   - `<meta name="description">`: „Asystent ocen okresowych w służbie cywilnej. Nie pisze oceny: zbiera fakty przez dwa lata i pilnuje terminów z przepisów. Prototyp na HackNation 2026.”;
   - `theme-color` z tokenu tła;
   - ikona `favicon.svg`: litera „m” w kolorze akcentu na białym, jak znak „mOcena” w nagłówku;
   - Open Graph i Twitter card: tytuł „mOcena: ten asystent nie pisze oceny”, opis jak wyżej, obraz `og.png` 1200×630.
2. **Obraz `og.png`** w wyglądzie wejścia (`context/design/mockups/tour/v3-entry.html`): tło, „mOcena”, „Ten asystent nie pisze oceny.” i uproszczona oś z pięcioma przystankami. Powstaje z pliku SVG w repo. Gdy w środowisku nie da się go wyrenderować do PNG, zostaje `og.svg`, a `og:image` wskazuje na niego (zapisz to w raporcie).
3. **Strony błędów** (`src/views/error-page.tsx`) w karcie z układu:
   - 404: „Nie ma takiej strony” + przyciski „Strona główna” i „Pokaz dla jury”;
   - 500: „Coś poszło nie tak” + „Spróbuj jeszcze raz” i „Zacznij pokaz od nowa” (formularz `POST /tour/1`);
   - bez stosu wywołań i bez angielskiego tekstu. `app.onError` loguje błąd w konsoli serwera.
4. **Klawiatura:**
   - link „Przejdź do treści” jako pierwszy element strony, widoczny przy fokusie, prowadzi do `<main id="main">`;
   - każdy element klikalny ma widoczny fokus (token `--focus`).
5. `public/robots.txt` pozwala indeksować tylko `/` i `/tour`.

## What We're NOT Doing

- Widoki ekranów (S-09), przewodnik poza sekcją `<head>`.

## Phase 1: Head, ikona, błędy, klawiatura

### Changes Required

Pozycje 1–5.

### Success Criteria

#### Automated Verification
- `bun test src/first-impression.test.ts`:
  - `GET /`, `GET /tour` i ekran z kontem mają `lang="pl"`, `og:title`, `og:image`, `description` i `link rel="icon"`;
  - `GET /nie-ma-takiej` daje 404 z „Nie ma takiej strony” w układzie mOceny;
  - trasa testowa rzucająca błąd daje 500 z „Coś poszło nie tak”, bez słowa „Error” i bez stosu;
  - pierwszy odnośnik w `<body>` to „Przejdź do treści” z `href="#main"`;
  - `public/favicon.svg` i obraz OG istnieją.
- `bun test` zielony, `bun run seed` bez błędu, `wrangler deploy --dry-run` przechodzi.

#### Manual Verification
- Podgląd linku w narzędziu do kart OG pokazuje obraz i tytuł.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Head, ikona, błędy, klawiatura

#### Automated

- [ ] 1.1 Testy pierwszego wrażenia przechodzą: `bun test src/first-impression.test.ts`
- [ ] 1.2 Cały zestaw, dane pokazowe i wersja Cloudflare: `bun test`, `bun run seed`, `wrangler deploy --dry-run`

#### Manual

- [ ] 1.3 Podgląd linku pokazuje obraz i tytuł
