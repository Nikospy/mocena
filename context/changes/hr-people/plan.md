# Dane i lista pracowników w kadrach — plan wdrożenia

## Overview

Plaster S-17 (decyzja 13i, czynności 23, 24, 26, 27, 28, 29 z `docs/coverage.md`). Dziś dane pracowników i podległość wgrywa skrypt, lista w `/hr` nie ma wyszukiwania, a edycji danych i zastępstw nie ma wcale. Po tym plastrze kadry (Joanna):
- przeglądają listę pracowników z wyszukiwaniem i sortowaniem;
- dodają i edytują pracownika (z przełożonym, czyli oceniającym);
- wpisują ocenę historyczną sprzed systemu, która zasila liczenie terminu;
- ustawiają zastępstwo oceniającego;
- pobierają zestawienie CSV.

## Zasady (źródła: ustawa o służbie cywilnej, rozporządzenie z 2016 r., poradnik i FAQ DSC)

1. Ocenia **bezpośredni przełożony** (art. 81 ust. 1, § 2 ust. 1). Pole „Przełożony” wyznacza oceniającego.
2. Zmiana przełożonego w trakcie cyklu to zmiana oceniającego. Kryteria zostają (§ 9 ust. 3). Jest już ekran zmiany oceniającego (`src/routes/appraiser.tsx`), więc edycja przełożonego w trakcie cyklu prowadzi do niego, a nie zmienia go po cichu.
3. Pola potrzebne do arkusza i silnika:
   - imię i nazwisko;
   - stanowisko i komórka;
   - status (urzędnik / pracownik służby cywilnej, `appointed`);
   - typ arkusza (A, B, C) wynikający ze stanowiska: A kierownik urzędu, B bezpośrednie kierowanie pracownikami, C pozostali;
   - przełożony;
   - data zatrudnienia na czas nieokreślony albo data i wynik ostatniej oceny;
   - stopień służbowy i data jego przyznania (urzędnicy).
4. **Zastępstwo** nie jest w przepisach. Poradnik i FAQ DSC (pyt. 13): przy przedłużającej się nieobecności ocenę może przeprowadzić np. pośredni przełożony albo osoba zastępująca. Ekran zastępstwa mówi to wprost jednym zdaniem w głosie „podpowiedź”: „To praktyka z poradnika KPRM, nie przepis.”
5. **Brak w źródłach:** format sprawozdań, archiwizacja, rejestr ocen. Eksport CSV jest wygodą dla kadr, bez twierdzeń o sprawozdawczości.

## Desired End State

1. `/hr/people` (Joanna, kadry):
   - tabela pracowników: imię i nazwisko, stanowisko, komórka, przełożony, typ arkusza, termin najbliższej oceny z pigułką;
   - wyszukiwanie po imieniu, nazwisku i stanowisku (`?q=`, bez JS) i sortowanie po kolumnach (`?sort=name|deadline|unit`);
   - na 360 px wiersze jako karty;
   - odnośnik z `/hr` („Pracownicy”).
2. `/hr/people/new` i `/hr/people/:id/edit`:
   - formularz z polami z zasady 3, przełożony z listy osób, typ arkusza z podpowiedzią ze stanowiska (do zmiany);
   - walidacja z komunikatami po polsku;
   - nowy pracownik z datą ostatniej oceny albo zatrudnienia dostaje otwarty cykl z terminem z silnika (`nextAssessmentDeadline`);
   - przy zmianie przełożonego, gdy osoba ma otwarty cykl, formularz zamiast zapisu prowadzi do ekranu zmiany oceniającego.
3. **Ocena historyczna:** w edycji pracownika sekcja „Ocena sprzed systemu”: data i wynik (pozytywna/negatywna, poziom). Zapis tworzy wpis w historii ocen (`/people/:id/history`) i przelicza termin otwartego cyklu.
4. **Zastępstwa** `/hr/substitutions`:
   - kto jest nieobecny (oceniający), kto zastępuje, od–do;
   - lista aktywnych i przyszłych;
   - w trakcie zastępstwa osoba zastępująca widzi zespół nieobecnego na swojej stronie głównej z adnotacją „W zastępstwie za Marka Zielińskiego do 30.11.2026” i może pisać notatki i prowadzić czynności oceniającego.

   Uprawnienia rozszerza jedno miejsce: funkcja ustalająca, czy osoba działa jako oceniający cyklu. Znajdź ją (np. `isAppraiser` w `src/cycles/part1.ts` i jej użycia) i nie twórz drugiej. Każda czynność w zastępstwie ma w zdarzeniu `on_behalf_of`, a oś czasu pokazuje „(w zastępstwie)”.
5. **Eksport** `/hr/export.csv`: jeden wiersz na najnowszy cykl każdej osoby (osoba, stanowisko, komórka, oceniający, stan procesu, termin, data i wynik ostatniej oceny). UTF-8 z BOM i średnikiem jako separatorem (Excel PL), nagłówek po polsku. Przycisk „Pobierz zestawienie (CSV)” na `/hr`.
6. Tylko kadry (i admin) mają dostęp do `/hr/people*`, `/hr/substitutions`, `/hr/export.csv`. Pozostali dostają 403.

## What We're NOT Doing

- Import z systemu kadrowego, usuwanie danych pracownika (czynność 30 zostaje poza prototypem).
- Zmiany w przewodniku pokazu.

## Phase 1: Lista, edycja, ocena historyczna, zastępstwa, eksport

### Success Criteria

#### Automated Verification
- `bun test src/routes/hr-people.test.ts`:
  - lista z `q=wój` znajduje Piotra, a `sort=deadline` sortuje po terminie;
  - nowy pracownik z datą ostatniej oceny ma otwarty cykl z terminem z silnika;
  - edycja stanowiska zapisuje się;
  - zmiana przełożonego przy otwartym cyklu prowadzi do zmiany oceniającego;
  - ocena historyczna trafia do historii i zmienia termin;
  - zastępstwo: w zakresie dat zastępca widzi zespół i może zapisać notatkę (zdarzenie z `on_behalf_of`), a poza zakresem dat dostaje 403;
  - CSV 200 z `text/csv`, BOM, średnikami i wierszem Piotra;
  - oceniany dostaje 403 na `/hr/people`.
- `bun test` zielony (w tym przewodnik i automat pokazu), `bun run seed` bez błędu, `wrangler deploy --dry-run` przechodzi.

#### Manual Verification
- Ekrany przy 1440 i 360 px, CSV otwarty w arkuszu kalkulacyjnym z polskimi znakami.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Lista, edycja, ocena historyczna, zastępstwa, eksport

#### Automated

- [ ] 1.1 Testy kadr przechodzą: `bun test src/routes/hr-people.test.ts`
- [ ] 1.2 Cały zestaw, dane pokazowe i wersja Cloudflare: `bun test`, `bun run seed`, `wrangler deploy --dry-run`

#### Manual

- [ ] 1.3 Ekrany przy 1440 i 360 px, CSV z polskimi znakami
