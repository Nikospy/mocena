---
project: "mOcena"
version: 1
status: active
created: 2026-11-21
updated: 2026-11-21
prd_version: 2
main_goal: speed
top_blocker: time
milestone_id: full-cycle-demo
milestone_seq: 1
milestone_status: open
---

# Roadmap: mOcena

> Derived from `context/foundation/prd.md` (v2) and `context/foundation/tech-stack.md` + codebase baseline.
> Edit-in-place; the next milestone continues this file. Archive only when an independent roadmap replaces it.
> Slices below are listed in dependency order. The "At a glance" table is the index.
> Kolejność budowy przyjęta przez autora 2026-11-21: F-01, S-01, S-02, S-04, S-05, S-06, S-03 (`decisions.md`, decyzje 8a i 10h). Budowa nowych funkcji kończy się 22.11 o 07:00 (decyzja 10g).

## Milestone

**M-1: Cały cykl oceny w pokazie** — Status: open

- **Intent:** Jedna ocena okresowa przechodzi w prototypie całą drogę, od początku cyklu do potwierdzenia zapoznania, na trzech kontach (oceniający, oceniany, kadry), bez papieru.
- **Source materials:** `context/foundation/prd.md` (v1)
- **Done when:** every F-NN and S-NN below is `done`, plus dwa pełne przebiegi pokazu bez błędu, nagranie zapasowe i prezentacja PDF.
- **Scope anchors:** FR-001–FR-036, US-01–US-05.

## Vision recap

Ocena okresowa w służbie cywilnej powstaje raz na 24 miesiące, na papierze i z pamięci o ostatnich tygodniach. mOcena prowadzi oceniającego, ocenianego i kadry przez cały cykl: wybór arkusza i kryteriów, notatki o faktach, rozmowy, ocenę i potwierdzenie. Asystent pilnuje faktów, terminów i przepisów, a decyzję podejmuje przełożony.

## North star

**S-02: Oceniający wystawia ocenę, a oceniany ją potwierdza** — to krok, na który patrzy jury: wynik zgodny z rozporządzeniem, blokady formalne i potwierdzenie bez papieru.

> „North star” oznacza tu najmniejszy plaster od początku do końca, którego dostarczenie dowodzi głównej tezy produktu. Stoi tak wcześnie, jak pozwalają zależności, bo reszta ma sens tylko wtedy, gdy on działa.

## At a glance

| ID   | Change ID                    | Outcome (user can …)                                                                 | Prerequisites | PRD refs                                   | Status   |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------ | ------------- | ------------------------------------------ | -------- |
| F-01 | rules-engine-and-demo-data   | (foundation) silnik reguł z testami, dane pokazowe i wybór konta są na miejscu       | —             | FR-033, Business Logic, Access Control     | in-progress |
| S-01 | cycle-start-criteria         | oceniający zaczyna cykl i ustala kryteria, oceniany potwierdza część I               | F-01          | US-01, US-02, FR-001–FR-007                | proposed |
| S-02 | assessment-and-confirmation  | oceniający wystawia ocenę z blokadami, oceniany potwierdza zapoznanie                | S-01          | US-05, FR-018, FR-019, FR-022–FR-025       | proposed |
| S-04 | notes-and-justification      | oceniający notuje fakty z telefonu i składa z nich uzasadnienie                      | S-02          | FR-008, FR-009, FR-017, FR-020, FR-021     | proposed |
| S-05 | hr-partner-question          | oceniający dostaje pytanie HR partnera po notatce, zestawienie przed rozmową i przypomnienie o docenianiu | S-04 | US-04, FR-015, FR-016, FR-035, FR-036 | proposed |
| S-03 | timeline-and-absences        | kadry wpisują nieobecność i zmianę oceniającego, a wszyscy widzą oś czasu z regułami | S-01          | US-03, FR-010, FR-011, FR-014, FR-033, FR-034 | proposed |
| S-06 | hr-overview-and-print        | kadry widzą stan cykli i stopnie obowiązkowe, a arkusz da się pobrać i wydrukować    | S-02          | FR-026, FR-027, FR-029, FR-031             | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below.

| Stream | Theme                 | Chain                            | Note                                                              |
| ------ | --------------------- | -------------------------------- | ----------------------------------------------------------------- |
| A      | Rdzeń oceny           | `F-01` → `S-01` → `S-02`         | Ścisła ścieżka pokazu: bez niej nie ma „całego procesu”.          |
| B      | Notatki i HR partner  | `S-04` → `S-05`                  | Budowany zaraz po rdzeniu: moduł oceniany osobno przez jury.      |
| C      | Kadry, wydruk, czas   | `S-06` → `S-03`                  | Budowany na końcu; przy braku czasu jako pierwsza wypada oś czasu (S-03). |

## Baseline

What's already in place in the codebase as of `2026-11-21`.

- **Frontend:** absent — brak ekranów i stylów.
- **Backend / API:** partial — starter Hono w `src/index.ts`, odpowiada na `GET /`.
- **Data:** absent — brak bazy i danych pokazowych.
- **Auth:** absent.
- **Deploy / infra:** absent — uruchomienie lokalne przez `bun run dev`.
- **Observability:** absent — poza zakresem prototypu.
- **W repo, do przemianowania:** przetestowany silnik wyniku oceny i terminów oraz dane rozporządzenia w JSON, skopiowane z nazwami po polsku (`reguly/`, `src/silnik/`); `F-01` przenosi je na nazwy angielskie.

## Foundations

### F-01: Silnik reguł, dane pokazowe i wybór konta

- **Outcome:** (foundation) silnik wyniku oceny i terminów działa z testami, zestaw reguł ma wersję i datę obowiązywania, baza ma dane pokazowe jednego wydziału, a użytkownik wybiera konto demonstracyjne i widzi szkielet ekranu.
- **Change ID:** rules-engine-and-demo-data
- **PRD refs:** FR-033, Business Logic, Access Control, NFR „zmiana reguł bez zmiany programu”, NFR „pokaz działa bez sieci”
- **Unlocks:** S-01, S-02, S-03 (reguły i terminy), wszystkie plastry (konta i dane); ścieżka weryfikacji `bun test` na przykładach organizatora.
- **Prerequisites:** —
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Stoi pierwszy, bo każdy plaster potrzebuje kont, danych i reguł. Ryzyko: rozrośnie się w „warstwę danych”; granica to jeden wydział i tylko tabele, których potrzebuje S-01.
- **Status:** in-progress

## Slices

### S-01: Początek cyklu: arkusz, kryteria, oczekiwania, potwierdzenie części I

- **Outcome:** oceniający może zacząć cykl podwładnego: widzi arkusz dobrany do stanowiska, wybiera do 3 kryteriów dodatkowych z podpowiedzią, zapisuje oczekiwania, otwiera kartę rozmowy rozpoczynającej i przekazuje część I; oceniany może ją potwierdzić na własnym koncie.
- **Change ID:** cycle-start-criteria
- **PRD refs:** US-01, US-02, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007
- **Prerequisites:** F-01
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Czy podpowiedź kryteriów z opisu stanowiska da się oprzeć na prostych regułach? — Owner: team. Rozstrzygnięte 2026-11-21: tabela „rodzaj obowiązku → kryterium” w pliku reguł (`decisions.md`, decyzja 6b).
- **Risk:** Pierwszy ekran ustala wygląd całego produktu, więc tu zapada kierunek wizualny. Pokazuje dwie pierwsze trudności wymienione przez organizatora.
- **Status:** proposed

### S-02: Ocena z blokadami i potwierdzenie zapoznania

- **Outcome:** oceniający może przyznać oceny cząstkowe, zobaczyć wyliczony wynik z przepisem, dołączyć wniosek o stopień i zatwierdzić arkusz dopiero po uzupełnieniu wymaganych pól; oceniany może potwierdzić zapoznanie się z oceną, a przy braku potwierdzenia oceniający stwierdza fikcję zapoznania, którą widzą kadry.
- **Change ID:** assessment-and-confirmation
- **PRD refs:** US-05, FR-018, FR-019, FR-022, FR-023, FR-024, FR-025
- **Prerequisites:** S-01
- **Parallel with:** S-03
- **Blockers:** —
- **Unknowns:**
  - Czy potwierdzenie w systemie wystarcza organizatorowi jako odpowiednik podpisu? — Owner: user. Block: no (przyjęte: tak).
- **Risk:** Najwięcej reguł formalnych w jednym miejscu; mapa pól organizatora jest tu specyfikacją blokad.
- **Status:** proposed

### S-03: Oś czasu, nieobecności i zmiana oceniającego

- **Outcome:** kadry mogą wpisać nieobecności i zmianę oceniającego, a każdy uczestnik widzi oś czasu cyklu z nowym terminem, regułą i wersją reguł; prowadzący pokaz może przesunąć datę systemową i zobaczyć przypomnienia.
- **Change ID:** timeline-and-absences
- **PRD refs:** US-03, FR-010, FR-011, FR-014, FR-033, FR-034
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-04
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Sklejanie nieobecności przez dni wolne to nowy kod w silniku terminów; sprawdzian to przykład organizatora (05.10–06.11.2026).
- **Status:** proposed

### S-04: Notatki o faktach i uzasadnienie z notatek

- **Outcome:** oceniający może z telefonu zapisać notatkę o fakcie przy kryterium, wysłać ocenianemu informację zwrotną, a przy ocenie zobaczyć notatki przy kryteriach, ostrzeżenie o ocenie z ostatnich tygodni, kartę rozmowy oceniającej i złożyć z notatek uzasadnienie oraz wnioski rozwojowe.
- **Change ID:** notes-and-justification
- **PRD refs:** FR-008, FR-009, FR-017, FR-020, FR-021
- **Prerequisites:** S-02
- **Parallel with:** S-03, S-06
- **Blockers:** —
- **Unknowns:**
  - Czy składanie uzasadnienia z notatek organizator uzna za wsparcie w formułowaniu treści oceny? — Owner: user. Block: no.
- **Risk:** To jest teza produktu („24 miesiące ciszy”); bez danych z dwóch lat w bazie pokazowej ekran wygląda pusto.
- **Status:** proposed

### S-05: Pytanie HR partnera i przypomnienie o docenianiu

- **Outcome:** oceniający może odpowiedzieć na jedno pytanie zamknięte zadane po notatce z zaznaczoną zmianą zadań, dostać kartę rozmowy i formę rozwoju z katalogu, otworzyć zestawienie „Przed rozmową z pracownikiem” (notatki sprzed zmiany zadań i po niej, kryteria bez notatek, brak informacji zwrotnej, podwładni bez notatek od dawna, zdaniem i bez liczb) oraz zobaczyć przypomnienie o docenianiu; administrator może zobaczyć ekran „Skąd biorą się podpowiedzi” z miejscami na model uruchomiony w urzędzie.
- **Change ID:** hr-partner-question
- **PRD refs:** US-04, FR-015, FR-016, FR-035, FR-036
- **Prerequisites:** S-04
- **Parallel with:** S-06
- **Blockers:** —
- **Unknowns:**
  - Co organizator chce zobaczyć w module HR partnera? — Owner: user. Block: no (przyjęte przez autora: wariant bez modelu, z zestawieniem przed rozmową).
- **Risk:** Moduł oceniany osobno i nazwany przez organizatora innowacyjnym; stoi po notatkach, bo bez nich nie ma na co reagować.
- **Status:** proposed

### S-06: Stan cykli dla kadr, stopień obowiązkowy i wydruk arkusza

- **Outcome:** kadry i dyrektor generalny mogą zobaczyć stan wszystkich cykli na jednym ekranie, w tym przypomnienie o obowiązkowym stopniu służbowym z terminem, stany sprzeciwu i wniosku o termin; uprawniona osoba może zobaczyć historię ocen oraz pobrać i wydrukować arkusz.
- **Change ID:** hr-overview-and-print
- **PRD refs:** FR-026, FR-027, FR-029, FR-031 (oraz stany dla FR-013, FR-028, FR-030)
- **Prerequisites:** S-02
- **Parallel with:** S-04, S-05
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Zamyka „kompletność”: to ekran, na którym widać podprocesy, których pokaz nie klika.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                   | Suggested issue title                                         | Ready for `/10x-plan` | Notes |
| ---------- | --------------------------- | ------------------------------------------------------------- | --------------------- | ----- |
| F-01       | rules-engine-and-demo-data  | Silnik reguł, dane pokazowe i wybór konta                     | yes                   | Run `/10x-plan rules-engine-and-demo-data` |
| S-01       | cycle-start-criteria        | Początek cyklu: arkusz, kryteria, potwierdzenie części I      | no                    | po F-01 |
| S-02       | assessment-and-confirmation | Ocena z blokadami i potwierdzenie zapoznania                  | no                    | po S-01 |
| S-03       | timeline-and-absences       | Oś czasu, nieobecności i zmiana oceniającego                  | no                    | po S-01 |
| S-04       | notes-and-justification     | Notatki o faktach i uzasadnienie z notatek                    | no                    | po S-02 |
| S-05       | hr-partner-question         | Pytanie HR partnera i przypomnienie o docenianiu              | no                    | po S-04 |
| S-06       | hr-overview-and-print       | Stan cykli, stopień obowiązkowy i wydruk arkusza              | no                    | po S-02 |

## Open Roadmap Questions

1. **Czy potwierdzenie w systemie wystarcza w prototypie jako odpowiednik podpisu?** — Owner: user (mentorzy DSC). Block: S-02 (nie blokuje; przyjęte: tak).
2. **Co organizator chce zobaczyć w module HR partnera, żeby uznać go za innowacyjny?** — Owner: user (mentorzy DSC). Block: S-05 (nie blokuje).
3. **Czy składanie uzasadnienia z notatek organizator uzna za wsparcie w formułowaniu treści oceny?** — Owner: user (mentorzy DSC). Block: S-04 (nie blokuje).
4. **Kto w praktyce stwierdza fikcję zapoznania i co musi być zapisane?** — Owner: user (mentorzy DSC). Block: S-02 (nie blokuje).
5. **Długość slotu pokazu** — znana 2026-11-22. Block: roadmap-wide (nie blokuje).

## Parked

- **Model językowy w HR partnerze** — Why parked: PRD §Non-Goals; pytanie wynika z listy słów.
- **Wysyłka e-maili i integracja z elektronicznym systemem zarządzania dokumentacją** — Why parked: PRD §Non-Goals; powiadomienia widoczne w produkcie.
- **Podpis kwalifikowany, zaufany i osobisty** — Why parked: PRD §Non-Goals.
- **Import danych z systemu kadrowego, edycja danych pracownika, zastępstwa, usuwanie danych (FR-032)** — Why parked: PRD §Non-Goals; dane pokazowe są wgrane z góry.
- **Pełny obieg sprzeciwu, wniosku o termin, zmiany terminu przez oceniającego i decyzji o stopniu (FR-012, FR-013, FR-028)** — Why parked: w prototypie tylko stan na ekranie kadr (S-06).
- **Wydruk 1:1 ze wzorem** — Why parked: PRD §Non-Goals; komplet pól w kolejności wzoru.

## Milestone History

## Done
