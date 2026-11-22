# Zaproszenia na rozmowy — plan wdrożenia

## Overview

Plaster S-16 (decyzja 13i, czynności 17 i 18 z `docs/coverage.md`). Dziś są karty obu rozmów (tematy z przepisu), ale nie ma zaproszenia. Po tym plastrze oceniający zaprasza ocenianego na rozmowę o kryteriach i na rozmowę oceniającą: data, godzina, miejsce, tematy. Oceniany widzi zaproszenie, pobiera plik kalendarza i potwierdza termin. Oceniający widzi licznik dni do granicy z § 7.

## Zasady (źródła: rozporządzenie z 2016 r., poradnik KPRM)

1. **Rozmowa o kryteriach** (rozpoczynająca, § 5 ust. 1): oceniający i oceniany. Tematy:
   - główne obowiązki;
   - kryteria obowiązkowe i dodatkowe;
   - oczekiwania oceniającego;
   - cele, jeśli ich określenie jest uzasadnione.

   Termin (§ 7): 30 dni od sporządzenia poprzedniej oceny lub od zatrudnienia na czas nieokreślony; 7 dni od negatywnej oceny. Silnik ma `criteriaTalkDeadline`.
2. **Rozmowa oceniająca** (§ 10) odbywa się przed sporządzeniem oceny na piśmie. Tematy:
   - wykonane obowiązki i spełnianie kryteriów;
   - realizacja celów;
   - kierunki rozwoju i potrzeby szkoleniowe.

   Dokładnego terminu brak; ma być w związku czasowym z oceną (poradnik).
3. **Brak w źródłach:** zaproszenie jako czynność formalna, jego forma, wyprzedzenie i inni uczestnicy. Zaproszenie jest więc wygodą dla stron, a nie wymogiem. Ekran mówi to jednym zdaniem w głosie „podpowiedź”, a nie „reguła”.

## Desired End State

1. Na karcie rozmowy rozpoczynającej i oceniającej (oceniający) przycisk „Zaproś na rozmowę”. Formularz `/cycles/:id/invitations/new?kind=opening|assessment`:
   - data (z datą słownie), godzina, miejsce (tekst, np. „pokój 214” albo „wideo”), opcjonalna notatka;
   - tematy wstawione z przepisu, bez edycji;
   - dla `opening` licznik „Do granicy z § 7: N dni (do 27.12.2024)”, a data po granicy daje ostrzeżenie (nie blokadę).

   Zapis tworzy zdarzenie `invitation_sent` (kind, data, godzina, miejsce, notatka).
2. Oceniany ma na stronie głównej kartę „Zaproszenie na rozmowę o kryteriach: 12.12.2024, 10:00, pokój 214” z tematami, przyciskiem „Potwierdzam termin” (zdarzenie `invitation_confirmed`) i „Pobierz do kalendarza” (`/cycles/:id/invitations/:eventId.ics`).
3. Plik `.ics`: poprawny iCalendar (VCALENDAR/VEVENT, `DTSTART`/`DTEND` 60 min w strefie Europe/Warsaw z `VTIMEZONE`, `SUMMARY` „Rozmowa o kryteriach oceny: Piotr Wójcik”, `DESCRIPTION` z tematami, `LOCATION`, `UID` stały dla zdarzenia), `Content-Type: text/calendar; charset=utf-8`, CRLF. Generowany bez bibliotek zewnętrznych.
4. Oceniający widzi na karcie i na stronie głównej stan zaproszenia: „Wysłane 9.12, czeka na potwierdzenie” albo „Potwierdzone przez Piotra 9.12”. Może zmienić termin, co tworzy nowe zaproszenie i unieważnia poprzednie.
5. Oś czasu ma wpis „Zaproszenie na rozmowę…” i „Potwierdzenie terminu”.
6. Dane pokazowe: przy przystanku 1 przewodnika jeszcze nie ma zaproszenia, więc juror może je wysłać. Seed nie dodaje zaproszeń do cyklu Piotra. Ewa ma jedno potwierdzone zaproszenie na rozmowę oceniającą w przeszłości, żeby było widać stan.

## What We're NOT Doing

- E-mail i integracja z kalendarzem urzędu (dane nie wychodzą z komputera).
- Zmiany w przewodniku pokazu.

## Phase 1: Zaproszenie, potwierdzenie, plik kalendarza

### Success Criteria

#### Automated Verification
- `bun test src/routes/invitations.test.ts`:
  - Marek zaprasza Piotra (9.12.2024, `opening`): zdarzenie, karta u Piotra z tematami z § 5;
  - `.ics` 200 z `text/calendar`, `BEGIN:VEVENT`, `DTSTART;TZID=Europe/Warsaw:20241212T100000`, CRLF;
  - Piotr potwierdza → stan u Marka;
  - data po granicy § 7 daje ostrzeżenie i zapisuje się;
  - oceniany nie może wysłać zaproszenia (403);
  - nowe zaproszenie unieważnia poprzednie;
  - brak słowa „podpis”.
- `bun test` zielony (w tym przewodnik i automat pokazu), `bun run seed` bez błędu, `wrangler deploy --dry-run` przechodzi.

#### Manual Verification
- Plik `.ics` otwiera się w kalendarzu macOS z właściwą godziną. Ekrany przy 1440 i 360 px.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Zaproszenie, potwierdzenie, plik kalendarza

#### Automated

- [x] 1.1 Testy zaproszeń przechodzą: `bun test src/routes/invitations.test.ts` — 5e633d6
- [x] 1.2 Cały zestaw, dane pokazowe i wersja Cloudflare: `bun test`, `bun run seed`, `wrangler deploy --dry-run` — 5e633d6

#### Manual

- [ ] 1.3 `.ics` w kalendarzu macOS i ekrany przy 1440 i 360 px
