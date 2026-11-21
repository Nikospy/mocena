---
bootstrapped_at: 2026-11-21T16:52:16Z
starter_id: hono
starter_name: Hono
project_name: mocena
language_family: js
package_manager: bun
cwd_strategy: subdir-then-move
bootstrapper_confidence: verified
phase_3_status: ok
audit_command: bun audit
---

## Hand-off

Zobacz `context/foundation/tech-stack.md` (starter `hono`, menedżer pakietów `bun`, cel wdrożenia `self-host`). Odstępstwo od karty: szablon `bun` zamiast `nodejs`.

## Pre-scaffold verification

| Signal | Value | Severity | Notes |
|---|---|---|---|
| npm package | create-hono v0.19.5, hono v4.13.19 | fresh | wersje z przebiegu instalacji 2026-11-21 |
| GitHub repo | not run | n/d | pominięte: tryb hackathonu |

## Scaffold log

**Resolved invocation**: `bun create hono@latest .bootstrap-scaffold --template bun --pm bun --install` (kod wyjścia 0)

| Plik | Działanie |
|---|---|
| `package.json`, `tsconfig.json`, `bun.lock`, `src/index.ts`, `node_modules/` | przeniesione do katalogu projektu |
| `README.md` ze startera | pominięty: projekt ma własny `README.md` |
| `.gitignore` | scalony przez dopisanie |
| `context/` | zachowany bez zmian |

Po scaleniu `name` w `package.json` zmieniony na `mocena`. Aplikacja startowa odpowiada 200 na `GET /` (sprawdzone przez `app.request`).

## Post-scaffold audit

`bun audit`: brak podatności (5 pakietów).

## Hints recorded but not acted on

`ci_provider`, `ci_default_flow`: bez CI w prototypie. `has_auth: true`: logowanie przez konta demonstracyjne powstaje w pierwszym plastrze.

## Next steps

Roadmapa plastrów: `context/foundation/roadmap.md`.
