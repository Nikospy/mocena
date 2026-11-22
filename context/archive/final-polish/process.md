# Paczka „proces” (gałąź `final-process`)

Cel: pokaz ma pokazywać cały proces oceny bez ślepych ścieżek. Kryteria jury: związek z wyzwaniem i zgodność z przepisami (30%), kompletność (20%). Zasady wspólne: `change.md` w tym katalogu.

Kolejność (od góry; to, co niżej, wypada pierwsze):

1. **Kolejny cykl po ocenie.** Po potwierdzeniu zapoznania z oceną (także po stwierdzeniu fikcji zapoznania) powstaje następny cykl tej osoby, a oceniający dostaje na stronie głównej sprawę „Wyznacz kryteria” z terminem: 30 dni od oceny (§ 7 rozporządzenia), a po ocenie negatywnej 7 dni; po negatywnej widać też datę ponownej oceny po 6 miesiącach od zapoznania (art. 81 ust. 9 ustawy; funkcja jest w `src/engine/deadlines.ts`). Terminy i podstawy bierz z `rules/regulation-2016-470.json` i silnika; jeśli reguły tam nie ma, dopisz ją do pliku reguł z podstawą prawną i testem. Niczego nie cytuj z pamięci.
2. **Tryb „klikaj samodzielnie” bez ślepych ścieżek.** Start 9.12.2024 pokazuje dziś: „Do granicy z § 7: -694 dni”, u Ewy i Tomasza „Zobacz ocenę” prowadzi do „Ocena nie jest jeszcze zatwierdzona”, Piotr ma notatki z 2 lat, ale nie ma kryteriów. Ujemne liczby dni zamień na zdanie o przekroczonym terminie. Odnośnik do oceny pokazuj tylko, gdy ocena istnieje dla daty systemowej. Dane widoczne przed swoją datą ukryj (zasada z `context/foundation/demo.md`: dane z przyszłości są niewidoczne).
3. **Pokaz obiecuje tylko to, co jest na ekranie** (`src/tour/stops.ts`). Krok o notatkach mówi o podziale „sprzed zmiany zadań i po niej”: sprawdź na ekranie i popraw tekst albo selektor. Krok 1 każe patrzeć na „Termin rozmowy o kryteriach”, a ekran pokazuje termin oceny: popraw. Plakietka `§ 9 ust. 1` przy kroku z notatką: sprawdź w pliku reguł, czego dotyczy ten przepis; jeśli nie dotyczy notatek ani zmiany zadań w tym momencie cyklu, zamień na właściwą podstawę albo usuń plakietkę.
4. **„Wstaw do uzasadnienia” bez zaznaczonych notatek** mówi, co zrobić („Zaznacz notatki, które mają trafić do uzasadnienia”), zamiast nic nie robić. Wstawiane notatki mają postać cytatu z datą („Notatka z 11.02.2025: …”), każda w osobnym wierszu.
5. **Sprawy po terminie** na stronie głównej są oznaczone słowem („po terminie od 27.12.2024”), nie samym kolorem.
6. **Oś czasu Ewy:** na starcie cyklu (02.12.2024) widnieje „Zaproszenie na rozmowę oceniającą”; ma to być rozmowa o kryteriach.
7. **Konto dyrektora generalnego** (Barbara Szymańska jest już w danych): konto na liście wyboru, rozpatrzenie wniosku Anny o zmianę terminu, widok statystyk urzędu bez nazwisk (użyj istniejących kafelków terminowości).
8. **Osoba z arkuszem A w danych pokazowych** (kierownik urzędu; mapowanie jest w `src/engine/criteria.ts`), żeby arkusz A dało się otworzyć.
9. **Porządki w kadrach:** w CSV osobne kolumny „Termin oceny” i „Termin sprzeciwu”; Administrator nie figuruje na liście pracowników z arkuszem; etykieta roli Tomasza zgodna z jego funkcją.
10. **Eksport jednej oceny do pliku** (JSON albo CSV z kadr i z ekranu oceny) i **usunięcie danych pracownika** w kadrach z potwierdzeniem (słowo „potwierdzenie”, nie „podpis”).

Poza zakresem: tryb korekty administratora, zmiana dat pokazu (21–22.11.2026 zostają), początek okresu oceny liczony od daty kryteriów (pytanie do mentora).
