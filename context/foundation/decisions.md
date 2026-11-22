# Decyzje autora

Decyzje podjęte przez autora 21.11.2026 (17:57–19:00) po przejściu całego planu punkt po punkcie. Mają pierwszeństwo przed PRD, roadmapą i każdym starszym planem. Zmiana którejkolwiek wymaga zgody autora.

## 1. Teza

**Decyzja.** Przełożony ocenia dwa lata pracy, a pamięta ostatnie tygodnie. Produkt to przewodnik po procesie i notatki o faktach zbierane przez cały cykl.

**Dlaczego.** Trudności, które wymienia organizator, dotyczą wyboru kryteriów, rozmów, uzasadnienia i terminów. Żadna nie polega na tym, że brakuje tekstu oceny.

**Odrzucono.** Produkt, w którym sednem jest AI pisząca ocenę albo czat z asystentem. Model może dopisać fakt o człowieku, którego nie było. Ocena pracownika to w AI Act obszar wysokiego ryzyka. Dane wysyłane poza urząd wymagają anonimizacji.

**Najsłabsze miejsce.** Oryginalność i moduł HR partnera, który organizator nazywa innowacyjnym i ocenia osobno. Odpowiedź: asystent pilnuje procesu i pamięci o faktach, a nie wystawia ocen.

## 2. Bez modelu w prototypie

**Decyzja.** W prototypie nie działa żaden model językowy ani decyzyjny.

**Dlaczego.** Model piszący o człowieku może dopisać fakt, a na scenie bez karty graficznej może nie zdążyć. Uruchomienie lokalnego modelu to kilka godzin, których nie ma. Wersja na regułach najlepiej spełnia kryterium wdrożenia: przeglądarka, baza w pliku, żadnego dodatkowego sprzętu.

**Odrzucono.** Lokalny model do rozpoznawania sygnałów w notatkach. Model językowy porządkujący notatki i piszący uzasadnienie.

## 3. HR partner

**Decyzja.**

1. Zmianę zadań pracownika zaznacza przełożony polem „Zmiana zadań pracownika” przy notatce. Lista słów tylko wstępnie zaznacza to pole, przełożony może je odznaczyć.
2. Po notatce z zaznaczonym polem partner pyta „To stała zmiana zadań?”. Po „tak” pokazuje kartę rozmowy i jedną formę rozwoju z katalogu.
3. Notatka ma pole „dobrze / do poprawy”, wypełniane wyłącznie przez przełożonego.
4. Jest ekran „Przed rozmową z pracownikiem”. Pokazuje: notatki sprzed zmiany zadań i po niej, kryteria bez żadnej notatki, czas od ostatniej informacji zwrotnej, podwładnych, o których przełożony od dawna nie ma żadnej notatki (zdaniem, bez liczb przy nazwisku; decyzja 10k). Każda pozycja ma pytanie albo proponowane działanie.
5. Są karty przygotowania do rozmowy rozpoczynającej i oceniającej z tematami wymaganymi przez rozporządzenie oraz przypomnienie o docenianiu.

**Dlaczego.** Samo wykrywanie zmiany zadań po słowach w tekście nie działa wystarczająco dobrze, żeby na nim polegać. Pole wypełnione przez człowieka jest pewne, a lista słów oszczędza jedno kliknięcie. Ekran „Przed rozmową” daje to, czego organizator oczekuje od HR partnera (analiza sytuacji, ryzyka, sugestie działań), bez rozumienia tekstu: z dat, liczb i pól.

**Odrzucono.** Wskaźnik motywacji, etykiety typu „ryzyko odejścia”, analizę nieobecności. Seria zwolnień lekarskich to dane o zdrowiu. Etykieta przy nazwisku to profilowanie pracownika.

**Uzupełnienie z 22.11.2026 (final-polish). Gdy po zmianie zadań wraca praca po godzinach.** Jeśli notatki przełożonego datowane po granicy zmiany zadań zawierają słowa z listy urzędu („po 18”, „wieczorami”, „nadgodziny”, „weekend”; lista to ustawienie urzędu, jak lista słów zmiany zadań), ekran „Przed rozmową z pracownikiem” pokazuje mu pytanie: „Od zmiany zadań w Twoich notatkach wraca praca po godzinach. Czy zakres zadań jest do udźwignięcia?” — z odnośnikami do tych notatek i z kartą rozmowy o podziale zadań (po odpowiedzi „tak” na notatce ze zmianą zadań). Pytanie opiera się wyłącznie na datach, polach i własnych wpisach oceniającego: bez etykiety i wskaźnika przy nazwisku, bez punktów, bez modelu językowego (zasady 4, 5 i 7 w `AGENTS.md`). Przeciążenie po zmianie zadań trafia do rozmowy o podziale zadań, nie do uzasadnienia oceny.

**Autor (22.11.2026 ok. 03:15):** „z twojego przeglądu naprawiamy wszystko, co tam było do zaznaczenia i poprawy, oraz naprawiamy wszystko, co ten grog nam tutaj pokazał”.

**Odrzucono.** Etykieta „przeciążony” i wskaźnik przy nazwisku (profilowanie), punkty ryzyka, ocena „1” oparta na notatkach o pracy po godzinach (dane pokazowe rozdzielają te dwie sprawy).

## 4. Zakres

**Decyzja.** Cały proces płytko, nie jeden fragment głęboko. Z 30 czynności z listy organizatora: 15 działa, 12 jest uproszczonych, 3 są poza prototypem.

- **Działa (15):** przypomnienie o wyznaczeniu kryteriów; wybór kryteriów i potwierdzenie rozmowy przez oceniającego; potwierdzenie kryteriów przez ocenianego; przypomnienie o terminie oceny; wystawienie oceny; potwierdzenie zapoznania z oceną; stwierdzenie fikcji zapoznania; przesunięcie terminu przez długą nieobecność; przypomnienie o obowiązkowym stopniu służbowym; zmiana oceniającego; wpisanie nieobecności; historia ocen; podgląd arkusza; pobranie arkusza; wydruk arkusza.
- **Uproszczone (12):** zmiana terminu przez oceniającego; zaproszenia na obie rozmowy (karta z datą, bez e-maila; liczone jako 2); wniosek ocenianego o zmianę terminu; wniosek o stopień; zmiana oceny po sprzeciwie; ponowna ocena po sprzeciwie; dane pracowników i podległość (wgrane skryptem; liczone jako 2); archiwizacja; statystyki; lista pracowników bez wyszukiwania.
- **Poza prototypem (3):** edycja danych pracownika, zastępstwa, usunięcie danych.

**Dlaczego.** Organizator wymaga pokazania całego procesu. Wąski, dopracowany fragment traci na kompletności i na związku z wyzwaniem.

## 5. Potwierdzenia i fikcja zapoznania

**Decyzja 5a.** Oceniający i oceniany potwierdzają kliknięciem, każdy na własnym koncie. System sam wpisuje miejscowość, datę i nazwisko, a pola się blokują. Konta pokazowe są bez hasła. Mówimy „potwierdzenie”, nigdy „podpis”. Zdanie dla jury: „Kliknięcie to potwierdzenie w systemie. Moc prawną daje dziś wydruk z podpisem. Urząd może w tym miejscu podpiąć podpis kwalifikowany albo zaufany” (brzmienie po decyzji 11b).

Pracownik potwierdza w cyklu dokładnie dwie rzeczy: część I (rozmowa o kryteriach, kryteria, termin) i część II (zapoznanie z oceną). Notatek przełożonego nie potwierdza.

**Decyzja 5b.** Gdy oceniany nie potwierdza zapoznania, oceniający sam klika „Stwierdź fikcję zapoznania” i wybiera „nie mógł” albo „nie chciał”. System liczy terminy od tego dnia (brzmienie po decyzji 11a). Kadry tylko widzą wpis. Nie ma automatu, który wpisuje fikcję po upływie czasu.

**Dlaczego.** Organizator sam opisuje potwierdzenie z automatycznym wpisem; prawdziwy podpis to osobny projekt. Słów „fikcja zapoznania” nie ma w ustawie ani w rozporządzeniu, są tylko w materiałach organizatora, bez trybu i terminu. System nie przesądza więc sam skutku prawnego wobec pracownika, a oceniający nie potrzebuje drugiej osoby do jednego wpisu.

**Odrzucono.** Finał pokazu na wydruku „do podpisu”. Automat „po 7 dniach bez kliknięcia uznajemy za zapoznanego”. Potwierdzanie wpisu przez kadry.

**Znana luka.** Część I nie ma wyjścia, gdy pracownik jej nigdy nie potwierdzi.

## 6. Pokaz

**Decyzja 6a.** Jedna ocena (Piotra) w 5 krokach, od początku cyklu do potwierdzenia, na trzech kontach, z przesuwaniem daty tylko do przodu. Zmiana oceniającego jest pokazana na osi czasu Ewy i nie wchodzi do wersji 3-minutowej. Scenariusz: `context/foundation/demo.md`.

**Decyzja 6b.** Podpowiedź kryteriów dodatkowych pochodzi z tabeli „rodzaj obowiązku → kryterium” w pliku reguł. Przy stanowisku są zaznaczone rodzaje obowiązków z zamkniętej listy. Zdanie „dlaczego” brzmi: „bo w opisie stanowiska jest obowiązek: …”. Tabela jest oznaczona jako „ustawienie urzędu”, bo nie pochodzi z przepisów ani z materiałów organizatora.

**Odrzucono.** Pokaz na trzech różnych pracownikach. Podpowiedź ze słów w tekście opisu stanowiska. Brak podpowiedzi.

**Założenie.** Długość pokazu (3 minuty) nie jest potwierdzona przez organizatora.

## 7. Technologia

**Decyzja.** TypeScript na Bun, Hono, jeden plik SQLite (`bun:sqlite`), HTML składany na serwerze (Hono JSX), jeden układ na telefon i komputer, osobny styl do druku, przepisy w pliku JSON z wersją i datą obowiązywania, jeden proces, bez logowania i bez CI.

**Dlaczego.** Silnik wyniku i terminów istniał w tym języku z testami na przykładach organizatora. Urząd nie stawia serwera bazy. Nowe przepisy to nowy plik, a ocena pamięta swoją wersję reguł.

**Odrzucono.** Osobny frontend, osobny serwer bazy, Docker Desktop (płatny dla administracji).

**Druk.** „Drukuj / pobierz PDF” to druk z przeglądarki ze stylem do druku; osobnego generatora PDF nie ma.

**Jak o tym mówić.** Zmiana wartości w przepisach nie wymaga programisty; nowy sposób liczenia wymaga. Jeden plik bazy to jedna instalacja na urząd. Logowanie to krok wdrożeniowy.

## 8. Praca nad kodem

- **8a.** Kolejność budowy: F-01, S-01, S-02, S-04, S-05, S-06, S-03 (HR partner przed kadrami i osią czasu; oś czasu na końcu, zmienione decyzją 10h).
- **8b.** Kod i nazwy plików po angielsku, interfejs po polsku.
- **8c.** Push tylko na polecenie autora.

## 9. Miejsce na model w przyszłości

**Decyzja.** Prototyp działa na regułach, ale pomysł pokazuje, gdzie urząd może włączyć model uruchomiony u siebie jako wsparcie w tle. W produkcie: adapter dla podpowiedzi i ekran „Skąd biorą się podpowiedzi” (FR-036). W prezentacji: jeden slajd. W opisie: jedno zdanie.

Miejsca na ekranie „Skąd biorą się podpowiedzi”:

| # | Miejsce | Co robiłby model w tle | W prototypie |
|---|---|---|---|
| 1 | zapis notatki | wstępnie zaznacza pole „Zmiana zadań pracownika” | działa na liście słów |
| 2 | zapis notatki | ostrzega, że notatka zawiera dane o zdrowiu | tylko pokazane jako miejsce |
| 3 | zapis notatki | podpowiada kryterium, którego notatka dotyczy | tylko pokazane jako miejsce |
| 4 | zapis notatki | „podobna notatka już jest” | tylko pokazane jako miejsce |
| 5 | karta rozmowy | dopasowuje formę rozwoju z katalogu | tylko pokazane jako miejsce |
| 6 | uzasadnienie oceny | wskazuje zbyt trudne zdania, niczego nie przepisuje | tylko pokazane jako miejsce |

Pod tabelą lista „Czego model nigdy nie robi”: nie proponuje punktów, nie pisze tekstu o pracowniku, nie oznacza notatki jako „dobrze / do poprawy”, nie porównuje pracowników.

Warunki wspólne dla każdego miejsca: model tylko przygotowuje albo porządkuje; wynik to pozycja z zamkniętej listy albo wskazanie fragmentu; przełożony poprawia jednym dotknięciem; ekran działa także bez modelu; do modelu nie trafiają nazwiska.

Adapter powstaje w plastrze notatek (S-04), ekran w plastrze HR partnera (S-05). Adapter dostaje treść notatki bez nazwisk i zwraca: źródło podpowiedzi (`rules`, `local-model` albo `none`) oraz podpowiedź pola „Zmiana zadań pracownika”. Domyślnie działają reguły, a model jest wyłączony. Gdy model nie odpowie w krótkim czasie, wynik dają reguły. Dokładny kształt ustala plan plastra S-04.

**Dlaczego.** Ocena pracownika to w AI Act obszar wysokiego ryzyka. Funkcja pomocnicza unika tego reżimu tylko wtedy, gdy przygotowuje albo porządkuje i nie profiluje człowieka. Otwarte polskie modele (PLLuM, Bielik) da się uruchomić lokalnie bez opłat, a gotowej państwowej usługi z takim modelem dla urzędów dziś nie ma.

**Czego nie mówić.** Że KPRM pilotuje PLLuM (niepotwierdzone). Kwot i dat projektów państwowych bez sprawdzenia u źródła.

**Odrzucono.** Uruchomienie modelu w prototypie. Działające ostrzeżenie o danych o zdrowiu jako dodatkowa funkcja.

## 10. Decyzje z dialogu przed budową (21.11.2026, 21:30–22:50)

Przyjęte przez autora, po jednej naraz.

- **10a. Start budowy.** Budowa stoi do końca dialogu o decyzjach, także część F-01 bez ekranów. Odrzucono: silnik i baza równolegle z dialogiem.
- **10b. Wygląd.** Jedynym źródłem wyglądu jest design system autora (powstaje osobno). Pierwszy ekran autor akceptuje na zrzutach 360 i 1440 px jeszcze 21.11 przed snem; potem wygląd jest powielany bez pytań. Gdy design system nie jest gotowy, powstaje logika i testy kolejnych plastrów bez stylów. Odrzucono: własne style agenta z podmianą na końcu.
- **10c. Ostrzeżenie „fakty tylko z ostatniego miesiąca”.** Do danych pokazowych dochodzi jedna notatka Marka o Piotrze z 12.11.2026 przy kryterium bez innych notatek; bez niej ostrzeżenie z kroku 4 pokazu by się nie pojawiło. Odrzucono: pisanie notatki na żywo, pokaz bez tego ostrzeżenia.
- **10d. Część I bez potwierdzenia.** Luka zostaje. Oceniający i kadry widzą „czeka na potwierdzenie od X dni”. Zdanie dla jury: „Tryb na brak potwierdzenia ustala urząd, system go nie przesądza”. Odrzucono: wpis oceniającego jak przy fikcji zapoznania (brak podstawy prawnej).
- **10e. Treści pisane przy budowie** (tabela „rodzaj obowiązku → kryterium”, lista słów, katalog form rozwoju, karty rozmów, pytania „Przed rozmową”). Autor ich osobno nie przegląda.
- **10f. Uzasadnienie z notatek.** Przełożony zaznacza notatki przy kryterium i klika „Wstaw”; trafiają z datą do zwykłego pola tekstowego, które może poprawić. Nic nie wstawia się samo. Nad polem zdanie „Ten tekst przeczyta pracownik”. Odrzucono: wstępne wypełnienie wszystkimi notatkami, same odsyłacze bez wklejania.

- **10g. Koniec budowy.** Nowe funkcje powstają do 07:00 w niedzielę 22.11. Od 07:00 do 11:00: dwa pełne przebiegi pokazu, naprawa błędów z przebiegów, nagranie zapasowe, prezentacja PDF. Plaster, który o 07:00 nie działa, zostaje jako stan na ekranie albo wypada ze scenariusza. Odrzucono: 05:00, 09:00, brak sztywnej godziny.
- **10h. Co wypada pierwsze.** Oś czasu (S-03) jest budowana na końcu, po ekranie kadr i wydruku (S-06). Dlaczego: S-06 to 5 z 15 czynności liczonych jako „działa” i ostatni krok każdej wersji pokazu; S-03 to 3 z 15 i krok, którego wersja 90-sekundowa nie ma. Zmienia decyzję 8a. Odrzucono: S-06 na końcu; S-06 zaraz po S-02 (cierpiałby HR partner).
- **10i. Dane wgrane z przyszłości.** Każde wgrane zdarzenie ma datę, a ekrany pokazują tylko te, których data już minęła według daty systemowej. To, co kliknięte na żywo, zapisuje się z datą systemową i zostaje. Zdanie dla jury: „Dwa lata pracy są wgrane z góry, a przesunięcie daty je odsłania”. Wymóg: w kroku 1 Marek wybiera kryterium „Orientacja na klienta/interesanta”, bo wgrana notatka z 04.08.2025 jest do niego przypisana. Odrzucono: dwa stany bazy podmieniane przy zmianie daty; początek cyklu na innej osobie.
- **10j. Informacja zwrotna.** Przy notatce jest przycisk „Przekaż pracownikowi”. Otwiera tekst notatki do poprawy; pracownik widzi wysłaną wersję, a samej notatki nie widzi na swoim koncie; na wniosek urząd mu ją wydaje (brzmienie po decyzji 11c). Data wysłania zeruje przypomnienie o docenianiu. Odrzucono: osobny formularz; przełączenie notatki na widoczną.
- **10k. Rozkład notatek w zespole.** Ekran „Przed rozmową” mówi zdaniem o przełożonym, na przykład „O Marii nie masz żadnej notatki od 6 miesięcy”, z przyciskiem „Dopisz notatkę”. Nazwiska bez liczb. Zmienia brzmienie decyzji 3 pkt 4. Odrzucono: liczby notatek przy nazwiskach (czyta się jak ranking); usunięcie pozycji.
- **10l. Adapter podpowiedzi.** Jedno wejście (treść notatki bez nazwisk), wynik: źródło i podpowiedź pola. Działają reguły. Gałąź modelu z testem na atrapie lokalnej usługi (przełączenie i powrót do reguł po przekroczeniu czasu) powstaje jako pierwsza rzecz, jeśli zostanie czas. Odrzucono: atrapa od razu; sam opis bez gałęzi.
- **10m. Nieobecność bez rodzaju.** System zapisuje tylko daty i to, czy nieobecność jest usprawiedliwiona. Zdanie dla jury: „System nie wie, czy to choroba, bo do terminu wystarcza mu data”. Odrzucono: rodzaj widoczny tylko dla kadr.
- **10n. Fikcja zapoznania.** Przycisk jest dostępny od razu po zatwierdzeniu oceny. Przed zapisem ekran pokazuje skutek („Urząd przyjmuje dzisiejszy dzień jako dzień zapoznania. Od dziś system liczy 7 dni na sprzeciw”), wymaga wyboru „nie mógł” albo „nie chciał” oraz wpisania, jak i kiedy doręczono kopię arkusza (brzmienie po decyzji 11a). Odrzucono: próg dni z ustawień urzędu (liczba bez podstawy); zapis bez ekranu skutku.

## 11. Poprawki po sprawdzeniu przepisów (21.11.2026, 23:30)

Przyjęte przez autora po sprawdzeniu decyzji na aktualnym brzmieniu ustawy o służbie cywilnej, rozporządzenia o ocenach, Kodeksu pracy, RODO i AI Act. Żadna nie zmienia zakresu. 11a–11c zmieniają brzmienie decyzji 10n, 5a, 5b i 10j (naniesione także w ich treści wyżej).

- **11a. Fikcja zapoznania: słowa i jedno pole.** Ekran skutku mówi: „Urząd przyjmuje dzisiejszy dzień jako dzień zapoznania. Od dziś system liczy 7 dni na sprzeciw”. Wpis wymaga dodatkowo dwóch pól: jak doręczono kopię arkusza (osobiście, pocztą, pocztą elektroniczną) i kiedy. Dlaczego: sprzeciw służy „w terminie 7 dni od dnia zapoznania się z oceną” (art. 83 ust. 1 ustawy), a ustawa i rozporządzenie nie znają fikcji zapoznania, więc system nie może podawać biegu terminu jako faktu prawnego. Kopię arkusza oceniający doręcza ocenianemu (§ 12 ust. 2 rozporządzenia); to doręczenie jest przesłanką wpisu, zwłaszcza przy „nie mógł”. Odrzucono: zdanie „Od dziś biegnie 7 dni na sprzeciw”.
- **11b. Potwierdzenie a podpis.** Zdanie dla jury: „Kliknięcie to potwierdzenie w systemie. Moc prawną daje dziś wydruk z podpisem. Urząd może w tym miejscu podpiąć podpis kwalifikowany albo zaufany”. Dlaczego: ocenę „sporządza się na piśmie” (art. 81 ust. 3 ustawy), a część I oceniany „potwierdza podpisem” (§ 6 ust. 2 rozporządzenia). EZD to system obiegu dokumentów, nie podpis. Odrzucono: „Urząd, który ma podpis zaufany albo EZD, podpina go w tym miejscu”.
- **11c. Notatka nie jest „prywatna”.** Na ekranach i w pokazie: „Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje”. Dlaczego: notatka o pracowniku to jego dane osobowe i ma on prawo dostępu do nich oraz do kopii (RODO art. 15 ust. 1 i 3); wymagania już przewidują eksport na wniosek. Odrzucono: słowo „prywatna” w interfejsie i w pokazie.
- **11d. Zmiana terminu oceny.** Stan uproszczony na ekranie kadr pokazuje podstawę (art. 81 ust. 8 ustawy) i zdanie: „Po zmianie terminu oceniający zawiadamia pracownika pisemnie, a kopia pisma idzie do arkusza” (§ 8 rozporządzenia). Gdyby powstał formularz zmiany terminu, lista powodów jest zamknięta: cztery z art. 81 ust. 8.
- **11e. HR partner: podstawa prawna zmiany zadań.** Karta „Rozmowa po zmianie zadań” ma zdanie: „Jeśli to zmiana stanowiska z istotną zmianą obowiązków, prawo wymaga nowej rozmowy o kryteriach albo oceny. Sprawdź terminy z kadrami”, z podstawą: art. 81 ust. 6 ustawy i § 9 ust. 1–2 rozporządzenia. System sam tego nie rozstrzyga.
- **11f. Brzmienie tezy (22.11.2026).** Teza z decyzji 1 brzmi: „Przełożony ocenia dwa lata pracy, a pamięta ostatnie tygodnie”. Znaczenie i zakres bez zmian. Odrzucono: „Ocena okresowa psuje się przez 24 miesiące przed formularzem, a nie w formularzu” (kalka, nie brzmi po polsku).

Potwierdzone bez zmian: prototyp na regułach nie jest „systemem AI” (AI Act art. 3 pkt 1, motyw 12); obowiązki dla systemów wysokiego ryzyka z załącznika III stosuje się od 2 grudnia 2027 (art. 113 lit. c (i) po zmianie rozporządzeniem (UE) 2026/1744); nieobecność bez rodzaju wystarcza (art. 81 ust. 7 ustawy); odrzucenie analizy nieobecności, wskaźników i etykiet (RODO art. 9 ust. 1 i art. 4 pkt 4).

## 12. Ustalenia agenta po recenzjach planów (22.11.2026, 00:00–01:30)

To nie są decyzje autora. Agent przyjął je sam, bo są techniczne i dają się cofnąć; autor może każde zmienić. Szczegóły są w rozdziale „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`.

- **12a. Przykład sprzeciwu w danych pokazowych** jest na nowej osobie bez konta, Katarzynie Lewandowskiej (podwładna Anny). Maria nie ma żadnego cyklu, bo na niej widać zdanie „O Marii nie masz żadnej notatki…”.
- **12b. Kryteria i termin części I blokują się już przy przekazaniu**, a nie dopiero po potwierdzeniu ocenianego, jak mówi PRD. Powód: nie budujemy wycofania przekazanej części I.
- **12c. Trzy rzeczy potrzebne do wersji 5-minutowej pokazu** (fikcja zapoznania z wglądem kadr, przycisk odnotowania stopnia, zmiana oceniającego na osi Ewy) powstają zaraz po wersji minimalnej swoich plastrów.
- **12d. Termin oceny ma trzy źródła:** termin przekazany w części I, termin bieżący przed zatwierdzeniem i termin zamrożony w ocenie po zatwierdzeniu. Nieobecność wpisana po zatwierdzeniu nie zmienia terminu tej oceny.
- **12e. „Telefon” na pokazie** to widok 360 px w osobnym oknie przeglądarki na komputerze z aplikacją (osobny profil albo okno prywatne dla każdego konta). Prawdziwy telefon tylko przez sieć lokalną.
- **12f. Datę systemową** może przesunąć każde konto, zawsze tylko do przodu.
- **12g. Moduł podpowiedzi** (`src/suggestions/index.ts`) tworzy S-01 razem z podpowiedzią kryteriów; S-04 i S-05 dopisują swoje wejścia. Decyzja 9 mówiła o S-04, bo powstała przed planami.
- **12h. Wersje pokazu** w planach to 90 sekund i 5 minut (`context/foundation/demo.md`); „3 minuty” w starszych zdaniach to założona długość slotu, nie osobna wersja.

Trzy sprawy z warsztatu event stormingu czekają na decyzję autora (przyjęte ustawienie domyślne w nawiasie): czy oceniany widzi wpis o fikcji zapoznania (nie widzi, jak w PRD); czy pokaz Ewy mówi, że nowy oceniający nie widzi notatek poprzednika (nie mówi); czy rozmowa o kryteriach ma własną datę (nie ma, liczy się dzień przekazania części I). Pełna lista miejsc niepewnych: `context/domain/event-storming.board.json`.

## 13. Poprzeczka jakości (decyzja autora, 22.11.2026, ok. 01:35)

Autor: „samo kodowanie szybko nam teraz idzie wiec mozna powiedziec ze mamy mnostwo czasu na dopracowanie tego na 100% - to ma byc projekt ktory powalczy o nagrode glowna - nie ma zadnych polsrodkow”.

- **13a. Cel to nagroda główna.** Czas zwolniony przez szybkie kodowanie idzie na dopracowanie, nie na nowe funkcje bez sensu dla jury.
- **13b. „Gotowe” znaczy sprawdzone tak, jak zobaczy to juror:** cały przebieg kliknięty w prawdziwej przeglądarce przy 360 i 1440 px, zrzuty porównane z makietami, testy zielone. Zielone testy i PASS arbitra to warunek konieczny, nie dowód gotowości.
- **13c. Każdy ekran na poziomie przyjętych makiet** (`context/design/`). Ekran, którego makieta nie pokazuje, najpierw powstaje jako wizja do oceny okiem autora, potem w kodzie.
- **13d. Zakres i to, co widać na ekranach, ustalamy z autorem** w kolejnym kroku workflow 10x (roadmapa i plany), zanim powstanie kod.
- Odrzucono: oddanie „bo działa” i poprawianie wyglądu na końcu.
- **13e. Juror poznaje mOcenę przez przewodnik pokazu** na żywej stronie: wejście z tezą i przyciskiem „Rozpocznij pokaz”, 5 kroków, w każdym jedno kliknięcie zmienia konto i datę, a ramka mówi, na co patrzeć i który przepis działa. Odrzucono: nagranie i PDF jako główna droga, swobodne klikanie z instrukcją.
- **13f. Widoczny zostaje cały proces**, dopracowany, bez nowych funkcji. Odrzucono: chowanie funkcji spoza 5 kroków, nowe funkcje.
- **13g. Push na GitHub po każdym sprawdzonym etapie**, po kontroli, że w repo nie ma prywatnych ścieżek ani materiałów organizatora. Zmienia decyzję 8c (push tylko przez autora) na ten czas.
- **13h. Wygląd przewodnika: wejście V3 (oś dwóch lat z pięcioma przystankami) i krok V2 (karta boczna z numerowaną listą „Na co patrzeć”, na telefonie zwijana karta u dołu).** Wzorzec: `context/design/mockups/tour/`. Odrzucono: pasek u góry (V1), przyciemniony ekran z dymkiem (V3 krok).
- **13i. Dobudowujemy do pełnej wersji trzy uproszczone czynności (autor, 22.11 ok. 03:15):** zmiana terminu oceny przez oceniającego i wniosek ocenianego o zmianę terminu z rozpatrzeniem; zaproszenia na rozmowę o kryteriach i rozmowę oceniającą; dane i lista pracowników w kadrach (wyszukiwanie, sortowanie, edycja danych, zastępstwa, eksport zestawienia). Sprzeciw zostaje uproszczony. Nagranie robimy na końcu według wzoru autora. Autor: na ekranach jest za dużo tekstu (szczegóły dopisze). Odrzucono: ogłaszanie „ostatniej rundy”; poprawki trwają do oddania.

## Pytania otwarte (do mentorów organizatora)

1. Czy potwierdzenie w systemie na własnym koncie wystarcza zamiast podpisu? (Z przepisów: nie zastępuje podpisu, decyzja 11b. Pytanie zostaje o to, czego organizator oczekuje w prototypie.)
2. Czego organizator oczekuje od modułu HR partnera?
3. Czy uzasadnienie złożone z notatek przełożonego jest akceptowalne?
4. Kto w praktyce stwierdza fikcję zapoznania i co musi być zapisane?
