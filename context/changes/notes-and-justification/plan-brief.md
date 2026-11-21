# Notatki o faktach i uzasadnienie z notatek — Plan Brief

> Full plan: `context/changes/notes-and-justification/plan.md`

## What & Why

Ocena psuje się przez 24 miesiące przed formularzem, nie w formularzu (decyzja 1). Plaster S-04 daje przełożonemu notatki o faktach zapisywane z telefonu przez cały cykl, a przy ocenie: notatki przy każdym kryterium, ostrzeżenie, gdy fakty są tylko z ostatniego miesiąca, i wstawianie zaznaczonych notatek do uzasadnienia.

## Starting Point

Po F-01, S-01 i S-02: baza z osobami i cyklami, `today()` z filtrem dat, formularz oceny z polami uzasadnienia i wniosków. Tabeli notatek, adaptera podpowiedzi i karty rozmowy oceniającej nie ma.

## Desired End State

Marek zapisuje notatkę na 360 px; pole „Zmiana zadań pracownika” zaznacza się samo z listy słów i da się je odznaczyć. Piotr czyta przekazaną informację zwrotną, notatka zostaje prywatna. W formularzu oceny (23.11.2026) przy kryteriach są notatki z datami, jedno ostrzeżenie „z ostatniego miesiąca” i przyciski „Wstaw”. Karta rozmowy oceniającej ma trzy tematy z § 10.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Gdzie żyją notatki | Osobna tabela `notes`, filtr `date <= today()` | Własne pola i odczyt przy każdym kryterium; ten sam filtr co `events` | Plan (decyzja 10i) |
| Klucz notatki | `subject_id`, `cycle_id` opcjonalny | „Dopisz notatkę” działa dla Marii bez cyklu | Plan (decyzja 10k) |
| Adapter | `suggestForNote(text)` → `{source, taskChange, matched}`, redakcja nazwisk w jednym miejscu | Jedno wymienne miejsce; typ nie ma pól na punkty ani tekst o pracowniku | Decyzje 9, 10l |
| Co się zapisuje | `task_change` = klik człowieka; wynik adaptera obok, do wglądu | Nic bez kliknięcia; S-05 widzi źródło | Plan |
| Podpowiedź w trakcie pisania | Mały skrypt bez zależności; przestaje po pierwszym kliknięciu pola | htmx nie jest wgrany; człowiek ma ostatnie słowo | Plan |
| „Wstaw” | W przeglądarce; serwer renderuje gotowy fragment `Kryterium, data: treść` | Nie rusza zapisu S-02, nic nie wstawia się samo | Decyzja 10f |
| Informacja zwrotna | Tabela `feedback_messages`, tekst do poprawy, `sent_on = today()` | Data zeruje przypomnienie S-05; notatka zostaje prywatna | Decyzja 10j |
| Gałąź modelu | Faza 4, opcjonalna, tylko adres lokalny, powrót do reguł po czasie | Pierwsza rzecz, jeśli zostanie czas | Decyzja 10l |

## Scope

**In scope:** tabela i 16 notatek pokazowych; formularz notatki; „Moje notatki”; „Przekaż pracownikowi” i ekran „Informacja zwrotna”; adapter z regułami; notatki i ostrzeżenia FR-020 przy kryteriach; „Wstaw” do uzasadnienia i wniosków; karta rozmowy oceniającej.

**Out of scope:** pytanie HR partnera, „Przed rozmową”, przypomnienie o docenianiu, ekran „Skąd biorą się podpowiedzi” (S-05); edycja i usuwanie notatek; style (design system autora); model językowy.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Dane i adapter | Tabele, seed 16 notatek, odczyty z filtrem daty, adapter z regułami | Nazwy kryteriów po tłumaczeniu w F-01 |
| 2. Formularz, lista, informacja zwrotna | Ekrany przełożonego i pracownika, podpowiedź w trakcie pisania | Formularz na 360 px |
| 3. Ocena i karta | Notatki przy kryteriach, ostrzeżenia, „Wstaw”, karta § 10 | Wpięcie w widok S-02 o nieznanych nazwach |
| 4. Model (opcjonalna) | Gałąź `local-model` z testem na atrapie | Brak czasu |

**Prerequisites:** F-01, S-01, S-02 zbudowane (nazwy w sekcji „Założenia wobec wcześniejszych plastrów”).
**Estimated effort:** ok. 80 minut jednego agenta (25 + 25 + 25, faza 4 dodatkowo 10–15).

## Open Risks & Assumptions

- Krok 2 pokazu powtarza wgraną notatkę z 11.03.2026; domyślnie notatka na żywo z datą 10.03.2026.
- Notatki Ewy pisze Marek od 12.12.2024, a jej cykl zaczął poprzedni naczelnik: zmiana oceniającego musi być wcześniej.
- Kolejność cięcia jest na górze planu.

## Success Criteria (Summary)

- Kroki 2 i 4 pokazu działają na danych wgranych seedem.
- `bun test` przechodzi, w tym testy reguł R1–R10.
- Nigdzie przy nazwisku nie ma liczby ani etykiety; nic nie zapisuje się bez kliknięcia.
