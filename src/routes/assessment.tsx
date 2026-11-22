import { actsAsAppraiser } from "../substitutions";
import { Hono, type Context } from "hono";
import "../assessment/home";
import { buildAssessmentSnapshot } from "../assessment/snapshot";
import { assessmentState, currentGradeNumber, type AssessmentDraft } from "../assessment/state";
import { visibleCycleById, startNextCycle, type Cycle } from "../cycles";
import { assessmentSlots } from "../notes/assessment-slots";
import { cycleCriteria } from "../cycles/part1";
import { getDb } from "../db";
import { approvalBlockers, gradeRequestOptions } from "../engine/approval";
import { objectionDeadline } from "../engine/deadlines";
import { computeAssessment, criterion, POINTS } from "../engine/scoring";
import { recordEvent } from "../events";
import { shiftedDeadlineSentence } from "../deadline-shift";
import { currentPerson, personById, type Person } from "../people";
import { setting, today } from "../settings";
import { AssessmentMessage, AssessmentView, BlockerList, ResultPanel } from "../views/assessment";
import { FictionView } from "../views/acknowledgement-fiction";

type Ctx = { cycle: Cycle; person: Person; appraisee: Person };

function guard(c: Context): Response | Ctx {
  const person = currentPerson(c);
  if (!person) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id") ?? "");
  if (!cycle) return c.text("Nie ma takiego cyklu.", 404);
  const appraisee = personById(cycle.person_id);
  if (!appraisee) return c.text("Nie ma takiego cyklu.", 404);
  return { cycle, person, appraisee };
}

const isAppraiser = (cx: Ctx) => actsAsAppraiser(cx.cycle.appraiser_id, cx.person.id);
const isAppraisee = (cx: Ctx) => cx.cycle.person_id === cx.person.id;

const isCtx = (g: unknown): g is Ctx => typeof g === "object" && g !== null && "cycle" in g && "appraisee" in g;

const emptyDraft = (): AssessmentDraft => ({
  scores: {},
  justification: "",
  developmentConclusions: "",
  interviewDate: null,
  gradeRequest: { attached: false, motivation: "" },
});

function isIsoDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function readDraft(body: Record<string, unknown>): AssessmentDraft {
  const scores: Record<string, number> = {};
  for (const [k, v] of Object.entries(body)) {
    const m = /^score\[(.+)\]$/.exec(k);
    if (m && typeof v === "string" && v.trim() !== "") scores[m[1]] = Number(v);
  }
  const date = str(body.interviewDate).trim();
  return {
    scores,
    justification: str(body.justification),
    developmentConclusions: str(body.developmentConclusions),
    interviewDate: date === "" ? null : date,
    gradeRequest: { attached: str(body.gradeRequestAttached) === "1", motivation: str(body.gradeMotivation) },
  };
}

/** Błędy, które odrzucają zapis szkicu: ocena spoza cyklu albo spoza skali, zła data rozmowy. Braki ocen nie blokują zapisu szkicu. */
function draftErrors(cycleId: string, d: AssessmentDraft): string[] {
  const ids = new Set(cycleCriteria(cycleId).map((x) => x.id));
  const scale = POINTS as readonly number[];
  const errors: string[] = [];
  for (const [id, v] of Object.entries(d.scores)) {
    if (!ids.has(id)) errors.push(`Ocena dotyczy kryterium spoza tego cyklu: ${id}`);
    else if (!scale.includes(v)) errors.push("Ocena cząstkowa musi wynosić 1, 3, 5, 7 albo 9.");
  }
  if (d.interviewDate !== null && (!isIsoDate(d.interviewDate) || d.interviewDate > today())) {
    errors.push("Data rozmowy oceniającej musi być datą nie późniejszą niż dzień dzisiejszy.");
  }
  return errors;
}

function resultOf(ids: string[], scores: Record<string, number>) {
  const keys = Object.keys(scores);
  const scale = POINTS as readonly number[];
  if (ids.length === 0 || keys.length !== ids.length) return null;
  if (!ids.every((id) => scale.includes(scores[id]))) return null;
  return computeAssessment(scores);
}

function screenData(cx: Ctx, draft: AssessmentDraft) {
  const criteria = cycleCriteria(cx.cycle.id);
  const ids = criteria.map((x) => x.id);
  const { grade } = currentGradeNumber(cx.cycle.person_id);
  const appointed = !!cx.appraisee.appointed;
  const result = resultOf(ids, draft.scores);
  return {
    criteria,
    grade,
    result,
    blockers: approvalBlockers({ criteria: ids, draft, appointed, grade }),
    gradeOption: gradeRequestOptions({ appointed, grade, outcome: result?.outcome ?? null }),
  };
}

function render(c: Context, cx: Ctx, extra: { status?: 200 | 403 | 409 | 422; errors?: string[]; draft?: AssessmentDraft } = {}) {
  const state = assessmentState(cx.cycle.id);
  const status = extra.status ?? 200;
  const base = { viewer: cx.person, person: cx.appraisee, today: today() };
  if (state.stage === "no_part1") {
    return c.html(<AssessmentMessage {...base} text="Ocena nie może powstać bez potwierdzonej części I." action={{ label: "Przejdź do części I", href: `/cycles/${cx.cycle.id}/part1` }} />, status);
  }
  const appraiser = isAppraiser(cx);
  if (state.stage === "draft" && !appraiser) {
    return c.html(<AssessmentMessage {...base} text="Ocena nie jest jeszcze zatwierdzona." />, status);
  }
  const draft = extra.draft ?? state.draft ?? emptyDraft();
  const d = screenData(cx, state.snapshot ? { ...draft, scores: state.snapshot.scores } : draft);
  return c.html(
    <AssessmentView
      mode={state.stage === "draft" ? "edit" : "view"}
      cycleId={cx.cycle.id}
      state={state}
      criteria={d.criteria}
      person={cx.appraisee}
      viewer={cx.person}
      today={today()}
      blockers={d.blockers}
      draft={draft}
      slots={appraiser ? assessmentSlots({ cycleId: cx.cycle.id, viewer: cx.person }) : undefined}
      result={d.result}
      gradeOption={d.gradeOption}
      grade={d.grade}
      sheet={cx.cycle.sheet ?? ""}
      periodFrom={cx.cycle.period_start}
      errors={extra.errors}
      canAcknowledge={isAppraisee(cx) && state.stage === "approved"}
      canFiction={appraiser && state.stage === "approved"}
      shifted={state.stage === "draft" ? shiftedDeadlineSentence(cx.cycle.id) : null}
    />,
    status,
  );
}

const app = new Hono();

app.get("/cycles/:id/assessment", (c) => {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraiser(g) && !isAppraisee(g) && g.person.role !== "hr") return c.text("Brak uprawnień do tej oceny.", 403);
  return render(c, g);
});

const CLOSED = "Ocena nie przyjmuje już zmian: została zatwierdzona albo cykl jest zamknięty.";

/** Wspólny początek tras zapisu oceniającego. Zwraca odpowiedź błędu albo kontekst. */
function writeGuard(c: Context): Ctx | Response | Promise<Response> {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraiser(g)) return c.text("Tylko oceniający może zapisać ocenę.", 403);
  const stage = assessmentState(g.cycle.id).stage;
  if (stage === "no_part1") return render(c, g, { status: 409 });
  if (stage !== "draft") return render(c, g, { status: 409, errors: [CLOSED] });
  return g;
}

app.post("/cycles/:id/assessment", async (c) => {
  const g = writeGuard(c);
  if (!isCtx(g)) return g;
  const draft = readDraft(await c.req.parseBody());
  const errors = draftErrors(g.cycle.id, draft);
  if (errors.length) return render(c, g, { status: 422, errors, draft });
  const ok = getDb().transaction(() => {
    if (assessmentState(g.cycle.id).stage !== "draft") return false;
    recordEvent("assessment_draft_saved", g.cycle.id, g.person.id, draft);
    return true;
  })();
  if (!ok) return render(c, g, { status: 409, errors: [CLOSED] });
  return c.redirect(`/cycles/${g.cycle.id}/assessment`, 303);
});

app.post("/cycles/:id/assessment/approve", async (c) => {
  const g = writeGuard(c);
  if (!isCtx(g)) return g;
  const draft = readDraft(await c.req.parseBody());
  const errors = draftErrors(g.cycle.id, draft);
  if (errors.length) return render(c, g, { status: 422, errors, draft });
  const outcome = getDb().transaction((): "closed" | "blocked" | "ok" => {
    if (assessmentState(g.cycle.id).stage !== "draft") return "closed";
    recordEvent("assessment_draft_saved", g.cycle.id, g.person.id, draft);
    const ids = cycleCriteria(g.cycle.id).map((x) => x.id);
    const blockers = approvalBlockers({
      criteria: ids,
      draft,
      appointed: !!g.appraisee.appointed,
      grade: currentGradeNumber(g.cycle.person_id).grade,
    });
    if (blockers.length) return "blocked";
    recordEvent("assessment_approved", g.cycle.id, g.person.id, buildAssessmentSnapshot(g.cycle.id, draft));
    return "ok";
  })();
  if (outcome === "closed") return render(c, g, { status: 409, errors: [CLOSED] });
  if (outcome === "blocked") return render(c, g, { status: 422, draft, errors: ["Oceny nie można jeszcze zatwierdzić."] });
  return c.redirect(`/cycles/${g.cycle.id}/assessment`, 303);
});

app.post("/cycles/:id/assessment/acknowledge", (c) => {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraisee(g)) return c.text("Tylko oceniany może potwierdzić zapoznanie z oceną.", 403);
  const ok = getDb().transaction(() => {
    const state = assessmentState(g.cycle.id);
    if (state.stage !== "approved" || !state.approvedOn || !state.snapshot) return false;
    recordEvent("assessment_acknowledged", g.cycle.id, g.person.id, {
      place: setting("office_city") ?? "",
      date: today(),
      name: g.person.name,
      objectionDeadline: objectionDeadline(today()),
    });
    startNextCycle(g.cycle, g.person.id, state.approvedOn, today(), state.snapshot.result.outcome);
    return true;
  })();
  if (!ok) return render(c, g, { status: 409, errors: ["Ocena nie czeka na potwierdzenie zapoznania."] });
  return c.redirect(`/cycles/${g.cycle.id}/assessment`, 303);
});

app.post("/cycles/:id/assessment/preview", async (c) => {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraiser(g)) return c.text("Tylko oceniający może zobaczyć podgląd wyniku.", 403);
  const draft = readDraft(await c.req.parseBody());
  const d = screenData(g, draft);
  return c.html(
    <div>
      <ResultPanel
        result={d.result}
        scores={d.criteria.filter((x) => draft.scores[x.id] !== undefined).map((x) => ({ name: criterion(x.id).name, score: draft.scores[x.id] }))}
        cycleId={g.cycle.id}
      />
      <BlockerList blockers={d.blockers} />
    </div>,
  );
});

const REASONS = ["could_not", "would_not"];
const METHODS = ["in_person", "post", "email"];

function fictionGuard(c: Context): Ctx | Response | Promise<Response> {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraiser(g)) return c.text("Tylko oceniający może stwierdzić fikcję zapoznania.", 403);
  const stage = assessmentState(g.cycle.id).stage;
  if (stage !== "approved") {
    return render(c, g, { status: 409, errors: ["Fikcję zapoznania można stwierdzić tylko po zatwierdzeniu oceny, dopóki oceniany jej nie potwierdził."] });
  }
  return g;
}

function fictionScreen(c: Context, cx: Ctx, extra: { status?: 200 | 422; errors?: string[]; values?: Record<string, string> } = {}) {
  const approvedOn = assessmentState(cx.cycle.id).approvedOn ?? today();
  return c.html(
    <FictionView
      viewer={cx.person}
      person={cx.appraisee}
      cycleId={cx.cycle.id}
      today={today()}
      approvedOn={approvedOn}
      deadline={objectionDeadline(today())}
      errors={extra.errors}
      values={extra.values ? { reason: extra.values.reason, deliveryMethod: extra.values.deliveryMethod, deliveredOn: extra.values.deliveredOn } : undefined}
    />,
    extra.status ?? 200,
  );
}

app.get("/cycles/:id/assessment/fiction", (c) => {
  const g = fictionGuard(c);
  if (!isCtx(g)) return g;
  return fictionScreen(c, g);
});

app.post("/cycles/:id/assessment/fiction", async (c) => {
  const g = fictionGuard(c);
  if (!isCtx(g)) return g;
  const body = await c.req.parseBody();
  const values = { reason: str(body.reason), deliveryMethod: str(body.deliveryMethod), deliveredOn: str(body.deliveredOn) };
  const errors: string[] = [];
  if (!REASONS.includes(values.reason)) errors.push("Wybierz, czy oceniany nie mógł, czy nie chciał potwierdzić");
  const approvedOn = assessmentState(g.cycle.id).approvedOn ?? today();
  const dateOk = isIsoDate(values.deliveredOn) && values.deliveredOn >= approvedOn && values.deliveredOn <= today();
  if (!METHODS.includes(values.deliveryMethod) || !dateOk) errors.push("Wpisz, jak i kiedy doręczono kopię arkusza");
  if (errors.length) return fictionScreen(c, g, { status: 422, errors, values });
  const ok = getDb().transaction(() => {
    const state = assessmentState(g.cycle.id);
    if (state.stage !== "approved" || !state.approvedOn || !state.snapshot) return false;
    recordEvent("acknowledgement_fiction", g.cycle.id, g.person.id, {
      reason: values.reason,
      deliveryMethod: values.deliveryMethod,
      deliveredOn: values.deliveredOn,
      objectionDeadline: objectionDeadline(today()),
    });
    startNextCycle(g.cycle, g.person.id, state.approvedOn, values.deliveredOn, state.snapshot.result.outcome);
    return true;
  })();
  if (!ok) return render(c, g, { status: 409, errors: ["Ocena nie czeka już na potwierdzenie zapoznania."] });
  return c.redirect(`/cycles/${g.cycle.id}/assessment`, 303);
});

export default app;
