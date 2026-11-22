# Paczka „oddanie” (gałąź `final-delivery`)

Cel: jury widzi, jak to wdrożyć u siebie (30% punktów), a moduł HR partnera odpowiada na przeciążenie pracownika (20% plus osobna ocena). Zasady wspólne: `change.md` w tym katalogu.

Kolejność (od góry; to, co niżej, wypada pierwsze):

1. **Strona `/about` „Wdrożenie i dane”** (nowa trasa, nowy widok, test trasy). Treść tylko z faktów w repo (`README.md`, `context/foundation/tech-stack.md`, `decisions.md`, `rules/`), bez obietnic na wyrost. Sekcje:
   - uruchomienie u siebie: jedno polecenie, baza w pliku, bez płatnych licencji i usług, dane nie wychodzą poza komputer;
   - reguły: plik `rules/regulation-2016-470.json` z wersją i datą obowiązywania, zmiana przepisów to nowa wersja pliku, każdy wynik pokazuje wersję;
   - dane kadrowe: co jest dziś (lista pracowników, CSV), co wymaga integracji przy wdrożeniu (system kadrowy, EZD, poczta): napisane wprost jako „nie ma w prototypie”;
   - ochrona danych: jakie dane przetwarza, kto co widzi (role), brak etykiet i profilowania, do adaptera podpowiedzi nie trafiają nazwiska, ciasteczka pokazu (`person_id`, `mocena_demo`) i do czego służą, co urząd musi dodać przy wdrożeniu (logowanie, retencja, administrator danych);
   - kod: odnośnik do repozytorium `https://github.com/Nikospy/mocena`, font Open Sans (OFL). Nazwę licencji kodu weź z jednej stałej z wartością tymczasową „do ustalenia przez autora”; pliku LICENSE nie twórz.
   Użyj istniejących klas z `public/style.css`. Odnośnik do `/about` w stopce doda paczka „wygląd”.
2. **README:** sekcja „Wdrożenie” opisuje uruchomienie w urzędzie (lokalnie, bez chmury) obok wdrożenia pokazowego.
3. **HR partner: pytanie o obciążenie.** Na ekranie „Przed rozmową” (`src/views/before-meeting.tsx`, logika w `src/hr-partner/`): gdy notatki przełożonego po zmianie zadań zawierają słowa z listy (praca po godzinach: „po 18”, „wieczorami”, „nadgodziny”, „weekend”; lista jako ustawienie urzędu, tak jak lista słów zmiany zadań), partner pokazuje pytanie do przełożonego: „Od zmiany zadań w Twoich notatkach wraca praca po godzinach. Czy zakres zadań jest do udźwignięcia?” z odnośnikami do tych notatek i z kartą rozmowy o podziale zadań. To pytanie do oceniającego oparte na jego własnych wpisach: bez etykiety i wskaźnika przy nazwisku, bez punktów, bez modelu językowego (zasady 4, 5 i 7 z `AGENTS.md`). Test reguły. Dopisz to jako decyzję w `context/foundation/decisions.md` (sekcja 3, HR partner) z datą 22.11.2026 i cytatem autora z `change.md`.
4. **Dane pokazu:** ocena „1” przy Rzetelności nie może opierać się na notatkach o pracy po godzinach. Sprawdź `src/seed/` i `context/foundation/demo.md`; jeśli uzasadnienie w pokazie bierze notatkę o domykaniu kolejki wieczorami, zmień dobór notatek albo ich przypisanie tak, żeby testy i `demo-check` przechodziły. Zmianę opisz w `demo.md`.
5. **Ekran „Przed rozmową z Piotrem”** nie pokazuje zdania o Marii („O Marii nie masz notatki”); to zdanie zostaje tylko na liście notatek o zespole.
6. **Wydruk arkusza** (`public/print.css`, `src/views/sheet.tsx`): stopka nie nachodzi na treść na żadnej stronie (dziś ma `position: fixed`); układ w kolejności urzędowego wzoru arkusza (części I, II, III, miejsca na daty i potwierdzenia); przewijany region dostępny z klawiatury. Sprawdź wydruk do PDF w przeglądarce bez okna (Playwright jest dostępny, patrz `scripts/pitch-shots.ts`).
7. **Zdanie otwierające pokazu** (`src/views/tour-entry.tsx`): zaczyna od tego, co asystent robi, a dopiero potem mówi, czego nie robi. Słownik: `context/domain/glossary.md`.
8. **Komplet zgłoszenia:** policz slajdy w `docs/pitch/index.html` (limit 15) i sprawdź, czy da się je zapisać do PDF. Tylko raport, bez zmian.
