# Paczka „teksty interfejsu” (gałąź `final-copy`)

Cel: każdy tekst na ekranie jest poprawny, spójny i zgodny ze słownikiem. Zasady wspólne: `change.md`. To przegląd: kodu nie zmieniasz, wynik to jeden plik.

Wolno zmieniać: tylko `context/archive/final-polish/copy-findings.md`.

Źródła reguł: `context/domain/glossary.md` (słowo na ekranie, czego nie pisać), `AGENTS.md` (zasady 6 i 7), zasady tekstów interfejsu: przycisk mówi, co się stanie (czasownik + dopełnienie); ta sama rzecz ma zawsze tę samą nazwę; błąd mówi, co się stało i jak to naprawić; nagłówek nazywa czynność; bez żargonu i skrótów bez rozwinięcia; polska typografia („…”, półpauza ze spacjami, twarda spacja po jednoliterowych słowach); zdania krótkie, strona czynna.

Przejdź wszystkie pliki w `src/views/`, `src/tour/`, `src/content.ts`, komunikaty błędów w `src/routes/` i teksty kart w `src/hr-partner/`. Dla każdego znaleziska wiersz tabeli: plik i linia, tekst dziś, proponowany tekst, reguła, waga (błąd / niespójność / kosmetyka). Szukaj w szczególności:
- tej samej czynności pod różnymi nazwami („Otwórz”, „Zobacz”, „Pokaż”) i przycisków bez dopełnienia;
- nagłówków, które nie mówią, co się na ekranie robi;
- komunikatów błędów bez wskazania, co poprawić;
- słów zakazanych przez słownik („podpis” i podobne), etykiet oceniających osobę;
- liczb i dat w niespójnym formacie, ujemnych liczb dni, skrótów prawnych bez rozwinięcia przy pierwszym użyciu;
- literówek, błędów odmiany imion i nazwisk, sierot typograficznych w nagłówkach.

Na końcu pliku: lista 10 zmian o największym wpływie i lista terminów, które mają dwie nazwy (z rekomendacją jednej).
