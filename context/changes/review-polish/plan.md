# Dopracowanie po przeglądzie na żywej stronie — plan wdrożenia

## Overview

Plaster S-09 (roadmapa M-1, kotwica MS-03, decyzje 13a–13c). 22.11.2026 przegląd przeszedł cały pokaz na żywej stronie: 52 ekrany przy 360 i 1440 px. Znalazł 14 usterek, które juror zauważy (P1), 11 usterek wykończenia (P2) i listę tekstów do poprawy. Do tego dochodzą otwarte uwagi testera. Ten plaster usuwa je wszystkie, tak żeby juror nie trafił na niejasny tekst, pusty obszar, niespójny komponent ani ślepy zaułek.

Równolegle powstaje S-08 (`guided-demo-tour`), który zmienia `src/views/layout.tsx` i `src/index.tsx` i dodaje pliki `src/tour/*`. **Tego plastra te pliki nie dotyczą.** Wyjątek: jedna linia z nazwą roli w nagłówku, jeśli inaczej się nie da (pozycja 1.14). Style dopisujesz w sekcji `/* review-polish */` na końcu `public/style.css`, tylko na tokenach.

## Current State Analysis

Ekrany są zbudowane i przestylowane (S-01–S-07), 211 testów przechodzi. Usterki poniżej opisują stan żywej strony z 22.11, ok. 01:40. Odnośniki „(NN)” to numery zrzutów z przeglądu; same zrzuty nie są w repo.

## Desired End State

Każda pozycja z faz 1 i 2 jest naprawiona i ma test tam, gdzie da się ją sprawdzić w HTML. Przepisy i daty biorą się tylko z silnika i z `rules/regulation-2016-470.json`. Gdy poprawka wymagałaby przepisu, którego nie ma w regułach, nie dopisujesz go z pamięci, tylko zgłaszasz w raporcie.

### Key Discoveries

- Przegląd chodził w przeglądarce z językiem en-US, więc pola daty pokazywały 12/09/2024. Daty, które wypisuje sama aplikacja, mają format polski. Pola `<input type="date">` zależą od języka przeglądarki i tego nie zmieniamy.
- Artefakt scenariusza: jeśli w kroku 2 druga notatka dostanie kryterium „Myślenie analityczne”, krok 4 traci „kryterium bez notatek”. Rozwiązuje to przewodnik (S-08), który mówi, czego nie zaznaczać. Tu nic nie robisz.

## What We're NOT Doing

- Przewodnik pokazu, ekran wejścia, pasek „Pokaz” i `layout.tsx` należą do S-08.
- Nowe funkcje spoza listy.
- Zmiana reguł oceny i terminów w silniku.

## Phase 1: Usterki, które juror zauważy (P1) i teksty

### Changes Required

1.1 **Strona główna Piotra po zapoznaniu (22.11.2026):** zamiast „Brak spraw do załatwienia.” karta „Twoja ocena” z wynikiem słownym, terminem sprzeciwu i przepisem (z silnika) oraz przyciskiem do oceny. Ogólnie: gdy oceniany nie ma spraw, strona główna pokazuje jego najbliższy termin i drogę do oceny lub części I, a nie pustkę („Nic na Ciebie nie czeka. Twój termin oceny: …”).

1.2 **Strona główna oceniającego:** sprawa „Wystaw ocenę: <osoba>” pojawia się dopiero 30 dni przed terminem oceny tej osoby (terminem z silnika, z przesunięciami). Wcześniej osoba ma zwykły odnośnik w zespole, bez sprawy. Ta sama reguła dotyczy Anny. To założenie produktu, nie przepis, więc tekst nie powołuje się na przepis.

1.3 **Panel wyniku oceny:** kolejność treści:
- wynik („Ocena negatywna” / „Ocena pozytywna” + poziom);
- przyczyna z przepisem (np. „Rzetelność: 1, znacznie poniżej oczekiwań” i pigułka § z reguł);
- jedna linia „Średnia 4,43 — nie zmienia wyniku” (tylko gdy wynik nie wynika ze średniej);
- w pozostałych przypadkach „Średnia 4,43” bez sprzecznego poziomu.

Słowo „średnia” pada raz. Żaden podpis poziomu nie przeczy wynikowi.

1.4 **Podpis wybranego poziomu** przy rzędzie cyfr 1/3/5/7/9: krótko, tuż pod rzędem („Wybrano 1: znacznie poniżej oczekiwań”), bez pustego marginesu przed notatkami na 360 px.

1.5 **Ocena u Piotra na 360 px:** na wąskim ekranie wynik, termin sprzeciwu i przycisk zapoznania stoją na górze, przed listą kryteriów (kolejność w CSS albo w markupie).

1.6 **Termin oceny po przesunięciu:** gdy termin różni się od pierwotnego, ekran oceny i strona główna pokazują krótko „Termin przesunięty z 27.11.2026 na 30.12.2026 przez nieobecność” z odnośnikiem do osi czasu (daty z silnika). Bez nowych twierdzeń prawnych o końcu okresu oceny.

1.7 **Część I (krok 1):**
- pola oczekiwań pokazują się tylko przy zaznaczonych kryteriach (prosty JS z działaniem bez JS: pola są, ale zwinięte);
- „Kryteria obowiązkowe” nie jest pustą belką: pokazuje listę kryteriów obowiązkowych z arkusza albo zdanie, skąd się biorą;
- surowe trójkąty `<details>` zamienione na wzorzec rozwijania z makiet;
- etykieta odklejona od summary;
- „Podpowiedź · ustawienie urzędu” raz na sekcję, nie przy każdym polu.

1.8 **Odnośniki cyklu na 360 px:** pierwszy ekran pokazuje treść, a nie 8 odnośników. Odnośniki do faz, które jeszcze nie nastąpiły (ocena, zapoznanie w 2024), są ukryte. Pozostałe idą do zwartego menu („Więcej” albo rząd chipów przewijany w poziomie). Przycisk potwierdzenia części I na telefonie jest osiągalny bez przewijania 3800 px; jeśli trzeba, dodaj przyklejony pasek z przyciskiem.

1.9 **Ekran „To stała zmiana zadań?”:**
- pokazuje cytat notatki z datą („Notatka z 11.03.2026”);
- po jednym zdaniu, co się stanie po „Tak” i po „Nie”;
- przyciski „Tak, stała zmiana”, „Nie, chwilowe zastępstwo”, „Zdecyduję później”;
- dół ekranu na telefonie nie jest pusty;
- „Zamknij” na karcie rozmowy ma prowadzić do innego stanu niż „To chwilowe zastępstwo”: zamyka kartę i zostawia odpowiedź „tak”.

1.10 **Pigułka wersji reguł:** zamiast „reguły 2016-470/1” i „Reguły: 2016-470/1, obowiązują od…” tekst „Zasady z rozporządzenia z 2016 r., wersja 1”. Odnośnik prowadzi do strony z treścią zasad, jeśli taka jest, albo do osi czasu. Identyfikator wersji zostaje w atrybucie `title` i na wydruku arkusza.

1.11 **`/hr`:**
- przycisk „Drukuj / pobierz PDF” przy każdym wierszu z arkuszem (prowadzi do arkusza z wywołaniem druku albo do samego arkusza);
- „Sprzeciw do: 19.11.2026” po terminie → „Termin sprzeciwu minął 19.11.2026”;
- „do dyrektor generalny urzędu” → „do dyrektora generalnego urzędu”;
- długi akapit stanu Anny skrócony do jednej linii z rozwinięciem;
- pigułka terminu nie łamie się na 6 linii.

1.12 **„Odnotuj przyznanie stopnia”:** po kliknięciu komunikat sukcesu na `/hr` („Odnotowano przyznanie stopnia Tomaszowi Kamińskiemu, 22.11.2026.”) i wpis na osi czasu Tomasza.

1.13 **Fikcja zapoznania jest do znalezienia:** na `/hr` przy cyklu, w którym fikcję da się stwierdzić (według istniejącej reguły trasy), jest przycisk „Stwierdź odmowę zapoznania”. Gdy fikcji nie da się stwierdzić, bo ocena nie jest gotowa, przycisku nie ma.

1.14 **Formy ról według osoby:**
- „oceniająca” i „oceniana” przy kobietach (Anna, Ewa, Joanna, Katarzyna, Maria), „oceniający” i „oceniany” przy mężczyznach;
- „pracownik” w nagłówku zamieniony na rolę w procesie;
- forma brana z pola osoby w danych pokazowych (dopisz pole, jeśli go nie ma);
- Anna nie widzi własnego terminu oceny wśród swoich spraw jako oceniająca.

1.15 **Teksty** (obecny → nowy):
- „Nie zaznaczysz — nie trafią do oceny.” → „Do oceny trafią tylko zaznaczone.”
- „Część I czeka na potwierdzenie od dziś.” → „Przekazano <data>. Czeka na potwierdzenie <osoby>.”
- „Pytanie o notatkę” → „Notatka z <data>”
- „Zaznaczyłeś przy notatce…” → „W tej notatce zaznaczono zmianę zadań <osoby>.”
- „Odpowiem później” → „Zdecyduję później”
- „jak go ogarnąć” → „jak sobie z nim poradzić”
- „Nie przekazałeś Piotrowi… Zastanów się” → „Brak zapisanej informacji zwrotnej dla <osoby>.”
- „Statystyki… (widok dyrektora generalnego, bez nazwisk)” → „Terminowość w urzędzie (bez nazwisk)”
- Wszędzie formy bezosobowe zamiast „zaznaczyłeś / nie przekazałeś”.

### Success Criteria

#### Automated Verification
- `bun test src/routes/polish-p1.test.ts`: po jednym teście na pozycje 1.1, 1.2, 1.3, 1.6, 1.8 (ukryte odnośniki przyszłych faz w 2024), 1.9, 1.10, 1.11, 1.12, 1.13, 1.14 i 1.15. Teksty sprawdzane w HTML.
- Żaden ekran nie zawiera „2016-470/1” poza atrybutem `title` i arkuszem (test przechodzi po trasach pokazu).
- `bun test` zielony, `bun run seed` bez błędu, `wrangler deploy --dry-run` przechodzi.

#### Manual Verification
- Przejście pokazu przy 360 i 1440 px: żadna pozycja 1.1–1.15 nie wraca na zrzutach.

## Phase 2: Wykończenie (P2) i uwagi testera

### Changes Required

2.1 Strona główna Joanny w kroku 3 (10.11.2026) ma sprawę „Wpisz nieobecności” albo kartę „Cykle wymagające uwagi” z Piotrem. Jeśli dane nie dają powodu, sprawa „Sprawdź nieobecności przed terminami ocen” z listą najbliższych terminów.

2.2 Ekran „Przed rozmową”:
- to samo pytanie nie pada 3 razy;
- nagłówek „Docenienie” ma zdanie wyjaśnienia i wygląda jak pozostałe sekcje.

2.3 „Wstaw do uzasadnienia” wstawia notatki jako osobne akapity z datą („11.02.2025: …”), nie jako jeden sklejony akapit.

2.4 Karta zmiany zadań: przy „Możesz ją przenieść” jest przycisk albo zdanie znika.

2.5 „arkusz C” / „Arkusz C” pisane jednolicie. Pigułki przepisów w liście braków nie łamią linii w środku.

2.6 Kafelki statystyk z zerami: gdy wszystkie są 0, jedno zdanie zamiast 12 kafli z zerami.

2.7 Sortowanie `/hr`: najpierw cykle wymagające działania, zamknięte na końcu.

2.8 Blokada oceny bez potwierdzonej części I ma przycisk „Przejdź do części I”.

2.9 Oś czasu przed dodaniem nieobecności: kreska „Dziś” nie dotyka kółka terminu (odstęp minimalny).

2.10 Legenda osi czasu ma próbki kropki pełnej i pustej.

2.11 Arkusz: jeden przycisk druku zamiast dwóch.

### Success Criteria

#### Automated Verification
- `bun test src/routes/polish-p2.test.ts`: testy pozycji 2.1, 2.3, 2.6, 2.7 i 2.8.
- `bun test` zielony.

#### Manual Verification
- Pozycje 2.2, 2.4, 2.5 i 2.9–2.11 obejrzane na zrzutach 360 i 1440 px.

## Testing Strategy

Trasy przez `app.request()` z ciasteczkiem konta i datą ustawioną w `settings`. Teksty sprawdzane po zdjęciu znaczników HTML. Wygląd sprawdza człowiek na zrzutach (decyzja 13b).

## Open questions

- 1.2: próg 30 dni przed terminem to założenie. Autor może go zmienić.

## References

- `context/foundation/demo.md`
- `context/foundation/decisions.md` (sekcja 13)
- `context/design/README.md`, `context/design/mockups/*.html`
- `context/domain/glossary.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Usterki, które juror zauważy (P1) i teksty

#### Automated

- [ ] 1.1 Testy pozycji P1 i tekstów przechodzą: `bun test src/routes/polish-p1.test.ts`
- [ ] 1.2 Cały zestaw, dane pokazowe i wersja Cloudflare: `bun test`, `bun run seed`, `wrangler deploy --dry-run`

#### Manual

- [ ] 1.3 Pokaz przy 360 i 1440 px bez usterek 1.1–1.15

### Phase 2: Wykończenie (P2) i uwagi testera

#### Automated

- [ ] 2.1 Testy pozycji P2 przechodzą: `bun test src/routes/polish-p2.test.ts`
- [ ] 2.2 Cały zestaw testów przechodzi: `bun test`

#### Manual

- [ ] 2.3 Pozycje 2.2, 2.4, 2.5, 2.9–2.11 obejrzane na zrzutach
