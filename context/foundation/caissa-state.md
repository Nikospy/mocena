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

Na main, w sieci i na GitHubie (22.11 ok. 02:55): F-01, S-01–S-13 zbudowane. Przewodnik pokazu działa, automat pokazu (zwykły i przewodnik) 2x zielony na żywej stronie. openbot (VM 109) ma starego Herdra 0.9.5 i Caissę: serwer Herdra w terminalu `openbot/herdr-srv`, workspace w2, pane króla `w2:p1`, modele `/tmp/models-openbot.json` (arbiter zapasowy Codex `gpt-6.1-sol`, bo omp na openbot nie ma zAI); repo wysyła `debian.ts wyslij <repo> --host=openbot --apply`, wynik ściąga `git fetch openbot caissa/<id>/integration`. Limit Caissy: 3 joby na maszynę. W toku (subagenci): druga runda przeglądu wyglądu i dostępności, skrypt nagrania pokazu.

## Następny ruch

Raport drugiej rundy podzielić po plikach na 3–6 jobów (Mac i openbot), scalić, przejść przewodnik przy 360 i 1440 px, pokazać autorowi zrzuty. Potem nagranie, zrzuty do prezentacji i PDF, teksty formularza, przegląd autora, archiwizacja, push najpóźniej 10:30.
