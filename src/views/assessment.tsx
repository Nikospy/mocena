import { OBJECTION_OUTCOME_TEXT, objectionRecipientFor, type ObjectionFacts, type AssessmentDraft, type AssessmentSnapshot, type AssessmentStateData } from "../assessment/state";
import { objectionReviewDeadline } from "../engine/deadlines";
import { verdictText } from "../assessment/verdict";
import type { CycleCriterion } from "../cycles/part1";
import type { Blocker, GradeRequestOption } from "../engine/approval";
import { rules, rulesVersion } from "../engine/rules";
import { criterion, POINTS, type AssessmentResult } from "../engine/scoring";
import type { Person } from "../people";
import { ConfirmationBlock, ErrorSummary, FieldError, type FormErrors, LegalBasis, PageHeader, RulesVersion, invalid } from "./components";
import { Layout, formatDate } from "./layout";
import { romanGrade } from "../engine/grades";
import type { JSX } from "hono/jsx/jsx-runtime";

export type Slots = {
  criterionAside?: (criterionId: string) => JSX.Element;
  justificationTools?: JSX.Element;
  conclusionsTools?: JSX.Element;
  beforeForm?: JSX.Element;
  /** Odnośniki do rzędu odnośników nagłówka strony (np. karta rozmowy oceniającej). */
  headerLinks?: JSX.Element;
};

export const REASON_LABEL = { could_not: "nie mógł potwierdzić", would_not: "nie chciał potwierdzić" } as const;
export const METHOD_LABEL = { in_person: "osobiście", post: "pocztą", email: "pocztą elektroniczną" } as const;

const LEVELS = new Map<number, string>(rules.partialScale.map((s) => [s.points, s.name]));

export function PersonIco() {
  return (
    <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
  );
}
export function WarnIco() {
  return <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z" /><path d="M12 10v4.5M12 17.5h.01" /></svg>;
}
export function OkIco() {
  return <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}
/** Kryteria z wpisaną oceną cząstkową: nazwa i punkty (do nazwania przyczyny wyniku). */
function scoreRows(criteria: { id: string }[], scores: Record<string, number>): { name: string; score: number }[] {
  return criteria.filter((c) => scores[c.id] !== undefined).map((c) => ({ name: criterion(c.id).name, score: scores[c.id] }));
}


function mean2(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

type ResultLike = Pick<AssessmentResult, "mean" | "overallLevel" | "outcome" | "reasons">;

/** „Treść zdania (§ 11 ust. 1 pkt 4).” z silnika → treść i przepis osobno (przepis idzie do pigułki). */
function splitReason(r: string): { text: string; basis: string | null } {
  const m = /^(.*?)\s*\((§[^)]*)\)\.?$/.exec(r);
  return m ? { text: m[1], basis: m[2] } : { text: r.replace(/\.$/, ""), basis: null };
}

/**
 * Wynik, przyczyna z przepisem, jedna linia o średniej (słowo „średnia” pada raz). Poziom ogólny stoi przy wyniku
 * tylko wtedy, gdy mu nie przeczy (`verdictText`). `scores` pozwala nazwać kryteria z oceną „1”.
 */
export function ResultPanel(props: { result: ResultLike | null; scores?: { name: string; score: number }[]; cycleId?: string; version?: string }) {
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
  const neg = r.outcome === "negative";
  const { verdict, level } = verdictText(r);
  const ones = (props.scores ?? []).filter((s) => s.score === 1);
  const lines = r.reasons.flatMap((raw) => {
    const x = splitReason(raw);
    return x.text.startsWith("Ocena cząstkowa") && ones.length > 0
      ? ones.map((s) => ({ text: `${s.name}: 1, ${LEVELS.get(1) ?? ""}`, basis: x.basis }))
      : [x];
  });
  const meanDoesNotDecide = neg && r.mean > 4;
  const version = props.version ?? rulesVersion().version;
  return (
    <section class={`rule res ${neg ? "neg" : "pos"}`} id="assessment-result" aria-live="polite">
      <p class="voice rule-v">
        <span class="pg" aria-hidden="true">§</span>
        <span><b>Wynik oceny</b> · wyliczony z przepisu</span>
      </p>
      <div class="verdict-box">
        <p class="verdict">{neg ? <WarnIco /> : <OkIco />}<span>{verdict}</span></p>
        {level ? <p class="verdict-level">{level}</p> : null}
        <ul class="reason">
          {lines.map((x) => (
            <li>
              {x.text} {x.basis ? <LegalBasis basis={x.basis} /> : null}
            </li>
          ))}
        </ul>
      </div>
      <p class="avg-line">
        <b>Średnia {mean2(r.mean)}</b>
        {meanDoesNotDecide ? " – nie zmienia wyniku" : null}
      </p>
      <p class="cap">
        <RulesVersion version={version} href={props.cycleId ? `/cycles/${props.cycleId}/timeline` : undefined} />
      </p>
    </section>
  );
}

export function BlockerList(props: { blockers: Blocker[] }) {
  return (
    <div id="assessment-blockers" class={props.blockers.length ? "st warn miss" : "st-none"}>
      {props.blockers.length ? (
        <><span><WarnIco /></span><div>
          <b>Do zatwierdzenia brakuje:</b>
          <ul>
            {props.blockers.map((b) => (
              <li>
                {b.items ? (
                  <details class="miss-d">
                    <summary>{b.message} <LegalBasis basis={b.basis} /></summary>
                    <ul>{b.items.map((n) => <li>{n}</li>)}</ul>
                  </details>
                ) : (
                  <>{b.message} <LegalBasis basis={b.basis} /></>
                )}
              </li>
            ))}
          </ul>
        </div></>
      ) : null}
    </div>
  );
}

/** Po wniesieniu sprzeciwu zegar sprzeciwu nie ma już znaczenia: zdanie mówi stan faktyczny. */
export function objectionFactsText(o: ObjectionFacts, recipient: string | null): string {
  const addressee = recipient ? ` do ${recipient}` : "";
  if (o.resolvedOn) return `Sprzeciw${addressee} wniesiony ${formatDate(o.filedOn)}, rozpatrzony ${formatDate(o.resolvedOn)}: ${o.outcome ? OBJECTION_OUTCOME_TEXT[o.outcome] : "rozstrzygnięty"}.`;
  return `Sprzeciw${addressee} wniesiony ${formatDate(o.filedOn)}. Rozpatrzenie do ${formatDate(objectionReviewDeadline(o.filedOn))}.`;
}

export function ObjectionClock(props: { deadline: string; today: string; mine: boolean; recipient: string | null; gender: "f" | "m" | null; objection: ObjectionFacts | null }) {
  const left = daysBetween(props.today, props.deadline);
  const o = props.objection;
  const basis = o ? (o.resolvedOn ? rules.deadlines.objectionDays.basis : rules.deadlines.objectionReviewDays.basis) : rules.deadlines.objectionDays.basis;
  const who = props.mine ? "możesz złożyć" : `${props.gender === "f" ? "oceniana" : "oceniany"} może złożyć`;
  const addressee = props.recipient ? ` do ${props.recipient}` : "";
  let text: string;
  if (o) {
    text = objectionFactsText(o, props.recipient);
  } else if (left > 0) {
    const days = left === 1 ? "1 dzień" : `${left} dni`;
    text = `Sprzeciw${addressee} ${who} do ${formatDate(props.deadline)}. Zostało: ${days}.`;
  } else if (left === 0) {
    text = `Dziś jest ostatni dzień na sprzeciw${addressee} (${formatDate(props.deadline)}).`;
  } else {
    text = `Termin na sprzeciw minął ${formatDate(props.deadline)}.`;
  }
  return (
    <div class={`st ${o || left >= 0 ? "info" : "warn"}`} id="objection-clock">
      <div>
        <b>{text}</b>
        <small>
          <LegalBasis basis={basis} />
        </small>
      </div>
    </div>
  );
}

export function AssessmentMessage(props: { viewer: Person; person: Person; today: string; text: string; status?: number; action?: { label: string; href: string } }) {
  return (
    <Layout title="Ocena" person={props.viewer} today={props.today}>
      <PageHeader title={<>Ocena okresowa: {props.person.name}</>} />
      <section class="am-msg">
        <p class="st info">{props.text}</p>
        <div class="btns">
          {props.action ? <a class="btn primary" href={props.action.href}>{props.action.label}</a> : null}
          <a class={props.action ? "btn text" : "btn"} href="/">Wróć do spraw</a>
        </div>
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
  errors?: FormErrors;
  /** Tytuł podsumowania błędów (np. „Oceny nie można jeszcze zatwierdzić”); bez niego liczba pól. */
  errorTitle?: string;
  canAcknowledge?: boolean;
  canFiction?: boolean;
  /** Termin przesunięty przez nieobecność (silnik): zdanie i odnośnik do osi czasu. */
  shifted?: { text: string } | null;
  /** Sprzeciw uwzględniony z nakazem ponownego sporządzenia oceny: termin drugiej oceny. */
  redo?: { date: string; basis: string[] } | null;
};

function Header(p: { person: Person; sheet: string; period: string; links?: JSX.Element }) {
  return (
    <PageHeader
      context={<>{p.person.position_title ?? ""} · arkusz {p.sheet} · {p.period}</>}
      title={<>Ocena okresowa: {p.person.name}</>}
      linksLabel="Cykl oceny"
      links={p.links}
    />
  );
}

function EditForm(p: AssessmentViewProps) {
  const slots = p.slots ?? {};
  const d = p.draft;
  const justificationRequired = p.result?.justificationRequired ?? false;
  const e = p.errors ?? {};
  return (
    <>
      {slots.beforeForm ?? null}
      <form method="post" action={`/cycles/${p.cycleId}/assessment`} id="assessment-form" data-preview={`/cycles/${p.cycleId}/assessment/preview`}>
        <div class="o-grid">
          <div class="o-main">
            <section aria-labelledby="h-crits">
              <div class="list-h">
                <h2 id="h-crits" tabindex={-1}>Kryteria i oceny cząstkowe</h2>
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
                          <FieldError id={`score-${c.id}`} errors={e} />
                          <div class="score" role="radiogroup" aria-label={`Ocena cząstkowa: ${cr.name}`} {...invalid(`score-${c.id}`, e)}>
                            {POINTS.map((n) => (
                              <label>
                                <input type="radio" name={`score[${c.id}]`} id={n === POINTS[0] ? `score-${c.id}` : undefined} value={String(n)} checked={val === n} aria-label={String(n)} data-level={LEVELS.get(n) ?? ""} />
                                <span>{n}</span>
                              </label>
                            ))}
                          </div>
                          <p class="lvl" aria-live="polite">{val !== undefined ? `Wybrano ${val}: ${LEVELS.get(val) ?? ""}` : ""}</p>
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
              <FieldError id="interviewDate" errors={e} />
              <input class="area date-field" type="date" id="interviewDate" name="interviewDate" max={p.today} value={d.interviewDate ?? p.today} {...invalid("interviewDate", e)} />
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
              <FieldError id="justification" errors={e} />
              <textarea class="area" id="justification" name="justification" rows={5} {...invalid("justification", e)}>{d.justification}</textarea>
            </section>

            <section class="card tx-card">
              <label for="developmentConclusions">
                <h2>
                  Wnioski do indywidualnego programu rozwoju zawodowego
                  <span class="req">wymagane</span>
                </h2>
              </label>
              {slots.conclusionsTools ?? null}
              <FieldError id="developmentConclusions" errors={e} />
              <textarea class="area" id="developmentConclusions" name="developmentConclusions" rows={4} {...invalid("developmentConclusions", e)}>{d.developmentConclusions}</textarea>
              <p class="sign"><PersonIco />{p.viewer.name}</p>
            </section>

            {p.sheet === "A" ? (
              <section class="card tx-card">
                <label class="lbl" for="objectionRecipient">Sprzeciw przysługuje do:</label>
                <FieldError id="objectionRecipient" errors={e} />
                <input class="area" id="objectionRecipient" name="objectionRecipient" type="text" maxlength={200}
                  value={d.objectionRecipient ?? ""} aria-required="true" {...invalid("objectionRecipient", e)} />
                <p class="cap">Wpisz adresata przed zatwierdzeniem oceny.</p>
              </section>
            ) : null}

            {p.gradeOption === "not_applicable" ? null : (
              <section class="card tx-card" id="grade-request">
                <h2>Wniosek o kolejny stopień służbowy</h2>
                {p.gradeOption === "no_only" ? (
                  <p>Wniosek o stopień: nie. Nie można go dołączyć przy ocenie negatywnej ani przy najwyższym stopniu.</p>
                ) : (
                  <>
                    <div class="seg fit">
                      <label>
                        <input type="radio" name="gradeRequestAttached" value="1" checked={d.gradeRequest.attached} />
                        <span>Dołączam wniosek</span>
                      </label>
                      <label>
                        <input type="radio" name="gradeRequestAttached" value="0" checked={!d.gradeRequest.attached} />
                        <span>Bez wniosku</span>
                      </label>
                    </div>
                    {p.grade !== null ? <p class="cap">Stopień docelowy: {romanGrade(p.grade + 1)}</p> : null}
                    <label class="lbl" for="gradeMotivation">Umotywowanie wniosku</label>
                    <FieldError id="gradeMotivation" errors={e} />
                    <textarea class="area" id="gradeMotivation" name="gradeMotivation" rows={3} {...invalid("gradeMotivation", e)}>{d.gradeRequest.motivation}</textarea>
                  </>
                )}
              </section>
            )}
          </div>

          <aside class="side" aria-label="Wynik i zatwierdzenie">
            <ResultPanel result={p.result} scores={scoreRows(p.criteria, d.scores)} cycleId={p.cycleId} />
            <BlockerList blockers={p.blockers} />
            <div class="decide">
              <button type="submit" class="btn full">Zapisz szkic oceny</button>
              <button type="submit" class="btn primary full" formaction={`/cycles/${p.cycleId}/assessment/approve`}>
                Zatwierdź ocenę
              </button>
            </div>
          </aside>
        </div>
      </form>
      <script src="/assessment.js" defer></script>
      <script src="/score-caption.js" defer></script>
    </>
  );
}

function SnapshotView(p: AssessmentViewProps & { snapshot: AssessmentSnapshot }) {
  const s = p.snapshot;
  const st = p.state;
  const mine = p.viewer.id === p.person.id;
  const recipient = objectionRecipientFor(s.sheet, s.objectionRecipient);
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
                <p class="o-score"><b class="big">{c.score}</b> <span>{LEVELS.get(c.score) ?? ""}</span></p>
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
            <h2>Wniosek o kolejny stopień służbowy</h2>
            <p>Stopień docelowy: {romanGrade(s.gradeRequest.targetGrade)}</p>
            <p>{s.gradeRequest.motivation}</p>
          </section>
        ) : null}
      </div>
      <aside class="side first" aria-label="Wynik i potwierdzenia">
        <ResultPanel result={s.result} scores={s.criteria} cycleId={p.cycleId} version={s.rulesVersion.version} />
        {s.sheet === "A" && recipient && !st.objectionDeadline ? <p class="cap">Sprzeciw przysługuje do: {recipient}</p> : null}
        {st.objectionDeadline ? <ObjectionClock deadline={st.objectionDeadline} today={p.today} mine={mine} recipient={recipient} gender={p.person.gender} objection={st.objection} /> : null}
        {p.canAcknowledge ? (
          <form method="post" action={`/cycles/${p.cycleId}/assessment/acknowledge`} class="decide">
            <p class="cap">Potwierdzenie zapoznania z oceną: <LegalBasis basis={rules.approval.acknowledgement.basis} /></p>
            <button type="submit" class="btn primary full">Potwierdzam zapoznanie z oceną</button>
          </form>
        ) : null}
        {p.canFiction ? (
          <div class="decide">
            <a class="btn full" href={`/cycles/${p.cycleId}/assessment/fiction`}>Wpisz fikcję zapoznania</a>
          </div>
        ) : null}
        <a class="btn o-export" href={`/cycles/${p.cycleId}/assessment/export.json`} download>Pobierz ocenę jako plik danych (JSON)</a>
        <dl class="card b-facts o-facts">
          <div><dt>Okres oceny</dt><dd>{formatDate(s.periodFrom)}–{formatDate(s.periodTo)}</dd></div>
          <div><dt>Rozmowa oceniająca</dt><dd>{formatDate(s.interviewDate)}</dd></div>
          <div><dt>Termin oceny</dt><dd><b>{formatDate(s.deadline.date)}</b> <LegalBasis basis={s.deadline.basis} /></dd></div>
          <div><dt>Zatwierdzenie oceny</dt><dd><ConfirmationBlock kind="confirmation" name={s.confirmation.name} place={s.confirmation.place} date={s.confirmation.date} /></dd></div>
          <div><dt>Zapoznanie z oceną</dt><dd>
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
          </dd></div>
        </dl>
      </aside>
    </div>
  );
}

export function AssessmentView(p: AssessmentViewProps) {
  const snap = p.state.snapshot;
  const period = `okres od ${formatDate(snap?.periodFrom ?? p.periodFrom)} do ${formatDate(snap?.periodTo ?? p.today)}`;
  return (
    <Layout title="Ocena" person={p.viewer} today={p.today}>
      <Header person={p.person} sheet={snap?.sheet ?? p.sheet} period={period} links={p.slots?.headerLinks} />
      {p.shifted ? (
        <p class="st info" id="deadline-shift">
          <span>
            {p.shifted.text}. <a href={`/cycles/${p.cycleId}/timeline`}>Zobacz oś czasu</a>
          </span>
        </p>
      ) : null}
      {p.redo ? (
        <div class="st info" id="assessment-redo">
          <div>
            <b>Sprzeciw uwzględniony: ocenę sporządza się po raz drugi do {formatDate(p.redo.date)} <LegalBasis basis={p.redo.basis} /></b>
            <p>Druga ocena nie może być niższa niż pierwsza ani w żadnym elemencie. Prototyp nie ma jeszcze formularza drugiej oceny: poniżej pierwsza ocena, tylko do odczytu.</p>
          </div>
        </div>
      ) : null}
      <ErrorSummary errors={p.errors} title={p.errorTitle} />
      {p.mode === "edit" || !snap ? <EditForm {...p} /> : <SnapshotView {...p} snapshot={snap} />}
    </Layout>
  );
}
