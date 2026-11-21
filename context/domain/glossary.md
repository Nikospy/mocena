---
artifact: domain-glossary
created: 2026-11-21
source: context/foundation/decisions.md, prd.md, demo.md; context/changes/rules-engine-and-demo-data/plan.md (rozdział „Kontrakt wspólny dla wszystkich plastrów”) i plany S-01–S-06
---

# Słownik: mOcena

Tych słów używasz w kodzie, testach, commitach i rozmowie. Słowo na ekranie jest po polsku, nazwa w kodzie po angielsku i pochodzi z kontraktu wspólnego albo z planu plastra, który ją udostępnia. Gdy kod F-01 nazwie coś inaczej niż kontrakt, wygrywa kod, a rozjazd trafia do `## Progress` planu. „Brak w kontrakcie” znaczy: nikt jeszcze nie nadał nazwy; nie wymyślaj jej bez autora.

Plastry: F-01 `rules-engine-and-demo-data`, S-01 `cycle-start-criteria`, S-02 `assessment-and-confirmation`, S-03 `timeline-and-absences`, S-04 `notes-and-justification`, S-05 `hr-partner-question`, S-06 `hr-overview-and-print`.

## Ludzie i role

| Słowo na ekranie | Znaczenie | Nazwa w kodzie | Nie nazywaj tego |
|---|---|---|---|
| oceniający | Osoba, która w danym cyklu wyznacza kryteria, wystawia i zatwierdza ocenę; w cyklu jest jedna naraz. | `cycles.appraiser_id`; rola `appraiser` | „ewaluator”, „recenzent”; `assessor_id`, `evaluator`, `reviewer_id`, `manager_id` |
| oceniany | Osoba, której dotyczy cykl oceny. | `cycles.person_id`; w notatce `notes.subject_id`; w payloadzie `appraiseeName` | `employee_id`, `appraisee_id`, `evaluatee` |
| przełożony | Osoba z podległości służbowej; decyduje o notatkach o podwładnym bez cyklu i o zdaniach „O Marii nie masz…”. | `people.supervisor_id` | „oceniający” (to rola w cyklu), `manager_id`, `boss_id` |
| kadry | Komórka kadrowa: wpisuje nieobecności i zmianę oceniającego, widzi stan cykli i wpis o fikcji. | rola `hr`; ekran `GET /hr` | „HR partner” (to moduł asystenta), `admin` |
| administrator | Konto ekranu „Skąd biorą się podpowiedzi” i daty systemowej. | rola `admin` | „kadry” |
| dyrektor generalny urzędu | Adresat sprzeciwu i oceniający w cyklu Anny; widzi statystyki bez nazwisk. Nie ma konta. | wiersz `people` bez konta (`has_account = 0`) wgrany przez `src/seed/base.ts`; adresat w `objection_filed.payload.to`; `cycles.appraiser_id` cyklu Anny | „kierownik urzędu” (to arkusz A i adresat sprzeciwu tylko przy arkuszu A) |
| urzędnik mianowany | Członek korpusu z mianowaniem; tylko on ma stopnie służbowe i wniosek o stopień. | `people.appointed = 1`, `people.appointed_year` | „pracownik mianowany”; `is_official` |
| pracownik służby cywilnej | Zatrudniony bez mianowania; wniosek o stopień „nie dotyczy”. | `people.appointed = 0` | „urzędnik” |
| HR partner | Moduł asystenta na regułach: pytanie po notatce, „Przed rozmową”, docenienie. Nie jest osobą ani modelem. | `src/hr-partner/`, trasy S-05 | „AI”, „chatbot”, „asystent AI”; `hr` (to rola kadr) |
| konto | Wybór osoby pokazowej, bez hasła. | `currentPerson(c)`, `GET/POST /account` | „logowanie”, `user`, `login` |

## Cykl i część I

| Słowo na ekranie | Znaczenie | Nazwa w kodzie | Nie nazywaj tego |
|---|---|---|---|
| cykl oceny | 24 miesiące od początku okresu do terminu oceny (art. 81 ust. 4 ustawy). | `cycles`; początek `cycle_started` | „kampania”; `review`, `appraisal` |
| bieżący (otwarty) cykl | Widoczny cykl osoby bez zapoznania z oceną i bez fikcji zapoznania; gdy jest ich kilka, najpóźniejszy. Tylko do niego trafiają nowe notatki i zapisy. | `openCycle(personId)` | „pierwszy widoczny cykl”, „aktywny cykl”; `currentCycle`, `activeCycle` |
| powód rozpoczęcia cyklu | Zatrudnienie na czas nieokreślony, mianowanie albo poprzednia ocena. | `cycle_started.payload.reason`: `hired`, `appointed`, `previous_assessment` | `trigger`, `type` |
| początek okresu oceny | Dzień, od którego liczy się 24 miesiące (Piotr: 27.11.2024). | `cycles.period_start`, `periodStart`; w migawce `periodFrom` | „dzień rozmowy”; `start_date` |
| poprzednia ocena | Dzień jej sporządzenia, dzień zapoznania i wynik. | `previousAssessmentOn`, `previousAcknowledgedOn`, `previousOutcome` w `cycle_started` | — |
| arkusz A / B / C | Wzór oceny według rodzaju stanowiska (§ 3 ust. 2–4 rozporządzenia). | `cycles.sheet`, `sheetForPosition(kind)` | „formularz”, „szablon”; `form`, `template` |
| rodzaj stanowiska | Kierownik urzędu, bezpośrednie kierowanie ludźmi albo pozostałe. | `people.position_kind`: `head_of_office`, `manager`, `staff` | „stanowisko” (nazwa to `people.position_title`) |
| rodzaj obowiązku | Pozycja z zamkniętej listy przy stanowisku; źródło podpowiedzi kryterium. | `people.duty_types`; `dutyTypes` w `rules/office-settings.json` | „słowo kluczowe”, „tag” |
| kryterium obowiązkowe | Kryterium narzucone przez arkusz (§ 4): 6 w A, po 5 w B i C. | `cycle_criteria.kind = 'mandatory'`, `mandatoryCriteria(sheet)` | „kompetencja” |
| kryterium dodatkowe | Od 0 do 3 kryteriów wybranych przez oceniającego, bez powtórzeń i bez obowiązkowych. | `kind = 'additional'`, `selectableCriteria`, `validateAdditionalCriteria` | „opcjonalne”, „własne” |
| identyfikator kryterium | Dana z pliku reguł, po polsku (np. `orientacja-na-klienta`). | `criterion_id`, `criterion(id)` | tłumaczenie na angielski |
| podpowiedź kryterium | Kryterium z tabeli „rodzaj obowiązku → kryterium” ze zdaniem „bo w opisie stanowiska jest obowiązek: …”; nic nie jest zaznaczone z góry. | `suggestCriteria(sheet, dutyTypeIds)`, `dutyToCriterion` | „rekomendacja AI” |
| oczekiwanie | Tekst oceniającego, jak oceniany ma spełniać kryterium (§ 5 ust. 1). | `cycle_criteria.expectation` | „cel” |
| cele | Temat 4 rozmowy o kryteriach; bez osobnego pola. | brak w kontrakcie | „oczekiwanie” |
| rozmowa o kryteriach (rozmowa rozpoczynająca) | Rozmowa z czterema tematami z § 5 ust. 1. | `GET /cycles/:id/cards/opening`, `card('opening')`, `criteriaConversation` | „onboarding”, „spotkanie” |
| część I | Arkusz, kryteria, oczekiwania, termin oceny i dwa potwierdzenia. | `part1Status(cycleId)`, `cycleCriteria(cycleId)` | „umowa celów” |
| przekazanie części I | „Potwierdzam rozmowę i przekazuję część I”; od tej chwili część I jest zablokowana. | `part1_submitted`, `submitPart1`, `isPart1Locked` | „wysłanie do podpisu” |
| „Część I czeka na potwierdzenie od X dni” | Stan bez terminu i bez wyjścia (decyzja 10d). | `part1Status().waitingDays`, `waitingDaysText`; krok `part1_waiting` | „zaległość pracownika” |
| termin rozmowy o kryteriach | 30 dni od poprzedniej oceny (§ 7 pkt 1), 7 dni po negatywnej (§ 7 pkt 2). | `criteriaTalkDeadline(from, afterNegative)` | — |

## Ocena i wynik

| Słowo na ekranie | Znaczenie | Nazwa w kodzie | Nie nazywaj tego |
|---|---|---|---|
| ocena cząstkowa | 1, 3, 5, 7 albo 9 przy kryterium; stawia ją tylko oceniający. | `AssessmentDraft.scores`, pole `score[<criterionId>]`, `criteria[].score` | „punktacja”, „rating” (`rating` to pole notatki) |
| średnia | Średnia arytmetyczna ocen cząstkowych, bez zaokrąglania. | `result.mean` | — |
| poziom ogólny | Przedział średniej: od „znacznie poniżej oczekiwań” do „znacznie powyżej oczekiwań”. | `result.overallLevel` | „ocena”, „wynik” |
| ocena pozytywna / negatywna | Wynik: negatywna, gdy średnia nie przekracza 4 albo choć jedna ocena cząstkowa to 1 (§ 11 ust. 1 rozporządzenia). | `result.outcome`: `positive`, `negative` | `passed`, `score`, „zaliczona” |
| uzasadnienie | Tekst oceniającego; wymagany przy ocenie negatywnej (§ 11 ust. 3). Nad polem: „Ten tekst przeczyta pracownik”. | `justification`, `result.justificationRequired` | „opis wygenerowany” |
| wnioski do indywidualnego programu rozwoju zawodowego | Zawsze wymagane (art. 81 ust. 5 ustawy). | `developmentConclusions` | „rekomendacje”, `ipr`, `devPlan` |
| rozmowa oceniająca | Rozmowa z trzema tematami z § 10 przed zatwierdzeniem. | `interviewDate`, `GET /cycles/:id/cards/assessment-conversation`, `assessmentConversation` | — |
| szkic oceny | Stan po „Zapisz”; ostatni szkic wygrywa. | `assessment_draft_saved`, `AssessmentDraft` | „wersja robocza notatek” |
| zatwierdzenie oceny | „Zatwierdź ocenę”: zapis migawki z wynikiem, terminem z dnia zatwierdzenia (odtąd zamrożonym) i wersją reguł. | `assessment_approved`, `AssessmentSnapshot`, `buildAssessmentSnapshot(cycleId, draft, { asOf })` | „podpisanie”, „finalizacja”; `submitted`, `signed` |
| blokada zatwierdzenia | Brak pola, którego wymaga przepis; komunikat z podstawą. | `approvalBlockers(input)`, `Blocker { field, message, basis }` | „walidacja AI” |
| etap oceny | Miejsce oceny w procesie, liczone ze zdarzeń. | `assessmentState().stage`: `no_part1`, `draft`, `approved`, `acknowledged`, `fiction` | kolumna `status` (nie istnieje) |
| ostrzeżenie „fakty tylko z ostatniego miesiąca” | Wszystkie notatki przy kryterium są z ostatniego miesiąca; nie blokuje. | `criterionWarnings` → `recent_only`; drugi rodzaj `extreme_without_facts` | „błąd”, „blokada” |

## Potwierdzenie, zapoznanie i fikcja

| Słowo na ekranie | Znaczenie | Nazwa w kodzie | Nie nazywaj tego |
|---|---|---|---|
| potwierdzenie | Kliknięcie na własnym koncie; system wpisuje miejscowość, datę i nazwisko, pola się blokują (decyzja 5a, 11b). | `ConfirmationBlock` z S-01, od początku z dwoma wariantami: `kind: "confirmation"` (`name, place, date`) i `kind: "fiction"` (`name, reason, deliveryMethod, deliveredOn, date`); `place` z `settings.office_city` | „podpis”, „e-podpis”; `signature`, `signed_at`, `sign` |
| potwierdzenie części I | Oceniany potwierdza rozmowę, kryteria i termin (§ 6 ust. 2). | `part1_confirmed { place, appraiseeName }`, `confirmPart1` | „akceptacja kryteriów”, „zgoda” |
| zapoznanie z oceną | Oceniany potwierdza zapoznanie z oceną i wnioskami (§ 12). | `assessment_acknowledged { place, date, name, objectionDeadline }` | „akceptacja oceny”, „podpisanie oceny”; `accepted` |
| fikcja zapoznania | Wpis oceniającego, gdy oceniany „nie mógł” albo „nie chciał” potwierdzić; urząd przyjmuje dzień wpisu jako dzień zapoznania. | `acknowledgement_fiction`; `reason`: `could_not`, `would_not` | „domniemane zapoznanie”, „automatyczne zapoznanie”, „odmowa podpisu”; `auto_ack` |
| doręczenie kopii arkusza | Jak i kiedy oceniający doręczył kopię (§ 12 ust. 2); warunek wpisu fikcji. | `deliveryMethod`: `in_person`, `post`, `email`; `deliveredOn` | — |
| sprzeciw | Środek ocenianego do dyrektora generalnego w 7 dni od zapoznania (art. 83 ust. 1). | `objection_filed { to }` | „odwołanie”, „reklamacja” |
| termin sprzeciwu (zegar) | Data liczona raz, przy zapoznaniu albo fikcji, i odtąd czytana z payloadu. | `objectionDeadline`, `ObjectionClock` | „termin biegnie” |
| rozpatrzenie sprzeciwu | 14 dni (art. 83 ust. 3): zmiana oceny, ponowne sporządzenie albo nieuwzględniony. Kadry wpisują je po zamknięciu cyklu. | `objection_resolved.outcome`: `changed`, `redone`, `rejected`; `objectionReviewDeadline` | — |
| odwołanie do sądu pracy | Krok po sprzeciwie (art. 83 ust. 5); tylko termin w silniku. | `courtAppealDeadline` | „sprzeciw” |

## Notatki, informacja zwrotna i HR partner

| Słowo na ekranie | Znaczenie | Nazwa w kodzie | Nie nazywaj tego |
|---|---|---|---|
| notatka | Fakt zapisany przez przełożonego przy kryterium; widzi ją tylko autor (`notes.author_id`), także po zmianie oceniającego; pracownik nie widzi jej na swoim koncie. Można ją pisać przed potwierdzeniem części I i o osobie bez cyklu. | `notes`, `addNote`, `noteById(id)`, `notesForCycle`, `notesAbout`, `notesByAuthor` | „notatka prywatna”, „dziennik”, „ocena bieżąca” |
| data faktu | Dzień, którego dotyczy notatka; decyduje o widoczności. | `notes.date` | `created_at` (to dzień kliknięcia „Zapisz notatkę”) |
| „dobrze / do poprawy” | Pole notatki wypełniane wyłącznie przez przełożonego (decyzja 3). | `notes.rating`: `good`, `needs_improvement` | „ocena notatki”, „sentyment”; `score` |
| „Zmiana zadań pracownika” | Pole przy notatce; zapisuje się wybór człowieka, podpowiedź obok. | `notes.task_change`; `suggested_task_change`, `suggestion_source` | „wykryta zmiana”, „sygnał” |
| lista słów | Ustawienie urzędu, które tylko wstępnie zaznacza pole. | `taskChangeWords` | „model”, „NLP” |
| podpowiedź (adapter) | Jedno wymienne miejsce na podpowiedzi; dostaje tekst bez nazwisk. | `src/suggestions/index.ts`, `suggestForNote`, `suggestionMode()`: `rules`, `local-model`, `none` | „AI”, „model językowy” |
| „To stała zmiana zadań?” | Jedno pytanie zamknięte po notatce z zaznaczonym polem; odpowiada tylko autor notatki (inne konto: 403). | `task_change_answered { noteId, answer, developmentFormId }`, `GET/POST /notes/:noteId/task-change` | „alert”, „ryzyko” |
| forma rozwoju | Pozycja z katalogu (ustawienie urzędu) pokazana po „Tak”. | `developmentForms`, `developmentFormId`, `pickDevelopmentForm` | „szkolenie zalecone przez AI” |
| informacja zwrotna | Poprawiony tekst notatki wysłany przez autora notatki przyciskiem „Przekaż pracownikowi”; oceniany ją widzi. Cudza notatka: 403, notatki nie ma: 404. | `feedback_messages`, `sendFeedback`, `lastFeedbackDate`, `GET /feedback` | „udostępniona notatka”, `shared_note` |
| „Wstaw do uzasadnienia” | Dopisuje zaznaczone notatki z datą do pola; nic nie zapisuje. | `formatNoteForInsert`, slot `justificationTools` | „generuj uzasadnienie” |
| „Przed rozmową z pracownikiem” | Zestawienie własnych wpisów przełożonego z pytaniem albo działaniem przy każdej pozycji. | `GET /cycles/:id/before-meeting`, `beforeMeetingSummary` | „raport o pracowniku”, „analiza ryzyka” |
| docenienie | Przypomnienie po czasie bez informacji zwrotnej i karta. | `GET /cycles/:id/appreciation`, `appreciationReminderDays` | „motywowanie” |
| „Skąd biorą się podpowiedzi” | Ekran administratora z sześcioma miejscami na model i listą „Czego model nigdy nie robi”. | `GET /admin/suggestion-sources` | — |

## Czas: terminy, nieobecności, oś czasu

| Słowo na ekranie | Znaczenie | Nazwa w kodzie | Nie nazywaj tego |
|---|---|---|---|
| data systemowa | „Dziś” w aplikacji; prowadzący przesuwa ją tylko do przodu. | `today()`, `settings.demo_date`, `POST /demo/date` | `new Date()`, „data serwera” |
| data zdarzenia | Dzień zapisany przy wierszu; z ekranu zawsze `today()`, w danych pokazowych i przygotowaniu testów jawna. | `events.date`; `recordEvent(type, cycleId, actorId, payload)`, `seedEvent(type, cycleId, actorId, payload, date)` (nigdy w trasach) | `created_at` |
| odsłanianie | Ekrany pokazują tylko zdarzenia, notatki i nieobecności z datą nie późniejszą niż data systemowa. Jawną datę `asOf` podają tylko moduły danych pokazowych, testy i `savePart1`. | `visibleEvents(cycleId, { asOf })`, `visibleEventsOfType(type)` | „ukryte dane” |
| termin oceny | Dzień, do którego trzeba sporządzić ocenę. Nie jest zapisany w `cycles`; ekran bierze go z jednego z trzech źródeł: przed zatwierdzeniem oceny liczony, po widocznym `assessment_approved` zamrożony w migawce (późniejsza nieobecność go nie zmienia). | przed zatwierdzeniem `effectiveDeadline(cycleId)` → `{ date, basis }`; po zatwierdzeniu `AssessmentSnapshot.deadline` | `cycles.deadline`, `due_date` |
| termin przekazany w części I | Migawka terminu z dnia przekazania; pokazuje go ekran części I po przekazaniu i wydruk części I. | `part1_submitted.payload.dueDate`, `dueDateBasis` | „termin oceny” (bieżący) |
| okres oceny (od–do) | Okres podlegania ocenie na arkuszu. | `periodFrom`, `periodTo` w migawce | — |
| nieobecność | Tylko daty i to, czy jest usprawiedliwiona (decyzja 10m). | `absences`, `excused`, `absence_recorded { absence_id, notified }` | „zwolnienie lekarskie”, „L4”, „urlop”; `absence_type`, `kind` |
| ciągła nieobecność | Wpisy rozdzielone samymi dniami wolnymi liczone jako jedna. | `mergeAbsences` → `MergedAbsence` | „suma nieobecności” |
| „dłużej niż miesiąc” | Próg, od którego nieobecność przedłuża termin (art. 81 ust. 7). | `isLongerThanMonth`, `longAbsenceOverMonths` | — |
| dzień wolny / następny dzień roboczy | Termin kończący się w dzień wolny przechodzi na następny dzień roboczy. | `isDayOff`, `toWorkingDay` | — |
| ponowna ocena po negatywnej | 6 miesięcy od zapoznania z oceną negatywną (art. 81 ust. 9); nieobecność jej nie przedłuża. | `periodEndAfterNegative`, `CycleKind = 'after_negative'` | — |
| zmiana oceniającego | Kadry wskazują nowego oceniającego; kryteria zostają (§ 9 ust. 3). | `appraiser_changed { from_id, to_id }`, `GET/POST /cycles/:id/appraiser` | „przekazanie notatek” |
| zmiana terminu oceny przez oceniającego | Przypadki z art. 81 ust. 8; w prototypie tylko zdanie na ekranie kadr (decyzja 11d). | brak w kontrakcie | „przesunięcie przez nieobecność” |
| wniosek ocenianego o zmianę terminu | Stan uproszczony, powód z zamkniętej listy art. 81 ust. 8. | `due_change_requested { requestedDate, reason }` | — |
| zmiana stanowiska | Zmiana z istotną zmianą obowiązków; wymaga nowej rozmowy o kryteriach albo oceny (art. 81 ust. 6, § 9 ust. 1–2). System jej nie rozstrzyga. | brak w kontrakcie | „zmiana zadań” |
| oś czasu | Wszystkie daty cyklu z przepisem i wersją reguł; widok zależy od roli. | `GET /cycles/:id/timeline`, `buildTimeline` | „historia ocen” |
| przypomnienie o terminie oceny | Pozycja listy spraw na określoną liczbę dni przed terminem (ustawienie urzędu). | `assessmentReminderDays` | „alarm” |

## Stopnie służbowe

| Słowo na ekranie | Znaczenie | Nazwa w kodzie | Nie nazywaj tego |
|---|---|---|---|
| stopień służbowy | Stopień urzędnika mianowanego, od I do IX. | `people.civil_service_grade`, `currentGrade(personId, { asOf })` → `{ grade, awardedOn }` | „ranga”, „awans”; `level` |
| data ostatniego stopnia | Od niej liczą się dwie kolejne oceny. | `people.grade_awarded_on`, `currentGrade().awardedOn` | — |
| stopień z mocy prawa | Obowiązek urzędu po dwóch kolejnych ocenach pozytywnych na dwóch najwyższych poziomach, w 30 dni od zapoznania (art. 89 ust. 2). Przyznanie odnotowuje się po zamknięciu cyklu. | `mandatoryGrade`, `mandatoryGradeDeadline`, `mandatory_grade_awarded`, `POST /hr/grades/:personId` | „wniosek”, „nagroda”, „premia” |
| wniosek o kolejny stopień | Dołączany do oceny przez oceniającego, z umotywowaniem (§ 11 ust. 5, art. 89 ust. 1). | `gradeRequest { attached, motivation, targetGrade }`, `gradeRequestOptions` → `not_applicable`, `no_only`, `yes_or_no` | „stopień z mocy prawa” |

## Reguły, ustawienia i widoki wspólne

| Słowo na ekranie | Znaczenie | Nazwa w kodzie | Nie nazywaj tego |
|---|---|---|---|
| wersja reguł | Plik przepisów z wersją i datą obowiązywania (2016-470/1, od 23.04.2016); ocena pamięta swoją. | `rules/regulation-2016-470.json`, `rulesVersion()` → `{ version, effectiveFrom, act }`; ten sam cały obiekt w `part1_submitted.payload.rulesVersion` i w migawce oceny | „konfiguracja” |
| ustawienie urzędu | Wartość wymyślona przez nas, nie z przepisów; na ekranie zawsze z tym dopiskiem. | `rules/office-settings.json`, `officeSettings()`, klucz `label` | „przepis”, „wymóg prawny” |
| podstawa prawna | Przepis obok każdej daty i każdego wyniku. | `basis`, `LegalBasis` | — |
| miejscowość, nazwa urzędu | Dane do potwierdzeń i arkusza. | `settings.office_city`, `settings.office_name` | — |
| lista spraw | Ekran startowy z pozycjami dopisywanymi przez plastry. | `homeTasks(person)`, `registerHomeTasks(fn)` | „powiadomienia”, „inbox” |
| stan cyklu | Krok procesu na ekranie kadr, zdaniem o procesie, nie o osobie. | `cycleState(cycleId).step` | „status pracownika” |
| arkusz (podgląd, „Drukuj / pobierz PDF”) | Wszystkie pola w kolejności wzoru; druk z przeglądarki. | `GET /cycles/:id/sheet`, `sheetData`, `canViewSheet`, `public/print.css` | „eksport PDF” |
| historia ocen | Zatwierdzone oceny osoby ze wszystkich cykli. | `GET /people/:id/history`, `assessmentHistory` | „oś czasu” |

## Pary, które łatwo pomylić

1. **Oceniający a przełożony.** `cycles.appraiser_id` mówi, kto ocenia w tym cyklu i kto pisze notatki o osobie z cyklem; `people.supervisor_id` mówi tylko o podległości i decyduje o notatkach o osobie bez cyklu. Po zmianie oceniającego te dwie wartości mogą się różnić.
2. **Potwierdzenie części I a zapoznanie z oceną.** `part1_confirmed` zamyka początek cyklu (rozmowa, kryteria, termin, § 6 ust. 2); `assessment_acknowledged` zamyka ocenę i od niego system liczy 7 dni na sprzeciw (§ 12, art. 83 ust. 1).
3. **Zapoznanie a fikcja zapoznania.** Zapoznanie klika oceniany na swoim koncie; fikcję wpisuje oceniający z powodem i doręczeniem kopii. Zdarza się dokładnie jedno z nich.
4. **Notatka a informacja zwrotna.** Notatka (`notes`) zostaje u autora; informacja zwrotna (`feedback_messages`) to osobny, poprawiony tekst, który widzi oceniany.
5. **Początek okresu, dzień rozmowy o kryteriach, termin oceny.** `cycles.period_start` (27.11.2024) liczy 24 miesiące; dzień rozmowy to data zdarzenia `part1_submitted` (9.12.2024); termin ma trzy źródła: przekazany w części I `part1_submitted.payload.dueDate` (27.11.2026), bieżący przed zatwierdzeniem `effectiveDeadline(cycleId)` (po nieobecności 30.12.2026), po zatwierdzeniu `AssessmentSnapshot.deadline`.
6. **Ocena cząstkowa, poziom, wynik.** Ocena cząstkowa to punkt przy kryterium; poziom (`overallLevel`) to przedział średniej; wynik (`outcome`) to pozytywna albo negatywna. Poziom „powyżej oczekiwań” może iść z wynikiem negatywnym (jedna „1”).
7. **Zmiana zadań a zmiana stanowiska.** Zmianę zadań zaznacza przełożony przy notatce (`notes.task_change`) i cykl trwa; zmiana stanowiska to sprawa prawna (art. 81 ust. 6), której system nie rozstrzyga.
8. **Stopień z mocy prawa a wniosek o stopień.** Stopień z mocy prawa to obowiązek urzędu liczony przez system dla kadr (`mandatoryGrade`); wniosek to decyzja oceniającego dołączona do oceny (`gradeRequest`).
9. **Data systemowa a data zdarzenia.** `today()` to „dziś” pokazu; `events.date` to dzień, w którym coś się stało. Wgrane zdarzenia z przyszłości są niewidoczne, dopóki data systemowa ich nie minie.
10. **Data faktu a data zapisu notatki.** `notes.date` decyduje o widoczności i miejscu w okresie; `notes.created_at` mówi tylko, kiedy kliknięto „Zapisz notatkę”.
11. **Sprzeciw a odwołanie.** Sprzeciw idzie do dyrektora generalnego w 7 dni; odwołanie idzie do sądu pracy po rozpatrzeniu sprzeciwu.

## Nazwy techniczne, które każdy plaster pisze tak samo

| Rzecz | Nazwa w kodzie | Nie nazywaj tego |
|---|---|---|
| Zapis części I bez sprawdzania aktora (dane pokazowe) i ze sprawdzeniem (trasa) | `savePart1(cycleId, actorId, input, date)`, `submitPart1(cycleId, actorId, input)` | `createPart1`, `storePart1` |
| Złożenie migawki oceny (S-02, jedyne miejsce; woła je zatwierdzenie i moduł danych S-06) | `buildAssessmentSnapshot(cycleId, draft, { asOf })` | własny kod migawki w danych pokazowych |
| Bieżący stopień | `currentGrade(personId, { asOf })` → `{ grade, awardedOn }` | odczyt `people.civil_service_grade` wprost |
| Odczyt na jawną datę (tylko moduły danych pokazowych, testy i `savePart1`) | `visibleEvents(cycleId, { asOf })`, `effectiveDeadline(cycleId, { asOf })` | `allEvents`, pomijanie granicy daty |
| Zdarzenie z jawną datą (dane pokazowe i przygotowanie testów) | `seedEvent(type, cycleId, actorId, payload, date)` | `recordEvent` z datą, `seedEvent` w trasie |
| Notatka po identyfikatorze (S-04) | `noteById(id)` | zapytanie do `notes` w innym plastrze |
| Kody odpowiedzi tras | 303 po `POST`, który zapisuje; 200 po `POST`, który nic nie zapisuje (`POST /suggestions/note`, `POST /cycles/:id/assessment/preview`); 422 walidacja; 403 brak uprawnień (także cudza notatka); 404 brak zasobu; 409 powtórzenie zamkniętego kroku; 409 „cykl nie jest otwarty” tylko dla części I, oceny, nieobecności i zmiany oceniającego | 400, 200 po zapisie |
| Dane po kroku 1 pokazu | `--after-step-1`, `seedOptions.afterStep1` | ręczne wpisywanie części I Piotra w teście |
| Dane do kroku 2 granego na żywo | `--live-step-2`, `seedOptions.liveStep2` | kasowanie wgranej notatki w teście |
| Osoba z przykładem sprzeciwu | Katarzyna Lewandowska (bez konta, podwładna Anny) | Maria (Maria nie ma żadnego cyklu) |

## Zdania, których nie mówimy

- „Podpis”, „podpisz”, „do podpisu” o kliknięciu. Mówimy „potwierdzenie” (decyzje 5a, 11b).
- „Notatka prywatna”. Mówimy: „Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje” (11c).
- „Od dziś biegnie 7 dni na sprzeciw”. Mówimy: „Urząd przyjmuje dzisiejszy dzień jako dzień zapoznania. Od dziś system liczy 7 dni na sprzeciw” (11a).
- „Urząd, który ma podpis zaufany albo EZD, podpina go w tym miejscu”. Mówimy: „Kliknięcie to potwierdzenie w systemie. Moc prawną daje dziś wydruk z podpisem. Urząd może w tym miejscu podpiąć podpis kwalifikowany albo zaufany” (11b).
- „Po 7 dniach bez kliknięcia uznajemy pracownika za zapoznanego” (odrzucone w 5b).
- „System wpisze potwierdzenie części I za pracownika”. Mówimy: „Tryb na brak potwierdzenia ustala urząd, system go nie przesądza” (10d).
- „System wie, że to choroba”. Mówimy: „System nie wie, czy to choroba, bo do terminu wystarcza mu data” (10m).
- „Ryzyko odejścia”, „wskaźnik motywacji”, liczba notatek przy nazwisku (3, 10k).
- „AI pisze ocenę”, „model proponuje punkty” (1, 9).
- „To zmiana stanowiska” jako ustalenie systemu. Mówimy: „Jeśli to zmiana stanowiska z istotną zmianą obowiązków, prawo wymaga nowej rozmowy o kryteriach albo oceny. Sprawdź terminy z kadrami” (11e).
- „KPRM pilotuje PLLuM” (niepotwierdzone, decyzja 9).
