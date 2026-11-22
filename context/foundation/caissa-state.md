# Stan Caissy: mOcena

## Projekt

Prototyp asystenta ocen okresowych (HackNation 2026). Plany 7 plastrów gotowe w `context/changes/`. Oddanie 22.11.2026, 11:00; budowa nowych funkcji do 07:00; S-03 wypada, jeśli nie ruszy do 05:45.

## Decyzje i uzasadnienia

- 22.11, ok. 00:30. Budowa przez Caissę. Autor: „to jest hackathon, nie wszystko musi być idealnie. Musimy działać też szybko”. Skład: król i królowa na thinking high, pozostałe role na low. Wszystkie role na omp, bo tylko tam działa `thinking`.
- Skład: królowa Opus 5.5 high; worker Sonnet 5.5 low bez prewalk (baza i daty, słaby cel ryzykowny); arbiter Grok 4.7 low z zapasem GLM 5.3 low; mapy i dokumentacja Haiku 5.5 low.
- Bez `consider`: plany po czterech recenzjach, więc każdy plaster idzie przez `deliver --brief` z `plan.md`.
- Kolejność: F-01, S-01, S-02, potem S-04 i S-06 równolegle, S-05, S-03.

- Uruchamianie: sesja króla działa w aplikacji Herdr, a Caissa wymaga starego Herdra. Komendy Caissy idą z env `HERDR_ENV=1 HERDR_SOCKET_PATH=~/.config/herdr/herdr.sock HERDR_PANE_ID=w6J:p1 CAISSA_WAKE=0` (workspace „mOcena Caissa” w serwerze starego Herdra, bez fokusu). Koniec joba król łapie pętlą `caissa status` w tle.
- Każdy job ma `tenX: partial` (bez archiwizacji): plan F-01 zawiera kontrakt czytany przez inne plastry; archiwizacja wszystkich zmian na końcu.

- Wdrożenie: Cloudflare Workers, `bun run deploy` (lokalny wrangler; globalny `/usr/local/bin/wrangler` jest zepsuty, zła architektura). Każdy widz ma własny Durable Object z SQLite i świeżymi danymi. Test: `bun run scripts/smoke-worker.ts`. Prace poboczne (wdrożenie, narzędzia) król robi przez subagenta, nie przez slot Caissy (autor 22.11).
- Po każdym scalonym plastrze: `bun run deploy`.

## Bieżący rezultat i zgoda

Zgoda na start budowy: wiadomość autora 22.11 ok. 00:30 („Okej, będziemy ruszać, ale będziesz działał w caissie”).

## Aktywna praca

Na main i w sieci: F-01, S-01–S-06 oraz poprawki wyglądu czterech grup ekranów (S-07 w toku). Push na GitHub po każdym etapie (decyzja 13g). W toku (subagenci): przegląd wyglądu i przebiegu na żywej stronie; trzy warianty wyglądu przewodnika pokazu do oceny autora.

## Następny ruch

Autor wybiera wariant przewodnika (S-08), potem plan i budowa S-08; równolegle S-09 z listy przeglądu. Potem S-10 (automat pokazu 2x), S-11 (nagranie, PDF, README, teksty zgłoszenia). Granica nowych funkcji 07:00, oddanie 11:00, push najpóźniej 10:30.
