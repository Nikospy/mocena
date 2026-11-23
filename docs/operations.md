# Utrzymanie w urzędzie

Instrukcja dla osoby, która prowadzi mOcenę na komputerze urzędu. Dane są w jednym pliku SQLite (domyślnie `mocena.sqlite`; inną ścieżkę ustawia zmienna `MOCENA_DB`). Nic nie wychodzi poza ten komputer.

## Sprawdzenie, czy działa

`GET /healthz` zwraca `{"status":"ok","rulesVersion":"...","db":"ok"}` (kod 200). Gdy baza nie odpowiada, kod to 503. Adres nie wymaga logowania i nie zwraca danych osobowych, więc nadaje się do monitoringu:

```sh
curl -fsS http://localhost:3000/healthz
```

## Kopia

Kopię robisz przed każdą aktualizacją i co najmniej raz na dobę. Używaj kopii spójnej, a nie zwykłego kopiowania pliku z działającej bazy:

```sh
sqlite3 "${MOCENA_DB:-mocena.sqlite}" ".backup 'kopia-$(date +%F).sqlite'"
```

Kopię przechowuj poza katalogiem aplikacji, w miejscu zabezpieczonym tak jak inne dane kadrowe urzędu. Bez narzędzia `sqlite3` zatrzymaj aplikację i skopiuj plik bazy razem z plikami `-wal` i `-shm`, jeśli istnieją.

## Przywracanie

1. Zatrzymaj aplikację.
2. Zachowaj uszkodzony plik pod inną nazwą (nie usuwaj go).
3. Skopiuj wybraną kopię w miejsce pliku z `MOCENA_DB` (usuń przy nim stare pliki `-wal` i `-shm`).
4. Uruchom aplikację i sprawdź `GET /healthz`, potem otwórz listę cykli w kadrach.

## Aktualizacja

1. Zrób kopię (patrz wyżej).
2. `git pull`
3. `bun install`
4. `bun test`: przy czerwonym wyniku nie uruchamiaj nowej wersji.
5. Zrestartuj aplikację i sprawdź `GET /healthz`.

### Nowelizacja przepisów (reguł)

Nowe przepisy wgrywa administrator na ekranie `/admin/rules`, bez zmiany plików i bez restartu:

1. Pobierz szablon aktualnego pakietu (JSON).
2. Nadaj nowy identyfikator w polu `version` (opublikowanej wersji nie da się zmienić ani nadpisać), ustaw `effectiveFrom` nie wcześniejszy niż data obecnej wersji (ta sama data oznacza poprawkę: wygrywa nowsza publikacja) i zmień terminy, nazwy kryteriów i poziomów, opisy albo podstawy prawne.
3. Wgraj plik (do 256 KB) albo wklej JSON. System odrzuca pakiet z listą powodów (422), gdy zmienia strukturę (kryteria, arkusze, punkty skali, progi poziomów: „zmiana struktury wymaga zmiany programu”), ma wartości poza granicami (miesiące 1–60, dni 1–90, kryteria dodatkowe 0–5), pomija sekcję albo nie przechodzi próby działania silnika. Nic wtedy nie zapisuje.
4. Przejrzyj podgląd: zmienione wartości ze wszystkich sekcji, liczbę otwartych cykli, które przejdą na nowe wartości (i w ilu zmieni się termin oceny), oraz cykli z zatwierdzoną oceną, które zostaną przy swojej wersji.
5. Kliknij „Opublikuj nową wersję reguł”. Wersja obowiązuje od daty `effectiveFrom` (wg zegara aplikacji); wcześniej obowiązuje poprzednia.

Pakiet zapisuje się w tabeli `rule_versions` w bazie, więc wchodzi do kopii zapasowej razem z danymi. Historia wersji jest na `/admin/rules`. Oceny zatwierdzone wcześniej zostają przy wersji zapisanej w ocenie: ich arkusz, historia i oś czasu pokazują nazwy, skalę, poziomy i terminy z tamtej wersji. Zmiany zakresu, którego pakiet nie obejmuje (inne kryteria, skala punktów, progi poziomów), wymagają zmiany programu i aktualizacji jak wyżej. Restart pokazu (`/demo/restart`) wraca do wersji wyjściowej.

## Czego ta instrukcja nie obejmuje

Logowania, okresu przechowywania danych i administratora danych ustala urząd (strona `/about`, „Wdrożenie i dane”).
