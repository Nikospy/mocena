# Pokrycie listy czynności organizatora

Organizator zadania podał 30 czynności procesu oceny okresowej. Kryterium sukcesu prototypu: co najmniej 15 działa, a pozostałe mają widoczny stan albo są jawnie nazwane jako poza prototypem. Ten dokument pokazuje, jak wygląda to w kodzie (stan na 22.11.2026, `bun test`: 229 testów przechodzi). Opisy czynności są skrótami autora, nie brzmieniem z materiałów organizatora.

## Podsumowanie

| Stan | Liczba |
|---|---|
| działa | 15 |
| uproszczone | 12 |
| poza prototypem | 3 |
| razem | 30 |

Dwie pozycje liczone podwójnie (zaproszenia na rozmowy, dane pracowników i podległość) to dwie czynności z listy każda.

## Jak oglądać

Konta pokazowe są bez hasła (`/account`): Marek (oceniający), Piotr i Ewa (oceniani), Joanna (kadry), Anna (oceniająca), Tomasz (oceniany), administrator. Datę systemową przesuwa się do przodu (`POST /demo/date`), a gotowe przystanki pokazu daje `/tour`. Daty poniżej pochodzą z danych pokazowych (`context/foundation/demo.md`).

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
| 16 | Zmiana terminu przez oceniającego | uproszczone | `/hr`, wiersz Anny: stan „wniosek o zmianę terminu” | Brak formularza zmiany terminu i pisma do pracownika; jest tylko stan i podstawa (art. 81 ust. 8, § 8). Stan pochodzi z danych wgranych. |
| 17 | Zaproszenie na rozmowę o kryteriach | uproszczone | `/cycles/:id/cards/opening`, Marek | Karta z tematami z przepisu, bez wysyłki e-mail. Liczone jako 1 z 2 zaproszeń. |
| 18 | Zaproszenie na rozmowę oceniającą | uproszczone | `/cycles/:id/cards/assessment-conversation`, Marek | Jak wyżej: karta, bez e-maila. Liczone jako 2 z 2. |
| 19 | Wniosek ocenianego o zmianę terminu | uproszczone | `/hr`, wiersz Anny (dane wgrane, wniosek z 5.10.2026) | Brak formularza wniosku i rozpatrzenia; widać stan „czeka na rozpatrzenie”. |
| 20 | Wniosek o kolejny stopień służbowy | uproszczone | `/cycles/:id/assessment`, sekcja „Wniosek o następny stopień służbowy”, Anna | Wniosek dołącza się do oceny z umotywowaniem i trafia do arkusza. Brak osobnego obiegu i powiadomienia. Kod robi tu więcej niż deklaruje decyzja. |
| 21 | Zmiana oceny po sprzeciwie | uproszczone | `/hr`, wiersz Katarzyny, rozstrzygnięcie sprzeciwu | Kadry zapisują rozstrzygnięcie „zmiana oceny”; sama ocena się nie zmienia, nie ma powiadomienia. |
| 22 | Ponowne sporządzenie oceny po sprzeciwie | uproszczone | `/hr`, wiersz Katarzyny | Zapisuje się rozstrzygnięcie „ponowne sporządzenie”; oceniający dostaje sprawę z terminem drugiej oceny (art. 83 ust. 3 ustawy). Formularza drugiej oceny jeszcze nie ma: ekran oceny i sprawa mówią to wprost i pokazują pierwszą ocenę tylko do odczytu. |
| 23 | Dane pracowników (wprowadzenie, import) | uproszczone | `bun run seed`; kto jest w `/account` | Dane wgrywa skrypt, w tym oceny historyczne; brak ekranu wprowadzania i łącza z systemem kadrowym. Liczone jako 1 z 2. |
| 24 | Podległość (kto kogo ocenia) | uproszczone | `/hr` (kolumna Oceniający) | Wgrana skryptem, zmienia się tylko oceniającego (poz. 10). Liczone jako 2 z 2. |
| 25 | Archiwizacja | uproszczone | `/hr`, `/people/:id/history` | Zamknięte cykle i oceny zostają w historii; brak operacji archiwizacji ani eksportu zestawienia. |
| 26 | Statystyki i zestawienia | uproszczone | `/hr#statystyki`, Joanna | Liczniki terminowości bez nazwisk. Brak eksportu do sprawozdawczości. |
| 27 | Lista pracowników z wyszukiwaniem | uproszczone | `/hr` (stan wszystkich cykli), `/notes` (zespół oceniającego) | Lista sortowana po terminie; bez wyszukiwania i dowolnego sortowania. |
| 28 | Edycja danych pracownika | poza prototypem | brak | Dane wgrywa skrypt; edycja to ekran kadrowy, nieistotny dla pokazu procesu. |
| 29 | Zastępstwa | poza prototypem | brak | Nie ma modelu zastępstw w danych ani ekranów. |
| 30 | Usunięcie danych pracownika | poza prototypem | brak | Prototyp nie usuwa danych (wymagałoby polityki retencji); reset całości to `POST /demo/restart`. |

## Uwagi do prawdziwości

- Pozycje 1-15 sprawdzono w kodzie (trasy w `src/routes/*.tsx`, widoki w `src/views`, przypomnienia w `src/reminders.ts`, `src/routes/cycle-start.tsx`, `src/hr/`). Testy przechodzą.
- Nic z pozycji 1-15 nie opiera się na wgranych na sztywno stanach, poza datami danych pokazowych.
- Pozycje 16 i 19 pokazują stan tylko na wgranych danych: nie da się ich przeprowadzić w aplikacji.
- Pozycja 20 działa lepiej niż zakłada decyzja (jest w formularzu oceny); to nie wymaga zmiany liczb.
- Przypomnienia i terminy pokazuje się przesunięciem daty systemowej, nie wysyłką wiadomości. Prototyp niczego nie wysyła poza komputer.
