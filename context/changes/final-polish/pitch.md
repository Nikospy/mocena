# Paczka „prezentacja” (gałąź `final-pitch`)

Cel: prezentacja dla jury (`docs/pitch/index.html`, zapis do PDF, najwyżej 15 slajdów) jest na poziomie studia i mówi do kryteriów oceny: związek z wyzwaniem i zgodność z przepisami 30%, potencjał wdrożeniowy 30%, oryginalność 20%, kompletność 20%. Zasady wspólne: `change.md`.

Wolno zmieniać: `docs/pitch/` i `scripts/pitch-shots.ts`. Treść tylko z faktów w repo (`README.md`, `context/foundation/`), bez obietnic na wyrost i bez materiałów organizatora.

1. Obejrzyj każdy slajd na zrzucie (1920×1080, przeglądarka bez okna) i oceń według kanonu autora (`kanon/projektowanie.md`, `kanon/branding.md`): jeden element główny na slajdzie, najwyżej 4 rozmiary pisma, siatka i wspólne krawędzie, wiersz do 75 znaków, kontrast, bez ozdób.
2. Popraw układ i typografię slajdów. Jeden slajd to jedna teza w nagłówku (zdanie, nie hasło) i jeden dowód (zrzut ekranu, liczba albo przepis).
3. Sprawdź kolejność opowieści: problem → co robi asystent → pokaz na ekranach → zgodność z przepisami (reguły w pliku z wersją) → HR partner → wdrożenie u siebie (bez płatnych licencji, dane lokalnie) → co dalej. Brakujące ogniwo dopisz, powtórzenia usuń. Limit 15 slajdów.
4. Zapis do PDF: jedna strona na slajd, nic nie ucięte, fonty osadzone. Zapisz PDF w `docs/pitch/` i policz strony.
5. Zrzuty ekranów w slajdach powstają skryptem `scripts/pitch-shots.ts`; ekrany aplikacji zmieniają się w innych paczkach, więc ramki zrzutów mają działać po ponownym uruchomieniu skryptu (koordynator uruchomi go po scaleniu).

Raport: lista slajdów (numer, teza), ścieżki zrzutów wszystkich slajdów „po”, ścieżka PDF, liczba stron.
