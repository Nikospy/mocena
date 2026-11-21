# Oś czasu, nieobecności i zmiana oceniającego — Plan Brief

> Full plan: `context/changes/timeline-and-absences/plan.md`. Nazwy: rozdział „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`.

## What & Why

Krok 3 pokazu: kadry (Joanna, data systemowa 10.11.2026) wpisują nieobecność ocenianego Piotra z `/hr` przez „Wpisz nieobecność”, dwa wpisy z osi czasu, i widzą jedną nieobecność 05.10–06.11.2026 (33 dni) połączoną przez dni wolne, dłuższą niż miesiąc, z terminem przedłużonym z 27.11.2026 na 30.12.2026. Plaster dodaje też oś czasu cyklu z przepisem i wersją reguł przy każdej dacie, zmianę oceniającego zachowującą kryteria (§ 9 ust. 3 rozporządzenia) oraz przypomnienia przy przesuwaniu daty systemowej. Plaster jest budowany jako ostatni i wypada pierwszy, gdy zabraknie czasu (decyzja 10h).

## Starting Point

F-01 daje silnik terminów (`src/engine/deadlines.ts`: `nextAssessmentDeadline`, `periodEndAfterNegative`, `criteriaTalkDeadline`), tabele `people`, `cycles`, `cycle_criteria`, `events`, `settings`, funkcje `today()`, `visibleEvents`, `effectiveDeadline(cycleId, { asOf })` (zwraca `{ date, basis }`), `registerHomeTasks`, `registerCycleLinks`, konta, układ i cykle ze zdarzeniami `cycle_started`. Plik reguł nie ma progu nieobecności (art. 81 ust. 7 ustawy) ani § 9 ust. 3 (zmiana oceniającego). Brakuje tabeli `absences`, osi czasu, formularzy kadr i łączenia nieobecności.

## Desired End State

- Joanna wpisuje dwie nieobecności Piotra; oś pokazuje jedną nieobecność 05.10.2026–06.11.2026 (33 dni), dopisek „dłużej niż miesiąc”, termin bazowy 27.11.2026 i nowy termin 30.12.2026, przy każdej dacie przepis, w stopce wersję reguł („Reguły 2016-470/1, obowiązują od 23.04.2016”).
- Ten sam termin 30.12.2026 pokazują `effectiveDeadline`, `/hr` i wydruk otwartego cyklu. Od widocznego `assessment_approved` oś i wydruk pokazują `AssessmentSnapshot.deadline`; nieobecność wpisana później się zapisuje, ale termin się nie zmienia.
- Piotr widzi nowy termin i jego podstawę, bez dat nieobecności i bez zmiany oceniającego.
- Oś Ewy: zmiana oceniającego 05.12.2024 („kryteria bez zmian, § 9 ust. 3”) i, od 28.08.2026, nieobecność 16.02–28.08.2026 z terminem 02.06.2027. Oceniający i oceniany widzą przypomnienie na ekranie startowym, gdy data systemowa wejdzie w okno przypomnienia.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Rodzaj nieobecności | brak; formularz ma tylko „od”, „do” i „usprawiedliwiona” | decyzja 10m | plan, „What We're NOT Doing” |
| Analiza nieobecności | brak sum, liczników i etykiet przy nazwisku; liczba dni tylko we wpisie nieobecności i w widoku kadr i oceniającego | zasada 7 w `AGENTS.md` | plan, „What We're NOT Doing”, pkt 6 |
| Termin oceny | nigdy nie zapisany w `cycles`; liczony za każdym razem przez `effectiveDeadline` | jedno źródło dla każdego ekranu | plan, „Implementation Approach” |
| Łączenie nieobecności | przez dni wolne (`isDayOff`) i styk; nieusprawiedliwiona nic nie łączy | art. 81 ust. 7 mówi o usprawiedliwionej | plan, pkt 2 w Phase 1 |
| Próg „dłużej niż miesiąc” | `addDays(to, 1) > addMonths(from, value)`, porównanie ścisłe | przykłady z końcem miesiąca w planie | plan, pkt 2 w Phase 1 |
| Zaokrąglenie | dzień roboczy raz, na końcu, po przedłużeniu | 14.03.2024 daje 16.04.2026, nie 20.04.2026 | plan, „Key Discoveries” |
| Ponowna ocena po negatywnej | nieobecność nie przedłuża terminu | FAQ DSC pyt. 19 | plan, pkt 2 w Phase 1 |
| Termin po zatwierdzeniu | `AssessmentSnapshot.deadline` z payloadu `assessment_approved` | zamrożony termin migawki | plan, pkt 6 w Phase 1 |
| Zmiana oceniającego | `cycle_criteria` nietknięte; w jednej transakcji zdarzenie i `cycles.appraiser_id` | § 9 ust. 3 | plan, pkt 4 w Phase 2 |
| Widoczność dla ocenianego | bez dat nieobecności i bez zmiany oceniającego | tabela dostępu w PRD | plan, „Desired End State” |
| Zapis | `recorded_on = today()`, bez wstecznego datowania | każdy zapis ma datę systemową | plan, „What We're NOT Doing” |
| Nieobecności wpisywane po zatwierdzeniu | zapisują się (303), cykl nadal otwarty | przed zapoznaniem cykl jest otwarty | plan, pkt 5 w Phase 1 |
| Termin przypomnienia | `assessmentReminderDays` = 30, oznaczone „ustawienie urzędu” | wartość nie wynika z przepisów | plan, pkt 1 w Phase 3 |
| Kolejność budowy | plaster ostatni; wypada pierwszy, gdy budowa nie zacznie się do 05:45 | decyzja 10h, koniec o 07:00 (decyzja 10g) | plan, „Overview” |

## Scope

**In scope:** łączenie nieobecności i próg, rozszerzone `effectiveDeadline` (z `cycleDeadlineDetails`), tabela `absences`, formularz kadr (wpis nieobecności), oś czasu z przepisem i wersją reguł, odnośniki w wierszu cyklu na `/hr`, dane Ewy (zmiana oceniającego i nieobecność), zmiana oceniającego z formularza, przypomnienia na ekranie startowym.

**Out of scope:** rodzaj nieobecności, analiza nieobecności, edycja i usuwanie wpisów, zmiana terminu przez oceniającego i wniosek ocenianego (FR-012, FR-013, stan w S-06), przedłużanie terminu ponownej oceny po negatywnej, nieobecności oceniającego i zastępstwa, wsteczne datowanie, zapis terminu w `cycles`, wygląd (tokeny i komponenty z design systemu autora).

## Architecture / Approach

Czysta funkcja na datach w `src/engine/absences.ts` (`mergeAbsences`, `isLongerThanMonth`, `assessmentDeadline`), rozszerzenie `src/cycles.ts` (`cycleDeadlineDetails`, `visibleAbsences`), oś w `src/timeline.ts` i widoku `src/views/timeline.tsx`, trasy `src/routes/absences.tsx`, `src/routes/timeline.tsx`, `src/routes/appraiser.tsx`, dane w `src/seed/absences.ts`, przypomnienia w `src/reminders.ts`. Trasy po udanym zapisie dają 303, błąd walidacji 422, brak uprawnień 403, zamknięty cykl 409. Oś nie ma etykiet przy nazwisku; składa się z semantycznej listy `<ol>` z `<time>`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Wersja minimalna (ok. 45 min) | silnik z testami, rozszerzone `effectiveDeadline`, tabela `absences`, formularz kadr, oś z połączoną nieobecnością, progiem, nowym terminem i przepisem, odnośniki na `/hr` | budowa nie zacznie się do 05:45: plaster wypada z pokazu (plan, „Overview”) |
| 2. Dane Ewy, cudze zdarzenia, zmiana oceniającego (ok. 20 min) | `appraiser_changed` na osi Marka, nieobecność Ewy, wpisy części I, oceny, zapoznania i fikcji, formularz zmiany oceniającego | wypada od dołu według kolejności cięcia; pkt 1 jest potrzebny do wersji 5-minutowej |
| 3. Przypomnienia (ok. 15 min) | `assessmentReminderDays` i pozycje listy spraw przy przesunięciu daty | wypada w całości jako pkt 5 kolejności cięcia |

**Prerequisites:** F-01, S-01, S-02, S-04, S-05 i S-06 (plan, „Current State Analysis”); nazwy z kontraktu, a przy rozjeździe obowiązuje kod.
**Estimated effort:** ok. 80 minut (45 + 20 + 15).

## Open Risks & Assumptions

- Kolejność cięcia: najpierw Phase 2 pkt 1 (zmiana oceniającego Ewy na osi), potem pkt 2–4, potem Phase 3. Łączenia przez dni wolne, wspólnego terminu w `effectiveDeadline` i ścieżki `/hr` → oś → drugi wpis nie tnie się.
- Open question (nie blokuje): nieobecność wykraczająca poza okres oceny. Rekomendacja: dni sprzed `period_start` się nie liczą, próg sprawdza całą nieobecność, nieobecność zaczęta po bieżącym surowym końcu nie przedłuża.
- Liczba dni oczekiwania i przypomnienia (`assessmentReminderDays`) to ustawienie urzędu, nie przepis.

## Success Criteria (Summary)

**Phase 1 (automatyczne):**
- `bun test src/engine` przechodzi.
- Przykład organizatora: dwa wpisy 05.10–16.10.2026 i 19.10–06.11.2026 dają jedną nieobecność 33 dni, `longerThanMonth: true`; termin 2026-12-30.
- Próg 31.01–27.02.2026 nie, 31.01–28.02.2026 tak; druga długa nieobecność w przedłużeniu przedłuża; 14.03.2024 i 33 dni dają 2026-04-16; termin ponownej oceny z `periodEndAfterNegative`.
- Po dwóch wpisach ten sam termin 30.12.2026 w `effectiveDeadline`, `GET /hr` i na osi; oś zawiera „05.10.2026–06.11.2026”, „dłużej niż miesiąc”, „art. 81 ust. 7” i wersję reguł.
- Ścieżka `/hr` → „Wpisz nieobecność” → oś → drugi wpis bez `/cycles/:id/part1`, `POST` 303; oceniany widzi 30.12.2026 bez dat i „33 dni”.
- Brak rodzaju nieobecności w tabeli, formularzu i zapisie; brak liczb i etykiet przy nazwisku.
- Po `assessment_approved` oś pokazuje 27.11.2026 z migawki; nieobecność zapisuje się (303) ze zdaniem o niezmienionym terminie; cykl zamknięty 409, walidacja 422.

**Phase 1 (ręcznie):** krok 3 pokazu na koncie Joanny (10.11.2026) i ten sam termin w wierszu Piotra na `/hr`.

**Phase 2 (automatyczne):**
- `bun run seed` wgrywa się bez błędu.
- Zmiana oceniającego Ewy: wpis z „§ 9 ust. 3” na koncie Marka, brak na koncie Ewy; `cycles.appraiser_id` Ewy = Marek.
- Nieobecność Ewy: 2026-08-27 niewidoczna, 2026-08-28 i 2026-08-29 widoczna, termin 2027-06-02.
- Zmiana oceniającego z formularza zostawia `cycle_criteria`, przenosi `appraiser_id` i dostęp; `POST` 303.

**Phase 2 (ręcznie):** oś Ewy na koncie Marka (zmiana oceniającego i nieobecność) i na koncie Ewy (tylko termin i podstawa).

**Phase 3 (automatyczne):** przy 2026-10-27 Marek nie ma przypomnienia o terminie Piotra, przy 2026-10-28 ma („27.11.2026”).

**Phase 3 (ręcznie):** przesunięcie daty na koncie administratora i konto Marka pokazuje przypomnienie z przepisem i dopiskiem „ustawienie urzędu”.
