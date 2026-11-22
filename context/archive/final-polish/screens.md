# Paczka „ekrany” (pięć grup równolegle, po fundamencie wyglądu)

Fundament (powłoka, skala pisma, nagłówek strony, lista spraw, wiersz notatki, podstawa prawna, trzy przyciski) jest w `main`. Kontrakt komponentów: rozdział „Komponenty wspólne” w `visual.md`. Każda grupa doprowadza SWOJE ekrany do progów z `visual.md` i do poziomu studia: każdy ekran, każdy stan, 360 i 1440 px, a także 320, 768 i 1024 px. Zasady wspólne: `change.md`.

## Zasady grup

- Zmieniasz tylko pliki swojej grupy (tabela niżej) i ich testy. CSS piszesz wyłącznie w swojej sekcji na końcu `public/style.css` (`/* === screens: <grupa> === */`). Komponentów wspólnych (`src/views/components.tsx`, reguły CSS powyżej sekcji grup) nie zmieniasz; gdy brakuje wspólnego komponentu albo wspólny jest błędny, opisz to w raporcie w punkcie „do fundamentu”.
- Kolory, rozmiary, odstępy i zaokrąglenia tylko z tokenów. Skala pisma 14/16/20/28 (telefon 24). Bez nowych rozmiarów i bez własnych cieni.
- Zachowania, tras i treści merytorycznej nie zmieniasz. Teksty poprawiasz tylko według listy z przeglądu tekstów (dostaniesz ją w trakcie) albo gdy tekst jest błędem.
- Każdy ekran grupy oglądasz na zrzucie w każdym stanie (pusty, wypełniony, po błędzie walidacji, po sukcesie, zablokowany) i przy pięciu szerokościach. Ekran nieobejrzany wpisujesz w raporcie z nazwy.
- Pytania kontrolne przy każdym ekranie: co tu jest najważniejsze i czy widać to w sekundę; jaka jest jedna akcja główna; czy lewa krawędź jest jedna; czy odstępy grupują to, co do siebie należy; czy cokolwiek wygląda na „zrobione przez automat” (ramka w ramce, trzy style odnośników obok siebie, przycisk szerszy niż treść, osierocony odnośnik, tabela zamiast listy).
- Pomiar: `bun run scripts/design-audit.ts <katalog> --only <ekrany>`; pokaz: skrypt `serve-check.ts` z polecenia; `bun test` zielone; commit po każdym ekranie. Przed raportem `git merge main`.

## Grupy

| Grupa (sekcja CSS) | Pliki | Ekrany |
|---|---|---|
| `cycle` | `part1.tsx`, `assessment-card.tsx`, `before-meeting.tsx`, `assessment.tsx`, `components/criterion-notes.tsx`, `acknowledgement-fiction.tsx`, `task-change.tsx`, `public/assessment.js`, `public/score-caption.js`, `public/insert-notes.js` | Część I (edycja, przekazana, do potwierdzenia, potwierdzona), karty rozmów, „Przed rozmową”, ocena (pusta, robocza, zatwierdzona, u ocenianego, po zapoznaniu, po sprzeciwie), fikcja zapoznania, pytanie o zmianę zadań |
| `cycle-time` | `timeline.tsx`, `absence-form.tsx`, `deadline-change.tsx`, `appraiser-change-form.tsx`, `sheet.tsx` (ekran; wydruku nie psujesz), `history.tsx`, `invitation.tsx` | oś czasu, nieobecności, zmiana terminu (wniosek, decyzja, pismo), zmiana oceniającego, arkusz na ekranie, historia ocen, zaproszenia (nowe, wysłane) |
| `hr-admin` | `hr-overview.tsx`, `hr-people.tsx`, `substitutions.tsx`, `suggestion-sources.tsx`, `about.tsx`, widoki statystyk urzędu i usuwania danych | stan cykli, pracownicy (lista, nowy, edycja, usunięcie), zastępstwa, statystyki urzędu, źródła podpowiedzi, „Wdrożenie i dane” |
| `home-tour` | strona główna i wybór konta (widoki w `src/index.tsx` / `src/routes/`), `tour-entry.tsx`, `tour-done.tsx`, `tour-panel.tsx`, `layout.tsx`, `head.tsx`, `error-page.tsx`, `public/tour.js` | strona główna każdej roli (z zaległościami i pusta), wybór konta, wejście do pokazu, każdy krok pokazu z panelem przewodnika, ekran końcowy, strony 403 i 404, powłoka |
| `forms-states` | `note-form.tsx`, `notes-list.tsx`, `components/note-item.tsx`, `appreciation.tsx`, `feedback-form.tsx`, `feedback.tsx`, `public/note-form.js`; oraz wspólny komponent błędów (wyjątek: wolno dopisać go do `components.tsx`) | notatka (nowa, po zapisie, z pytaniem), lista notatek, docenienie, informacja zwrotna; stany błędów WSZYSTKICH formularzy aplikacji |

## Zadania grup (punkty z `visual.md` i pozostałości po fundamencie)

**cycle**
- U1: układ 2/3 + 1/3 (`.o-grid`) na Części I, „Przed rozmową” i kartach rozmów: po prawej reguła, termin i akcja.
- Ocena: odnośnik „Karta rozmowy oceniającej” wchodzi do rzędu odnośników nagłówka strony; pasek etapów zaczyna się na lewej krawędzi treści; K4 (notatki pod kryterium zwinięte na telefonie, ekran oceny najwyżej 4 ekrany przewijania przy 360 px); `under24` = 0 na ocenie u ocenianego.
- Część I na telefonie: pięć pogrubionych odnośników jeden pod drugim zamienić na jeden zwarty rząd albo menu „Więcej”.
- Ocena po zatwierdzeniu: `under16Pct` ≤ 50; mniej ramek na „Przed rozmową”.

**cycle-time**
- Oś czasu: `under16Pct` z 62–66 do ≤ 50 (legenda i opisy 16 px albo krótsze), `.t-grid` → `.o-grid`; zdanie o przesunięciu terminu nie jest pigułką.
- Arkusz na ekranie: jeden `h1` widoczny przy każdej szerokości, `sizeCount` ≤ 4, wiersz ≤ 80 znaków, mniej ramek (21); druk bez zmian (sprawdź PDF).
- Formularze nieobecności, zmiany terminu, zmiany oceniającego i zaproszenia: pola 48 px, jedna akcja główna, pismo o zmianie terminu czytelne jak dokument.

**hr-admin**
- K5: w tabeli stanu cykli jeden odnośnik w wierszu (nazwisko prowadzi do cyklu), bez kolumny „Odnośniki” i bez menu „Więcej”; rozstrzygnięcie sprzeciwu jako sekcja nad tabelą albo na ekranie oceny tego cyklu (ta sama trasa `POST /cycles/:id/objection-outcome`); na telefonie tabela staje się listą.
- Lista pracowników: zaległość słowami, nie samym kolorem; wyszukiwanie i sortowanie w jednym rzędzie z polami 48 px; „Dodaj pracownika” jako jedna akcja główna.
- L2: brak przewijania strony w poziomie przy 320 i 360 px.
- „Wdrożenie i dane”: strona tekstowa jak dokument (nagłówek strony, śródtytuły 20 px, wiersz 66 znaków, bez ramek).

**home-tour**
- F4: wybór konta (role jako zwykły tekst, karta klikalna w całości) i wejście do pokazu (`primaryCount` ≤ 1, hierarchia, oś „pięciu chwil” czytelna na telefonie).
- F3: każdy krok pokazu z panelem przewodnika na zrzucie 360 i 1440 px; panel nie zasłania treści (tabela kadr), brak czarnej ramki fokusu wokół nagłówka (fokus zostaje dla czytników), `.gp-end` ma wysokość, przyciski panelu to trzy wspólne postaci.
- Strona główna: sprawy z terminem nad sprawami bez terminu („Notatki o zespole” nie jest pierwsza); odnośnik w wierszu nazywa czynność, nie „Otwórz”; stan pusty z jednym zdaniem i jedną akcją.
- Powłoka: mniej powietrza między rzędem znaku a nawigacją na komputerze; stopka z odnośnikami „Wdrożenie i dane” i „Kod źródłowy”; odpowiedź 403 jako zwykła strona z układem i odnośnikiem powrotu (dziś goły tekst); tytuł strony w `head.tsx` zaczyna się od tego, co asystent robi.

**forms-states**
- F2: wspólny komponent błędów: podsumowanie nad formularzem z odnośnikami do pól i komunikat przy polu (`aria-describedby`, `aria-invalid`), pola zachowują wartości. Najpierw komponent i commit, potem zastosowanie we własnych formularzach, na końcu lista pozostałych formularzy aplikacji ze stanem (zrobione / do zrobienia przez grupę X).
- F1: formularz notatki: żetony kryteriów w jednej postaci, pasek akcji przyklejony tylko na telefonie, na komputerze przycisk w przepływie; `boxes` z 19 do ≤ 10.
- Lista notatek: jedna akcja główna na ekranie (nie przycisk przy każdej osobie), osoby bez notatek w zwartej postaci.
- F6: fokus klawiatury widoczny na każdej kontrolce (zrzuty po Tab).
