# Stan cykli dla kadr, stopień obowiązkowy i wydruk arkusza — Plan Brief

> Full plan: `context/changes/hr-overview-and-print/plan.md`. Nazwy: rozdział „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`.

## What & Why

Krok 5 pokazu (`context/foundation/demo.md`). Joanna (kadry) widzi na `/hr` stan wszystkich cykli i kartę obowiązku stopnia służbowego Tomasza: termin 14.12.2026 z podstawą art. 89 ust. 2 ustawy, „To obowiązek, nie wniosek”. Są też stany uproszczone: sprzeciw Katarzyny Lewandowskiej, wniosek Anny o zmianę terminu, statystyki bez nazwisk. Każda uprawniona osoba (oceniany, oceniający, kadry) dostaje historię ocen, podgląd arkusza i druk z przeglądarki („Drukuj / pobierz PDF”). Plaster niesie 5 z 15 czynności liczonych jako „działa” (decyzja 4).

## Wersja minimalna

Faza 1, ok. 50 minut z łącznych ok. 80 minut dla jednego agenta. Zawiera: kartę stopnia Tomasza, tabelę stanów cykli (sprzeciw Katarzyny Lewandowskiej, wniosek Anny), podgląd arkusza ze stylem druku i pouczeniem, druk własnego egzemplarza przez ocenianego (część I i cały arkusz), historię ocen, odnośniki (`registerCycleLinks`, pozycja `registerHomeTasks` dla kadr) oraz dane pokazowe `src/seed/assessments.ts`. Faza 1 to kompletny krok 5 pokazu. Nie wolno ciąć niczego z tej listy.

## Kolejność cięcia

Faza 2 powstaje w tej kolejności. Tniemy od dołu, więc pozycja 1 wypada jako ostatnia.

1. Przycisk „Odnotuj przyznanie stopnia” (potrzebny do wersji 5-minutowej pokazu).
2. Wgrane poprzednie oceny Piotra i Ewy (bez nich historia działa tylko na Tomaszu).
3. Część III na arkuszu (bez niej zostaje pole „Czy dołączono wniosek o kolejny stopień”).
4. Blok statystyk bez nazwisk (bez niego zostaje zdanie „Statystyki: poza prototypem”).
5. Przyciski rozstrzygnięcia sprzeciwu.

## Starting Point

Zależności od wcześniejszych plastrów (nazwy z kontraktu):

- **F-01**: tabele `people` (`appointed`, `civil_service_grade`, `grade_awarded_on`), `cycles`, `cycle_criteria`, `events`, `settings`; `visibleEvents`, `effectiveDeadline`, `currentGrade`, `registerHomeTasks`, `registerCycleLinks`, `createTestApp`, `runSeed`; silnik `toWorkingDay`, `objectionDeadline`, `objectionReviewDeadline`, `criteriaTalkDeadline`.
- **S-01**: `savePart1`, `sheetForPosition`, `ConfirmationBlock` z wariantami `confirmation` i `fiction`, zdarzenia `part1_submitted` i `part1_confirmed`.
- **S-02**: `AssessmentSnapshot`, `buildAssessmentSnapshot`, `assessmentState`, zdarzenia `assessment_approved`, `assessment_acknowledged`, `acknowledgement_fiction`, klucz `approval.gradeRequest.maxGrade`.
- **S-04, S-05**: plan niczego z nich nie używa.
- **S-03**: nie jest potrzebny; plaster powstaje przed nim.

## Desired End State

Przy dacie systemowej 22.11.2026 `/hr` pokazuje kartę Tomasza (pole „Urzędnik” z jego nazwiskiem, termin 14.12.2026, „Stopień V → VI”), sprzeciw Katarzyny Lewandowskiej z rozpatrzeniem do 04.12.2026, wniosek Anny z podstawą art. 81 ust. 8 i zapoznanie Piotra ze sprzeciwem do 30.11.2026. Karta Tomasza pojawia się od 12.11.2026. Na `/hr` nie ma nazw poziomów ani słów „pozytywna” i „negatywna”. Arkusz ma pola w kolejności wzoru z zał. 2–4 rozporządzenia, pouczenie o sprzeciwie, „Potwierdzenie w systemie” i nigdzie słowa „podpis”.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Reguła stopnia | czysta funkcja `mandatoryGrade` w `src/engine/grades.ts`; liczby z pliku reguł | test bez bazy | plan, faza 1, zmiana 1 |
| Stan cyklu | tylko z `visibleEvents` | dane odsłaniane datą | decyzja 10i |
| Termin oceny | przed zatwierdzeniem `effectiveDeadline`, po nim `AssessmentSnapshot.deadline`; termin przekazany w części I z `part1_submitted.payload.dueDate` | jedno źródło na każdą sytuację | kontrakt, „Skąd ekran bierze termin oceny” |
| Nazwisko na karcie | w osobnym polu; treść mówi o obowiązku urzędu, bez poziomu | zasada 7 w `AGENTS.md` | plan, uwaga 18 |
| Wynik i poziom | tylko w historii ocen i na arkuszu | dokumenty dostępne z Access Control | plan, „Architecture” |
| Druk | `window.print()` i styl `public/print.css`, bez generatora PDF | decyzja 7 | plan |
| Odnośniki | tylko dla ról, które przepuszcza trasa `GET` | nie ma linku prowadzącego do 403 | kontrakt |
| Zamknięty cykl w `POST` | działa; 409 tylko dla własnych warunków trasy | zamknięty cykl to stan oczekiwany | plan, faza 2 |
| Termin 30 dni na sobotę | przechodzi na poniedziałek 14.12.2026 | jak pozostałe terminy w silniku | plan, pytanie 2 |
| Statystyki | blok na ekranie Joanny, bez nazwisk | brak konta dyrektora generalnego | plan, faza 2, zmiana 3 |

## Scope

**In scope:** karta stopnia z mocy prawa, tabela stanów cykli, historia ocen, podgląd arkusza i druk, styl druku, odnośniki na `/hr` i w wierszach cyklu, dane pokazowe `src/seed/assessments.ts`. Faza 2: przycisk odnotowania stopnia, poprzednie oceny Piotra i Ewy, część III, statystyki, rozstrzygnięcie sprzeciwu.

**Out of scope:** pełny obieg sprzeciwu, wniosku o zmianę terminu i decyzji o stopniu (roadmapa, „Parked”); generator PDF; wierność 1:1 ze wzorem; notatki na arkuszu i wydruku; oś czasu i nieobecności (S-03); wyszukiwanie i filtry; przypomnienie o stopniu dla oceniającej; style ekranu.

## Architecture / Approach

Trzy warstwy: reguła w silniku (`src/engine/grades.ts`), odczyt stanu z widocznych zdarzeń (`src/hr/`), trasy i widoki w Hono JSX na wspólnym układzie `src/views/layout.tsx`. Testy przez `app.request()` na `createTestApp({ today, seedOptions })`.

## Phases at a Glance

| Phase | What it delivers |
| --- | --- |
| 1. Wersja minimalna (ok. 50 min) | krok 5 pokazu w całości, dane pokazowe Tomasza, Katarzyny Lewandowskiej i Anny |
| 2. Dopełnienie (w kolejności cięcia) | przycisk odnotowania stopnia, poprzednie oceny Piotra i Ewy, część III, statystyki, rozstrzygnięcie sprzeciwu |

## Success Criteria (Summary)

**Faza 1, automatyczne:**
- `bun test src/engine/grades.test.ts`
- `bun test src/hr/cycle-state.test.ts`
- `bun run seed`
- `bun test src/routes/hr.test.ts src/routes/sheet.test.ts src/routes/history.test.ts`
- `bun test src/routes/hr-sheets.test.ts`

**Faza 1, ręcznie:** pełny przebieg kroku 5 przy 2026-11-22; wydruk arkusza Piotra z jego konta (A4, bez nawigacji, części od nowej strony, pouczenie, bez „podpis”); wydruk arkusza Tomasza z 12.11.2026 z „Dane poprzedniej oceny” z 12.11.2024.

**Faza 2, automatyczne:** `bun test src/routes/hr-actions.test.ts`; `bun test` w całości.

**Faza 2, ręcznie:** przy 2026-11-22 kliknięcie „Odnotuj przyznanie stopnia” usuwa kartę Tomasza, a historia i arkusz nadal się otwierają.

## Open Risks & Assumptions

Otwarte pytania z plan.md, każde z domyślnym rozstrzygnięciem, z którym implementacja idzie dalej:

- „Na jednym z dwóch najwyższych poziomów”: domyślnie każda z dwóch ocen na dowolnym z dwóch najwyższych poziomów.
- Termin w dzień wolny: domyślnie następny dzień roboczy.
- Data ostatniego stopnia i rok mianowania Tomasza (`2022-12-01`, `2016`) nie są w `demo.md`; domyślnie dane pokazowe.
- Poprzednie oceny Piotra i Ewy: domyślnie pozytywne, „na poziomie oczekiwań”.
- Powód wniosku Anny: domyślnie jeden z czterech powodów z art. 81 ust. 8, bez danych o zdrowiu; wybór przy budowie po sprawdzeniu przepisu w bazie wiedzy.
