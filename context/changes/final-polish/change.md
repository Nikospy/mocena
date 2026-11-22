# final-polish: poprawki przed oddaniem (22.11.2026)

Decyzja autora z 22.11 ok. 03:15: „z twojego przeglądu naprawiamy wszystko, co tam było do zaznaczenia i poprawy, oraz naprawiamy wszystko, co ten grog nam tutaj pokazał”.

Źródła: przegląd wyglądu (17 punktów, pomiar `scripts/design-audit.ts`) i zewnętrzny audyt wymogów zadania. Praca idzie w czterech paczkach równolegle, każda na swojej gałęzi i w swoim worktree:

| Paczka | Gałąź | Plik zlecenia | Pliki, które wolno zmieniać |
|---|---|---|---|
| wygląd | `final-visual` | `visual.md` | `public/style.css`, `public/rodzina.css`, `public/tour.js`, `src/views/` (znaczniki i klasy), `scripts/design-audit.ts` |
| wydruk | `final-print` | pozycja 6 z `delivery.md` | `public/print.css`, `src/views/sheet.tsx` |
| proces | `final-process` | `process.md` | `src/routes/`, `src/engine/`, `src/seed/`, `src/tour/stops.ts`, `src/home-tasks.ts`, `src/hr/`, `src/cycles*`, `src/people.ts`, testy |
| oddanie | `final-delivery` | `delivery.md` | nowa strona `/about`, `README.md`, `public/print.css`, `src/views/sheet.tsx`, `src/views/before-meeting.tsx` (treść), `src/hr-partner/`, `src/views/tour-entry.tsx`, `context/foundation/decisions.md` |

## Zasady wspólne

1. Najpierw przeczytaj `AGENTS.md`, sekcję „Zasady, których nie wolno złamać”. Wszystkie obowiązują.
2. Zmieniasz tylko pliki swojej paczki. W cudzym widoku wolno dodać element z istniejącymi klasami; nowych reguł CSS nie dopisujesz (CSS należy do paczki „wygląd”). Jeśli bez CSS się nie da, opisz potrzebę w raporcie końcowym.
3. Po każdym sprawdzonym punkcie commit lokalny na swojej gałęzi. Bez pusha. Autora commitów nie zmieniasz.
4. Bramki przed raportem: `bun test` (wszystko zielone), `bun run demo-check`. Nowa reguła albo trasa dostaje test.
5. Pozycje robisz w kolejności z listy. Granica czasu: 06:15. O tej godzinie kończysz bieżącą pozycję i oddajesz to, co jest zielone.
6. Przed raportem: `git merge main` we własnym worktree, rozwiąż konflikty, powtórz bramki.
7. Raport końcowy to ostatnie linie w terminalu: lista zrobionych pozycji z commitami, lista pominiętych z powodem, a na końcu jedna linia `GOTOWE: <gałąź> <skrót commita>`.
8. Nie zadajesz pytań autorowi. Wątpliwość rozstrzygasz zachowawczo i opisujesz w raporcie.
