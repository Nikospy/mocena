# Ocena z blokadami i potwierdzenie zapoznania — Plan Brief

> Full plan: `context/changes/assessment-and-confirmation/plan.md`

## What & Why

Oceniający przyznaje oceny cząstkowe, widzi wynik z silnika z podstawą prawną i zatwierdza ocenę dopiero po uzupełnieniu pól wymaganych przepisami; oceniany potwierdza zapoznanie na własnym koncie, a przy braku potwierdzenia oceniający stwierdza fikcję zapoznania. To north star roadmapy: krok, na który patrzy jury (kroki 4 i 5 pokazu).

## Starting Point

Silnik wyniku i terminu sprzeciwu ma testy (po F-01 w `src/engine/`). Cykl, kryteria i potwierdzoną część I daje S-01; tabele, konta, `today()` i układ ekranu daje F-01. Ekranów oceny nie ma.

## Desired End State

Na koncie Marka „1” przy Rzetelności daje ocenę negatywną mimo średniej 6,14; bez wniosków do IPRZ zatwierdzenie jest zablokowane z przepisem. Po zatwierdzeniu Piotr potwierdza zapoznanie i widzi zegar sprzeciwu; zamiast tego Marek może przez ekran skutku zapisać fikcję („nie mógł” / „nie chciał”), którą widzi Joanna.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zapis stanu oceny | tylko zdarzenia w `events` (szkic, zatwierdzenie, potwierdzenie, fikcja), bez nowej tabeli | konwencja projektu i filtr dat z decyzji 10i działają bez wyjątków | Plan |
| Zatwierdzenie | migawka całej oceny z wersją reguł w zdarzeniu `assessment_approved` | historia i wydruk (S-06) bez przeliczania, FR-033 | Plan |
| Wynik na żywo | trasa podglądu bez zapisu, liczy silnik na serwerze | jedno źródło reguł i „nic bez kliknięcia” | Plan |
| Blokady | jedna czysta funkcja `approvalBlockers` dla ekranu i serwera | te same komunikaty i przepisy w obu miejscach | Plan |
| Uzasadnienie | zwykłe pole z miejscem na „Wstaw” dla S-04 | decyzja 10f | decisions.md |
| Fikcja | przycisk od zatwierdzenia, ekran skutku, wymagany wybór, kadry tylko widzą | decyzje 5b i 10n | decisions.md |
| Potwierdzenia | miejscowość, data, nazwisko wpisywane same, słowo „potwierdzenie” | decyzja 5a | decisions.md |
| Wniosek o stopień | tylko urzędnik mianowany z wynikiem pozytywnym, sprawdzony testem | Piotr nie jest mianowany, pokaz tego nie klika | brief zlecenia |

## Scope

**In scope:** oceny cząstkowe, wynik z przepisem, blokady (IPRZ, uzasadnienie przy negatywnej, umotywowanie wniosku o stopień), wniosek o stopień, zatwierdzenie, potwierdzenie ocenianego, zegar 7 dni, fikcja zapoznania, wgląd kadr, pozycje listy spraw.

**Out of scope:** notatki, „Wstaw”, ostrzeżenie z ostatniego miesiąca, karta rozmowy (S-04); ekran kadr, stopień obowiązkowy, wydruk (S-06); obieg sprzeciwu; automat fikcji; własne style.

## Architecture / Approach

`src/engine/approval.ts` (czyste blokady) → `src/assessment/state.ts` (etap oceny z widocznych zdarzeń) → `src/routes/assessment.tsx` (ekran, podgląd, zapis, zatwierdzenie, potwierdzenie, fikcja) → `src/views/assessment.tsx` i `src/views/acknowledgement-fiction.tsx` we wspólnym układzie z miejscami (`slots`) dla S-04.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Blokady i stan oceny | reguły zatwierdzenia i etap oceny z testami | nazwy z F-01/S-01 różne od założonych |
| 2. Formularz i zatwierdzenie | krok 4 pokazu | podgląd na żywo zjada czas (jest w kolejności cięcia) |
| 3. Potwierdzenie, fikcja, zegar | krok 5 pokazu i wariant 5-minutowy | rozjazd z ekranem kadr S-06 |

**Prerequisites:** F-01 i S-01 gotowe (tabele, `today()`, `part1_confirmed`, cykl Piotra).
**Estimated effort:** ok. 80 minut jednego agenta, 3 fazy.

## Open Risks & Assumptions

- Założone nazwy z F-01 i S-01 (lista w planie, sekcja „Założenia wobec wcześniejszych plastrów”); przy rozjeździe wygrywa kod.
- Kolejność cięcia: pole wniosku o stopień, wgląd kadr, podgląd na żywo, data rozmowy oceniającej.

## Success Criteria (Summary)

- Krok 4 pokazu: „1” daje wynik negatywny z przepisem, zatwierdzenie bez IPRZ zablokowane.
- Krok 5 pokazu: Piotr potwierdza i widzi zegar sprzeciwu; fikcja zapisuje się tylko po ekranie skutku i wyborze.
- `bun test` przechodzi, w tym test wniosku o stopień.
