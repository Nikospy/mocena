# Pokrycie listy czynności organizatora

Organizator zadania podał 30 czynności procesu oceny okresowej. Kryterium sukcesu prototypu: co najmniej 15 działa, a pozostałe mają widoczny stan albo są jawnie nazwane jako poza prototypem. Ten dokument pokazuje, jak wygląda to w kodzie (stan na 22.11.2026, `bun test`: 364 testów przechodzi). Opisy czynności są skrótami autora, nie brzmieniem z materiałów organizatora.

## Podsumowanie

| Stan | Liczba |
|---|---|
| działa | 26 |
| uproszczone | 4 |
| poza prototypem | 0 |
| razem | 30 |

Dwie pozycje liczone podwójnie (zaproszenia na rozmowy, dane pracowników i podległość) to dwie czynności z listy każda.

## Jak oglądać

Konta pokazowe są bez hasła (`/account`): Marek (oceniający), Piotr i Ewa (oceniani), Joanna (kadry), Anna (oceniająca), Tomasz (oceniany), Barbara Szymańska (dyrektor generalny: terminowość urzędu bez nazwisk na `/office/statistics`), administrator (źródła podpowiedzi, wersja reguł na `/admin/rules`, korekta zatwierdzonych arkuszy na `/admin/corrections`). Datę systemową przesuwa się do przodu (`POST /demo/date`), a gotowe przystanki pokazu daje `/tour`. Daty poniżej pochodzą z danych pokazowych (`context/foundation/demo.md`). Odmowy i błędy (403, 404, 409, 422) to strony z układem aplikacji, zdaniem o przyczynie i odnośnikiem powrotu, nie goły tekst.

## Tabela

| # | Czynność | Stan | Gdzie zobaczyć | Uwagi |
|---|---|---|---|---|
| 1 | Przypomnienie o wyznaczeniu kryteriów | działa | `/` (lista spraw), Marek, 9.12.2024 | Termin 30 dni (7 po ocenie negatywnej) z podstawą prawną; stan też w `/hr`. |
| 2 | Wybór kryteriów i potwierdzenie rozmowy | działa | `/cycles/:id/part1`, Marek, 9.12.2024 | Arkusz dobrany do stanowiska, do 3 kryteriów dodatkowych z uzasadnieniem. |
| 3 | Potwierdzenie kryteriów przez ocenianego | działa | `/cycles/:id/part1`, Piotr (telefon), po przekazaniu części I | Miejscowość, data i nazwisko wpisują się same. Słowo „potwierdzenie”, nie „podpis”. |
| 4 | Przypomnienie o terminie oceny | działa | `/` i `/cycles/:id/timeline`, Marek, ok. 10.11.2026 | Okno przypomnienia to ustawienie urzędu. |
| 5 | Wystawienie oceny | działa | `/cycles/:id/assessment`, Marek, 21.11.2026 | Średnia, poziom, wynik z przepisem, ostrzeżenia, blokady zatwierdzenia. |
| 6 | Potwierdzenie zapoznania z oceną | działa | `/cycles/:id/assessment`, Piotr, 22.11.2026 | Od tego liczy się 7 dni na sprzeciw (30.11.2026). |
| 7 | Stwierdzenie fikcji zapoznania | działa | `/cycles/:id/assessment/fiction`, Marek (przystanek dodatkowy `fiction` w `/tour`) | Powód, sposób i data doręczenia; wpis widzą kadry w `/hr`. Wymaga czystych danych, bo po potwierdzeniu Piotra nie da się go użyć. |
| 8 | Przesunięcie terminu przez długą nieobecność | działa | `/cycles/:id/absences` (Joanna, 10.11.2026), potem `/cycles/:id/timeline` | Nieobecności rozdzielone weekendem łączą się; oś czasu pokazuje regułę i wersję reguł. |
| 9 | Przypomnienie o obowiązkowym stopniu służbowym | działa | `/hr`, Joanna, 22.11.2026 | Tomasz: dwie oceny od ostatniego stopnia, 30 dni; przycisk odnotowuje stopień. |
| 10 | Zmiana oceniającego w trakcie cyklu | działa | `/cycles/:id/appraiser`, Joanna; oś Ewy (`/tour/extra/ewa-timeline`) | Kryteria zostają. Tylko kadry. |
| 11 | Wpisanie nieobecności | działa | `/cycles/:id/absences`, Joanna | Nieobecności: Piotr 5.10-6.11.2026, Ewa 16.02-28.08.2026. |
| 12 | Historia ocen pracownika | działa | `/people/:id/history`, Piotr, Marek lub Joanna | Dostęp: sam pracownik, jego oceniający, kadry. Tomasz ma dwie historyczne oceny. |
| 13 | Podgląd arkusza | działa | `/cycles/:id/sheet`, Marek, Piotr lub Joanna | Wszystkie pola w układzie wzoru z rozporządzenia. |
| 14 | Pobranie arkusza | działa | `/cycles/:id/sheet`, przycisk „Drukuj / pobierz PDF” | Zapis do PDF wybiera się w oknie druku przeglądarki. |
| 15 | Wydruk arkusza | działa | `/cycles/:id/sheet`, przycisk „Drukuj” (także sama część I) | Stopka i układ do druku (`no-print`). |
| 16 | Zmiana terminu przez oceniającego | działa | `/cycles/:id/deadline-change`, oceniający | Formularz z przypadkami z art. 81 ust. 8 i powodem; pismo do pracownika (`.../:eventId/letter`, widoczne też na osi czasu). Wniosek ocenianego można uwzględnić albo odrzucić z powodem (`.../reject`). |
| 17 | Zaproszenie na rozmowę o kryteriach | działa | `/cycles/:id/invitations/new`, Marek; zaproszenie otwiera oceniany | Formularz z datą, miejscem i nieobowiązkową wiadomością dla ocenianego; oceniany potwierdza termin na stronie zaproszenia; plik kalendarza `.../:eventId.ics`. Wysyłki poczty nie ma: nic nie wychodzi poza komputer. Liczone jako 1 z 2 zaproszeń. |
| 18 | Zaproszenie na rozmowę oceniającą | działa | `/cycles/:id/invitations/new?kind=assessment`, Marek | Jak wyżej. Liczone jako 2 z 2. |
| 19 | Wniosek ocenianego o zmianę terminu | działa | `/cycles/:id/deadline-change/request`, oceniany | Formularz z nową datą i powodem z art. 81 ust. 8 pkt 4; oceniający uwzględnia wniosek (nowy termin i pismo) albo odrzuca go z powodem. |
| 20 | Wniosek o kolejny stopień służbowy | uproszczone | `/cycles/:id/assessment`, sekcja „Wniosek o kolejny stopień służbowy”, Anna | Wniosek dołącza się do oceny z umotywowaniem i trafia do arkusza. Brak osobnego obiegu i powiadomienia. Kod robi tu więcej niż deklaruje decyzja. |
| 21 | Zmiana oceny po sprzeciwie | uproszczone | `/hr`, wiersz Katarzyny, rozstrzygnięcie sprzeciwu | Kadry zapisują rozstrzygnięcie „zmiana oceny”; sama ocena się nie zmienia, nie ma powiadomienia. |
| 22 | Ponowne sporządzenie oceny po sprzeciwie | uproszczone | `/hr`, wiersz Katarzyny | Zapisuje się rozstrzygnięcie „ponowne sporządzenie”; oceniający dostaje sprawę z terminem drugiej oceny (art. 83 ust. 3 ustawy). Formularza drugiej oceny jeszcze nie ma: ekran oceny i sprawa mówią to wprost i pokazują pierwszą ocenę tylko do odczytu. |
| 23 | Dane pracowników (wprowadzenie, import) | działa | `/hr/people/new`, `/hr/people/import`, Joanna | Dodawanie pracownika z wyborem przełożonego, komórki i rodzaju stanowiska oraz import z pliku CSV. Łącza z systemem kadrowym nie istnieją. Liczone jako 1 z 2. |
| 24 | Podległość (kto kogo ocenia) | działa | `/hr/people/new` i `/hr/people/:id/edit`, Joanna | Przełożonego wybiera się przy zapisie pracownika; w trakcie cyklu zmienia go ekran „Zmiana oceniającego” (poz. 10). Liczone jako 2 z 2. |
| 25 | Archiwizacja | uproszczone | `/hr`, `/people/:id/history` | Zamknięte cykle i oceny zostają w historii; osobnej operacji archiwizacji nie ma. Zestawienie stanu cykli eksportuje poz. 26. |
| 26 | Statystyki i zestawienia | działa | `/hr#statystyki`, `/office/statistics` (dyrektor), `/hr/export.csv` (kadry) | Liczniki terminowości bez nazwisk; eksport zestawienia stanu cykli do pliku CSV. |
| 27 | Lista pracowników z wyszukiwaniem | działa | `/hr/people`, Joanna | Lista pracowników z wyszukiwaniem i sortowaniem. |
| 28 | Edycja danych pracownika | działa | `/hr/people/:id/edit`, Joanna | Formularz danych pracownika, w tym komórka organizacyjna i rodzaj stanowiska. |
| 29 | Zastępstwa | działa | `/hr/substitutions`, Joanna | Nieobecny oceniający, osoba zastępująca i zakres dat; w czasie zastępstwa osoba zastępująca prowadzi czynności oceniającego. |
| 30 | Usunięcie danych pracownika | działa | `/hr/people/:id/delete`, Joanna | Usunięcie po zaznaczeniu pola potwierdzenia; konta kadr i administratora usunąć nie da się. Reset całości danych pokazowych to `POST /demo/restart`. |

## Uwagi do prawdziwości

- Pozycje 1-30 sprawdzono w kodzie (trasy w `src/routes/*.tsx`, `src/hr/`, `src/index.tsx`, przypomnienia w `src/reminders.ts`). Testy przechodzą.
- Nic z pozycji oznaczonych „działa” nie opiera się na wgranych na sztywno stanach, poza datami danych pokazowych.
- Rzeczy poza prototypem, nazwane wprost: formularz drugiej oceny po uwzględnionym sprzeciwie (poz. 22), osobny obieg wniosku o stopień (poz. 20), operacja archiwizacji (poz. 25), wysyłka poczty i łącza z systemem kadrowym oraz EZD.
- Pozycja 20 działa lepiej niż zakłada decyzja (jest w formularzu oceny); to nie wymaga zmiany liczb.
- Przypomnienia i terminy pokazuje się przesunięciem daty systemowej, nie wysyłką wiadomości. Prototyp niczego nie wysyła poza komputer.
