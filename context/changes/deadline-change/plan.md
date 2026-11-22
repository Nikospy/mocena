# Zmiana terminu oceny i wniosek ocenianego — plan wdrożenia

## Overview

Plaster S-15 (decyzja 13i, czynności 16 i 19 z `docs/coverage.md`, FR-012). Dziś zmiana terminu i wniosek ocenianego są tylko stanem z wgranych danych Anny. Po tym plastrze:
- oceniający zmienia termin oceny w jednym z 4 przypadków ustawowych i drukuje pismo do ocenianego;
- oceniany składa wniosek o zmianę terminu;
- oceniający rozpatruje wniosek.

Wszystko widać na osi czasu, na stronie głównej, w kadrach i w arkuszu.

## Zasady (źródła: ustawa o służbie cywilnej, rozporządzenie z 2016 r., poradnik KPRM)

1. **Art. 81 ust. 8 ustawy.** Oceniający może zmienić termin z ust. 4 (podstawowy, 24 miesiące) w przypadku:
   - pkt 1: zmiany na stanowisku oceniającego;
   - pkt 2: przewidywanej, dłuższej, usprawiedliwionej nieobecności ocenianego, która może uniemożliwić przeprowadzenie oceny;
   - pkt 3: przewidywanej, dłuższej, usprawiedliwionej nieobecności oceniającego;
   - pkt 4: złożenia przez ocenianego wniosku o zmianę terminu.
2. **Warunek dla wszystkich 4 przypadków:** od sporządzenia ostatniej oceny minęło więcej niż 6 miesięcy, a przy ocenianym po raz pierwszy okres oceny jest dłuższy niż 6 miesięcy. Inaczej zmiana jest niedozwolona, a wniosek trzeba odrzucić z tą podstawą.
3. **§ 8 rozporządzenia:** oceniający niezwłocznie zawiadamia ocenianego na piśmie o nowym terminie. Kopię pisma dołącza się do arkusza.
4. **Wniosek ocenianego rozpatruje oceniający** (poradnik KPRM, rozdz. 5.2). Ustawa mówi „może”, więc to uznanie, nie obowiązek.
5. Zmiana dotyczy tylko terminu podstawowego, a **nie** oceny ponownej po negatywnej (art. 81 ust. 9). Formularz jest niedostępny w cyklu po ocenie negatywnej.
6. Przedłużenie o nieobecność z ust. 7 działa samo, bez pisma. Zostaje jak jest.
7. **Brak w źródłach**, przyjęte założenia (do raportu):
   - forma wniosku: pole uzasadnienia, wymagane;
   - termin rozpatrzenia wniosku: brak, sprawa wisi u oceniającego na stronie głównej;
   - kierunek zmiany: dowolny, ale nowy termin musi być późniejszy niż dziś;
   - nałożenie ust. 7 na termin zmieniony z ust. 8: zmieniony termin zastępuje termin bazowy, a nieobecności dłuższe niż miesiąc nadal go przedłużają;
   - nowy termin wypadający w dzień wolny przechodzi na dzień roboczy (`toWorkingDay`).

## Desired End State

1. **Oceniający (Marek):** w cyklu Piotra i Ewy odnośnik „Zmień termin oceny”. Formularz `/cycles/:id/deadline-change`:
   - wybór przypadku 1–4 z pełnym brzmieniem w głosie „reguła”;
   - nowy termin z datą słownie;
   - uzasadnienie.

   Przy niespełnionym warunku 6 miesięcy formularz jest zablokowany i wyjaśnia dlaczego (pigułka art. 81 ust. 8). Po zapisie: zdarzenie `deadline_changed` (przypadek, stary termin, nowy termin, uzasadnienie) i przekierowanie do pisma.
2. **Pismo** `/cycles/:id/deadline-change/:eventId/letter`:
   - widok do druku w stylu arkusza (`print.css`);
   - urząd, miejscowość i data, oceniany, treść „Zawiadamiam o zmianie terminu sporządzenia oceny okresowej z … na …”, podstawa (art. 81 ust. 8 pkt N ustawy i § 8 rozporządzenia), oceniający;
   - miejsce na potwierdzenie odbioru (słowo „potwierdzenie”, nie „podpis”);
   - przycisk „Drukuj / pobierz PDF”.

   Arkusz (`sheet.tsx`) wymienia pismo jako załącznik z datą.
3. **Oceniany (Piotr, Ewa, Anna):** na stronie oceny i na stronie głównej odnośnik „Wnioskuj o zmianę terminu”, gdy warunek 6 miesięcy jest spełniony i nie ma wniosku w toku. Formularz z uzasadnieniem → zdarzenie `deadline_change_requested`. Oceniany widzi stan „Wniosek z 5.10.2026 czeka na decyzję oceniającego”.
4. **Rozpatrzenie:** oceniający dostaje sprawę na stronie głównej „Wniosek o zmianę terminu: <osoba>”.
   - „Zmień termin” otwiera formularz z przypadkiem 4 i treścią wniosku.
   - „Odrzuć” wymaga powodu → zdarzenie `deadline_change_rejected`.

   Oceniany widzi decyzję.
5. **Silnik:** `effectiveDeadline` i `cycleDeadlineDetails` uwzględniają ostatnie `deadline_changed`; podstawa zawiera art. 81 ust. 8 pkt N. Baner „Termin przesunięty z … na …” (`src/deadline-shift.ts`) obsługuje też ten przypadek. Oś czasu ma wpisy: wniosek, zmiana z odnośnikiem do pisma, odrzucenie.
6. **Kadry:** stan „wniosek o zmianę terminu” w `/hr` (`src/hr/cycle-state.ts`) wynika z prawdziwych zdarzeń. Wgrany wniosek Anny staje się zdarzeniem `deadline_change_requested` w seedzie, więc stan dalej jest widoczny, a teraz da się go rozpatrzyć.
7. Reguły (przypadki 1–4, warunek 6 miesięcy, § 8) są w `rules/regulation-2016-470.json` jako jedno źródło. Widoki biorą tekst stamtąd.

## What We're NOT Doing

- Wysyłka pisma mailem (dane nie wychodzą z komputera).
- Zmiana terminu oceny ponownej po negatywnej.

## Phase 1: Zmiana terminu, pismo, wniosek i rozpatrzenie

### Success Criteria

#### Automated Verification
- `bun test src/routes/deadline-change.test.ts`:
  - zmiana przez Marka w cyklu Piotra (21.11.2026, przypadek 2) zmienia `effectiveDeadline`, dodaje wpis osi czasu i daje pismo 200 z podstawą i bez słowa „podpis”;
  - warunek 6 miesięcy blokuje zmianę w cyklu, w którym od ostatniej oceny minęło mniej (422 z uzasadnieniem);
  - oceniany nie może zmienić terminu (403);
  - wniosek Piotra → sprawa u Marka → odrzucenie z powodem → Piotr widzi decyzję;
  - wniosek → przyjęcie z przypadkiem 4 → nowy termin;
  - arkusz wymienia pismo;
  - w cyklu po ocenie negatywnej formularz jest niedostępny.
- `bun test` zielony (w tym `src/demo-check/run.test.ts` i `src/tour/state.test.ts`), `bun run seed` bez błędu, `wrangler deploy --dry-run` przechodzi.

#### Manual Verification
- Przejście w przeglądarce przy 1440 i 360 px: formularz, pismo (podgląd druku), wniosek i rozpatrzenie.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Zmiana terminu, pismo, wniosek i rozpatrzenie

#### Automated

- [x] 1.1 Testy zmiany terminu przechodzą: `bun test src/routes/deadline-change.test.ts` — f58b23d
- [x] 1.2 Cały zestaw, dane pokazowe i wersja Cloudflare: `bun test`, `bun run seed`, `wrangler deploy --dry-run` — f58b23d

#### Manual

- [ ] 1.3 Przejście w przeglądarce przy 1440 i 360 px
