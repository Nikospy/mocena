# Paczka „pomiar całości” (gałąź `final-audit`)

Cel: żaden ekran ani stan aplikacji nie zostaje bez zrzutu i pomiaru. Pierwszy przegląd objął tylko 27 stanów z pokazu; autor: „całość, dosłownie CAŁOŚĆ naszego projektu ma być na doskonałym poziomie, żadnego więcej pomijania”. Zasady wspólne: `change.md`.

Wolno zmieniać: `scripts/design-audit.ts` (jesteś jego właścicielem; paczka „wygląd” go nie rusza), nowe pliki w `scripts/`, `context/archive/final-polish/coverage.md`. Kodu aplikacji i CSS nie zmieniasz.

1. **Spis powierzchni** w `coverage.md`: tabela wszystkich tras GET z `src/routes/` i `src/index.tsx` × role, które mają do nich dostęp × stany (pusty, wypełniony, po błędzie walidacji, po sukcesie, zablokowany, 403/404). Każdy wiersz ma nazwę zrzutu. Trasa bez zrzutu to błąd tej paczki.
2. **Rozszerz skrypt**, żeby robił zrzut i pomiar każdego wiersza spisu:
   - szerokości 320, 360, 768, 1024, 1440 (flaga `--widths`, domyślnie 360 i 1440);
   - stany błędu: wysłanie pustego albo błędnego formularza przez przeglądarkę (notatka, nieobecność, ocena, pracownik, zastępstwo, zaproszenie, zmiana terminu, fikcja zapoznania) i zrzut odpowiedzi;
   - tryb pokazu: każdy krok z włączonym panelem przewodnika (`/tour`), także ekran końcowy;
   - ekrany spoza pokazu: nowy pracownik, edycja, zastępstwa, historia ocen, zaproszenia (nowe, wysłane), docenienie, informacja zwrotna, zmiana terminu (wniosek, decyzja, pismo), fikcja zapoznania, źródła podpowiedzi, konto, strona błędu;
   - klawiatura: po 1, 3 i 6 naciśnięciach Tab zrzut z widocznym fokusem (strona główna, formularz oceny, kadry) oraz sprawdzenie, czy fokus jest widoczny (obliczony `box-shadow` albo `outline` elementu `:focus-visible`);
   - najechanie: zrzut przycisku głównego, drugorzędnego i odnośnika w stanie hover;
   - wydruk: PDF arkusza oceny (`page.pdf`) zamieniony na obrazy stron.
   Istniejące pomiary (pismo, kontrast, cele, długość wiersza, ramki, cienie, pigułki, przepełnienie) liczone dla każdego zrzutu. Opcje `--only` i `--css` zostają.
3. **Raport z pomiaru:** `scripts/design-report.ts <katalog>` czyta `metrics.json` i wypisuje tabelę progów z `visual.md` (ekran, szerokość, które progi nie przechodzą) oraz kod wyjścia 1, gdy coś nie przechodzi. To bramka dla pozostałych paczek.
4. Uruchom całość na stanie gałęzi `main`, zapisz wynik w katalogu podanym w poleceniu i dopisz do `coverage.md` kolumnę „stan wyjściowy” (przechodzi / nie przechodzi, które progi).

Kontrola pomiaru: pokaż, że bramka potrafi wyjść na czerwono (arkusz z celowo zepsutym kontrastem przez `--css`).
