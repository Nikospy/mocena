---
starter_id: hono
package_manager: bun
project_name: mocena
hints:
  language_family: js
  team_size: solo
  deployment_target: self-host
  ci_provider: github-actions
  ci_default_flow: manual-promotion
  bootstrapper_confidence: verified
  path_taken: custom
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

TypeScript na Bun z Hono: istniejący silnik wyniku oceny i terminów jest już w TypeScript i ma testy w `bun test`, więc przenosi się bez zmian. Hono daje routing i szablony JSX renderowane na serwerze bez etapu budowania, co pasuje do prostych ekranów na telefon i komputer oraz do stylu drukowania arkusza. Dane leżą w jednym pliku bazy (`bun:sqlite`), a przepisy w pliku JSON z wersją i datą obowiązywania. Całość to jeden proces bez płatnych licencji (Bun, Hono i htmx mają licencje MIT albo 0BSD), który urząd uruchamia u siebie, także w kontenerze. Skrypty przeglądarki i style są w repo, bez CDN, bo pokaz ma działać bez sieci. Odstępstwo od karty startera: szablon `bun` zamiast `nodejs` i `bun` jako menedżer pakietów. Kod i nazwy plików są po angielsku, interfejs po polsku. Bez CI: bramką jest `bun test` i przebieg pokazu.
