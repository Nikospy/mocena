# Ocena z blokadami i potwierdzenie zapoznania — Plan Brief

> Full plan: `context/changes/assessment-and-confirmation/plan.md`

## What & Why

Oceniający przyznaje oceny cząstkowe, widzi wynik z silnika z podstawą prawną i zatwierdza ocenę dopiero po uzupełnieniu pól wymaganych przepisami; oceniany potwierdza zapoznanie na własnym koncie, a przy braku potwierdzenia oceniający stwierdza fikcję zapoznania. To north star roadmapy: krok, na który patrzy jury (kroki 4 i 5 pokazu).

## Starting Point

Silnik wyniku i terminu sprzeciwu ma testy (po F-01 w `src/engine/`). Cykl, kryteria (`cycle_criteria`) i `part1_confirmed` daje S-01; tabele, konto, `today()`, `visibleEvents`, `recordEvent`, `effectiveDeadline` i układ ekranu daje F-01. Wszystkie nazwy pochodzą z rozdziału „Kontrakt wspólny” w planie F-01. Ekranów oceny nie ma.

## Desired End State

Na koncie Marka „1” przy Rzetelności daje ocenę negatywną mimo średniej 6,14; bez wniosków do IPRZ zatwierdzenie jest zablokowane z przepisem. Po zatwierdzeniu Piotr 22.11.2026 potwierdza zapoznanie i widzi zegar sprzeciwu do 30.11.2026. W osobnym przebiegu od czystych danych Marek zamiast tego zapisuje przez ekran skutku fikcję („nie mógł” / „nie chciał”, sposób i data doręczenia kopii arkusza), którą widzi Joanna.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zapis stanu oceny | tylko zdarzenia w `events` (szkic, zatwierdzenie, potwierdzenie, fikcja), bez nowej tabeli | konwencja projektu i filtr dat z decyzji 10i działają bez wyjątków | Plan |
| Zatwierdzenie | migawka `AssessmentSnapshot` z `periodFrom` = `cycles.period_start`, `deadline` z `effectiveDeadline` na dzień zatwierdzenia, `grade` i `gradeAwardedOn` z `currentGrade` na dzień zatwierdzenia i wersją reguł `{ version, effectiveFrom, act }`; składa ją tylko `buildAssessmentSnapshot`; po zatwierdzeniu termin oceny jest zamrożony w migawce | historia i wydruk (S-06) bez przeliczania, FR-033 | Recenzja, ustalenie 8 |
| Termin sprzeciwu | liczony raz przy potwierdzeniu albo fikcji, czytany z payloadu | zegar nie zmienia terminu przy przesuwaniu daty | Recenzja, ustalenie 15 |
| Kontrole serwera | aktor, potwierdzona część I, dokładny zestaw ocen, IPRZ, uzasadnienie, wniosek o stopień; zdarzenie końcowe w transakcji | żądanie może ominąć formularz; najwyżej jedno zdarzenie końcowe | Recenzja, ustalenie 13 |
| Blokady | jedna czysta funkcja `approvalBlockers` dla ekranu i serwera | te same komunikaty i przepisy w obu miejscach | Plan |
| Uzasadnienie | zwykłe pole `justification` w `slots` dla S-04 | decyzja 10f | decisions.md |
| Fikcja | przycisk od zatwierdzenia, ekran skutku, wymagany wybór i pola doręczenia kopii arkusza, kadry tylko widzą; w pokazie osobny przebieg | decyzje 5b, 10n i 11a | decisions.md, demo.md |
| Potwierdzenia | miejscowość z `settings.office_city`, data, nazwisko wpisywane same, słowo „potwierdzenie” | decyzja 5a | decisions.md |
| Wniosek o stopień | tylko urzędnik mianowany z wynikiem pozytywnym, stopień z `currentGrade(personId)` (F-01), granica w `approval.gradeRequest.maxGrade` (9), sprawdzony testem | Piotr nie jest mianowany, pokaz tego nie klika | Recenzja, ustalenie 9 |
| Dane pokazowe ocen | S-02 nic nie wgrywa; oceny Tomasza wgrywa S-06 w kształcie migawki S-02 | jeden właściciel na zestaw danych | Recenzja, ustalenie 3 |

## Scope

**In scope:** oceny cząstkowe, wynik z przepisem, blokady (IPRZ, uzasadnienie przy negatywnej, umotywowanie wniosku o stopień), wniosek o stopień, zatwierdzenie, potwierdzenie ocenianego, zegar 7 dni, fikcja zapoznania, wgląd kadr, pozycje listy spraw i odnośnik z części I.

**Out of scope:** notatki, „Wstaw”, ostrzeżenie z ostatniego miesiąca, karta rozmowy (S-04); ekran kadr, stopień obowiązkowy, wydruk, wgrane oceny (S-06); obieg sprzeciwu; automat fikcji; własne style.

## Architecture / Approach

`src/engine/approval.ts` (czyste blokady) → `src/assessment/state.ts` (etap oceny z `visibleEvents`) → `src/assessment/snapshot.ts` (`buildAssessmentSnapshot(cycleId, draft, { asOf })`, jedyne miejsce składania migawki; woła je zatwierdzenie i moduł danych S-06) → `src/routes/assessment.tsx` (ekran, zapis, zatwierdzenie, potwierdzenie, fikcja, podgląd) → `src/views/assessment.tsx` i `src/views/acknowledgement-fiction.tsx` we wspólnym układzie z `slots` dla S-04.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Wersja minimalna (ok. 50 min) | kroki 4 i 5 pokazu, wynik po „Zapisz”, pełne kontrole serwera | nazwy w kodzie F-01/S-01 różne od kontraktu |
| 2. Fikcja i wgląd kadr | wersja 5-minutowa pokazu; odnośnik „Ocena” dla kadr dopiero tu | rozjazd z ekranem kadr S-06 |
| 3. Dodatki | pole wniosku o stopień, podgląd na żywo, data rozmowy | pierwsze do wycięcia |

**Prerequisites:** F-01 i S-01 gotowe (tabele, `today()`, `part1_confirmed`, cykl Piotra).
**Estimated effort:** ok. 50 minut wersja minimalna, ok. 80 minut całość.

## Open Risks & Assumptions

- Oba potwierdzenia i wpis o fikcji rysuje `ConfirmationBlock` z S-01, który ma od początku oba warianty (`kind: "confirmation"` i `kind: "fiction"`); S-02 tylko go używa.
- Kolejność cięcia (od końca): data rozmowy oceniającej, podgląd na żywo, pole wniosku o stopień. Fikcja z ekranem skutku i wgląd kadr są potrzebne do wersji 5-minutowej pokazu: powstają zaraz po wersji minimalnej i wypadają ostatnie.

## Success Criteria (Summary)

- Krok 4 pokazu: „1” daje wynik negatywny z przepisem, zatwierdzenie bez IPRZ zablokowane.
- Krok 5 pokazu: Piotr potwierdza 22.11.2026 i widzi termin 30.11.2026; fikcja zapisuje się tylko po ekranie skutku, wyborze i polach doręczenia.
- `bun test` przechodzi, w tym bezpośrednie żądania, jedno zdarzenie końcowe przy powtórzeniach i test wniosku o stopień.
