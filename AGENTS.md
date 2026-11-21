# mOcena: wskazówki dla agentów

Prototyp cyfrowego asystenta ocen okresowych w służbie cywilnej. HackNation 2026, zadanie KPRM „Cyfrowy Asystent Ocen Okresowych”. Autor pracuje sam. Oddanie: niedziela 22.11.2026, 11:00.

## Zacznij tutaj

Czytaj w tej kolejności. Przy sprzeczności wygrywa dokument wyżej na liście.

1. `context/foundation/decisions.md`: decyzje autora z uzasadnieniem i tym, co odrzucono.
2. `context/foundation/prd.md`: wymagania (wersja 2, FR-001 do FR-036).
3. `context/foundation/roadmap.md`: plastry i przyjęta kolejność budowy.
4. `context/foundation/demo.md`: scenariusz pokazu, osoby i dane pokazowe do wgrania.
5. `context/changes/<change-id>/plan.md`: plan bieżącej zmiany; stan jest w sekcji `## Progress`.
6. `context/foundation/tech-stack.md`: stos i powody wyboru.
7. `context/domain/glossary.md`: słownik (słowo na ekranie, znaczenie, nazwa w kodzie, czego nie pisać). Czytasz go przed pierwszą linią kodu plastra.
8. `context/domain/event-storming.md`: przebieg cyklu oceny (aktor, polecenie, zdarzenie, reguła, widok) i reguły biznesowe z testami. Pełna tablica warsztatu: `context/domain/event-storming.board.json`.

`context/foundation/shape-notes.md` to notatki wejściowe do PRD. Nie są źródłem decyzji.

Nazwy tabel, zdarzeń, tras i funkcji wspólnych dla plastrów są w rozdziale „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`. Żaden plaster nie tworzy drugiej nazwy na to samo.

## Zasady, których nie wolno złamać

1. **Język.** Kod, nazwy plików, zmiennych, tabel i tras po angielsku. Interfejs i treść przepisów po polsku.
2. **Push tylko na wyraźne polecenie autora.** Commit lokalny robisz sam po każdym sprawdzonym etapie.
3. **Repo jest publiczne.** Żadnych prywatnych ścieżek, adresów e-mail, sekretów ani materiałów organizatora. Autora commitów nie zmieniasz (jest ustawiony lokalnie w tym repo).
4. **Bez modelu językowego w prototypie.** Wszystko działa na regułach: daty, liczby, pola, zdania z szablonów. System nie rozumie treści notatek.
5. **Podpowiedzi przechodzą przez jedno wymienne miejsce w kodzie** (adapter), żeby urząd mógł podłączyć model uruchomiony u siebie. Model nigdy nie proponuje punktów, nie pisze tekstu o pracowniku, nie oznacza notatki jako „dobrze / do poprawy” i nie porównuje pracowników.
6. **Słowo „potwierdzenie”, nigdy „podpis”.** Podpisu elektronicznego nie budujemy.
7. **Przy nazwisku pracownika nie ma etykiet ani wskaźników.** Sygnały pochodzą tylko z wpisów przełożonego. Nic się nie zapisuje bez kliknięcia człowieka.
8. **Bez płatnych licencji i usług.** Dane nie wychodzą poza komputer, na którym działa aplikacja.
9. **Budowę zaczynasz dopiero na wyraźne polecenie autora.** Stan na 21.11.2026 wieczór: wstrzymana. Dokumenty możesz poprawiać.
10. **Wygląd.** Pierwszy gotowy ekran (ekran startowy ze zmiany `rules-engine-and-demo-data`) pokazujesz autorowi na zrzucie (360 px i 1440 px). Dopiero po jego akceptacji powielasz wygląd na kolejne ekrany.

## Komendy

```sh
bun install
bun run dev      # serwer z przeładowaniem
bun test         # testy silnika i tras
bun run seed     # dane pokazowe (powstaje w zmianie rules-engine-and-demo-data)
```

Trasy sprawdzaj w testach przez `app.request()`, bez uruchamiania serwera.

## Stan kodu (21.11.2026, 19:00)

- Jest starter Hono (`src/index.ts`, `GET /`).
- Silnik wyniku i terminów jest skopiowany z nazwami po polsku: `reguly/rozporzadzenie-2016-470.json`, `src/silnik/ocena.ts`, `src/silnik/terminy.ts`, `src/silnik/ocena.test.ts` (19 testów przechodzi).
- Pierwszy krok budowy: przenieść to na nazwy angielskie według `context/changes/rules-engine-and-demo-data/plan.md` i poprawić datę obowiązywania reguł na `2016-04-23` (w pliku jest błędnie `2016-04-22`).
- Ekranów, bazy i danych pokazowych jeszcze nie ma.

## Sposób pracy

Zmiana to katalog `context/changes/<change-id>/` z `change.md` i `plan.md`. Po każdym kroku odhaczasz pozycję w `## Progress` i dopisujesz skrót commita. Jedna zmiana na jeden plaster z roadmapy.
