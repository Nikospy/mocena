# Notatki o faktach i uzasadnienie z notatek — Plan Brief

> Full plan: `context/changes/notes-and-justification/plan.md`

## What & Why

Ocena psuje się przez 24 miesiące przed formularzem, nie w formularzu (decyzja 1). Plaster S-04 daje przełożonemu notatki o faktach zapisywane z telefonu przez cały cykl, a przy ocenie: notatki przy każdym kryterium, ostrzeżenie, gdy fakty są tylko z ostatniego miesiąca, i wstawianie zaznaczonych notatek do uzasadnienia.

## Starting Point

Po F-01, S-01 i S-02: baza z osobami i cyklami według kontraktu wspólnego (`cycles.appraiser_id`, `today()`, granica `date <= today()`), ekran wejściowy cyklu z `registerCycleLinks`, formularz oceny ze `slots` i polami `justification`, `developmentConclusions`. Tabeli notatek, adaptera podpowiedzi i karty rozmowy oceniającej nie ma.

## Desired End State

Marek zapisuje notatkę na 360 px; pole „Zmiana zadań pracownika” zaznacza się samo z listy słów i da się je odznaczyć. W formularzu oceny (21.11.2026, krok 4) przy kryteriach są notatki z datami, jedno ostrzeżenie „z ostatniego miesiąca” i „Wstaw do uzasadnienia”. Karta rozmowy oceniającej ma trzy tematy z § 10. Po wersji minimalnej: Piotr czyta przekazaną informację zwrotną, a samej notatki nie widzi na swoim koncie (decyzja 11c: w interfejsie nie ma słowa „prywatna”).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Gdzie żyją notatki | Tabela `notes` z kontraktu, jedna granica `date <= today()` | Własne pola i odczyt przy każdym kryterium; ta sama granica co zdarzenia | Kontrakt, decyzja 10i |
| Data faktu i data zapisu | `date` (fakt, decyduje o widoczności) osobno od `created_at` (kliknięcie) | Recenzja, ustalenie 11 | Plan |
| Dostęp | Zapis: `cycles.appraiser_id` w cyklu, `people.supervisor_id` bez cyklu; odczyt tylko autor | Zmiana oceniającego nie może zostawić starego dostępu | Recenzja, ustalenie 17 |
| Adapter | `src/suggestions/`: osobne wejścia dla notatki i reguł kryteriów; w prototypie tylko reguły | Jedno wymienne miejsce; konfiguracja nie włączy usługi | Decyzje 9, 10l; ustalenie 18 |
| Co się zapisuje | `task_change` = klik człowieka; wynik adaptera obok, do wglądu | Nic bez kliknięcia; S-05 widzi źródło | Plan |
| „Wstaw” | W przeglądarce do `slots` S-02; test DOM | Nie rusza zapisu S-02, nic nie wstawia się samo | Decyzja 10f |
| Dane pokazowe | `src/seed/notes.ts`, opcja `--live-step-2` pomija notatkę z 11.03.2026 | Krok 2 pisze ją na żywo | Kontrakt |
| Gałąź modelu | Faza 4, tylko podstawiona funkcja w kodzie, sprawdzana atrapą | Pierwsza rzecz, jeśli zostanie czas | Decyzja 10l |

## Scope

**In scope:** tabele i 16 notatek pokazowych; formularz notatki; „Moje notatki”; adapter z regułami; notatki i ostrzeżenie „z ostatniego miesiąca” przy kryteriach; „Wstaw do uzasadnienia”; karta rozmowy oceniającej z odnośnikami; potem „Przekaż pracownikowi”, ekran „Informacja zwrotna”, drugie „Wstaw”, data notatki, ostrzeżenie o ocenie skrajnej.

**Out of scope:** pytanie HR partnera, „Przed rozmową”, przypomnienie o docenianiu, ekran „Skąd biorą się podpowiedzi” (S-05); edycja i usuwanie notatek; style (design system autora); model językowy.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Dane i adapter (minimalna) | Tabele, seed 16 notatek, odczyty, dostęp, adapter z regułami | Mapa nazw kryteriów |
| 2. Formularz, ocena, karta (minimalna) | Formularz na 360 px, notatki przy kryteriach, ostrzeżenie, „Wstaw do uzasadnienia”, karta | Wpięcie w `slots` S-02 |
| 3. Dokładki | Informacja zwrotna, drugie „Wstaw”, data, ostrzeżenie skrajne | Brak czasu |
| 4. Model (opcjonalna) | Gałąź `local-model` z testem na atrapie | Brak czasu |

**Prerequisites:** F-01, S-01, S-02 zbudowane (nazwy z rozdziału „Kontrakt wspólny” planu F-01).
**Estimated effort:** wersja minimalna ok. 50 minut (20 + 30); faza 3 ok. 25; faza 4 dodatkowo 10–15.

## Open Risks & Assumptions

- Kolejność cięcia jest na górze planu; wersji minimalnej się nie tnie.
- Gdy `src/seed/base.ts` nie ustawi Marka jako oceniającego Ewy przed S-03, Marek nie dopisze notatki o Ewie (pokaz tego nie używa).

## Success Criteria (Summary)

- Kroki 2 (2026-03-11, `--live-step-2`) i 4 (2026-11-21) pokazu działają na danych wgranych seedem.
- `bun test` przechodzi, w tym R1–R12 dla wersji minimalnej.
- Nigdzie przy nazwisku nie ma liczby ani etykiety; nic nie zapisuje się bez kliknięcia.
