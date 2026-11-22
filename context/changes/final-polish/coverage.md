# Pokrycie pomiaru całości

Konta reprezentują role: `marek` to oceniający, `piotr` i `tomasz` to oceniani, `joanna` to kadry, `admin` to administrator, a `anna` to czynny zastępca w wierszach oznaczonych jako zastępstwo. Dla tras chronionych anonim otrzymuje przekierowanie do wyboru konta, mierzonego w wierszu `account`. Wiersze 403 pokazują odmowę dla przykładowego konta bez dostępu. Wiersze 404 pokazują odpowiedź dla brakującego zasobu.

Identyfikator w ostatniej kolumnie daje plik `<identyfikator>-<szerokość>.jpg`. Eksporty CSV i ICS otrzymują podgląd pobranej treści, a wydruk dodatkowo PDF i PNG każdej strony.

| Trasa GET | Konto | Stan | Identyfikator zrzutu |
| --- | --- | --- | --- |
| `/` | `anonim` | wejście do aplikacji | `home-guest` |
| `/` | `marek` | sprawy na początku cyklu | `home-marek` |
| `/` | `marek` | sprawy przed oceną | `home-marek-late` |
| `/` | `marek` | fokus · Tab × 1 | `home-tab-1` |
| `/` | `marek` | fokus · Tab × 3 | `home-tab-3` |
| `/` | `marek` | fokus · Tab × 6 | `home-tab-6` |
| `/` | `marek` | najechanie · akcja główna | `hover-primary` |
| `/` | `piotr` | oczekujące potwierdzenie | `home-piotr` |
| `/` | `joanna` | sprawy kadr | `home-hr` |
| `/` | `admin` | sprawy administratora | `home-admin` |
| `/` | `tomasz` | brak spraw | `home-empty` |
| `/account` | `anonim` | wybór konta | `account` |
| `/account` | `anonim` | 422 · nieznane konto | `account-error` |
| `/account` | `marek` | wybór konta po zalogowaniu | `account-marek` |
| `/account` | `piotr` | wybór konta po zalogowaniu | `account-piotr` |
| `/account` | `joanna` | wybór konta po zalogowaniu | `account-joanna` |
| `/account` | `admin` | wybór konta po zalogowaniu | `account-admin` |
| `/cycles/:id` | `marek` | przekierowanie do części I | `cycle-marek` |
| `/cycles/:id` | `piotr` | przekierowanie do części I | `cycle-piotr` |
| `/cycles/:id` | `admin` | 403 · odmowa | `cycle-403` |
| `/cycles/:id` | `marek` | 404 · brak zasobu | `cycle-404` |
| `/cycles/:id/part1` | `marek` | wybór kryteriów | `part1-edit` |
| `/cycles/:id/part1` | `marek` | 422 · braki kryteriów | `part1-error` |
| `/cycles/:id/part1` | `marek` | przekazana i zablokowana | `part1-submitted` |
| `/cycles/:id/part1` | `marek` | po potwierdzeniu | `part1-done-marek` |
| `/cycles/:id/part1` | `piotr` | przed przekazaniem | `part1-piotr-wait` |
| `/cycles/:id/part1` | `piotr` | do potwierdzenia | `part1-to-confirm` |
| `/cycles/:id/part1` | `piotr` | po potwierdzeniu | `part1-confirmed` |
| `/cycles/:id/part1` | `joanna` | podgląd przed przekazaniem | `part1-hr-edit` |
| `/cycles/:id/part1` | `joanna` | podgląd oczekującego potwierdzenia | `part1-hr-pending` |
| `/cycles/:id/part1` | `joanna` | podgląd po potwierdzeniu | `part1-hr-done` |
| `/cycles/:id/part1` | `admin` | 403 · odmowa | `part1-403` |
| `/cycles/:id/part1` | `marek` | 404 · brak zasobu | `part1-404` |
| `/cycles/:id/cards/opening` | `marek` | karta bez zaproszenia | `card-opening` |
| `/cycles/:id/cards/opening` | `marek` | karta z zaproszeniem | `card-opening-sent` |
| `/cycles/:id/cards/opening` | `piotr` | podgląd ocenianego | `card-opening-piotr` |
| `/cycles/:id/cards/opening` | `admin` | 403 · odmowa | `opening-403` |
| `/cycles/:id/cards/opening` | `marek` | 404 · brak zasobu | `opening-404` |
| `/cycles/:id/assessment` | `marek` | blokada · brak potwierdzenia części I | `assessment-no-part1` |
| `/cycles/:id/assessment` | `marek` | blokada · przed oknem oceny | `assessment-early` |
| `/cycles/:id/assessment` | `marek` | pusty formularz | `assessment-empty` |
| `/cycles/:id/assessment` | `marek` | 422 · niekompletna ocena | `assessment-error` |
| `/cycles/:id/assessment` | `marek` | zapisany szkic | `assessment-draft` |
| `/cycles/:id/assessment` | `marek` | zatwierdzona | `assessment-approved` |
| `/cycles/:id/assessment` | `marek` | po zapoznaniu | `assessment-done-marek` |
| `/cycles/:id/assessment` | `marek` | zapoznanie przez doręczenie | `assessment-fiction-saved` |
| `/cycles/:id/assessment` | `marek` | fokus · Tab × 1 | `assessment-tab-1` |
| `/cycles/:id/assessment` | `marek` | fokus · Tab × 3 | `assessment-tab-3` |
| `/cycles/:id/assessment` | `marek` | fokus · Tab × 6 | `assessment-tab-6` |
| `/cycles/:id/assessment` | `piotr` | przed zatwierdzeniem | `assessment-piotr-wait` |
| `/cycles/:id/assessment` | `piotr` | do zapoznania | `assessment-piotr` |
| `/cycles/:id/assessment` | `piotr` | po zapoznaniu | `assessment-acknowledged` |
| `/cycles/:id/assessment` | `joanna` | przed zatwierdzeniem | `assessment-hr-wait` |
| `/cycles/:id/assessment` | `joanna` | zatwierdzona | `assessment-hr-approved` |
| `/cycles/:id/assessment` | `joanna` | po zapoznaniu | `assessment-hr-done` |
| `/cycles/:id/assessment` | `anna` | formularz czynnego zastępcy | `assessment-substitute` |
| `/cycles/:id/assessment` | `admin` | 403 · odmowa | `assessment-403` |
| `/cycles/:id/assessment` | `marek` | 404 · brak zasobu | `assessment-404` |
| `/cycles/:id/assessment/fiction` | `marek` | pusty formularz | `fiction-form` |
| `/cycles/:id/assessment/fiction` | `marek` | 422 · brak danych doręczenia | `fiction-error` |
| `/cycles/:id/assessment/fiction` | `marek` | 409 · już zapoznano | `fiction-blocked` |
| `/cycles/:id/assessment/fiction` | `piotr` | 403 · odmowa | `fiction-403` |
| `/cycles/:id/assessment/fiction` | `marek` | 404 · brak zasobu | `fiction-404` |
| `/hr` | `joanna` | stan cykli i obowiązek nadania stopnia | `hr` |
| `/hr` | `joanna` | po przyznaniu stopnia | `hr-awarded` |
| `/hr` | `joanna` | fokus · Tab × 1 | `hr-tab-1` |
| `/hr` | `joanna` | fokus · Tab × 3 | `hr-tab-3` |
| `/hr` | `joanna` | fokus · Tab × 6 | `hr-tab-6` |
| `/hr` | `joanna` | najechanie · odnośnik | `hover-link` |
| `/hr` | `piotr` | 403 · odmowa | `hr-403` |
| `/cycles/:id/sheet` | `marek` | pełny arkusz | `sheet` |
| `/cycles/:id/sheet` | `marek` | wyciąg części I | `sheet-part1-marek` |
| `/cycles/:id/sheet` | `piotr` | pełny arkusz | `sheet-piotr` |
| `/cycles/:id/sheet` | `piotr` | wyciąg części I | `sheet-part1-piotr` |
| `/cycles/:id/sheet` | `joanna` | pełny arkusz | `sheet-joanna` |
| `/cycles/:id/sheet` | `joanna` | wyciąg części I | `sheet-part1-joanna` |
| `/cycles/:id/sheet` | `anna` | pełny arkusz | `sheet-anna` |
| `/cycles/:id/sheet` | `anna` | wyciąg części I | `sheet-part1-anna` |
| `/cycles/:id/sheet` | `marek` | wydruk · PDF i obrazy stron | `sheet-print` |
| `/cycles/:id/sheet` | `admin` | 403 · odmowa | `sheet-403` |
| `/cycles/:id/sheet` | `marek` | 404 · brak zasobu | `sheet-404` |
| `/people/:id/history` | `marek` | wypełniona historia | `history-marek` |
| `/people/:id/history` | `piotr` | wypełniona historia | `history-piotr` |
| `/people/:id/history` | `joanna` | wypełniona historia | `history-joanna` |
| `/people/:id/history` | `anna` | wypełniona historia | `history-anna` |
| `/people/:id/history` | `joanna` | brak poprzednich ocen | `history-empty` |
| `/people/:id/history` | `admin` | 403 · odmowa | `history-403` |
| `/people/:id/history` | `marek` | 404 · brak zasobu | `history-404` |
| `/people/:personId/notes/new` | `marek` | pusty formularz | `note-form` |
| `/people/:personId/notes/new` | `marek` | 422 · brak treści i kryterium | `note-error` |
| `/people/:personId/notes/new` | `anna` | formularz czynnego zastępcy | `note-substitute` |
| `/people/:personId/notes/new` | `admin` | 403 · odmowa | `note-403` |
| `/people/:personId/notes/new` | `marek` | 404 · brak zasobu | `note-404` |
| `/notes` | `marek` | notatki | `notes-list` |
| `/notes` | `marek` | po zapisaniu notatki | `notes-saved` |
| `/notes` | `marek` | po wysłaniu informacji | `notes-feedback-sent` |
| `/notes` | `piotr` | brak notatek | `notes-empty-piotr` |
| `/notes` | `joanna` | brak notatek | `notes-empty-joanna` |
| `/notes` | `admin` | brak notatek | `notes-empty-admin` |
| `/notes/:id/feedback` | `marek` | treść z notatki | `feedback-form` |
| `/notes/:id/feedback` | `marek` | 422 · pusta treść | `feedback-error` |
| `/notes/:id/feedback` | `piotr` | 403 · odmowa | `feedback-form-403` |
| `/notes/:id/feedback` | `marek` | 404 · brak zasobu | `feedback-form-404` |
| `/feedback` | `marek` | brak informacji | `feedback-empty-marek` |
| `/feedback` | `piotr` | brak informacji | `feedback-empty-piotr` |
| `/feedback` | `joanna` | brak informacji | `feedback-empty-joanna` |
| `/feedback` | `admin` | brak informacji | `feedback-empty-admin` |
| `/feedback` | `piotr` | otrzymana informacja | `feedback-received` |
| `/cycles/:id/cards/assessment-conversation` | `marek` | karta bez zaproszenia | `card-assessment` |
| `/cycles/:id/cards/assessment-conversation` | `marek` | karta z zaproszeniem | `card-assessment-sent` |
| `/cycles/:id/cards/assessment-conversation` | `piotr` | 403 · odmowa | `assessment-card-403` |
| `/cycles/:id/cards/assessment-conversation` | `marek` | 404 · brak zasobu | `assessment-card-404` |
| `/cycles/:id/absences` | `joanna` | pusty formularz i lista bez wpisów | `absence-form` |
| `/cycles/:id/absences` | `joanna` | 422 · brak dat | `absence-error` |
| `/cycles/:id/absences` | `joanna` | lista po udokumentowaniu nieobecności | `absence-filled` |
| `/cycles/:id/absences` | `joanna` | widok zamkniętego cyklu | `absence-closed` |
| `/cycles/:id/absences` | `joanna` | 409 · próba zapisu w zamkniętym cyklu | `absence-closed-post` |
| `/cycles/:id/absences` | `piotr` | 403 · odmowa | `absences-403` |
| `/cycles/:id/absences` | `marek` | 404 · brak zasobu | `absences-404` |
| `/cycles/:id/timeline` | `marek` | oś przed nieobecnościami | `timeline-start-marek` |
| `/cycles/:id/timeline` | `piotr` | oś przed nieobecnościami | `timeline-start-piotr` |
| `/cycles/:id/timeline` | `joanna` | oś przed nieobecnościami | `timeline-start-joanna` |
| `/cycles/:id/timeline` | `joanna` | oś z nieobecnościami | `timeline` |
| `/cycles/:id/timeline` | `joanna` | zapis bez zmiany terminu | `timeline-saved-unchanged` |
| `/cycles/:id/timeline` | `joanna` | zapis ze zmianą terminu | `timeline-saved-extended` |
| `/cycles/:id/timeline` | `joanna` | zapis po zatwierdzeniu | `timeline-saved-approved` |
| `/cycles/:id/timeline` | `marek` | oś po zmianie terminu | `timeline-shifted-marek` |
| `/cycles/:id/timeline` | `piotr` | oś po zmianie terminu | `timeline-shifted-piotr` |
| `/cycles/:id/timeline` | `anna` | oś czynnego zastępcy | `timeline-substitute` |
| `/cycles/:id/timeline` | `admin` | 403 · odmowa | `timeline-403` |
| `/cycles/:id/timeline` | `marek` | 404 · brak zasobu | `timeline-404` |
| `/cycles/:id/appraiser` | `joanna` | wybór oceniającego | `appraiser-change` |
| `/cycles/:id/appraiser` | `joanna` | zaproponowany oceniający | `appraiser-prefilled` |
| `/cycles/:id/appraiser` | `joanna` | 422 · pusty wybór | `appraiser-error` |
| `/cycles/:id/appraiser` | `joanna` | zamknięty cykl | `appraiser-closed` |
| `/cycles/:id/timeline` | `joanna` | po zmianie oceniającego | `timeline-appraiser-changed` |
| `/cycles/:id/appraiser` | `piotr` | 403 · odmowa | `appraiser-403` |
| `/cycles/:id/appraiser` | `marek` | 404 · brak zasobu | `appraiser-404` |
| `/hr/people` | `joanna` | lista pracowników | `people-joanna` |
| `/hr/people` | `admin` | lista pracowników | `people-admin` |
| `/hr/people` | `joanna` | brak wyników wyszukiwania | `people-empty-joanna` |
| `/hr/people` | `admin` | brak wyników wyszukiwania | `people-empty-admin` |
| `/hr/people` | `joanna` | lista pracowników (nazwa z pierwszego pomiaru) | `hr-people` |
| `/hr/people` | `joanna` | po utworzeniu | `people-saved` |
| `/hr/people` | `joanna` | po edycji | `people-updated` |
| `/hr/people` | `admin` | po utworzeniu | `people-saved-admin` |
| `/hr/people` | `admin` | po edycji | `people-updated-admin` |
| `/hr/people` | `piotr` | 403 · odmowa | `people-403` |
| `/hr/people/new` | `joanna` | pusty formularz | `person-new-joanna` |
| `/hr/people/new` | `joanna` | 422 · brak danych | `person-new-error-joanna` |
| `/hr/people/:id/edit` | `joanna` | wypełniony formularz z cyklem | `person-edit-joanna` |
| `/hr/people/:id/edit` | `joanna` | wypełniony formularz bez cyklu | `person-edit-no-cycle-joanna` |
| `/hr/people/:id/edit` | `joanna` | 422 · usunięta nazwa | `person-edit-error-joanna` |
| `/hr/substitutions` | `joanna` | brak zastępstw | `substitutions-joanna` |
| `/hr/substitutions` | `joanna` | 422 · brak danych | `substitutions-error-joanna` |
| `/hr/substitutions` | `joanna` | po dodaniu zastępstwa | `substitutions-saved-joanna` |
| `/hr/people/new` | `admin` | pusty formularz | `person-new-admin` |
| `/hr/people/new` | `admin` | 422 · brak danych | `person-new-error-admin` |
| `/hr/people/:id/edit` | `admin` | wypełniony formularz z cyklem | `person-edit-admin` |
| `/hr/people/:id/edit` | `admin` | wypełniony formularz bez cyklu | `person-edit-no-cycle-admin` |
| `/hr/people/:id/edit` | `admin` | 422 · usunięta nazwa | `person-edit-error-admin` |
| `/hr/substitutions` | `admin` | brak zastępstw | `substitutions-admin` |
| `/hr/substitutions` | `admin` | 422 · brak danych | `substitutions-error-admin` |
| `/hr/substitutions` | `admin` | po dodaniu zastępstwa | `substitutions-saved-admin` |
| `/hr/people/new` | `piotr` | 403 · odmowa | `person-new-403` |
| `/hr/people/:id/edit` | `joanna` | 404 · brak osoby | `person-edit-404` |
| `/hr/people/:id/edit` | `piotr` | 403 · odmowa | `person-edit-403` |
| `/hr/substitutions` | `piotr` | 403 · odmowa | `substitutions-403` |
| `/hr/export.csv` | `joanna` | pobranie CSV · podgląd treści | `export-joanna` |
| `/hr/export.csv` | `admin` | pobranie CSV · podgląd treści | `export-admin` |
| `/hr/export.csv` | `piotr` | 403 · odmowa | `export-403` |
| `/notes/:noteId/task-change` | `marek` | pytanie bez odpowiedzi | `task-change-question` |
| `/notes/:noteId/task-change` | `marek` | 422 · brak odpowiedzi | `task-change-error` |
| `/notes/:noteId/task-change` | `marek` | po odpowiedzi Tak | `task-change-card` |
| `/notes/:noteId/task-change` | `marek` | po odpowiedzi Nie | `task-change-no` |
| `/notes/:noteId/task-change` | `piotr` | 403 · odmowa | `task-change-403` |
| `/notes/:noteId/task-change` | `marek` | 404 · brak zasobu | `task-change-404` |
| `/cycles/:id/before-meeting` | `marek` | podsumowanie z notatkami | `before-meeting` |
| `/cycles/:id/before-meeting` | `marek` | podsumowanie bez notatek | `before-meeting-empty` |
| `/cycles/:id/before-meeting` | `piotr` | 403 · odmowa | `before-meeting-403` |
| `/cycles/:id/before-meeting` | `marek` | 404 · brak zasobu | `before-meeting-404` |
| `/cycles/:id/appreciation` | `marek` | notatki do docenienia | `appreciation` |
| `/cycles/:id/appreciation` | `marek` | brak notatek do docenienia | `appreciation-empty` |
| `/cycles/:id/appreciation` | `piotr` | 403 · odmowa | `appreciation-403` |
| `/cycles/:id/appreciation` | `marek` | 404 · brak zasobu | `appreciation-404` |
| `/admin/suggestion-sources` | `admin` | źródła podpowiedzi | `suggestion-sources` |
| `/admin/suggestion-sources` | `piotr` | 403 · odmowa | `sources-403` |
| `/tour` | `anonim` | wejście do przewodnika | `tour-entry` |
| `/tour` | `marek` | wejście po zalogowaniu | `tour` |
| `/tour` | `marek` | najechanie · przycisk drugorzędny | `hover-secondary` |
| `/tour` | `piotr` | wejście po zalogowaniu | `tour-entry-piotr` |
| `/tour` | `joanna` | wejście po zalogowaniu | `tour-entry-joanna` |
| `/tour` | `admin` | wejście po zalogowaniu | `tour-entry-admin` |
| `/tour/done` | `joanna` | ekran końcowy z przewodnikiem | `tour-done` |
| `/tour/done` | `anonim` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-anonim` |
| `/tour/done` | `marek` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-marek` |
| `/tour/done` | `piotr` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-piotr` |
| `/tour/done` | `joanna` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-joanna` |
| `/tour/done` | `admin` | ekran końcowy bez aktywnego przewodnika | `tour-done-direct-admin` |
| `/cycles/:id/part1` | `marek` | przewodnik · krok 1 | `tour-1` |
| `/cycles/:id/part1` | `piotr` | przewodnik · krok 1b | `tour-1b` |
| `/people/:personId/notes/new` | `marek` | przewodnik · krok 2 | `tour-2` |
| `/cycles/:id/absences` | `joanna` | przewodnik · krok 3 | `tour-3` |
| `/cycles/:id/assessment` | `marek` | przewodnik · krok 4 | `tour-4` |
| `/cycles/:id/assessment` | `piotr` | przewodnik · krok 5 | `tour-5` |
| `/hr` | `joanna` | przewodnik · krok 5b | `tour-5b` |
| `/cycles/:id/deadline-change` | `marek` | formularz bez wniosku | `deadline-decision` |
| `/cycles/:id/deadline-change` | `marek` | 422 · brak danych | `deadline-decision-error` |
| `/cycles/:id/deadline-change` | `marek` | decyzja na wniosek ocenianego | `deadline-pending` |
| `/cycles/:id/deadline-change` | `marek` | 422 · brak powodu odmowy | `deadline-reject-error` |
| `/cycles/:id/deadline-change` | `marek` | zatwierdzona ocena | `deadline-decision-blocked` |
| `/cycles/:id/deadline-change` | `piotr` | 403 · odmowa | `deadline-change-403` |
| `/cycles/:id/deadline-change` | `marek` | 404 · brak zasobu | `deadline-change-404` |
| `/cycles/:id/deadline-change/request` | `piotr` | pusty wniosek | `deadline-request` |
| `/cycles/:id/deadline-change/request` | `piotr` | 422 · brak uzasadnienia | `deadline-request-error` |
| `/cycles/:id/deadline-change/request` | `piotr` | wniosek wysłany | `deadline-request-pending` |
| `/cycles/:id/deadline-change/request` | `piotr` | wniosek odrzucony | `deadline-request-rejected` |
| `/cycles/:id/deadline-change/request` | `piotr` | wniosek przyjęty | `deadline-request-accepted` |
| `/cycles/:id/deadline-change/request` | `piotr` | zatwierdzona ocena | `deadline-request-blocked` |
| `/cycles/:id/deadline-change/request` | `joanna` | 403 · odmowa | `deadline-request-403` |
| `/cycles/:id/deadline-change/request` | `marek` | 404 · brak zasobu | `deadline-request-404` |
| `/cycles/:id/deadline-change/:eventId/letter` | `marek` | pismo po zmianie terminu | `deadline-letter-marek` |
| `/cycles/:id/deadline-change/:eventId/letter` | `piotr` | pismo po zmianie terminu | `deadline-letter-piotr` |
| `/cycles/:id/deadline-change/:eventId/letter` | `joanna` | pismo po zmianie terminu | `deadline-letter-joanna` |
| `/cycles/:id/deadline-change/:eventId/letter` | `admin` | 403 · odmowa | `deadline-letter-403` |
| `/cycles/:id/deadline-change/:eventId/letter` | `marek` | 404 · brak zasobu | `deadline-letter-404` |
| `/cycles/:id/invitations/new` | `marek` | nowe · rozmowa o kryteriach | `invitation-opening` |
| `/cycles/:id/invitations/new` | `marek` | nowe · rozmowa oceniająca | `invitation-assessment` |
| `/cycles/:id/invitations/new` | `marek` | 422 · brak terminu i miejsca | `invitation-error` |
| `/cycles/:id/invitations/new` | `marek` | poprzednie zaproszenie w formularzu | `invitation-prefilled` |
| `/cycles/:id/invitations/new` | `piotr` | 403 · odmowa | `invitation-new-403` |
| `/cycles/:id/invitations/new` | `marek` | 404 · brak zasobu | `invitation-new-404` |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `marek` | wysłane | `invitation-sent-marek` |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `piotr` | wysłane | `invitation-sent-piotr` |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `marek` | potwierdzone | `invitation-confirmed-marek` |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `piotr` | potwierdzone | `invitation-confirmed-piotr` |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `marek` | termin minął | `invitation-expired` |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `joanna` | 403 · odmowa | `invitation-403` |
| `/cycles/:id/invitations/:eventId{[0-9]+}` | `marek` | 404 · brak zasobu | `invitation-404` |
| `/cycles/:id/invitations/:eventId{[0-9]+\.ics}` | `marek` | pobranie ICS · podgląd treści | `calendar-marek` |
| `/cycles/:id/invitations/:eventId{[0-9]+\.ics}` | `piotr` | pobranie ICS · podgląd treści | `calendar-piotr` |
| `/cycles/:id/invitations/:eventId{[0-9]+\.ics}` | `joanna` | 403 · odmowa | `calendar-403` |
| `/cycles/:id/invitations/:eventId{[0-9]+\.ics}` | `marek` | 404 · brak zasobu | `calendar-404` |
| `(brak trasy)` | `marek` | 404 · strona aplikacji | `error-404` |
