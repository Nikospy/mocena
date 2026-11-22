# Paczka „proces 2” (gałąź `final-process-2`, start po scaleniu paczki „proces”)

Cel: pozostałe braki z audytu wymogów, których nie objęła paczka „proces”. Zasady wspólne: `change.md`. Kolejność od góry.

1. **Tryb korekty błędów przez administratora**: administrator może poprawić pole zatwierdzonego arkusza z podaniem powodu; zmiana zostaje w historii (kto, kiedy, co, dlaczego) i jest widoczna na arkuszu.
2. **Część rozwojowa**: na karcie rozmowy oceniającej zestawienie z notatek przełożonego „co szło dobrze” i „co do poprawy” według kryteriów (to cytaty z jego wpisów, bez etykiet przy nazwisku i bez punktów).
3. **Zaproszenie na rozmowę**: obok pliku .ics odnośnik `mailto:` z gotowym tematem i treścią.
4. **Import pracowników z CSV** w kadrach (ten sam układ kolumn co eksport) i komórka organizacyjna jako lista zamiast wolnego tekstu.
5. **Przypomnienia**: sprawa z terminem w ciągu 7 dni i po terminie ma to napisane słowami na stronie głównej każdej roli.
6. **Sprzeciw, ponowne sporządzenie oceny**: cykl po tym rozstrzygnięciu ma termin (dziś „—”) i sprawę u oceniającego.
7. **Aktualizacja przepisów**: na stronie administratora widać wersję pliku reguł, datę obowiązywania i opis, jak wgrać nową wersję.

8. **Wniosek ocenianego o zmianę terminu jest do znalezienia.** Trasa `/cycles/:id/deadline-change/request` działa, ale sprawa na stronie głównej ma `quiet: true` (`src/deadline-change-links.ts`) i znika, gdy oceniany ma inną sprawę (`src/home-tasks.ts`). Odnośnik „Poproś o zmianę terminu” ma być zawsze dostępny dla ocenianego w otwartym cyklu: na ekranie cyklu albo osi czasu, niezależnie od innych spraw. Test: Ewa 22.11 widzi odnośnik.
9. **„Okres podlegania ocenie” na arkuszu.** Arkusz pokazuje okres od daty poprzedniej oceny; okres biegnie od dnia wyznaczenia kryteriów (u Piotra 09.12.2024). Popraw datę „od” na arkuszu i w wydruku, o ile `context/foundation/decisions.md` nie mówi inaczej (jeśli mówi, zostaw i zgłoś w raporcie). Terminu oceny nie zmieniasz. Test na danych pokazowych.

Poza zakresem tej paczki (wymaga decyzji autora, bo zmienia przyjęty scenariusz): daty pokazu wypadające w weekend, zmiana sposobu liczenia terminu oceny.
