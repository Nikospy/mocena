import type { AssessmentDraft, AssessmentSnapshot, AssessmentStateData } from "../assessment/state";
import type { CycleCriterion } from "../cycles/part1";
import type { Blocker, GradeRequestOption } from "../engine/approval";
import { rules, rulesVersion } from "../engine/rules";
import { criterion, POINTS, type AssessmentResult } from "../engine/scoring";
import type { Person } from "../people";
import { ConfirmationBlock, LegalBasis } from "./components";
import { Layout, formatDate } from "./layout";
import type { JSX } from "hono/jsx/jsx-runtime";

export type Slots = {
  criterionAside?: (criterionId: string) => JSX.Element;
  justificationTools?: JSX.Element;
  conclusionsTools?: JSX.Element;
  beforeForm?: JSX.Element;
};

export const REASON_LABEL = { could_not: "nie mógł potwierdzić", would_not: "nie chciał potwierdzić" } as const;
export const METHOD_LABEL = { in_person: "osobiście", post: "pocztą", email: "pocztą elektroniczną" } as const;

const LEVELS = new Map<number, string>(rules.partialScale.map((s) => [s.points, s.name]));

function mean2(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

type ResultLike = Pick<AssessmentResult, "mean" | "overallLevel" | "outcome" | "reasons">;

export function ResultPanel(props: { result: ResultLike | null }) {
  const r = props.result;
  if (!r) {
    return (
      <section class="rule res" id="assessment-result" aria-live="polite">
        <p class="voice rule-v">
          <span class="pg" aria-hidden="true">§</span>
          <span><b>Wynik oceny</b> · wyliczony z przepisu</span>
        </p>
        <p>Wynik pojawi się, gdy każde kryterium będzie miało ocenę.</p>
      </section>
    );
  }
  const v = rulesVersion();
  const neg = r.outcome === "negative";
  return (
    <section class={`rule res ${neg ? "neg" : "pos"}`} id="assessment-result" aria-live="polite">
      <p class="voice rule-v">
        <span class="pg" aria-hidden="true">§</span>
        <span><b>Wynik oceny</b> · wyliczony z przepisu</span>
      </p>
      <div class="verdict-box">
        <p class="verdict">{neg ? "Ocena negatywna" : "Ocena pozytywna"}</p>
        <ul class="reason">{r.reasons.map((x) => <li>{x}</li>)}</ul>
      </div>
      <div class="res-calc">
        <p class="big avg">{mean2(r.mean)}</p>
        <p class="avg-cap">średnia ocen cząstkowych</p>
        <p class="level">{r.overallLevel}</p>
      </div>
      <p class="cap">
        {rules.source.publisher}, reguły {v.version}
      </p>
    </section>
  );
}

export function BlockerList(props: { blockers: Blocker[] }) {
  return (
    <div id="assessment-blockers" class={props.blockers.length ? "st warn miss" : "st-none"}>
      {props.blockers.length ? (
        <div>
          <b>Do zatwierdzenia brakuje:</b>
          <ul>
            {props.blockers.map((b) => (
              <li>
                {b.message} <LegalBasis basis={b.basis} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ObjectionClock(props: { deadline: string; today: string; mine: boolean }) {
  const left = daysBetween(props.today, props.deadline);
  const basis = rules.deadlines.objectionDays.basis;
  const who = props.mine ? "możesz złożyć" : "oceniany może złożyć";
  let text: string;
  if (left > 0) {
    const days = left === 1 ? "1 dzień" : `${left} dni`;
    text = `Sprzeciw do dyrektora generalnego urzędu ${who} do ${formatDate(props.deadline)}. Zostało: ${days}.`;
  } else if (left === 0) {
    text = `Dziś jest ostatni dzień na sprzeciw do dyrektora generalnego urzędu (${formatDate(props.deadline)}).`;
  } else {
    text = `Termin na sprzeciw minął ${formatDate(props.deadline)}.`;
  }
  return (
    <div class={`st ${left >= 0 ? "info" : "warn"}`} id="objection-clock">
      <div>
        <b>{text}</b>
        <small>
          <LegalBasis basis={basis} />
        </small>
      </div>
    </div>
  );
}

export function AssessmentMessage(props: { viewer: Person; person: Person; today: string; text: string; status?: number }) {
  return (
    <Layout title="Ocena" person={props.viewer} today={props.today}>
      <section class="card">
        <h1>Ocena okresowa: {props.person.name}</h1>
        <p class="st info">{props.text}</p>
        <a class="btn text" href="/">Wróć na stronę główną</a>
      </section>
    </Layout>
  );
}

export type AssessmentViewProps = {
  mode: "edit" | "view";
  cycleId: string;
  state: AssessmentStateData;
  criteria: CycleCriterion[];
  person: Person;
  viewer: Person;
  today: string;
  blockers: Blocker[];
  slots?: Slots;
  draft: AssessmentDraft;
  result: AssessmentResult | null;
  gradeOption: GradeRequestOption;
  grade: number | null;
  sheet: string;
  periodFrom: string;
  errors?: string[];
  canAcknowledge?: boolean;
  canFiction?: boolean;
};

function Header(p: { person: Person; sheet: string; period: string }) {
  return (
    <section class="card hdr" aria-label="Cykl oceny">
      <p class="cap">Ocena okresowa · arkusz {p.sheet}</p>
      <h1>{p.person.name}</h1>
      <p class="cap">
        {p.person.position_title ?? ""} · {p.period}
      </p>
    </section>
  );
}

function EditForm(p: AssessmentViewProps) {
  const slots = p.slots ?? {};
  const d = p.draft;
  const justificationRequired = p.result?.justificationRequired ?? false;
  return (
    <>
      {slots.beforeForm ?? null}
      <form method="post" action={`/cycles/${p.cycleId}/assessment`} id="assessment-form" data-preview={`/cycles/${p.cycleId}/assessment/preview`}>
        <div class="o-grid">
          <div class="o-main">
            <section aria-labelledby="h-crits">
              <div class="list-h">
                <h2 id="h-crits">Kryteria i oceny cząstkowe</h2>
                <p class="cap">1 znacznie poniżej · 3 poniżej · 5 na poziomie · 7 powyżej · 9 znacznie powyżej oczekiwań</p>
              </div>
              <div class="card sheet">
                {p.criteria.map((c) => {
                  const cr = criterion(c.id);
                  const val = d.scores[c.id];
                  return (
                    <article class="crit" data-crit={c.id}>
                      <div class="crit-row">
                        <div>
                          <h3>{cr.name}</h3>
                          <p class="kind">{c.kind === "mandatory" ? "obowiązkowe" : "dodatkowe"}</p>
                          {c.expectation ? <p class="cap">Oczekiwanie: {c.expectation}</p> : null}
                        </div>
                        <div class="scorebox">
                          <div class="score" role="radiogroup" aria-label={`Ocena cząstkowa: ${cr.name}`}>
                            {POINTS.map((n) => (
                              <label>
                                <input type="radio" name={`score[${c.id}]`} value={String(n)} checked={val === n} aria-label={String(n)} />
                                <span>{n}</span>
                              </label>
                            ))}
                          </div>
                          <p class="lvl">{val !== undefined ? (LEVELS.get(val) ?? "") : ""}</p>
                        </div>
                      </div>
                      {slots.criterionAside ? slots.criterionAside(c.id) : null}
                    </article>
                  );
                })}
              </div>
            </section>

            <section class="card tx-card">
              <label for="interviewDate">
                <h2>Data rozmowy oceniającej</h2>
              </label>
              <input class="area" type="date" id="interviewDate" name="interviewDate" max={p.today} value={d.interviewDate ?? p.today} />
            </section>

            <section class="card tx-card">
              <label for="justification">
                <h2>
                  Uzasadnienie oceny
                  <span class="req">{justificationRequired ? "wymagane" : "wymagane przy ocenie negatywnej, § 11 ust. 3"}</span>
                </h2>
              </label>
              <p class="cap">Ten tekst przeczyta pracownik.</p>
              {slots.justificationTools ?? null}
              <textarea class="area" id="justification" name="justification" rows={5}>{d.justification}</textarea>
            </section>

            <section class="card tx-card">
              <label for="developmentConclusions">
                <h2>
                  Wnioski do indywidualnego programu rozwoju zawodowego
                  <span class="req">wymagane</span>
                </h2>
              </label>
              {slots.conclusionsTools ?? null}
              <textarea class="area" id="developmentConclusions" name="developmentConclusions" rows={4}>{d.developmentConclusions}</textarea>
              <p class="sign">{p.viewer.name}</p>
            </section>

            {p.gradeOption === "not_applicable" ? null : (
              <section class="card tx-card" id="grade-request">
                <h2>Wniosek o następny stopień służbowy</h2>
                {p.gradeOption === "no_only" ? (
                  <p>Wniosek o stopień: nie. Nie można go dołączyć przy ocenie negatywnej ani przy najwyższym stopniu.</p>
                ) : (
                  <>
                    <div class="seg fit">
                      <label>
                        <input type="radio" name="gradeRequestAttached" value="1" checked={d.gradeRequest.attached} />
                        <span>Tak</span>
                      </label>
                      <label>
                        <input type="radio" name="gradeRequestAttached" value="0" checked={!d.gradeRequest.attached} />
                        <span>Nie</span>
                      </label>
                    </div>
                    {p.grade !== null ? <p class="cap">Stopień docelowy: {p.grade + 1}</p> : null}
                    <label class="lbl" for="gradeMotivation">Umotywowanie wniosku</label>
                    <textarea class="area" id="gradeMotivation" name="gradeMotivation" rows={3}>{d.gradeRequest.motivation}</textarea>
                  </>
                )}
              </section>
            )}
          </div>

          <aside class="side" aria-label="Wynik i zatwierdzenie">
            <ResultPanel result={p.result} />
            <BlockerList blockers={p.blockers} />
            <div class="decide">
              <button type="submit" class="btn full">Zapisz</button>
              <button type="submit" class="btn primary full" formaction={`/cycles/${p.cycleId}/assessment/approve`}>
                Zatwierdź ocenę
              </button>
            </div>
          </aside>
        </div>
      </form>
      <script src="/assessment.js" defer></script>
    </>
  );
}

function SnapshotView(p: AssessmentViewProps & { snapshot: AssessmentSnapshot }) {
  const s = p.snapshot;
  const st = p.state;
  const mine = p.viewer.id === p.person.id;
  return (
    <div class="o-grid">
      <div class="o-main">
        <section class="card sheet" aria-labelledby="h-crits">
          <h2 id="h-crits">Kryteria i oceny cząstkowe</h2>
          {s.criteria.map((c) => (
            <article class="crit">
              <div class="crit-row">
                <div>
                  <h3>{c.name}</h3>
                  <p class="kind">{c.kind === "mandatory" ? "obowiązkowe" : "dodatkowe"}</p>
                </div>
                <div class="scorebox">
                  <p class="big">{c.score}</p>
                  <p class="lvl">{LEVELS.get(c.score) ?? ""}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
        <section class="card tx-card">
          <h2>Uzasadnienie oceny</h2>
          <p>{s.justification.trim() ? s.justification : "Bez uzasadnienia."}</p>
        </section>
        <section class="card tx-card">
          <h2>Wnioski do indywidualnego programu rozwoju zawodowego</h2>
          <p>{s.developmentConclusions}</p>
        </section>
        {s.gradeRequest.attached ? (
          <section class="card tx-card">
            <h2>Wniosek o następny stopień służbowy</h2>
            <p>Stopień docelowy: {s.gradeRequest.targetGrade}</p>
            <p>{s.gradeRequest.motivation}</p>
          </section>
        ) : null}
      </div>
      <aside class="side" aria-label="Wynik i potwierdzenia">
        <ResultPanel result={s.result} />
        <section class="card">
          <p>
            Okres oceny: {formatDate(s.periodFrom)} – {formatDate(s.periodTo)}
          </p>
          <p>
            Rozmowa oceniająca: {formatDate(s.interviewDate)}
          </p>
          <p>
            Termin oceny: <b>{formatDate(s.deadline.date)}</b> <LegalBasis basis={s.deadline.basis} />
          </p>
          <ConfirmationBlock kind="confirmation" name={s.confirmation.name} place={s.confirmation.place} date={s.confirmation.date} />
          {st.stage === "acknowledged" && st.acknowledgement ? (
            <ConfirmationBlock kind="confirmation" name={st.acknowledgement.name} place={st.acknowledgement.place} date={st.acknowledgement.date} />
          ) : st.stage === "fiction" && st.fiction ? (
            <ConfirmationBlock
              kind="fiction"
              name={p.person.name}
              reason={REASON_LABEL[st.fiction.reason]}
              deliveryMethod={METHOD_LABEL[st.fiction.deliveryMethod]}
              deliveredOn={st.fiction.deliveredOn}
              date={st.fiction.eventDate}
            />
          ) : (
            <ConfirmationBlock kind="confirmation" />
          )}
        </section>
        {st.objectionDeadline ? <ObjectionClock deadline={st.objectionDeadline} today={p.today} mine={mine} /> : null}
        {p.canAcknowledge ? (
          <form method="post" action={`/cycles/${p.cycleId}/assessment/acknowledge`} class="decide">
            <p class="cap">Potwierdzenie zapoznania z oceną: {rules.approval.acknowledgement.basis}</p>
            <button type="submit" class="btn primary full">Potwierdzam zapoznanie z oceną</button>
          </form>
        ) : null}
        {p.canFiction ? (
          <div class="decide">
            <a class="btn full" href={`/cycles/${p.cycleId}/assessment/fiction`}>Stwierdź fikcję zapoznania</a>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export function AssessmentView(p: AssessmentViewProps) {
  const snap = p.state.snapshot;
  const period = `okres od ${formatDate(snap?.periodFrom ?? p.periodFrom)} do ${formatDate(snap?.periodTo ?? p.today)}`;
  return (
    <Layout title="Ocena" person={p.viewer} today={p.today}>
      <Header person={p.person} sheet={snap?.sheet ?? p.sheet} period={period} />
      {p.errors?.length ? (
        <div class="st bad" role="alert">
          <ul>{p.errors.map((e) => <li>{e}</li>)}</ul>
        </div>
      ) : null}
      {p.mode === "edit" || !snap ? <EditForm {...p} /> : <SnapshotView {...p} snapshot={snap} />}
    </Layout>
  );
}
