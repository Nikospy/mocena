// Formularz rozstrzygnięcia sprzeciwu „zmiana oceny”: oceny cząstkowe pierwszej oceny do podniesienia (art. 83 ust. 3 ustawy).
import type { AssessmentSnapshot } from "../assessment/state";
import { rules } from "../engine/rules";
import { computeAssessment, POINTS } from "../engine/scoring";
import type { Person } from "../people";
import { LEVELS, ResultPanel } from "./assessment";
import { ErrorSummary, FieldError, type FormErrors, LegalBasis, PageHeader, invalid } from "./components";
import { Layout, formatDate } from "./layout";

export function ObjectionChangeView(p: {
  viewer: Person;
  person: Person;
  cycleId: string;
  today: string;
  first: AssessmentSnapshot;
  filedOn: string;
  scores: Record<string, number>;
  decidedBy: string;
  errors?: FormErrors;
}) {
  const e = p.errors ?? {};
  const complete = p.first.criteria.every((c) => p.scores[c.id] !== undefined);
  const result = complete ? computeAssessment(p.scores) : null;
  return (
    <Layout title="Zmiana oceny po sprzeciwie" person={p.viewer} today={p.today}>
      <PageHeader context={<>Sprzeciw z dnia {formatDate(p.filedOn)}</>} title={<>Zmiana oceny: {p.person.name}</>} />
      <p class="st info" id="objection-change-note">
        <span>
          Zapisujesz decyzję rozpatrującego sprzeciw ({p.decidedBy}): sprzeciw uwzględniony, ocena zmieniona. Oceny cząstkowe można tylko podnieść. <LegalBasis basis={[rules.deadlines.objectionReviewDays.basis]} />
        </span>
      </p>
      <ErrorSummary errors={p.errors} title="Nie zapisano zmiany oceny" />
      <form class="objection-change-form" method="post" action={`/cycles/${p.cycleId}/objection-change`}>
        <div class="o-grid">
          <div class="o-main">
            <section aria-labelledby="h-crits">
              <div class="list-h">
                <h2 id="h-crits" tabindex={-1}>Oceny cząstkowe po zmianie</h2>
                <p class="cap">1 znacznie poniżej · 3 poniżej · 5 na poziomie · 7 powyżej · 9 znacznie powyżej oczekiwań</p>
              </div>
              <div class="card sheet">
                {p.first.criteria.map((c) => (
                  <article class="crit">
                    <div class="crit-row">
                      <div>
                        <h3>{c.name}</h3>
                        <p class="kind">w pierwszej ocenie {c.score}</p>
                      </div>
                      <div class="scorebox">
                        <FieldError id={`score-${c.id}`} errors={e} />
                        <div class="score" role="radiogroup" aria-label={`Ocena cząstkowa: ${c.name}`} {...invalid(`score-${c.id}`, e)}>
                          {POINTS.map((n) => (
                            <label>
                              <input type="radio" name={`score[${c.id}]`} id={n === POINTS[0] ? `score-${c.id}` : undefined} value={String(n)} checked={p.scores[c.id] === n} aria-label={String(n)} data-level={LEVELS.get(n) ?? ""} />
                              <span>{n}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <aside class="side" aria-label="Wynik i zapis">
            <ResultPanel result={result} scores={p.first.criteria.map((c) => ({ name: c.name, score: p.scores[c.id] }))} cycleId={p.cycleId} />
            <div class="decide">
              <button type="submit" class="btn primary full">Zapisz zmianę oceny</button>
              <a class="btn text full" href="/hr">Wróć do „Stan cykli”</a>
            </div>
          </aside>
        </div>
      </form>
    </Layout>
  );
}
