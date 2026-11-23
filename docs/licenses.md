# Licencje składników

Zestawienie składników, z których działa mOcena. Wszystkie są darmowe: prototyp działa bez płatnych licencji i usług, a dane nie wychodzą poza komputer, na którym działa aplikacja.

Tabelę zależności generuje `bun run scripts/license-report.ts` z `package.json` i `node_modules`. Po zmianie zależności uruchom skrypt ponownie.

## Zależności z package.json

| Składnik | Wersja | Licencja | Rodzaj | Płatne | Źródło |
|---|---|---|---|---|---|
| `hono` | 4.13.19 | MIT | zależność | nie | `node_modules/hono/package.json` |
| `@cloudflare/workers-types` | 4.20260702.1 | MIT OR Apache-2.0 | zależność deweloperska | nie | `node_modules/@cloudflare/workers-types/package.json` |
| `@types/bun` | 1.4.5 | MIT | zależność deweloperska | nie | `node_modules/@types/bun/package.json` |
| `happy-dom` | 21.0.4 | MIT | zależność deweloperska | nie | `node_modules/happy-dom/package.json` |
| `wrangler` | 4.166.0 | MIT OR Apache-2.0 | zależność deweloperska | nie | `node_modules/wrangler/package.json` |

## Środowisko i zasoby

| Składnik | Licencja | Płatne | Uwagi |
|---|---|---|---|
| Bun (środowisko uruchomieniowe, `bun:sqlite`) | MIT | nie | Uruchamia serwer, testy i bazę SQLite. |
| htmx | nie dotyczy | nie | Nie jest używany: w repo nie ma pliku htmx ani odwołania w kodzie. |
| Open Sans (fonty w `public/fonts/`) | SIL Open Font License 1.1 | nie | Pełny tekst w `public/fonts/OFL.txt`. |
| Model językowy | brak | nie | Prototyp nie używa modelu językowego; wszystko działa na regułach. |

## Prawa do własnego kodu

Prawa autorskie do kodu ma autor. Zgodnie z regulaminem zadania zwycięzca konkursu przenosi je na organizatora pisemną umową.
