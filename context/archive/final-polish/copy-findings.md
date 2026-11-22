# Przegląd tekstów interfejsu (paczka `final-copy`)

Zlecenie: `copy.md`. Przegląd z 22.11.2026, stan gałęzi `main` z ok. 03:45. Kod aplikacji nie był zmieniany; każdy wiersz to propozycja do wklejenia.

Źródła reguł: `context/domain/glossary.md` (słowo na ekranie, „nie nazywaj tego”, „Zdania, których nie mówimy”), `AGENTS.md` (zasady 1, 4–7), zasady z `copy.md`. Treść przepisów nie jest ruszana.

Jak czytać: kolumna „Waga” – **błąd** (nieprawda, zakazane słowo, zła odmiana, komunikat bez wyjścia), **niespójność** (ta sama rzecz pod dwiema nazwami, przycisk bez dopełnienia), **kosmetyka** (typografia, interpunkcja, długość). Numery linii z gałęzi `main`; przy kilku plikach mogą się przesunąć o 1–2 linie po scaleniu innych paczek – szukaj po tekście z kolumny „Tekst dziś”.

Teksty czytane w kodzie i na żywych stronach (`curl` na danych pokazowych z 9.12.2024, konta: Marek, Piotr, Ewa, Anna, Tomasz, Joanna, Administrator, Barbara Szymańska). Ekranów widocznych dopiero po przesunięciu daty (ocena zatwierdzona, zapoznanie, sprzeciw, fikcja, pismo o zmianie terminu, notatki z danymi) nie oglądano na żywo – ich teksty sprawdzono tylko w kodzie.

Liczba znalezisk:

| Rozdział | Błąd | Niespójność | Kosmetyka | Razem |
|---|---|---|---|---|
| 1. Cykl oceny | 10 | 25 | 10 | 45 |
| 2. Kadry i administrator | 12 | 21 | 35 | 68 |
| 3. Strona główna, konto, pokaz, powłoka | 10 | 19 | 16 | 45 |
| 4. Formularze i komunikaty | 9 | 33 | 11 | 53 |
| **Razem** | **41** | **98** | **72** | **211** |

Zmiany przekrojowe (dotykają kilku rozdziałów, wdraża je ten zespół, który dotyka pliku pierwszy, a reszta tylko sprawdza): przyciski nawigacji „Otwórz …” (rozdz. 3), strona błędu z układem zamiast gołego tekstu (rozdz. 4), nazwa „rozmowa o kryteriach” (rozdz. 1), etykieta wersji reguł w `src/engine/rules.ts:14` (rozdz. 3).

## 1. Cykl oceny

Zakres: Część I, karty rozmów, „Przed rozmową”, ocena, potwierdzenia, fikcja zapoznania, oś czasu, nieobecności, zmiana terminu, zmiana oceniającego, arkusz, historia ocen. Teksty czytane w kodzie i na żywych stronach (Marek, Piotr, Joanna; data pokazu 9.12.2024).

| Plik:linia | Tekst dziś | Proponowany tekst | Reguła | Waga |
|---|---|---|---|---|
| src/timeline.ts:133 | „Uznanie oceny za doręczoną” (tytuł wpisu przy fikcji zapoznania) | „Fikcja zapoznania z oceną” | słownik: „fikcja zapoznania”; doręczenie dotyczy kopii arkusza, nie oceny – dziś tekst myli dwa różne skutki prawne | błąd |
| src/timeline.ts:122 | „Część I: potwierdzenie zapoznania z kryteriami” | „Potwierdzenie części I przez ocenianego” | słownik, para 2: „zapoznanie” jest zarezerwowane dla oceny; część I się „potwierdza” | błąd |
| content/cards.json:31 | „Które kryteria spełniałeś najlepiej, a przy których oczekiwania nie zostały osiągnięte?” | „Przy których kryteriach praca szła najlepiej, a przy których oczekiwania nie zostały spełnione?” | forma niezależna od płci (karta jest ta sama dla każdego ocenianego); „spełnić oczekiwania”, nie „osiągnąć” | błąd |
| content/cards.json:7 | „Co w Twojej pracy oceniam jako dobrze spełnione kryteria, a co wymaga rozmowy?” | „Które kryteria są dla Ciebie jasne, a które trzeba doprecyzować?” | karta rozmowy na początku okresu: nie ma jeszcze czego oceniać; zdanie niegramatyczne („oceniam jako … kryteria”) | błąd |
| src/views/assessment-card.tsx:43 | przycisk „Notatki przy kryteriach” (prowadzi do formularza oceny) | „Przejdź do oceny” | przycisk mówi, co się stanie; dziś obiecuje listę notatek, a otwiera ocenę | błąd |
| src/views/assessment.tsx:312 | „Stopień docelowy: {p.grade + 1}” (cyfra arabska, np. „5”) | „Stopień docelowy: {romanGrade(p.grade + 1)}” (np. „V”) | słownik: stopnie od I do IX; arkusz i oś czasu piszą rzymskimi (`romanGrade`) | błąd |
| src/views/assessment.tsx:374 | „Stopień docelowy: {s.gradeRequest.targetGrade}” | „Stopień docelowy: {romanGrade(s.gradeRequest.targetGrade)}” | jak wyżej | błąd |
| src/timeline.ts:69 | „Nieobecność {od–do} ({m.days} dni)” | dla 1 dnia: „(1 dzień)”, dla pozostałych „({n} dni)” | odmiana przez liczby: dziś możliwe „1 dni” | błąd |
| src/views/timeline.tsx:65 | „Wpisz kolejną nieobecność” (widać także, gdy nie ma żadnej) | „Wpisz nieobecność” | tekst nieprawdziwy przy pustej liście; ta sama czynność w `src/timeline.ts:183` nazywa się „Wpisz nieobecność” | błąd |
| src/routes/assessment.tsx:217 | „Oceny nie można jeszcze zatwierdzić.” | „Oceny nie można jeszcze zatwierdzić. Uzupełnij pola z listy „Do zatwierdzenia brakuje”.” | błąd mówi, co zrobić | błąd |
| src/routes/assessment.tsx:79 | „Data rozmowy oceniającej musi być datą nie późniejszą niż dzień dzisiejszy.” | „Data rozmowy oceniającej nie może być późniejsza niż dziś.” | zdanie krótkie, bez rzeczownikowego stylu | niespójność |
| src/routes/assessment.tsx:75 | „Ocena dotyczy kryterium spoza tego cyklu: {id}” | „Jedno z kryteriów nie należy do tego cyklu. Odśwież stronę i wystaw oceny jeszcze raz.” | bez identyfikatora technicznego; błąd mówi, co zrobić | niespójność |
| src/views/acknowledgement-fiction.tsx:69 | etykieta „Kiedy” | „Data doręczenia kopii arkusza” | etykieta pola to rzeczownik, który sam mówi, o co chodzi | niespójność |
| src/views/acknowledgement-fiction.tsx:72 | „Zapisz wpis” | „Zapisz fikcję zapoznania” | przycisk: czasownik + rzecz | niespójność |
| src/views/part1.tsx:170 | „Zapisz” (obok „Potwierdzam rozmowę i przekazuję część I”) | „Zapisz szkic części I” | przycisk mówi, co się stanie; odróżnia zapis od przekazania | niespójność |
| src/views/assessment.tsx:325 | „Zapisz” (obok „Zatwierdź ocenę”) | „Zapisz szkic oceny” | jak wyżej; słownik: stan po zapisie to „szkic oceny” | niespójność |
| src/views/assessment.tsx:297 | „Wniosek o następny stopień służbowy” | „Wniosek o kolejny stopień służbowy” | słownik i arkusz (`sheet.tsx:263`, `:302`): „kolejny” | niespójność |
| src/views/assessment.tsx:373 | „Wniosek o następny stopień służbowy” | „Wniosek o kolejny stopień służbowy” | jak wyżej | niespójność |
| src/views/part1.tsx:166 | etykieta kryterium „do wyboru” | „dodatkowe” | słownik: „kryterium dodatkowe”; ekran po przekazaniu (`:182`) i ocena piszą „dodatkowe” | niespójność |
| src/views/part1.tsx:213 i content/cards.json:3 | „Karta rozmowy rozpoczynającej” (link i tytuł) | „Karta rozmowy o kryteriach” | ta sama rozmowa nazywa się na tym samym ekranie „Zaproś na rozmowę o kryteriach”; jedna nazwa (zob. listę pojęć) | niespójność |
| src/routes/cycle-start.tsx:26 | link „Karta rozmowy rozpoczynającej” | „Karta rozmowy o kryteriach” | jak wyżej | niespójność |
| src/views/before-meeting.tsx:103 | „Wróć do cyklu” (prowadzi do części I) | „Wróć do części I” | ta sama czynność w karcie rozmowy (`part1.tsx:222`) nazywa się „Wróć do części I” | niespójność |
| src/routes/cycle-start.tsx:47 | „Otwórz część I” | „Przejdź do części I” | ta sama czynność w `routes/assessment.tsx:112` to „Przejdź do części I”; jeden czasownik dla przejścia | niespójność |
| content/cards.json:41 | „Przy kryterium masz notatki tylko z ostatnich tygodni.” | „Przy kryterium masz notatki tylko z ostatniego miesiąca.” | słownik: ostrzeżenie „fakty tylko z ostatniego miesiąca” – karta ma mówić tym samym progiem | niespójność |
| content/cards.json:112 | „Karta rozmowy o podziale zadań” | „Karta rozmowy po zmianie zadań” | tytuł tej karty to „Rozmowa po zmianie zadań” (`cards.json:51`) | niespójność |
| src/views/timeline.tsx:39 | legenda „wpisał człowiek” | „wpisane przez człowieka” | para z „wyliczone z przepisu” i z podpisem nad legendą (`:35`) | niespójność |
| src/views/timeline.tsx:34 | nagłówek „Co z tego wynika” | „Daty cyklu oceny” | nagłówek nazywa to, co jest pod nim; dziś nie wiadomo, z czego „to” wynika | niespójność |
| src/views/sheet.tsx:138 (linki z `src/hr/links.ts`) | w nagłówku arkusza linki „Część I” i „Arkusz” obok przełącznika „Tylko część I” | na stronie arkusza nie pokazywać linków „Część I” i „Arkusz” albo zmienić pierwszy na „Część I – formularz” | link do bieżącej strony i dwa prawie identyczne linki „Część I” / „Tylko część I” | niespójność |
| src/views/deadline-change.tsx:101 | „Nowy termin sporządzenia oceny” | „Nowy termin oceny” | wszędzie poza arkuszem: „termin oceny”; ekran wniosku (`:173`) pisze „Nowy termin oceny” | niespójność |
| src/deadline-change.ts:40 | „…nie minęło jeszcze 6 miesięcy, więc zmiana terminu jest niedozwolona. Najwcześniej od {data}.” | „…nie minęło jeszcze 6 miesięcy. Termin można zmienić najwcześniej {data}.” | strona czynna, krótko, co dalej | niespójność |
| src/routes/absences.tsx:47 | „Cykl jest zamknięty, nieobecności nie wpisuje się.” | „Cykl jest zamknięty. Nieobecność wpisuje się tylko w otwartym cyklu.” | błąd mówi, co się stało i gdzie to zrobić | niespójność |
| src/routes/appraiser.tsx:62 | „Cykl jest zamknięty, oceniającego nie zmienia się.” | „Cykl jest zamknięty. Oceniającego zmienia się tylko w otwartym cyklu.” | jak wyżej | niespójność |
| src/deadline-change.ts:31 | „Cykl jest zamknięty, terminu już się nie zmienia.” | „Cykl jest zamknięty. Termin zmienia się tylko w otwartym cyklu.” | jak wyżej | niespójność |
| src/routes/assessment.tsx:237 i :319 | „Ocena nie czeka na potwierdzenie zapoznania.” / „Ocena nie czeka już na potwierdzenie zapoznania.” | oba: „Zapoznanie z oceną jest już zapisane.” | ten sam stan, dwie wersje; komunikat mówi, co się stało | niespójność |
| src/routes/absences.tsx:66–68, src/routes/deadline-change.tsx:65–69, :89, :126, src/deadline-change.ts:74–75, src/routes/assessment.tsx:302, :305, src/routes/appraiser.tsx:65 | komunikaty walidacji bez kropki („Podaj poprawną datę początku nieobecności”) | te same zdania z kropką na końcu („Podaj poprawną datę początku nieobecności.”) | inne komunikaty tego rozdziału kończą się kropką | niespójność |
| src/views/assessment.tsx:381 | „Pobierz ocenę (JSON)” | „Pobierz ocenę jako plik danych (JSON)” | bez żargonu; nazwa formatu tylko w nawiasie dla informatyka | kosmetyka |
| src/views/assessment.tsx:304–310 | przełącznik wniosku o stopień: „Tak” / „Nie” | „Dołączam wniosek” / „Bez wniosku” | opcje mówią, co się wybiera, bez „Tak/Nie” | kosmetyka |
| src/views/assessment.tsx:104 | „ — nie zmienia wyniku” (pauza) | „ – nie zmienia wyniku” (półpauza) | polska typografia: półpauza ze spacjami | kosmetyka |
| src/views/part1.tsx:79 | kroki „Kryteria”, „Okres oceny”, „Rozmowa”, „Ocena”, „Zapoznanie” | „Kryteria”, „Okres oceny”, „Rozmowa oceniająca”, „Ocena”, „Zapoznanie” | „Rozmowa” bez dopełnienia myli się z rozmową o kryteriach, która jest w kroku 1 | kosmetyka |
| src/views/history.tsx:14 | „Brak ocen w systemie” | „Nie ma jeszcze zatwierdzonych ocen.” | pełne zdanie z kropką; mówi, czego brakuje | kosmetyka |
| src/views/history.tsx:51 | „Ocena sprzed systemu” | „Oceny sprzed systemu” | nagłówek listy | kosmetyka |
| src/views/absence-form.tsx:61 | zakres „27.11.2024–30.12.2024” (półpauza bez spacji) | zostawić; w `assessment.tsx:396` zmienić „{od} – {do}” na „{od}–{do}” | jeden zapis zakresu dat w całej aplikacji | kosmetyka |
| src/views/deadline-change.tsx:115 | „…Kopię pisma dołącza się do arkusza. (§ 8 rozporządzenia)” | podstawę pokazać jako `<LegalBasis basis={DC.notice.basis} />` po zdaniu, bez nawiasu po kropce | interpunkcja: nawias po kropce wygląda na błąd | kosmetyka |
| src/timeline.ts:61 | „Wpisy ({n}) liczą się jako jedna nieobecność…” | „{n} wpisy liczą się jako jedna nieobecność…” (dla 5 i więcej: „{n} wpisów liczy się…”) | bez liczby w nawiasie; odmiana przez liczby | kosmetyka |
| src/timeline.ts:94 | „Zmiana oceniającego: {A} → {B}. Kryteria bez zmian” | „Zmiana oceniającego: {A} → {B}” (zdanie o kryteriach zostaje w szczegółach, `:95`) | tytuł bez drugiego zdania i bez kropki w środku | kosmetyka |

Nie przejrzane dokładnie: `src/views/components/*` (poza tym, co widać na stronach), `public/assessment.js`, `public/score-caption.js`, `public/date-words.js`, `public/auto-print.js`, stany ekranów dostępne dopiero po przesunięciu daty (ocena zatwierdzona, zapoznanie, sprzeciw, pismo o zmianie terminu) – daty nie przesuwałem, bo serwer był wspólny.


## 2. Kadry i administrator

Ekrany: „Stan cykli” (`/hr`), „Pracownicy” (`/hr/people`, formularz, usuwanie), „Zastępstwa” (`/hr/substitutions`), eksport CSV i JSON, „Terminowość w urzędzie” (`/office/statistics`), „Skąd biorą się podpowiedzi” (`/admin/suggestion-sources`), „Wdrożenie i dane” (`/about`), `README.md` (część dla jury). Sprawdzone na danych pokazowych z dnia 9.12.2024 (konta `joanna`, `admin`).

| Plik:linia | Tekst dziś | Proponowany tekst | Reguła | Waga |
|---|---|---|---|---|
| src/routes/hr-people.tsx:109 | Usunąć dane pracownika {g.person.name}? (na ekranie: „Usunąć dane pracownika Piotr Wójcik?”) | Usunąć dane pracownika {fullNameForm(name, "gen")}? (na ekranie: „Usunąć dane pracownika Piotra Wójcika?”) | odmiana nazwisk: po „pracownika” dopełniacz | błąd |
| src/routes/hr-people.tsx:107 | Potwierdzenie usunięcia danych (tytuł karty) | Usuwanie danych pracownika | słownik: „potwierdzenie” jest zarezerwowane dla potwierdzenia części I i zapoznania | błąd |
| src/views/substitutions.tsx:82 | {zastępujący} za {nieobecny} (na ekranie np. „Marek Zieliński za Anna Kwiatkowska”) | Nieobecny oceniający: {nieobecny} · zastępuje: {zastępujący} | odmiana: po „za” biernik („za Annę Kwiatkowską”), a słownik form nie ma biernika; układ z dwukropkiem nie wymaga odmiany | błąd |
| src/views/hr-overview.tsx:39 | „…, koniec w sobotę 12.12.2026, więc poniedziałek.” | „…; 30. dzień wypada w {rawDay} {raw}, więc termin przechodzi na {DOW_ACC[dow(dueOn)]}.” (np. „30. dzień wypada w sobotę 12.12.2026, więc termin przechodzi na poniedziałek.”) | zdanie bez orzeczenia, „więc poniedziałek” nic nie mówi | błąd |
| src/views/hr-overview.tsx:22 | rawDay = „dzień wolny od pracy” (na ekranie: „koniec w dzień wolny od pracy 1.01.2027”) | rawDay = „dzień wolny od pracy”, w zdaniu jak wyżej: „30. dzień wypada w dzień wolny od pracy 1.01.2027, więc termin przechodzi na …” | spójność z poprawką wiersza 39 | niespójność |
| src/views/about.tsx:77 (src/content.ts:4) | Licencja kodu: do ustalenia przez autora. | (decyzja autora) np. „Licencja kodu: MIT (plik LICENSE).” Do czasu decyzji usunąć wiersz. | jury widzi rzecz niedokończoną | błąd |
| src/views/about.tsx:53 | oceny i uzasadnienia złożone z notatek | oceny i uzasadnienia, do których oceniający może wstawić swoje notatki | zasada 4 AGENTS.md: system nie składa tekstu; „złożone z notatek” sugeruje, że składa | błąd |
| README.md:25 | Treść arkusza pochodzi od przełożonego, a uzasadnienie składa się z jego własnych notatek. | Treść arkusza pisze przełożony. Do uzasadnienia może wstawić własne notatki z datą. | jak wyżej (zasada 4) | błąd |
| src/routes/hr.tsx:110 | Nieznane rozstrzygnięcie sprzeciwu. | Wybierz wynik rozpatrzenia sprzeciwu: jeden z trzech przycisków w wierszu cyklu. | błąd mówi, co zrobić | błąd |
| src/routes/hr.tsx:113 | Sprzeciw nie czeka na rozstrzygnięcie. | Ten sprzeciw jest już rozpatrzony albo nie został wniesiony. Wróć do „Stan cykli”. | błąd mówi, co się stało i co dalej | błąd |
| src/routes/hr.tsx:97 | Nie ma obowiązku przyznania stopnia albo został już odnotowany. | Przyznanie stopnia jest już odnotowane albo obowiązek nie powstał. Wróć do „Stan cykli”. | błąd mówi, co dalej; najważniejsze na początku | błąd |
| src/routes/hr-people.tsx:126 | Potwierdź usunięcie danych pracownika. | Nie usunięto danych. Wróć i kliknij „Usuń dane pracownika”. | błąd mówi, co się stało; „potwierdź” zarezerwowane w słowniku | błąd |
| src/routes/admin.tsx:16 | Brak uprawnień. | Ten ekran widzi administrator. Zmień konto na „Administrator”. | błąd mówi, jak to naprawić; spójnie z „Ten ekran widzą kadry.” | błąd |
| src/hr/people.ts:281 | Tego konta nie można usunąć z listy pracowników. | Konta kadr i administratora nie można usunąć: bez niego nikt nie obsłuży systemu. | błąd mówi, dlaczego | kosmetyka |
| src/views/hr-overview.tsx:191 | Rozstrzygnięcie sprzeciwu: | Wynik rozpatrzenia sprzeciwu: | słownik: „rozpatrzenie sprzeciwu”; w tabeli i statystykach „Sprzeciw rozpatrzony” | niespójność |
| src/views/hr-overview.tsx:193 | Uwzględniony: zmiana oceny | Odnotuj: uwzględniony, zmiana oceny | przycisk mówi, co się stanie (czasownik); to zapis, nie etykieta | niespójność |
| src/views/hr-overview.tsx:196 | Uwzględniony: ponowne sporządzenie oceny | Odnotuj: uwzględniony, ponowne sporządzenie oceny | jak wyżej | niespójność |
| src/views/hr-overview.tsx:199 | Nieuwzględniony | Odnotuj: nieuwzględniony | jak wyżej; przycisk bez czasownika | niespójność |
| src/hr/cycle-state.ts:54 | Sprzeciw rozpatrzony: sprzeciw nieuwzględniony | Sprzeciw rozpatrzony: nieuwzględniony | powtórzenie słowa | kosmetyka |
| src/hr/cycle-state.ts:37–38 | Sprzeciw rozpatrzony: zmiana oceny / …: ponowne sporządzenie oceny | Sprzeciw rozpatrzony: uwzględniony, zmiana oceny / Sprzeciw rozpatrzony: uwzględniony, ponowne sporządzenie oceny | spójność z przyciskami i z art. 83 ust. 3 (uwzględniony / nieuwzględniony) | niespójność |
| src/hr/cycle-state.ts:64 | Rozpatrzenie do | Rozpatrzenie sprzeciwu do | etykieta bez dopełnienia w kolumnie „Termin” | kosmetyka |
| src/hr/cycle-state.ts:76 | System liczy sprzeciw do | Sprzeciw do | ta sama rzecz ma tę samą nazwę (wiersz 85: „Sprzeciw do”); „liczy sprzeciw” to skrót myślowy | niespójność |
| src/hr/cycle-state.ts:74 | Fikcja zapoznania stwierdzona {data} przez oceniającego: … | Fikcja zapoznania wpisana {data} przez oceniającego: … | słownik: fikcja to wpis oceniającego | kosmetyka |
| src/hr/cycle-state.ts:110 i src/views/hr-overview.tsx:60 | Okres oceny (stan cyklu) | Okres oceny trwa | stan zdaniem o procesie (słownik: „stan cyklu”); sam rzeczownik wygląda jak etykieta kolumny | kosmetyka |
| src/views/hr-overview.tsx:150, 161 i src/routes/hr-export.ts:13 | Stan procesu | Stan cyklu | słownik: „stan cyklu”; nagłówek ekranu to „Stan cykli” | niespójność |
| src/views/hr-overview.tsx:147 i src/routes/hr-export.ts:13 | Osoba | Oceniany | słownik: „oceniany”; obok kolumna „Oceniający” | niespójność |
| src/views/hr-overview.tsx:152, 187 | Odnośniki | Działania | na „Pracownicy” ta sama kolumna to „Działania”; „odnośniki” to język programisty | niespójność |
| src/views/hr-overview.tsx:133 | Więcej | Więcej działań | przycisk z dopełnieniem | kosmetyka |
| src/hr/links.ts:36, 37, 42 | Wpisz nieobecności | Wpisz nieobecność | w wierszu „Stan cykli” ten sam odnośnik to „Wpisz nieobecność”; ta sama czynność, ta sama nazwa | niespójność |
| src/routes/hr.tsx:53 | Pobierz ocenę (JSON) | Pobierz ocenę do systemu kadrowego (plik JSON) | bez żargonu: skrót tylko z wyjaśnieniem, po co plik | kosmetyka |
| src/views/hr-overview.tsx:80, 87 i src/routes/hr.tsx:22, 30, 31 | „Terminowość w urzędzie (bez nazwisk)” (h2), „Terminowość w urzędzie” (karta, tytuł karty przeglądarki), „Statystyki urzędu” (h1), „Zobacz statystyki” (przycisk) | h1 i tytuł: „Terminowość w urzędzie”; h2 na stronie dyrektora: „Liczby dla całego urzędu (bez nazwisk)”; przycisk: „Otwórz terminowość w urzędzie” | jedna rzecz, jedna nazwa; menu = nagłówek ekranu | niespójność |
| src/routes/hr.tsx:28 | Ten ekran widzi dyrektor generalny urzędu. | Ten ekran widzi dyrektor generalny urzędu. Zmień konto na „Barbara Szymańska”. | błąd mówi, jak to naprawić | kosmetyka |
| src/views/hr-overview.tsx:66 | Wniosek o zmianę terminu | Wniosek ocenianego o zmianę terminu | słownik: „wniosek ocenianego o zmianę terminu”; odróżnia od zmiany terminu przez oceniającego | kosmetyka |
| src/views/hr-people.tsx:157 | Typ arkusza | Arkusz | słownik: „arkusz A / B / C”; kolumna listy to „Arkusz” | niespójność |
| src/views/hr-people.tsx:179 | Urzędnik służby cywilnej (mianowany) | Urzędnik mianowany | słownik: słowo na ekranie „urzędnik mianowany” | niespójność |
| src/views/hr-people.tsx:182 | Stopień służbowy (urzędnicy) | Stopień służbowy (tylko urzędnik mianowany) | jak wyżej; „(urzędnicy)” nie mówi, kogo dotyczy | niespójność |
| src/views/hr-people.tsx:152 | Komórka organizacyjna | Komórka | lista, sortowanie i błąd mówią „Komórka”; albo wszędzie „Komórka organizacyjna” | kosmetyka |
| src/views/hr-people.tsx:235 | Zapisz | Zapisz dane pracownika | przycisk: czasownik + dopełnienie | kosmetyka |
| src/views/hr-people.tsx:237 | Wróć do listy | Wróć do listy pracowników | odnośnik opisuje cel | kosmetyka |
| src/routes/hr-people.tsx:25, 33 | Nowy pracownik (h1) | Dodaj pracownika | nagłówek nazywa czynność; ten sam tekst co przycisk na liście | kosmetyka |
| src/routes/hr-people.tsx:76, 88 | Edycja: {imię i nazwisko} | Dane pracownika: {imię i nazwisko} | nagłówek nazywa rzecz bez rzeczownika odczasownikowego | kosmetyka |
| src/views/hr-people.tsx:50 | Lista ({n}) | Pracownicy ({n}) | nagłówek nazywa, co jest na liście | kosmetyka |
| src/views/hr-people.tsx:52 | Nikt nie pasuje do wyszukiwania. | Nikt nie pasuje do „{q}”. Sprawdź pisownię albo kliknij „Pokaż wszystkich”. | pusty stan: dlaczego pusto i co zrobić | kosmetyka |
| src/views/hr-people.tsx:24 | Zapisano dane: {imię i nazwisko}. | Zapisano dane pracownika: {imię i nazwisko}. | sukces mówi, co zapisano | kosmetyka |
| src/views/hr-people.tsx:8 i :63 | Termin oceny (sortowanie) / Termin najbliższej oceny (kolumna) | Termin oceny (w obu miejscach) | ta sama rzecz, ta sama nazwa | kosmetyka |
| src/hr/people.ts:126 | Data nie może być późniejsza niż dziś. | Wpisz datę nie późniejszą niż dzisiejsza. | błąd mówi, co zrobić, bez przeczenia | kosmetyka |
| src/hr/people.ts:291 | …w cyklach lub kartotekach innych pracowników. | …w cyklach albo kartotekach innych pracowników. | polszczyzna urzędowa: „albo”, jak w reszcie aplikacji | kosmetyka |
| src/routes/substitutions.tsx:51 | Zastępca musi być inną osobą niż nieobecny. | Osoba zastępująca musi być kimś innym niż nieobecny oceniający. | ta sama rzecz, ta sama nazwa (etykieta: „Kto zastępuje”, opis: „osoba zastępująca”) | niespójność |
| src/routes/substitutions.tsx:54 | Koniec nie może być przed początkiem. | Data „Do” musi być taka sama jak „Od” albo późniejsza. | błąd nazywa pole tak jak etykieta i mówi, co wpisać | kosmetyka |
| src/routes/substitutions.tsx:52, 53 | Podaj poprawną datę początku. / Podaj poprawną datę końca. | Wpisz datę w polu „Od”. / Wpisz datę w polu „Do”. | błąd nazywa pole tak jak etykieta | kosmetyka |
| src/views/substitutions.tsx:39 | Kto jest nieobecny (oceniający) | Nieobecny oceniający | etykieta pola: rzeczownik | kosmetyka |
| src/views/substitutions.tsx:49 | Kto zastępuje | Osoba zastępująca | etykieta pola: rzeczownik; spójnie z opisem nad formularzem | kosmetyka |
| src/views/substitutions.tsx:26–27 | Podpowiedź · poradnik KPRM / To praktyka z poradnika KPRM, nie przepis. | Podpowiedź · poradnik Kancelarii Prezesa Rady Ministrów / To praktyka z poradnika Kancelarii Prezesa Rady Ministrów (KPRM), nie przepis. | skrót bez rozwinięcia przy pierwszym użyciu | kosmetyka |
| content/suggestion-sources.json:7 | „podobna notatka już jest” | ostrzega, że podobna notatka już jest | pozostałe pozycje to czasownik („wstępnie zaznacza”, „ostrzega”); tu cytat bez orzeczenia | niespójność |
| content/suggestion-sources.json:23 | przełożony poprawia jednym dotknięciem | przełożony poprawia jednym kliknięciem | aplikacja na komputerze; reszta tekstów mówi „kliknięcie” | kosmetyka |
| content/suggestion-sources.json:6, 8, 10 (×4) | tylko pokazane jako miejsce | jeszcze nie działa, to tylko miejsce na model | strona czynna, mówi stan wprost | kosmetyka |
| src/views/suggestion-sources.tsx:38 | Warunki wspólne | Warunki w każdym miejscu | nagłówek mówi, czego dotyczy | kosmetyka |
| src/views/about.tsx:57 | Oceniający widzi swoje notatki i cykle osób, które ocenia. | Autor widzi tylko swoje notatki. Oceniający widzi cykle osób, które ocenia. | słownik: notatkę widzi tylko autor (przełożony), także po zmianie oceniającego | niespójność |
| src/views/about.tsx:60 | Administrator widzi ekran podpowiedzi i datę systemową. | Administrator widzi ekran „Skąd biorą się podpowiedzi” i datę systemową. | ta sama rzecz, ta sama nazwa (nazwa ekranu ze słownika) | niespójność |
| src/views/about.tsx:64 | Do podpowiedzi notatki trafia treść bez nazwisk; … | Do podpowiedzi trafia treść notatki bez nazwisk; … | szyk: „podpowiedzi notatki” czyta się jak jedna fraza | kosmetyka |
| src/views/about.tsx:59 | …arkusze i zestawienie — bez treści notatek. | …arkusze i zestawienie. Treści notatek nie widzą. | typografia: pauza „—” zamiast półpauzy; jedno zdanie, jedna myśl | kosmetyka |
| src/views/about.tsx:68 | retencję — ile lat trzyma notatki i oceny — | okres przechowywania notatek i ocen (ile lat), | żargon („retencja”) i pauza „—” zamiast półpauzy | kosmetyka |
| src/views/about.tsx:25 | Wersja na workers.dev to wdrożenie pokazowe na zawody. | Wersja w internecie (Cloudflare Workers) działa tylko na czas zawodów. W urzędzie aplikacja działa lokalnie, bez chmury. | żargon (nazwa domeny) | kosmetyka |
| README.md:30 | Nie używa modelu językowego. Kliknięcie to potwierdzenie w systemie. Moc prawną daje dziś wydruk arkusza; urząd może w tym miejscu podłączyć kwalifikowane albo zaufane rozwiązanie elektroniczne. | Dwa punkty: „Nie używa modelu językowego.” oraz „Kliknięcie to potwierdzenie w systemie. Moc prawną daje dziś wydruk z podpisem. Urząd może w tym miejscu podpiąć podpis kwalifikowany albo zaufany.” | słownik („Zdania, których nie mówimy”, 11b) podaje to zdanie dosłownie; jeden punkt, jedna myśl | niespójność |
| README.md:9 | Kliknij »Rozpocznij pokaz« | Kliknij „Rozpocznij pokaz” | polskie cudzysłowy „…” | kosmetyka |
| README.md:18 | Wnioski do indywidualnego programu rozwoju są zawsze wymagane | Wnioski do indywidualnego programu rozwoju zawodowego są zawsze wymagane | słownik: pełna nazwa z art. 81 ust. 5 | niespójność |
| README.md:37 | Pokaz nie wysyła danych do usług zewnętrznych poza wdrożeniem pokazowym. | Wersja lokalna nie wysyła danych poza komputer. Wersja pokazowa działa w chmurze tylko na czas zawodów. | zdanie z podwójnym zastrzeżeniem trudno zrozumieć | kosmetyka |
| README.md:61 | …oraz jak chronione są dane — opisuje strona `/about` w aplikacji. | …oraz jak chronione są dane, opisuje w aplikacji strona „Wdrożenie i dane” (`/about`). | pauza „—” zamiast półpauzy; nazwa ekranu jak na ekranie | kosmetyka |


## 3. Strona główna, wybór konta, tryb pokazu, nawigacja i powłoka

Pliki: `src/index.tsx`, `src/views/layout.tsx`, `src/views/tour-entry.tsx`, `src/views/tour-panel.tsx`, `src/views/tour-done.tsx`, `src/tour/stops.ts`, `src/routes/tour.tsx`, `src/engine/rules.ts` (etykieta wersji reguł), dostawcy spraw na stronie głównej (`src/assessment/home.ts`, `src/routes/cycle-start.tsx`, `src/reminders.ts`, `src/deadline-change-links.ts`, `src/hr/links.ts`, `src/substitutions.ts`, `src/routes/notes.tsx`, `src/routes/hr.tsx`, `src/routes/hr-partner.tsx`, `src/routes/admin.tsx`), dane osób w `src/seed/base.ts` (widoczne w menu konta).

| Plik:linia | Tekst dziś | Proponowany tekst | Reguła | Waga |
|---|---|---|---|---|
| `src/tour/stops.ts:98` | „Od tej chwili biegnie termin na sprzeciw.” | „Od tej chwili system liczy 7 dni na sprzeciw.” | Słownik: „termin biegnie” na liście „nie nazywaj tego” (decyzja 11a) | błąd |
| `src/tour/stops.ts:49` | „Piotr zna kryteria i oczekiwania, zanim zacznie się okres oceny.” | „Piotr zna kryteria i oczekiwania na początku okresu oceny, a nie dopiero przy ocenie.” | Nieprawda: okres zaczął się 27.11.2024, rozmowa jest 9.12.2024 | błąd |
| `src/tour/stops.ts:98` | „Piotr czyta ocenę z uzasadnieniem złożonym z notatek i potwierdza zapoznanie.” | „Piotr czyta ocenę. Uzasadnienie napisał Marek i wstawił do niego fakty z notatek. Piotr potwierdza zapoznanie.” | Zasada 5 AGENTS.md: system nie pisze tekstu o pracowniku; „złożonym” sugeruje, że złożył je system | błąd |
| `src/tour/stops.ts:39` | „Podpowiedzi kryteriów: ramka przerywana, powód, można odrzucić.” | „Podpowiedzi kryteriów: przerywana ramka i powód. Nic nie jest zaznaczone z góry.” | Słownik („podpowiedź kryterium”: nic nie jest zaznaczone z góry); „odrzucić” sugeruje wybór systemu | błąd |
| `src/views/tour-done.tsx:29` | „W wersji 5-minutowej warto zobaczyć” | „Warto zobaczyć jeszcze” | Żargon z planu pokazu; jury nie zna „wersji 5-minutowej”, a wejście obiecuje „około 3 minut” | błąd |
| `src/views/tour-done.tsx:36` | „Fikcja zapoznania: gdy oceniany nie potwierdza oceny, oceniający wpisuje uznanie zapoznania za dokonane, z powodem i sposobem doręczenia.” | „Fikcja zapoznania: gdy oceniany nie może albo nie chce potwierdzić zapoznania z oceną, oceniający wpisuje fikcję zapoznania z powodem i sposobem doręczenia kopii arkusza.” | Słownik: potwierdza się zapoznanie, nie ocenę („akceptacja oceny” zakazana) | błąd |
| `src/engine/rules.ts:14` (widać na wejściu pokazu, w panelu przewodnika, na osi czasu) | „Zasady z rozporządzenia z 2016 r., wersja 1” (także przy „art. 81 ust. 7 ustawy”, „art. 83 ust. 1 ustawy”) | „Wersja reguł 1 (stan prawny od 23.04.2016)” | Nieprawda przy artykułach ustawy: art. 81 i 83 nie są z rozporządzenia; słownik: „wersja reguł” | błąd |
| `src/reminders.ts:33` | „Termin oceny Piotr Wójcik: 27.11.2026” | „Termin oceny Piotra Wójcika: 27.11.2026” (dopełniacz przez `nameForm(name, "gen")`, jak w `cycle-start.tsx:43`) | Odmiana nazwisk | błąd |
| `src/seed/base.ts:7` (widać w menu konta i na wyborze konta) | Wszyscy w „Wydział Organizacyjny”, także „Dyrektor departamentu” (Anna), drugi „Naczelnik wydziału” (Tomasz), kadry i administrator | Anna, Tomasz, Katarzyna: „Departament Spraw Obywatelskich”; Joanna: „Biuro Kadr”; Administrator: „Biuro Informatyki”; Barbara Szymańska: bez komórki | Wiarygodność danych pokazowych: dwóch naczelników jednego wydziału, dyrektor departamentu w wydziale | błąd |
| `src/routes/tour.tsx:35, 38, 43, 46, 53, 63` | „Nie ma takiego dodatku.” / „Nie ma takiego przystanku.” (goły tekst bez układu strony) | Strona 404 z układem: „Nie ma takiego kroku pokazu.” + odnośnik „Wróć do pokazu” (`/tour`) | Błąd mówi, co zrobić; „dodatek” i „przystanek” to nazwy z kodu | błąd |
| `src/assessment/home.ts:74–78` | „Nic na Ciebie nie czeka” / „Twój termin oceny:” / „Zobacz część I” | „Teraz nie masz spraw do załatwienia” / „Termin oceny:” / „Otwórz część I” | Zaimki małą literą, mało „Twój”; jedna nazwa czynności („Otwórz …”) | niespójność |
| `src/index.tsx:100, 109` | „Otwórz” (domyślny przycisk sprawy bez `action`: „Notatki o zespole”, „Stan cykli”, „Skąd biorą się podpowiedzi”, „Czeka na potwierdzenie zapoznania…”, „Zapoznaj się z oceną”, „Docenienie: …”, przypomnienie o terminie, „Wnioskuj o zmianę terminu”) | Każda sprawa dostaje `action` z dopełnieniem: „Otwórz notatki”, „Otwórz stan cykli”, „Otwórz źródła podpowiedzi”, „Otwórz ocenę”, „Przeczytaj ocenę”, „Otwórz kartę docenienia”, „Otwórz oś czasu”, „Złóż wniosek” | Przycisk: czasownik + dopełnienie | niespójność |
| `src/assessment/home.ts:68`, `src/routes/hr.tsx:22`, `src/routes/invitations.tsx:40, 59`, `src/deadline-change-links.ts:46`, `src/reminders.ts:30`, `src/routes/cycle-start.tsx:71` | „Zobacz ocenę”, „Zobacz statystyki”, „Zobacz zaproszenie”, „Zobacz wniosek”, „Zobacz oś czasu”, „Przejdź do potwierdzenia” | „Otwórz ocenę”, „Otwórz statystyki”, „Otwórz zaproszenie”, „Otwórz wniosek”, „Otwórz oś czasu”, „Potwierdź część I” | Ta sama czynność (przejście do ekranu) pod trzema czasownikami | niespójność |
| `src/assessment/home.ts:35` | „Czeka na potwierdzenie zapoznania: Piotr Wójcik” (przycisk „Otwórz”) | „Ocena czeka na zapoznanie: Piotr Wójcik” (przycisk „Otwórz ocenę”) | Najważniejsze słowo na początku; słownik: „zapoznanie z oceną” | niespójność |
| `src/assessment/home.ts:47` | „Zapoznaj się z oceną” (przycisk „Otwórz”) | „Zapoznaj się z oceną” (przycisk „Przeczytaj ocenę”) | Przycisk: czasownik + dopełnienie | niespójność |
| `src/deadline-change-links.ts:48` | „Wnioskuj o zmianę terminu” | „Wniosek o zmianę terminu oceny” (przycisk „Złóż wniosek”) | Nagłówek nazywa rzecz; „wnioskuj” brzmi urzędowo i sztucznie | niespójność |
| `src/deadline-change-links.ts:46` | „Twój wniosek o zmianę terminu” | „Wniosek o zmianę terminu oceny” | Mało „Twój”; ta sama nazwa co na ekranie wniosku („Wniosek o zmianę terminu oceny”) | kosmetyka |
| `src/views/layout.tsx:74` | Menu administratora: „Podpowiedzi” | „Źródła podpowiedzi” | Menu = nagłówek ekranu, na który prowadzi („Skąd biorą się podpowiedzi”); słowo „Źródła podpowiedzi” już jest w `tour-done.tsx:40` | niespójność |
| `src/routes/admin.tsx:9` i `src/views/suggestion-sources.tsx:16` | „Skąd biorą się podpowiedzi” (sprawa i nagłówek) obok menu „Podpowiedzi” i przycisku „Pokaż źródła podpowiedzi” | Zostawić nagłówek „Skąd biorą się podpowiedzi”; menu „Źródła podpowiedzi”; przycisk w pokazie „Otwórz źródła podpowiedzi” | Jedna rzecz, jedna nazwa (słownik: ekran „Skąd biorą się podpowiedzi”) | niespójność |
| `src/index.tsx:63` | „Zacznij pokaz od nowa” (na wyborze konta; kasuje dane i wraca do wyboru konta, nie uruchamia pokazu) | „Wgraj dane pokazowe od nowa” | Przycisk mówi, co się stanie; w `tour-done.tsx:47` „Zacznij od nowa” robi coś innego (startuje krok 1) | niespójność |
| `src/views/tour-done.tsx:47` | „Zacznij od nowa” | „Zacznij pokaz od nowa” | Przycisk z dopełnieniem; para z „Rozpocznij pokaz” | kosmetyka |
| `src/views/tour-done.tsx:51` | „Klikaj samodzielnie” | „Wybierz konto i klikaj samodzielnie” | Ta sama czynność co w `tour-entry.tsx:48` | niespójność |
| `src/views/tour-done.tsx:33, 41` | „Otwórz oś czasu Ewy” / „Pokaż źródła podpowiedzi” | „Otwórz oś czasu Ewy” / „Otwórz źródła podpowiedzi” | Jeden czasownik na przejście do ekranu | niespójność |
| `src/views/tour-done.tsx:37` | „Stwierdź fikcję zapoznania” | „Wpisz fikcję zapoznania” | Słownik: fikcja to „wpis oceniającego”; „stwierdź” to język decyzji administracyjnej (ten sam przycisk w `assessment.tsx:391` i `assessment/home.ts:41` — zmienić razem) | niespójność |
| `src/views/tour-done.tsx:32` | „Oceny dokonuje się na podstawie wcześniej wybranych kryteriów (§ 9 ust. 3).” | „Marek ocenia Ewę według kryteriów, które wyznaczył poprzedni oceniający (§ 9 ust. 3).” | Strona czynna, bez „dokonuje się” | kosmetyka |
| `src/views/tour-done.tsx:8` | „Wynik liczy przepis, punkty stawia przełożony.” | „Wynik liczy system według przepisu, oceny cząstkowe stawia oceniający.” | Słownik: „oceniający” (rola w cyklu), „ocena cząstkowa”; przepis niczego nie liczy | niespójność |
| `src/views/tour-done.tsx:7` | „Terminy liczy przepis, także po nieobecnościach.” | „System liczy terminy według przepisu, także po nieobecnościach.” | Podmiot czynności | kosmetyka |
| `src/views/tour-done.tsx:5` | „Kryteria ustala człowiek, system podpowiada z powodem.” | „Kryteria wybiera oceniający, system podpowiada je z powodem.” | Słownik: rola „oceniający” | kosmetyka |
| `src/views/tour-entry.tsx:41` | „Punkty stawia człowiek — samej oceny nie pisze.” | „Oceny cząstkowe stawia oceniający – asystent nie pisze ani zdania oceny.” | Półpauza ze spacjami zamiast pauzy; podmiot drugiej części niejasny; słownik: „ocena cząstkowa” | niespójność |
| `src/views/tour-entry.tsx:54` | „Formularz to ostatni tydzień.” | „Sama ocena to ostatni tydzień.” | Słownik: „formularz” na liście „nie nazywaj tego” (arkusz) | niespójność |
| `src/tour/stops.ts:84` | „Formularz oceny wypełnia się w ostatnim tygodniu, ale notatki są z 24 miesięcy. Punkty stawia Marek.” | „Ocenę wystawia się w ostatnim tygodniu, ale notatki są z 24 miesięcy. Oceny cząstkowe stawia Marek.” | Słownik: „formularz”, „punktacja” zakazane | niespójność |
| `src/views/tour-entry.tsx:56` i `:95` | „ostatnie tygodnie (powiększone): to, co pamięta przełożony” / „ostatnie 2 tygodnie: to, co przełożony pamięta” | Oba: „Ostatnie tygodnie (powiększone) – tyle pamięta przełożony” | Ta sama rzecz dwiema treściami na dwóch szerokościach | niespójność |
| `src/tour/stops.ts:61` | „Po wpisaniu »przejął« pole »Zmiana zadań pracownika« zaznacza się samo…” | „Po wpisaniu słowa „przejął” pole „Zmiana zadań pracownika” zaznacza się samo jako podpowiedź. Można je odznaczyć.” | Polskie cudzysłowy „…”, nie »…«; jedna myśl w zdaniu | niespójność |
| `src/tour/stops.ts:40` | „Karta rozmowy rozpoczynającej z tematami z przepisu.” | „Karta rozmowy o kryteriach z tematami z przepisu.” | Jedna nazwa rozmowy (zob. „Pojęcia z dwiema nazwami”) | niespójność |
| `src/tour/stops.ts:42` | „…potem przekaż Piotrowi.” | „…potem kliknij „Potwierdzam rozmowę i przekazuję część I”.” | Instrukcja nazywa przycisk tak, jak jest na ekranie (`part1.tsx:172`) | kosmetyka |
| `src/tour/stops.ts:90` | „Postaw „1” przy Rzetelności i kliknij „Wstaw do uzasadnienia”.” | „Postaw „1” przy Rzetelności, zaznacz notatki i kliknij „Wstaw do uzasadnienia”.” | Bez zaznaczenia notatek przycisk nic nie wstawia (słownik: „dopisuje zaznaczone notatki”) | kosmetyka |
| `src/tour/stops.ts:101` | „…gdy wypada w dzień wolny, przesuwa się na dzień roboczy.” | „…gdy wypada w dzień wolny, przechodzi na następny dzień roboczy.” | Słownik: „następny dzień roboczy” | kosmetyka |
| `src/tour/stops.ts:88` | „…czeka na uzasadnienie i wnioski do programu rozwoju.” | „…czeka na uzasadnienie i wnioski do indywidualnego programu rozwoju zawodowego.” | Słownik: pełna nazwa przy pierwszym użyciu w pokazie | kosmetyka |
| `src/views/tour-panel.tsx:19` | „Przełączy na konto Piotra i datę 22 listopada 2026” | „Następny krok: konto Piotra, 22 listopada 2026” | „Przełączy na datę” – zła składnia | kosmetyka |
| `src/index.tsx:83` | „Brak spraw do załatwienia.” | „Nie masz teraz spraw do załatwienia.” | Pusty stan: zdanie do osoby, bez „Brak” | kosmetyka |
| `src/index.tsx:128` | „Nie ma takiego konta.” | „Nie ma takiego konta. Wybierz osobę z listy.” | Błąd mówi, co zrobić | kosmetyka |
| `src/index.tsx:42, 45` | Tytuł karty „Wybór konta”, nagłówek „Wybierz konto pokazowe” | Tytuł karty „Wybierz konto pokazowe” | Tytuł karty = nagłówek | kosmetyka |
| `src/index.tsx:94` z `formatDate` vs pasek pokazu `formatDateLong` | „do 27.12.2024” na karcie sprawy, „dziś 9 grudnia 2024” w pasku | Zostawić 27.12.2024 w kartach i tabelach, pełny zapis tylko w zdaniach i w pasku; zapisać to jako zasadę w słowniku | Liczby i daty w jednym formacie na jednym typie miejsca | kosmetyka |
| `src/assessment/home.ts:63` | „Twoja ocena” | „Ocena okresowa” | Mało „Twoja” | kosmetyka |
| `src/hr/links.ts:20` | „Stan wszystkich cykli oceny i obowiązki urzędu” | „Stan wszystkich cykli oceny i obowiązki urzędu.” (kropka jak w innych opisach kart) | Spójna interpunkcja opisów | kosmetyka |

## 4. Formularze i komunikaty

Przejrzane: formularz notatki, lista „Notatki o zespole”, „To stała zmiana zadań?” i karta po zmianie zadań, docenienie, przekazanie informacji zwrotnej, ekran „Informacja zwrotna”, zaproszenia (formularz, strona zaproszenia, blok na karcie, pozycje listy spraw), ostrzeżenia przy kryterium, wszystkie odpowiedzi 403/404/409/422 w `src/routes/`, strony 404 i 500, `content/name-forms.json`, `content/full-name-forms.json`, `public/note-form.js`, `public/insert-notes.js`. Teksty oglądane w kontekście na danych pokazowych z 9.12.2024 (formularz notatki, docenienie, oba formularze zaproszenia, 403 z `/hr` dla Piotra, 404).

### Błędy

| Plik:linia | Tekst dziś | Proponowany tekst | Reguła | Waga |
|---|---|---|---|---|
| `src/routes/*.tsx` (ok. 75 wywołań `c.text(…, 403/404/409/422)`, np. `hr.tsx:75`, `notes.tsx:159`, `assessment.tsx:151`) | Goła strona tekstowa bez układu, nagłówka i przycisku, np. „Ten ekran widzą kadry.” (sprawdzone: `GET /hr` jako Piotr zwraca `text/plain`) | Każdy taki komunikat w układzie strony błędu (jak `NotFoundPage`): nagłówek „Nie masz dostępu do tego ekranu” (403) / „Nie ma takiej strony” (404) / „Tego nie da się już zrobić” (409), pod nim dzisiejsze zdanie, przyciski „Wróć do spraw” i „Zmień konto” | Błąd mówi, co zrobić; użytkownik nie może utknąć | błąd |
| `src/routes/hr-people.tsx:126` | „Potwierdź usunięcie danych pracownika.” (422 jako goła strona, formularz znika) | Komunikat przy polu wyboru w formularzu usuwania: „Zaznacz pole potwierdzenia, żeby usunąć dane pracownika.” | Błąd pola stoi przy polu; formularz zostaje | błąd |
| `src/views/invitation.tsx:93` | „Notatka dla ocenianego (nieobowiązkowa)” | „Wiadomość dla ocenianego (nieobowiązkowa)” | Słownik: „notatka” to fakt przełożonego, którego pracownik nie widzi; tu tekst idzie do pracownika | błąd |
| `src/invitations.ts:93` | „Notatka może mieć najwyżej 500 znaków” | „Wiadomość może mieć najwyżej 500 znaków.” | Słownik (jw.) | błąd |
| `src/views/invitation.tsx:58` | „Do granicy z § 7: ${left} dni (do 27.12.2024)” (przy 1 dniu wyjdzie „1 dni”, przy 0 – „0 dni”) | 2 i więcej: „Na rozmowę o kryteriach zostało 18 dni – do 27.12.2024.”; 1: „Na rozmowę o kryteriach został 1 dzień – do 27.12.2024.”; 0: „Termin rozmowy o kryteriach mija dziś, 27.12.2024.” | Odmiana przez liczby; bez żargonu („granica”); skrót prawny bez rozwinięcia | błąd |
| `src/views/error-page.tsx:25` | „Spróbuj jeszcze raz” (prowadzi na stronę główną, nie powtarza działania) | „Wróć do spraw” | Przycisk mówi, co się stanie | błąd |
| `content/cards.json:93` (docenienie bez przypomnienia, widoczne na `/cycles/cycle-piotr/appreciation`) | „Brak zapisanych notatek o dobrych faktach od tej daty. Dopisz notatkę, gdy coś zauważysz.” („tej daty” nie odnosi się do niczego na ekranie) | „Nie masz jeszcze notatek oznaczonych „dobrze” z tego okresu. Dopisz notatkę, gdy coś zauważysz.” i obok przycisk „Dopisz notatkę” | Tekst zrozumiały bez kontekstu; pusty stan z działaniem | błąd |
| `src/views/task-change.tsx:86` | Nagłówek „Dziękujemy” (system dziękuje, nagłówek nie mówi, co się stało) | „Zapisano odpowiedź „Nie”” (a akapit z `cards.json:72` skrócić do: „Pytanie o tę notatkę nie wróci.”) | Sukces: krótko, w czasie przeszłym; nagłówek nazywa stan | błąd |
| `src/views/task-change.tsx:88` | „Moje notatki” (prowadzi do „Notatki o zespole”) | „Wróć do notatek o zespole” | Ta sama rzecz ma tę samą nazwę | błąd |

### Niespójności

| Plik:linia | Tekst dziś | Proponowany tekst | Reguła | Waga |
|---|---|---|---|---|
| `src/views/feedback-form.tsx:28` | „Wyślij pracownikowi” | „Przekaż pracownikowi” | Słownik: informację zwrotną wysyła przycisk „Przekaż pracownikowi” (tak brzmi też przycisk na liście notatek i w docenieniu) | niespójność |
| `src/views/notes-list.tsx:51` | „Wysłano pracownikowi” | „Przekazano pracownikowi. Zobaczy tekst w „Informacji zwrotnej”.” | Jedna nazwa czynności; sukces z dalszym krokiem | niespójność |
| `src/views/feedback-form.tsx:9,11` | Tytuł i nagłówek „Przekaż pracownikowi: Piotr Wójcik” | „Informacja zwrotna dla: Piotr Wójcik” | Nagłówek nazywa rzecz, przycisk czynność; dziś nagłówek i przycisk brzmią tak samo | niespójność |
| `src/views/feedback-form.tsx:17,23` | „Twoja notatka. Pracownik zobaczy tylko tekst poniżej.” + „To zobaczy pracownik. Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje.” | Przy notatce: „Twoja notatka. Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje.”; nad polem: „Ten tekst pracownik zobaczy na swoim koncie.” | Każda informacja raz, przy rzeczy, której dotyczy; „pracownik” trzy razy w dwóch zdaniach | niespójność |
| `src/views/note-form.tsx:55–57` | Pod polem „Co się stało” brak zdania, kto widzi notatkę | Dopisać pod polem: „Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje.” | Słownik („Zdania, których nie mówimy”, 11c); użytkownik wie przed zapisem, kto przeczyta | niespójność |
| `src/routes/notes.tsx:89` | „Wpisz, co się wydarzyło.” (pole nazywa się „Co się stało”) | „Wpisz, co się stało.” | Błąd używa słów etykiety pola | niespójność |
| `src/routes/notes.tsx:93` | „Data nie może być późniejsza niż dziś.” | „Wybierz dzisiejszą albo wcześniejszą datę.” | Błąd mówi, jak naprawić | niespójność |
| `src/views/note-form.tsx:100` | „Podpowiedź · możesz odznaczyć” (widać też wtedy, gdy pole jest puste) | „Podpowiedź z listy słów urzędu” | Tekst prawdziwy w każdym stanie; „możesz odznaczyć” powtarza się w zdaniu pod polem | niespójność |
| `src/views/task-change.tsx:15` | „Nie, chwilowe zastępstwo” | „Nie, zmiana chwilowa” | Odpowiedź „nie” obejmuje każdą chwilową zmianę, nie tylko zastępstwo; „zastępstwo” ma w aplikacji osobny ekran kadr | niespójność |
| `content/cards.json:71` | „Forma rozwoju z katalogu urzędu, do rozważenia.” | „Forma rozwoju z katalogu urzędu (ustawienie urzędu). Omów ją z pracownikiem.” | Słownik: ustawienie urzędu zawsze z dopiskiem; zdanie z czasownikiem | niespójność |
| `content/cards.json:112` vs `cards.json:51` | „Karta rozmowy o podziale zadań” (link) prowadzi do karty „Rozmowa po zmianie zadań” | Link: „Karta rozmowy po zmianie zadań” | Link i nagłówek celu brzmią tak samo | niespójność |
| `src/views/invitation.tsx:24` | „Zmień termin” (przy wysłanym zaproszeniu) | „Zmień datę rozmowy” | „Termin” w aplikacji to termin oceny i „zmiana terminu” (osobny ekran, art. 81 ust. 8); tu chodzi o datę spotkania | niespójność |
| `src/invitations.ts:107,116,118` | „Wysłane 9.12, czeka na potwierdzenie” / „Potwierdzone przez Piotra 9.12” | „Wysłano 09.12.2024. Czeka na potwierdzenie ocenianego.” / „Potwierdzone przez Piotra 10.12.2024” | Jeden format daty w aplikacji (dd.mm.rrrr, jak `formatDate`) | niespójność |
| `src/views/invitation.tsx:66–67` | „Ta data jest po granicy z § 7 (27.12.2024)” / „Zaproszenie zapisze się mimo to. Termin rozmowy wynika z przepisu, nie z zaproszenia.” | „Ta data jest po terminie rozmowy o kryteriach (27.12.2024)” / „Zaproszenie i tak zostanie wysłane. Termin rozmowy wynika z § 7 rozporządzenia, nie z zaproszenia.” | Bez żargonu („granica”); skutek tymi słowami, co przycisk „Wyślij zaproszenie” | niespójność |
| `src/views/invitation.tsx:59` | „Rozmowa o kryteriach ma się odbyć w terminie z § 7 pkt 1.” | „Rozmowa o kryteriach ma się odbyć w terminie z § 7 pkt 1 rozporządzenia.” | Skrót prawny z nazwą aktu przy pierwszym użyciu na ekranie | niespójność |
| `src/invitations.ts:89–93` vs `src/routes/notes.tsx:88–93` | Błędy zaproszenia bez kropki („Podaj godzinę, na przykład 10:00”), błędy notatki z kropką | Wszystkie komunikaty błędów pól kończą się kropką: „Podaj godzinę, na przykład 10:00.”, „Podaj miejsce, na przykład „pokój 214” albo „wideo”.”, „Miejsce może mieć najwyżej 120 znaków.” | Jedna typografia komunikatów | niespójność |
| `src/invitations.ts:89`, `src/routes/notes.tsx:92` | „Podaj poprawną datę rozmowy” / „Podaj poprawną datę.” | „Wybierz datę rozmowy z kalendarza.” / „Wybierz datę z kalendarza.” | Błąd mówi, jak naprawić | niespójność |
| `src/notes/warnings.ts:7` | „Ocena skrajna, a przy tym kryterium nie masz żadnej notatki.” | „Ocena cząstkowa 1 albo 9, a przy tym kryterium nie masz żadnej notatki. Na jakich faktach ją opierasz?” | Słownik: „ocena cząstkowa”; ostrzeżenie mówi, co zrobić (jak drugie ostrzeżenie, które kończy się pytaniem) | niespójność |
| `src/views/appreciation.tsx:23` | Nagłówek „Docenienie” bez nazwiska (na ekranie nie widać, kogo dotyczy) | „Docenienie: Piotr Wójcik” | Ekran o osobie mówi, o kim (jak „Nowa notatka: Piotr Wójcik”) | niespójność |
| `src/views/appreciation.tsx:31–33` | Trudna sytuacja bez śródtytułu (w karcie po zmianie zadań jest „Trudna sytuacja”) | Dodać śródtytuł „Trudna sytuacja” | Ten sam element ma ten sam nagłówek | niespójność |
| `src/hr-partner/partner.ts:146` | „Karta docenienia” (przycisk) | „Otwórz kartę docenienia” | Przycisk: czasownik + dopełnienie | niespójność |
| `src/views/notes-list.tsx:65` | „Cykl oceny” (przycisk) | „Otwórz cykl oceny” | Przycisk: czasownik + dopełnienie | niespójność |
| `src/views/error-page.tsx:10` | „Strona główna” (przycisk na 404) | „Wróć do spraw” | Menu nazywa ekran startowy „Sprawy”; ta sama nazwa wszędzie | niespójność |
| `src/routes/admin.tsx:16` | „Brak uprawnień.” | „Ten ekran widzi administrator. Zmień konto, żeby go otworzyć.” | Błąd mówi, co się stało i co zrobić | niespójność |
| `src/routes/notes.tsx:118` | „Brak uprawnień.” | „Wybierz konto, żeby dostać podpowiedź.” | jw. | niespójność |
| `src/routes/notes.tsx:159`, `hr-partner.tsx:71` | „Brak uprawnień do tej notatki.” | „Notatkę widzi tylko jej autor.” | Słownik (notatkę widzi tylko autor); zdanie mówi, kto ma dostęp, jak „Ten ekran widzą kadry.” | niespójność |
| `src/routes/notes.tsx:69` | „Brak uprawnień do pisania notatek o tej osobie.” | „Notatki o tej osobie pisze jej oceniający albo przełożony.” | jw. | niespójność |
| `src/routes/notes.tsx:190`, `hr-partner.tsx:118`, `cycle-start.tsx:90`, `invitations.tsx:88` | „Brak uprawnień do tego cyklu.” | „Ten cykl oceny widzą oceniany, jego oceniający i kadry.” (w `notes.tsx:190` i `hr-partner.tsx:118`: „Ten ekran widzi oceniający tego cyklu.”) | jw. | niespójność |
| `src/routes/assessment.tsx:151,158` | „Brak uprawnień do tej oceny.” | „Ocenę widzą oceniany, jego oceniający i kadry.” | jw. | niespójność |
| `src/routes/assessment.tsx:265` | „Tylko oceniający może stwierdzić fikcję zapoznania.” | „Fikcję zapoznania wpisuje oceniający.” | Słownik: fikcja to „wpis oceniającego”; wzór zdania jak „Nieobecności wpisują kadry.” | niespójność |
| `src/routes/invitations.tsx:117,128` | „Nieznany rodzaj rozmowy.” | „Nie ma takiej rozmowy. Wybierz rozmowę o kryteriach albo rozmowę oceniającą.” | Bez języka systemu; co zrobić | niespójność |
| `src/routes/hr.tsx:110` | „Nieznane rozstrzygnięcie sprzeciwu.” | „Wybierz rozstrzygnięcie sprzeciwu: zmiana oceny, ponowne sporządzenie oceny albo nieuwzględnienie sprzeciwu.” | jw. | niespójność |
| `src/deadline-change.ts:40` | „Od ostatniej oceny (…) nie minęło jeszcze 6 miesięcy, więc zmiana terminu jest niedozwolona. Najwcześniej od ….” | „Termin można zmienić najwcześniej od …. Od ostatniej oceny (…) nie minęło jeszcze 6 miesięcy.” | Najważniejsze na początku; strona czynna zamiast „jest niedozwolona” | niespójność |

### Kosmetyka

| Plik:linia | Tekst dziś | Proponowany tekst | Reguła | Waga |
|---|---|---|---|---|
| `src/views/error-page.tsx:23,27` | „…zacznij pokaz od początku.” / „Zacznij pokaz od nowa” | „…zacznij pokaz od początku.” / „Zacznij pokaz od początku” | Ten sam zwrot w tekście i na przycisku | kosmetyka |
| `src/views/invitation.tsx:107` | „To wygoda dla obu stron: termin, miejsce i tematy są w jednym miejscu.” | „To wygoda dla obu stron: data, miejsce i tematy rozmowy są zebrane razem.” | Bez powtórzenia „miejsce… w jednym miejscu” | kosmetyka |
| `src/views/invitation.tsx:122–123` | Nagłówek z datą „16.12.2024” i pod nim ta sama data słownie | Zostawić jedną datę: nagłówek „Zaproszenie na rozmowę o kryteriach”, pod nim „16 grudnia 2024, 10:00, pokój 214” | Ta sama informacja raz | kosmetyka |
| `src/views/task-change.tsx:26,31` | „Notatka z 09.12.2024” nad nagłówkiem i ta sama data pod cytatem | Pod cytatem tylko nazwa kryterium | Ta sama informacja raz | kosmetyka |
| `src/routes/invitations.tsx:39` | „4 tematy z przepisu (§ 5 ust. 1). Pełna lista w zaproszeniu.” | „4 tematy z przepisu (§ 5 ust. 1 rozporządzenia). Pełna lista w zaproszeniu.” | Skrót prawny z nazwą aktu | kosmetyka |
| `src/views/feedback.tsx:11` | „Nie masz jeszcze informacji zwrotnej.” | „Nie masz jeszcze informacji zwrotnej. Gdy przełożony ją przekaże, zobaczysz ją tutaj.” | Pusty stan mówi, skąd przyjdzie treść | kosmetyka |
| `src/views/components/criterion-notes.tsx:20` | „Brak notatek przy tym kryterium” | „Brak notatek przy tym kryterium.” | Jedna typografia zdań w kartach | kosmetyka |
| `src/views/note-form.tsx:117`, `feedback-form.tsx:31` | „Notatki o zespole” (link pod formularzem) | „Wróć do notatek o zespole” | Link opisuje cel i czynność | kosmetyka |
| `src/views/appreciation.tsx:49` | „Wróć do cyklu” | „Wróć do cyklu oceny” | Pełna nazwa pojęcia ze słownika | kosmetyka |
| `src/routes/timeline.tsx:15`, `sheet.tsx:17`, `deadline-change.tsx:143` | „Oś czasu widzi oceniany, jego oceniający i kadry.” / „Ten arkusz widzi oceniany, oceniający i kadry.” / „Pismo widzi oceniany, oceniający i kadry.” | Jeden wzór: „… widzą oceniany, jego oceniający i kadry.” (podmiot szeregowy – liczba mnoga) | Spójność i składnia | kosmetyka |
| `content/name-forms.json`, `content/full-name-forms.json` | Brak form dla „Irena Maj” i „Jan Krawiec” (osoby z danych pokazowych) | Dopisać: „Irena”: gen „Ireny”, dat „Irenie”, ins „Ireną”, loc „Irenie”; „Jan”: gen „Jana”, dat „Janowi”, ins „Janem”, loc „Janie”; „Irena Maj”: „Ireny Maj”, „Irenie Maj”, „Ireną Maj”, „Irenie Maj”; „Jan Krawiec”: „Jana Krawca”, „Janowi Krawcowi”, „Janem Krawcem”, „Janie Krawcu” | Bez form zdania spadają do zapasowego „o osobie: …” | kosmetyka |

Poza zakresem tego rozdziału (do przekazania): `GET /notes` jako oceniany (Piotr) pokazuje „Notatki o zespole” i „Nie masz jeszcze notatek.” – oceniany bez podwładnych nie powinien widzieć tego ekranu (logika trasy, nie tekst). Komunikaty blokad zatwierdzenia z `src/engine/approval.ts` (bez kropek, „Brakuje ocen cząstkowych: 2”) zostawiam rozdziałowi 1.


## 10 zmian o największym wpływie

Kolejność: najpierw to, co jury zobaczy w pokazie i co jest nieprawdą albo łamie zasady z `AGENTS.md`.

1. **Strony błędów jako goły tekst** (rozdz. 4, pierwszy wiersz błędów; także `src/routes/tour.tsx:35–63`). Ok. 75 odpowiedzi 403/404/409/422 z `c.text` to biała strona bez układu i bez wyjścia (np. `GET /hr` jako Piotr). Jedna funkcja: strona z układem, zdanie „co się stało” i przyciski „Wróć do spraw” oraz „Zmień konto”.
2. **System „składa” uzasadnienie i „termin biegnie”** (`src/tour/stops.ts:98`, `src/views/about.tsx:53`, `README.md:25`). Tekst sugeruje, że uzasadnienie złożył system (zasada 4 i 5), a „biegnie termin” jest na liście zdań zakazanych. Wkleić: „Uzasadnienie napisał Marek i wstawił do niego fakty z notatek.” oraz „Od tej chwili system liczy 7 dni na sprzeciw.”
3. **Fikcja zapoznania na osi czasu** (`src/timeline.ts:133`): „Uznanie oceny za doręczoną” → „Fikcja zapoznania z oceną”. Doręcza się kopię arkusza, nie ocenę.
4. **Potwierdzenie części I pomylone z zapoznaniem** (`src/timeline.ts:122`): „Część I: potwierdzenie zapoznania z kryteriami” → „Potwierdzenie części I przez ocenianego”.
5. **Wersja reguł przy artykułach ustawy** (`src/engine/rules.ts:14`): „Zasady z rozporządzenia z 2016 r., wersja 1” stoi obok „art. 81 ust. 7 ustawy” na wejściu pokazu. → „Wersja reguł 1 (stan prawny od 23.04.2016)”.
6. **Odmiana nazwisk** w trzech miejscach widocznych w pokazie: `src/routes/hr-people.tsx:109` („Usunąć dane pracownika Piotra Wójcika?”), `src/views/substitutions.tsx:82` („Marek Zieliński za Anna Kwiatkowska” → „Nieobecny oceniający: Anna Kwiatkowska · zastępuje: Marek Zieliński”), `src/reminders.ts:33` („Termin oceny Piotra Wójcika: …”).
7. **Pytania w kartach rozmów** (`content/cards.json:7`, `:31`): jedno niegramatyczne i nie na ten etap, drugie w formie męskiej („spełniałeś”). Karta leży na ekranie kroku 1 pokazu.
8. **Jedna nazwa rozmowy na początku cyklu**: „rozmowa rozpoczynająca” → „rozmowa o kryteriach” (9 miejsc, m.in. `content/cards.json:3`, `src/routes/cycle-start.tsx:26`, `src/views/part1.tsx:213`, `src/tour/stops.ts:40`). Na ekranie części I stoją dziś obie nazwy obok siebie.
9. **Przyciski przejścia: jeden czasownik z dopełnieniem** („Otwórz …”). Dziś „Otwórz”, „Zobacz”, „Pokaż”, „Przejdź do” i goły „Otwórz” na kartach spraw (`src/index.tsx:100, 109` i dostawcy spraw – rozdz. 3).
10. **Informacja zwrotna i zaproszenie**: „Wyślij pracownikowi” / „Wysłano pracownikowi” → „Przekaż pracownikowi” / „Przekazano pracownikowi” (słownik); „Notatka dla ocenianego” w zaproszeniu → „Wiadomość dla ocenianego” (kolizja z pojęciem „notatka”, które pracownik ma nie widzieć).

Do decyzji autora, poza tekstem: `src/views/about.tsx:77` – „Licencja kodu: do ustalenia przez autora.” widzi jury. Wybrać licencję albo usunąć wiersz.

## Pojęcia z dwiema nazwami

| Pojęcie | Nazwy dziś i miejsca | Rekomendacja |
|---|---|---|
| rozmowa na początku cyklu | „rozmowa rozpoczynająca” (`content/cards.json:3`, `src/routes/cycle-start.tsx:26`, `src/views/part1.tsx:213`, `src/tour/stops.ts:40`); „rozmowa o kryteriach (oceny)” (`src/invitations.ts:14`, `src/routes/invitations.tsx:71`, `src/views/sheet.tsx:197`) | „rozmowa o kryteriach”; karta: „Karta rozmowy o kryteriach” |
| fikcja zapoznania | „fikcja zapoznania” (`acknowledgement-fiction.tsx`, `history.tsx:27`); „uznanie oceny za doręczoną” (`src/timeline.ts:133`); „uznanie zapoznania za dokonane” (`tour-done.tsx:36`); przycisk „Stwierdź fikcję zapoznania” | „fikcja zapoznania”; przycisk „Wpisz fikcję zapoznania” |
| ocena cząstkowa | „ocena cząstkowa” (słownik, formularz oceny); „punkty” (`tour-entry.tsx:41`, `stops.ts:84`, `tour-done.tsx:8`); „ocena skrajna” (`src/notes/warnings.ts:7`) | „ocena cząstkowa” („ocena cząstkowa 1 albo 9” zamiast „skrajna”) |
| arkusz | „arkusz” (słownik); „formularz” (`tour-entry.tsx:54`, `stops.ts:84`); „Typ arkusza” (`hr-people.tsx:157`) | „arkusz” |
| rola w cyklu | „oceniający” (słownik); „przełożony” w zdaniach o ocenie (`tour-done.tsx:8`) | „oceniający” przy ocenie; „przełożony” tylko o podległości i notatkach bez cyklu |
| przekazanie informacji zwrotnej | „Przekaż pracownikowi” (`notes-list.tsx:38`, `appreciation.tsx:44`); „Wyślij pracownikowi”, „Wysłano pracownikowi” (`feedback-form.tsx:28`, `notes-list.tsx:51`) | „Przekaż pracownikowi” / „Przekazano pracownikowi” |
| wiadomość w zaproszeniu | „Notatka dla ocenianego” (`invitation.tsx:93`) obok pojęcia „notatka” | „Wiadomość dla ocenianego” |
| przejście do ekranu | „Otwórz”, „Zobacz”, „Pokaż”, „Przejdź do” (rozdz. 3) | „Otwórz <rzecz>” |
| ekran źródeł podpowiedzi | „Skąd biorą się podpowiedzi” (nagłówek, sprawa); „Podpowiedzi” (menu); „Źródła podpowiedzi” (pokaz) | nagłówek bez zmian; menu i przyciski „Źródła podpowiedzi” |
| ekran startowy | „Sprawy” (menu), „Sprawy do załatwienia” (nagłówek), „Strona główna” (`error-page.tsx:10`, `index.tsx:158`) | „Sprawy”; przycisk powrotu „Wróć do spraw” |
| rozpatrzenie sprzeciwu | „Rozstrzygnięcie sprzeciwu” (`hr-overview.tsx:191`, `routes/hr.tsx:110, 113`); „Sprzeciw rozpatrzony” (`hr/cycle-state.ts:54`) | „rozpatrzenie sprzeciwu” (słownik) |
| stan cyklu | „Stan procesu” (`hr-overview.tsx:150`, `hr-export.ts:13`); „Stan cykli” (nagłówek) | „Stan cyklu” w kolumnie, „Stan cykli” w nagłówku |
| kolumna czynności | „Odnośniki” (`hr-overview.tsx:152`); „Działania” (`hr-people.tsx:64`) | „Działania” |
| urzędnik mianowany | „Urzędnik służby cywilnej (mianowany)” (`hr-people.tsx:179`), „Urzędnik” (`hr-overview.tsx:27`) | „urzędnik mianowany” |
| statystyki dyrektora | „Terminowość w urzędzie” (`routes/hr.tsx:22, 30`); „Statystyki urzędu” (`:31`) | „Terminowość w urzędzie” |
| osoba zastępująca | „Kto zastępuje”, „osoba zastępująca” (`substitutions.tsx:23, 49`); „Zastępca” (`routes/substitutions.tsx:51`) | „osoba zastępująca” |
| wpis nieobecności | „Wpisz nieobecności” (`hr/links.ts:36–42`); „Wpisz nieobecność” (`absence-form.tsx:21`, „Stan cykli”) | „Wpisz nieobecność” |
| wniosek o stopień | „następny stopień” (`assessment.tsx:297, 373`); „kolejny stopień” (`sheet.tsx:263, 302`, słownik) | „kolejny stopień” |
| kryterium wybierane | „do wyboru” (`part1.tsx:166`); „dodatkowe” (`part1.tsx:182`, `assessment.tsx:242`) | „kryterium dodatkowe” |
| termin oceny | „termin oceny”; „termin sporządzenia oceny” (`deadline-change.tsx:101`) | „termin oceny” poza arkuszem (na arkuszu zostaje sformułowanie wzoru) |
| karta po zmianie zadań | „Rozmowa po zmianie zadań” (`cards.json:51`); „Karta rozmowy o podziale zadań” (`cards.json:112`) | „Karta rozmowy po zmianie zadań” |
| ekran notatek | „Notatki o zespole” (nagłówek); „Notatki” (menu); „Moje notatki” (`task-change.tsx:88`) | „Notatki o zespole” (menu może zostać „Notatki”) |
| data rozmowy a termin | „Zmień termin” w zaproszeniu (`invitation.tsx:24`) i „zmiana terminu” oceny | przy zaproszeniu „Zmień datę rozmowy”; „termin” tylko dla terminów z przepisów |

## Czego nie przejrzano

- Teksty w `public/assessment.js`, `score-caption.js`, `date-words.js`, `auto-print.js` i `src/views/components/*` – tylko to, co widać na stronach.
- Ekrany widoczne dopiero po przesunięciu daty – tylko w kodzie (serwer był wspólny, daty nie przesuwano).
- Panel przewodnika w trakcie pokazu – tylko w kodzie (`POST /tour/…` przełącza datę dla wszystkich).
