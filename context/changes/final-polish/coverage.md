# Pokrycie pomiaru całości

Stan wyjściowy zmierzono na `main` `6923342`. Dla każdego z 306 wierszy zapisano pomiar przy pięciu szerokościach. W kolumnie „Stan wyjściowy” kody po szerokości oznaczają niespełnione progi. Szczegółowe wartości liczbowe są w raporcie generowanym przez `scripts/design-report.ts`.

Mediana T1 (próg ≤ 30% tekstu poniżej 16 px) w kolejności 320, 360, 768, 1024 i 1440 px wynosi 51%, 51%, 51%, 46%, 46%.

Konta reprezentują role. `marek` to oceniający, `piotr` i `maria` to oceniani, `joanna` to kadry, `admin` to administrator, `anna` to czynny zastępca w wierszach oznaczonych jako zastępstwo, a `dyrektor-urzedu` to dyrektor generalny. Dla tras chronionych anonim otrzymuje przekierowanie do wyboru konta, mierzonego w wierszu `account`. Wiersze 403 pokazują odmowę dla przykładowego konta bez dostępu. Wiersze 404 pokazują odpowiedź dla brakującego zasobu. Awarię 500 wywołuje chwilowa niedostępność tabeli w osobnej bazie pomiarowej. Przy wszystkich krokach przewodnika panel jest widoczny, a jego treść na telefonie rozwijana. Ekran końcowy w aplikacji ma własny układ bez panelu.

Identyfikator zrzutu daje plik `<identyfikator>-<szerokość>.jpg`. Eksporty CSV, ICS i JSON otrzymują podgląd pobranej treści, a wydruk dodatkowo PDF i PNG każdej strony.

| Trasa GET | Konto | Stan | Identyfikator zrzutu | Stan wyjściowy |
| --- | --- | --- | --- | --- |
| `/` | `anonim` | wejście do aplikacji | `home-guest` | nie przechodzi · 320 — T1, H2 / 360 — T1, H2 / 768 — T1, T2, H2 / 1024 — T1, H2 / 1440 — T1, H2 |
| `/` | `marek` | sprawy na początku cyklu | `home-marek` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/` | `marek` | sprawy przed oceną | `home-marek-late` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/` | `marek` | fokus · Tab × 1 | `home-tab-1` | nie przechodzi · 320 — T1, K3 / 360 — T1, K3 / 768 — T1, T2, K3 / 1024 — T1, K3 / 1440 — T1, K3 |
| `/` | `marek` | fokus · Tab × 3 | `home-tab-3` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/` | `marek` | fokus · Tab × 6 | `home-tab-6` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/` | `piotr` | oczekujące potwierdzenie | `home-piotr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/` | `joanna` | sprawy kadr | `home-hr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/` | `admin` | sprawy administratora | `home-admin` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/` | `dyrektor-urzedu` | sprawy dyrektora generalnego | `home-director` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/` | `piotr` | brak spraw (przed wyznaczeniem kryteriów) | `home-empty` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego (wcześniej konto `maria` włączane tylko do pomiaru) |
| `/account` | `anonim` | pierwsze uruchomienie: pusta baza, bez trybu pokazu | `first-run` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/account` | `anonim` | wybór konta | `account` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/account` | `anonim` | 422 · nieznane konto | `account-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/account` | `marek` | wybór konta po zalogowaniu | `account-marek` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/account` | `piotr` | wybór konta po zalogowaniu | `account-piotr` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/account` | `joanna` | wybór konta po zalogowaniu | `account-joanna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/account` | `admin` | wybór konta po zalogowaniu | `account-admin` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/account` | `dyrektor-urzedu` | wybór konta po zalogowaniu | `account-dyrektor-urzedu` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/about` | `anonim` | Wdrożenie i dane | `about-anonim` | nie przechodzi · 320 — L2 / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/about` | `marek` | Wdrożenie i dane | `about-marek` | nie przechodzi · 320 — L2 / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/about` | `piotr` | Wdrożenie i dane | `about-piotr` | nie przechodzi · 320 — L2 / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/about` | `joanna` | Wdrożenie i dane | `about-joanna` | nie przechodzi · 320 — L2 / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/about` | `admin` | Wdrożenie i dane | `about-admin` | nie przechodzi · 320 — L2 / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/about` | `dyrektor-urzedu` | Wdrożenie i dane | `about-dyrektor-urzedu` | nie przechodzi · 320 — L2 / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id` | `marek` | przekierowanie do części I | `cycle-marek` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id` | `piotr` | przekierowanie do części I | `cycle-piotr` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id` | `admin` | 403 · odmowa | `cycle-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id` | `marek` | 404 · brak zasobu | `cycle-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id` | `anna` | przekierowanie czynnego zastępcy | `cycle-anna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/` | `anna` | sprawy czynnego zastępcy | `home-substitute` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `marek` | wybór kryteriów | `part1-edit` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `marek` | 422 · cztery kryteria dodatkowe | `part1-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `marek` | przekazana i zablokowana | `part1-submitted` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `marek` | po potwierdzeniu | `part1-done-marek` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `piotr` | przed przekazaniem | `part1-piotr-wait` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `piotr` | do potwierdzenia | `part1-to-confirm` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `piotr` | po potwierdzeniu | `part1-confirmed` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `joanna` | podgląd przed przekazaniem | `part1-hr-edit` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `joanna` | podgląd oczekującego potwierdzenia | `part1-hr-pending` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `joanna` | podgląd po potwierdzeniu | `part1-hr-done` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `admin` | 403 · odmowa | `part1-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/part1` | `marek` | 404 · brak zasobu | `part1-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/part1` | `anna` | podgląd czynnego zastępcy | `part1-substitute` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/cards/opening` | `marek` | karta bez zaproszenia | `card-opening` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/cards/opening` | `marek` | karta z zaproszeniem | `card-opening-sent` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/cards/opening` | `piotr` | podgląd ocenianego | `card-opening-piotr` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/cards/opening` | `admin` | 403 · odmowa | `opening-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/cards/opening` | `marek` | 404 · brak zasobu | `opening-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/cards/opening` | `anna` | karta czynnego zastępcy | `opening-substitute` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `marek` | blokada · brak potwierdzenia części I | `assessment-no-part1` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `marek` | pusty formularz | `assessment-empty` | nie przechodzi · 320 — L2 / 360 — K4 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `marek` | 422 · niekompletna ocena | `assessment-error` | nie przechodzi · 320 — L2 / 360 — K4 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `marek` | zapisany szkic | `assessment-draft` | nie przechodzi · 320 — L2 / 360 — K4 / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `marek` | zatwierdzona | `assessment-approved` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `marek` | po zapoznaniu | `assessment-done-marek` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `marek` | zapoznanie przez doręczenie | `assessment-fiction-saved` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `marek` | fokus · Tab × 1 | `assessment-tab-1` | nie przechodzi · 320 — K3, L2 / 360 — K3, K4 / 768 — T2, K3 / 1024 — K3 / 1440 — K3 |
| `/cycles/:id/assessment` | `marek` | fokus · Tab × 3 | `assessment-tab-3` | nie przechodzi · 320 — L2 / 360 — K4 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `marek` | fokus · Tab × 6 | `assessment-tab-6` | nie przechodzi · 320 — L2 / 360 — K4 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `piotr` | przed zatwierdzeniem | `assessment-piotr-wait` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `piotr` | do zapoznania | `assessment-piotr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `piotr` | po zapoznaniu | `assessment-acknowledged` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `joanna` | przed zatwierdzeniem | `assessment-hr-wait` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `joanna` | zatwierdzona | `assessment-hr-approved` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `joanna` | po zapoznaniu | `assessment-hr-done` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `anna` | formularz czynnego zastępcy | `assessment-substitute` | nie przechodzi · 320 — L2 / 360 — K4 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `admin` | 403 · odmowa | `assessment-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/assessment` | `marek` | 404 · brak zasobu | `assessment-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/assessment` | `piotr` | blokada · brak potwierdzenia części I | `assessment-no-part1-piotr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `joanna` | blokada · brak potwierdzenia części I | `assessment-no-part1-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment` | `anna` | ocena po wniesieniu sprzeciwu | `assessment-objection-filed-anna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `joanna` | ocena po wniesieniu sprzeciwu | `assessment-objection-filed-joanna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `anna` | ocena po rozstrzygnięciu sprzeciwu | `assessment-objection-resolved-anna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment` | `joanna` | ocena po rozstrzygnięciu sprzeciwu | `assessment-objection-resolved-joanna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment/export.json` | `marek` | 404 · ocena przed zatwierdzeniem | `assessment-export-not-approved` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/assessment/export.json` | `marek` | zatwierdzona ocena · plik JSON | `assessment-export-approved-marek` | przechodzi przy wszystkich szerokościach |
| `/cycles/:id/assessment/export.json` | `piotr` | zatwierdzona ocena · plik JSON | `assessment-export-approved-piotr` | przechodzi przy wszystkich szerokościach |
| `/cycles/:id/assessment/export.json` | `joanna` | zatwierdzona ocena · plik JSON | `assessment-export-approved-joanna` | przechodzi przy wszystkich szerokościach |
| `/cycles/:id/assessment/export.json` | `marek` | ocena po zapoznaniu · plik JSON | `assessment-export-acknowledged-marek` | przechodzi przy wszystkich szerokościach |
| `/cycles/:id/assessment/export.json` | `piotr` | ocena po zapoznaniu · plik JSON | `assessment-export-acknowledged-piotr` | przechodzi przy wszystkich szerokościach |
| `/cycles/:id/assessment/export.json` | `joanna` | ocena po zapoznaniu · plik JSON | `assessment-export-acknowledged-joanna` | przechodzi przy wszystkich szerokościach |
| `/cycles/:id/assessment/export.json` | `anna` | plik JSON dla zastępcy | `assessment-export-substitute` | przechodzi przy wszystkich szerokościach |
| `/cycles/:id/assessment/export.json` | `admin` | 403 · odmowa | `assessment-export-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/assessment/export.json` | `marek` | 404 · brak zasobu | `assessment-export-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/part1` | `marek` | nowy cykl po negatywnej ocenie | `part1-after-negative` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/new` | `marek` | zaproszenie na rozmowę po negatywnej ocenie | `invitation-after-negative` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/request` | `piotr` | zmiana terminu zablokowana po negatywnej ocenie | `deadline-request-after-negative` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change` | `marek` | zmiana terminu zablokowana po negatywnej ocenie | `deadline-decision-after-negative` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/assessment/fiction` | `marek` | pusty formularz | `fiction-form` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — T3 |
| `/cycles/:id/assessment/fiction` | `marek` | 422 · brak danych doręczenia | `fiction-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — T3 |
| `/cycles/:id/assessment/fiction` | `marek` | 409 · już zapoznano | `fiction-blocked` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2, L3 / 1024 — L3 / 1440 — L3 |
| `/cycles/:id/assessment/fiction` | `piotr` | 403 · odmowa | `fiction-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/assessment/fiction` | `marek` | 404 · brak zasobu | `fiction-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/assessment/fiction` | `anna` | formularz czynnego zastępcy | `fiction-substitute` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — T3 |
| `/cycles/:id/assessment/fiction` | `anna` | 422 · brak danych doręczenia | `fiction-substitute-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — T3 |
| `/hr` | `joanna` | stan cykli i obowiązek nadania stopnia | `hr` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr` | `joanna` | po przyznaniu stopnia | `hr-awarded` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr` | `joanna` | fokus · Tab × 1 | `hr-tab-1` | nie przechodzi · 320 — K1, K3 / 360 — K1, K3 / 768 — T2, K3 / 1024 — K3 / 1440 — K3 |
| `/hr` | `joanna` | fokus · Tab × 3 | `hr-tab-3` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr` | `joanna` | fokus · Tab × 6 | `hr-tab-6` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr` | `joanna` | najechanie · odnośnik | `hover-link` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr` | `piotr` | 403 · odmowa | `hr-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr` | `joanna` | 422 · brak rozstrzygnięcia sprzeciwu | `objection-error` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr` | `joanna` | stan cykli po rozstrzygnięciu sprzeciwu | `hr-objection-resolved` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/office/statistics` | `dyrektor-urzedu` | statystyki na początku pokazu | `office-statistics-initial` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/office/statistics` | `dyrektor-urzedu` | statystyki po zapoznaniu z oceną | `office-statistics-final` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/office/statistics` | `joanna` | 403 · odmowa | `office-statistics-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr` | `anonim` | 302 · wybór konta | `hr-anonymous` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/sheet` | `marek` | pełny arkusz | `sheet` | nie przechodzi · 320 — T1, T2, K1 / 360 — T1, T2, K1 / 768 — T1, T2, K1 / 1024 — T1, T2, K1 / 1440 — T1, T2, T3, K1 |
| `/cycles/:id/sheet` | `marek` | wyciąg części I | `sheet-part1-marek` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1, T3 |
| `/cycles/:id/sheet` | `piotr` | pełny arkusz | `sheet-piotr` | nie przechodzi · 320 — T1, T2, K1 / 360 — T1, T2, K1 / 768 — T1, T2, K1 / 1024 — T1, T2, K1 / 1440 — T1, T2, T3, K1 |
| `/cycles/:id/sheet` | `piotr` | wyciąg części I | `sheet-part1-piotr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1, T3 |
| `/cycles/:id/sheet` | `joanna` | pełny arkusz | `sheet-joanna` | nie przechodzi · 320 — T1, T2, K1 / 360 — T1, T2, K1 / 768 — T1, T2, K1 / 1024 — T1, T2, K1 / 1440 — T1, T2, T3, K1 |
| `/cycles/:id/sheet` | `joanna` | wyciąg części I | `sheet-part1-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1, T3 |
| `/cycles/:id/sheet` | `anna` | pełny arkusz | `sheet-anna` | nie przechodzi · 320 — T1, T2, K1 / 360 — T1, T2, K1 / 768 — T1, T2, K1 / 1024 — T1, T2, K1 / 1440 — T1, T2, T3, K1 |
| `/cycles/:id/sheet` | `anna` | wyciąg części I | `sheet-part1-anna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1, T3 |
| `/cycles/:id/sheet` | `marek` | wydruk arkusza C · PDF i obrazy stron | `sheet-print` | nie przechodzi · 320 — T1, T2, K1, L2 / 360 — T1, T2, K1, L2 / 768 — T1, T2, K1 / 1024 — T1, T2, K1 / 1440 — T1, T2, T3, K1 |
| `/cycles/:id/sheet` | `joanna` | arkusz A · kierownik urzędu | `sheet-a` | nie przechodzi · 320 — T1, T2, K1 / 360 — T1, T2, K1 / 768 — T1, T2, K1 / 1024 — T1, T2, K1 / 1440 — T1, T2, T3, K1 |
| `/cycles/:id/sheet` | `joanna` | arkusz B · stanowisko kierownicze | `sheet-b` | nie przechodzi · 320 — T1, T2, K1 / 360 — T1, T2, K1 / 768 — T1, T2, K1 / 1024 — T1, T2, K1 / 1440 — T1, T2, T3, K1 |
| `/cycles/:id/sheet` | `admin` | 403 · odmowa | `sheet-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/sheet` | `marek` | 404 · brak zasobu | `sheet-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/people/:id/history` | `marek` | wypełniona historia | `history-marek` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/people/:id/history` | `piotr` | wypełniona historia | `history-piotr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/people/:id/history` | `joanna` | wypełniona historia | `history-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/people/:id/history` | `anna` | wypełniona historia | `history-anna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/people/:id/history` | `joanna` | brak poprzednich ocen | `history-empty` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/people/:id/history` | `admin` | 403 · odmowa | `history-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/people/:id/history` | `marek` | 404 · brak zasobu | `history-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/people/:personId/notes/new` | `marek` | pusty formularz | `note-form` | nie przechodzi · 320 — K1, F1 / 360 — K1, F1 / 768 — T2, K1, F1 / 1024 — K1, F1 / 1440 — K1, F1 |
| `/people/:personId/notes/new` | `marek` | 422 · brak treści i kryterium | `note-error` | nie przechodzi · 320 — K1, F1 / 360 — K1, F1 / 768 — T2, K1, F1 / 1024 — K1, F1 / 1440 — K1, F1 |
| `/people/:personId/notes/new` | `anna` | formularz czynnego zastępcy | `note-substitute` | nie przechodzi · 320 — K1, F1 / 360 — K1, F1 / 768 — T2, K1, F1 / 1024 — K1, F1 / 1440 — K1, F1 |
| `/people/:personId/notes/new` | `admin` | 403 · odmowa | `note-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/people/:personId/notes/new` | `marek` | 404 · brak zasobu | `note-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/notes` | `marek` | notatki pokazowe ukryte przed potwierdzeniem kryteriów | `notes-before-criteria` | nie przechodzi · 320 — T1, H2 / 360 — T1, H2 / 768 — T1, T2, H2 / 1024 — T1, H2 / 1440 — T1, H2 |
| `/notes` | `marek` | notatki | `notes-list` | nie przechodzi · 320 — H2 / 360 — H2 / 768 — T2, H2 / 1024 — H2 / 1440 — H2 |
| `/notes` | `marek` | po zapisaniu notatki | `notes-saved` | nie przechodzi · 320 — H2 / 360 — H2 / 768 — T2, H2 / 1024 — H2 / 1440 — H2 |
| `/notes` | `marek` | po wysłaniu informacji | `notes-feedback-sent` | nie przechodzi · 320 — H2 / 360 — H2 / 768 — T2, H2 / 1024 — H2 / 1440 — H2 |
| `/notes` | `piotr` | brak notatek | `notes-empty-piotr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/notes` | `joanna` | brak notatek | `notes-empty-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/notes` | `admin` | brak notatek | `notes-empty-admin` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/notes/:id/feedback` | `marek` | treść z notatki | `feedback-form` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/notes/:id/feedback` | `marek` | 422 · pusta treść | `feedback-error` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/notes/:id/feedback` | `piotr` | 403 · odmowa | `feedback-form-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/notes/:id/feedback` | `marek` | 404 · brak zasobu | `feedback-form-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/feedback` | `marek` | brak informacji | `feedback-empty-marek` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/feedback` | `piotr` | brak informacji | `feedback-empty-piotr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/feedback` | `joanna` | brak informacji | `feedback-empty-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/feedback` | `admin` | brak informacji | `feedback-empty-admin` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/feedback` | `piotr` | otrzymana informacja | `feedback-received` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/cards/assessment-conversation` | `marek` | karta bez zaproszenia | `card-assessment` | nie przechodzi · 320 — H2 / 360 — H2 / 768 — T2, H2 / 1024 — H2 / 1440 — H2 |
| `/cycles/:id/cards/assessment-conversation` | `marek` | karta z zaproszeniem | `card-assessment-sent` | nie przechodzi · 320 — H2 / 360 — H2 / 768 — T2, H2 / 1024 — H2 / 1440 — H2 |
| `/cycles/:id/cards/assessment-conversation` | `piotr` | 403 · odmowa | `assessment-card-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/cards/assessment-conversation` | `marek` | 404 · brak zasobu | `assessment-card-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/absences` | `joanna` | pusty formularz i lista bez wpisów | `absence-form` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/absences` | `joanna` | 422 · brak dat | `absence-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/absences` | `joanna` | lista po udokumentowaniu nieobecności | `absence-filled` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/absences` | `joanna` | widok zamkniętego cyklu | `absence-closed` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/absences` | `joanna` | 409 · próba zapisu w zamkniętym cyklu | `absence-closed-post` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/absences` | `piotr` | 403 · odmowa | `absences-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/absences` | `marek` | 404 · brak zasobu | `absences-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/timeline` | `marek` | oś przed nieobecnościami | `timeline-start-marek` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/timeline` | `piotr` | oś przed nieobecnościami | `timeline-start-piotr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/timeline` | `joanna` | oś przed nieobecnościami | `timeline-start-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/timeline` | `joanna` | oś z nieobecnościami | `timeline` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/timeline` | `joanna` | zapis bez zmiany terminu | `timeline-saved-unchanged` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/timeline` | `joanna` | zapis ze zmianą terminu | `timeline-saved-extended` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/timeline` | `joanna` | zapis po zatwierdzeniu | `timeline-saved-approved` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/timeline` | `marek` | oś po zmianie terminu | `timeline-shifted-marek` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/timeline` | `piotr` | oś po zmianie terminu | `timeline-shifted-piotr` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/timeline` | `anna` | oś czynnego zastępcy | `timeline-substitute` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/timeline` | `admin` | 403 · odmowa | `timeline-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/timeline` | `marek` | 404 · brak zasobu | `timeline-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/appraiser` | `joanna` | wybór oceniającego | `appraiser-change` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/appraiser` | `joanna` | zaproponowany oceniający | `appraiser-prefilled` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/appraiser` | `joanna` | 422 · pusty wybór | `appraiser-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/appraiser` | `joanna` | zamknięty cykl | `appraiser-closed` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/timeline` | `joanna` | po zmianie oceniającego | `timeline-appraiser-changed` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/appraiser` | `piotr` | 403 · odmowa | `appraiser-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/appraiser` | `marek` | 404 · brak zasobu | `appraiser-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr/people` | `joanna` | lista pracowników | `people-joanna` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people` | `admin` | lista pracowników | `people-admin` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people` | `joanna` | brak wyników wyszukiwania | `people-empty-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people` | `admin` | brak wyników wyszukiwania | `people-empty-admin` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people/import` | `joanna` | import CSV · pusty formularz | `people-import` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/hr/people/import` | `joanna` | import CSV · podgląd wierszy (POST, 200) | `people-import-preview` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/hr/people/import` | `joanna` | 422 · zły nagłówek pliku | `people-import-error` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/hr/people` | `joanna` | lista pracowników (nazwa z pierwszego pomiaru) | `hr-people` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people` | `joanna` | po utworzeniu | `people-saved` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people` | `joanna` | po edycji | `people-updated` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people` | `admin` | po utworzeniu | `people-saved-admin` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people` | `admin` | po edycji | `people-updated-admin` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people` | `piotr` | 403 · odmowa | `people-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr/people` | `joanna` | po usunięciu fikcyjnego pracownika | `people-deleted` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people/:id/delete` | `joanna` | potwierdzenie usunięcia | `person-delete-confirm` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people/:id/delete` | `joanna` | 422 · brak potwierdzenia | `person-delete-error` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr/people/:id/delete` | `joanna` | 409 · pracownik powiązany z innymi cyklami | `person-delete-blocked` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people/:id/delete` | `joanna` | 404 · brak pracownika | `person-delete-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr/people/:id/delete` | `admin` | 403 · odmowa administratorowi | `person-delete-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr/people/new` | `joanna` | pusty formularz | `person-new-joanna` | nie przechodzi · 320 — T1, L3 / 360 — T1, L3 / 768 — T1, T2, L3 / 1024 — T1, L3 / 1440 — T1, L3 |
| `/hr/people/new` | `joanna` | 422 · brak danych | `person-new-error-joanna` | nie przechodzi · 320 — T1, L3 / 360 — T1, L3 / 768 — T1, T2, L3 / 1024 — T1, L3 / 1440 — T1, L3 |
| `/hr/people/:id/edit` | `joanna` | wypełniony formularz z cyklem | `person-edit-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/hr/people/:id/edit` | `joanna` | wypełniony formularz bez cyklu | `person-edit-no-cycle-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/hr/people/:id/edit` | `joanna` | 422 · usunięta nazwa | `person-edit-error-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/hr/substitutions` | `joanna` | brak zastępstw | `substitutions-joanna` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/substitutions` | `joanna` | 422 · brak danych | `substitutions-error-joanna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/substitutions` | `joanna` | po dodaniu zastępstwa | `substitutions-saved-joanna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people/new` | `admin` | pusty formularz | `person-new-admin` | nie przechodzi · 320 — T1, L3 / 360 — T1, L3 / 768 — T1, T2, L3 / 1024 — T1, L3 / 1440 — T1, L3 |
| `/hr/people/new` | `admin` | 422 · brak danych | `person-new-error-admin` | nie przechodzi · 320 — T1, L3 / 360 — T1, L3 / 768 — T1, T2, L3 / 1024 — T1, L3 / 1440 — T1, L3 |
| `/hr/people/:id/edit` | `admin` | wypełniony formularz z cyklem | `person-edit-admin` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/hr/people/:id/edit` | `admin` | wypełniony formularz bez cyklu | `person-edit-no-cycle-admin` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/hr/people/:id/edit` | `admin` | 422 · usunięta nazwa | `person-edit-error-admin` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/hr/substitutions` | `admin` | brak zastępstw | `substitutions-admin` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/substitutions` | `admin` | 422 · brak danych | `substitutions-error-admin` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/substitutions` | `admin` | po dodaniu zastępstwa | `substitutions-saved-admin` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/hr/people/new` | `piotr` | 403 · odmowa | `person-new-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr/people/:id/edit` | `joanna` | 404 · brak osoby | `person-edit-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr/people/:id/edit` | `piotr` | 403 · odmowa | `person-edit-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr/substitutions` | `piotr` | 403 · odmowa | `substitutions-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/hr/export.csv` | `joanna` | pobranie CSV · podgląd treści | `export-joanna` | przechodzi przy wszystkich szerokościach |
| `/hr/export.csv` | `admin` | pobranie CSV · podgląd treści | `export-admin` | przechodzi przy wszystkich szerokościach |
| `/hr/export.csv` | `piotr` | 403 · odmowa | `export-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/notes/:noteId/task-change` | `marek` | pytanie bez odpowiedzi | `task-change-question` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/notes/:noteId/task-change` | `marek` | 422 · brak odpowiedzi | `task-change-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/notes/:noteId/task-change` | `marek` | po odpowiedzi Tak | `task-change-card` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/notes/:noteId/task-change` | `marek` | po odpowiedzi Nie | `task-change-no` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/notes/:noteId/task-change` | `piotr` | 403 · odmowa | `task-change-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/notes/:noteId/task-change` | `marek` | 404 · brak zasobu | `task-change-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/before-meeting` | `marek` | podsumowanie z notatkami | `before-meeting` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/before-meeting` | `marek` | podsumowanie bez notatek | `before-meeting-empty` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/before-meeting` | `piotr` | 403 · odmowa | `before-meeting-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/before-meeting` | `marek` | 404 · brak zasobu | `before-meeting-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/appreciation` | `marek` | notatki do docenienia | `appreciation` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/appreciation` | `marek` | brak notatek do docenienia | `appreciation-empty` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/appreciation` | `piotr` | 403 · odmowa | `appreciation-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/appreciation` | `marek` | 404 · brak zasobu | `appreciation-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/admin/suggestion-sources` | `admin` | źródła podpowiedzi | `suggestion-sources` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2, K1 / 1024 — K1 / 1440 — K1 |
| `/admin/rules` | `admin` | wersja przepisów | `admin-rules` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/admin/rules` | `joanna` | 403 · odmowa | `admin-rules-403` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/admin/corrections` | `admin` | lista arkuszy do korekty | `admin-corrections` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/cycles/:id/sheet/correction` | `admin` | korekta arkusza · formularz | `sheet-correction` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/cycles/:id/sheet/correction` | `admin` | 422 · korekta bez pól | `sheet-correction-error` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/cycles/:id/sheet/correction` | `marek` | 403 · odmowa | `sheet-correction-403` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/cycles/:id/sheet/correction` | `admin` | 404 · brak cyklu | `sheet-correction-404` | nowy wiersz (final-routes-errors), bez pomiaru wyjściowego |
| `/admin/suggestion-sources` | `piotr` | 403 · odmowa | `sources-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/tour` | `anonim` | wejście do przewodnika | `tour-entry` | nie przechodzi · 320 — T1, H2 / 360 — T1, H2 / 768 — T1, T2, H2 / 1024 — T1, H2 / 1440 — T1, H2 |
| `/tour` | `marek` | wejście po zalogowaniu | `tour` | nie przechodzi · 320 — T1, H2 / 360 — T1, H2 / 768 — T1, T2, H2 / 1024 — T1, H2 / 1440 — T1, H2 |
| `/tour` | `piotr` | wejście po zalogowaniu | `tour-entry-piotr` | nie przechodzi · 320 — T1, H2 / 360 — T1, H2 / 768 — T1, T2, H2 / 1024 — T1, H2 / 1440 — T1, H2 |
| `/tour` | `joanna` | wejście po zalogowaniu | `tour-entry-joanna` | nie przechodzi · 320 — T1, H2 / 360 — T1, H2 / 768 — T1, T2, H2 / 1024 — T1, H2 / 1440 — T1, H2 |
| `/tour` | `admin` | wejście po zalogowaniu | `tour-entry-admin` | nie przechodzi · 320 — T1, H2 / 360 — T1, H2 / 768 — T1, T2, H2 / 1024 — T1, H2 / 1440 — T1, H2 |
| `/tour` | `dyrektor-urzedu` | wejście po zalogowaniu | `tour-entry-dyrektor-urzedu` | nie przechodzi · 320 — T1, H2 / 360 — T1, H2 / 768 — T1, T2, H2 / 1024 — T1, H2 / 1440 — T1, H2 |
| `/tour/done` | `joanna` | ekran końcowy po przejściu przewodnika | `tour-done` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/tour/done` | `anonim` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-anonim` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/tour/done` | `marek` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-marek` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/tour/done` | `piotr` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-piotr` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/tour/done` | `joanna` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-joanna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/tour/done` | `admin` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-admin` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/tour/done` | `dyrektor-urzedu` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-dyrektor-urzedu` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/part1` | `marek` | przewodnik · krok 1 | `tour-1` | nie przechodzi · 320 — H2 / 360 — H2 / 768 — T2, H2 / 1024 — H2, K2, K3, Kontrast / 1440 — H2, K2, K3, Kontrast |
| `/cycles/:id/part1` | `piotr` | przewodnik · krok 1b | `tour-1b` | nie przechodzi · 320 — H2 / 360 — H2 / 768 — T2, H2 / 1024 — H2, K2, K3, Kontrast / 1440 — H2, K2, K3, Kontrast |
| `/people/:personId/notes/new` | `marek` | przewodnik · krok 2 | `tour-2` | nie przechodzi · 320 — H2, K1, F1 / 360 — H2, K1, F1 / 768 — T2, H2, K1, F1 / 1024 — H2, K1, K2, K3, Kontrast, F1 / 1440 — H2, K1, K2, K3, Kontrast, F1 |
| `/cycles/:id/absences` | `joanna` | przewodnik · krok 3 | `tour-3` | nie przechodzi · 320 — H2 / 360 — H2 / 768 — T2, H2 / 1024 — H2, K2, K3, Kontrast / 1440 — H2, K2, K3, Kontrast |
| `/cycles/:id/assessment` | `marek` | przewodnik · krok 4 | `tour-4` | nie przechodzi · 320 — H2, L2 / 360 — H2, K4 / 768 — T2, H2 / 1024 — H2, K1, K2, K3, Kontrast / 1440 — H2, K1, K2, K3, Kontrast |
| `/cycles/:id/assessment` | `piotr` | przewodnik · krok 5 | `tour-5` | nie przechodzi · 320 — H2 / 360 — H2 / 768 — T2, H2, L3 / 1024 — H2, K2, K3, L3, Kontrast / 1440 — H2, K2, K3, L3, Kontrast |
| `/hr` | `joanna` | przewodnik · krok 5b | `tour-5b` | nie przechodzi · 320 — H2, K1 / 360 — H2, K1 / 768 — T2, H2 / 1024 — H2, K2, K3, Kontrast / 1440 — H2, K2, K3, Kontrast |
| `/cycles/:id/timeline` | `joanna` | dodatek pokazu · oś Ewy | `tour-extra-ewa-timeline` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/assessment/fiction` | `marek` | dodatek pokazu · fikcja zapoznania | `tour-extra-fiction` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — przechodzi / 1440 — T3 |
| `/admin/suggestion-sources` | `admin` | dodatek pokazu · źródła podpowiedzi | `tour-extra-sources` | nie przechodzi · 320 — K1 / 360 — K1 / 768 — T2, K1 / 1024 — K1 / 1440 — K1 |
| `/cycles/:id/deadline-change` | `dyrektor-urzedu` | dyrektor rozpatruje wniosek Anny | `deadline-director-pending` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/:eventId/letter` | `dyrektor-urzedu` | pismo dyrektora generalnego | `deadline-letter-director` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/:eventId/letter` | `anna` | pismo dla ocenianej Anny | `deadline-letter-appraiser-as-employee` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change` | `marek` | formularz bez wniosku | `deadline-decision` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change` | `marek` | 422 · brak danych | `deadline-decision-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change` | `marek` | decyzja na wniosek ocenianego | `deadline-pending` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change` | `marek` | 422 · brak powodu odmowy | `deadline-reject-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change` | `marek` | zatwierdzona ocena | `deadline-decision-blocked` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/deadline-change` | `piotr` | 403 · odmowa | `deadline-change-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/deadline-change` | `marek` | 404 · brak zasobu | `deadline-change-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/deadline-change` | `marek` | od ostatniej oceny nie minęło 6 miesięcy | `deadline-decision-too-early` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change` | `marek` | zamknięty cykl | `deadline-decision-closed` | nie przechodzi · 320 — T1 / 360 — T1 / 768 — T1, T2 / 1024 — T1 / 1440 — T1 |
| `/cycles/:id/deadline-change/request` | `piotr` | pusty wniosek | `deadline-request` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/request` | `piotr` | 422 · brak uzasadnienia | `deadline-request-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/request` | `piotr` | wniosek wysłany | `deadline-request-pending` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/request` | `piotr` | wniosek odrzucony | `deadline-request-rejected` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/request` | `piotr` | wniosek przyjęty | `deadline-request-accepted` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/request` | `piotr` | zatwierdzona ocena | `deadline-request-blocked` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/request` | `joanna` | 403 · odmowa | `deadline-request-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/deadline-change/request` | `marek` | 404 · brak zasobu | `deadline-request-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/deadline-change/request` | `piotr` | od ostatniej oceny nie minęło 6 miesięcy | `deadline-request-too-early` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/request` | `piotr` | zamknięty cykl | `deadline-request-closed` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/:eventId/letter` | `marek` | pismo po zmianie terminu | `deadline-letter-marek` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/:eventId/letter` | `piotr` | pismo po zmianie terminu | `deadline-letter-piotr` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/:eventId/letter` | `joanna` | pismo po zmianie terminu | `deadline-letter-joanna` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/deadline-change/:eventId/letter` | `admin` | 403 · odmowa | `deadline-letter-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/deadline-change/:eventId/letter` | `marek` | 404 · brak zasobu | `deadline-letter-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/invitations/new` | `marek` | nowe · rozmowa o kryteriach | `invitation-opening` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/new` | `marek` | najechanie · przycisk główny | `hover-primary` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/new` | `marek` | nowe · rozmowa oceniająca | `invitation-assessment` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/new` | `marek` | 422 · brak terminu i miejsca | `invitation-error` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/new` | `marek` | poprzednie zaproszenie w formularzu | `invitation-prefilled` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/new` | `piotr` | 403 · odmowa | `invitation-new-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/invitations/new` | `marek` | 404 · brak zasobu | `invitation-new-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/invitations/new` | `marek` | 404 · nieznany typ rozmowy | `invitation-kind-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `marek` | wysłane | `invitation-sent-marek` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `piotr` | wysłane | `invitation-sent-piotr` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `marek` | potwierdzone | `invitation-confirmed-marek` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `piotr` | potwierdzone | `invitation-confirmed-piotr` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `marek` | potwierdzone po dacie rozmowy | `invitation-expired` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `marek` | najechanie · przycisk drugorzędny | `hover-secondary` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `joanna` | 403 · odmowa | `invitation-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `marek` | 404 · brak zasobu | `invitation-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/invitations/:eventId{[0-9]+\.ics}` | `marek` | pobranie ICS · podgląd treści | `calendar-marek` | przechodzi przy wszystkich szerokościach |
| `/cycles/:id/invitations/:eventId{[0-9]+\.ics}` | `piotr` | pobranie ICS · podgląd treści | `calendar-piotr` | przechodzi przy wszystkich szerokościach |
| `/cycles/:id/invitations/:eventId{[0-9]+\.ics}` | `joanna` | 403 · odmowa | `calendar-403` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `/cycles/:id/invitations/:eventId{[0-9]+\.ics}` | `marek` | 404 · brak zasobu | `calendar-404` | nie przechodzi · 320 — T1, T2, H1, L4 / 360 — T1, T2, H1, H3, L4 / 768 — T1, T2, H1, L4 / 1024 — T1, T2, H1, L4 / 1440 — T1, T2, H1, L4 |
| `(brak trasy)` | `marek` | 404 · strona aplikacji | `error-404` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |
| `/` | `marek` | 500 · awaria dostępu do danych w bazie pomiarowej | `error-500` | nie przechodzi · 320 — przechodzi / 360 — przechodzi / 768 — T2 / 1024 — przechodzi / 1440 — przechodzi |

## Odtworzenie

```sh
bun run scripts/design-audit.ts <katalog> --widths 320,360,768,1024,1440
bun run scripts/design-report.ts <katalog>
```

Pole `hover.method` rozróżnia najechanie wskaźnikiem i wymuszenie pseudoklasy przez Chromium. `hover.styleChanged` wskazuje, czy zmieniła się któraś z właściwości stylu objętych pomiarem.

Pomiar korzysta z Chromium uruchomionego w trybie headless. Obrazy stron PDF wymagają narzędzia `pdftoppm`. Bez `--widths` skrypt mierzy przy 360 i 1440 px.
