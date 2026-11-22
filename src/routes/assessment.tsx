import { reassessmentDeadline } from "../hr/cycle-state";
import { actsAsAppraiser } from "../substitutions";
import { Hono, type Context } from "hono";
import "../assessment/home";
import { buildAssessmentSnapshot } from "../assessment/snapshot";
import { assessmentInForce, assessmentState, currentGradeNumber, type AssessmentDraft } from "../assessment/state";
import { visibleCycleById, startNextCycle, restartNextCycle, type Cycle } from "../cycles";
import { redoLoweringErrors } from "../assessment/redo";
import { assessmentSlots } from "../notes/assessment-slots";
import { assessmentPeriodFrom, cycleCriteria } from "../cycles/part1";
import { getDb } from "../db";
import { approvalBlockers, gradeRequestOptions } from "../engine/approval";
import { objectionDeadline } from "../engine/deadlines";
import { computeAssessment, criterion, POINTS } from "../engine/scoring";
import { recordEvent } from "../events";
import { shiftedDeadlineSentence } from "../deadline-shift";
import { officeSettings } from "../office-settings";
import { currentPerson, personById, roleLabel, type Person } from "../people";
import { setting, today } from "../settings";
import { AssessmentMessage, AssessmentView, BlockerList, ResultPanel } from "../views/assessment";
import { FictionView } from "../views/acknowledgement-fiction";
import { formatDate } from "../views/layout";
import { errorPage } from "../views/error-page";

type Ctx = { cycle: Cycle; person: Person; appraisee: Person };

function guard(c: Context): Response | Ctx {
  const person = currentPerson(c);
  if (!person) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id") ?? "");
  if (!cycle) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  const appraisee = personById(cycle.person_id);
  if (!appraisee) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
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

function readDraft(body: Record<string, unknown>, sheet: string | null): AssessmentDraft {
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
    ...(sheet === "A" ? { objectionRecipient: str(body.objectionRecipient).trim() } : {}),
    interviewDate: date === "" ? null : date,
    gradeRequest: { attached: str(body.gradeRequestAttached) === "1", motivation: str(body.gradeMotivation) },
  };
}

/** Błędy, które odrzucają zapis szkicu: ocena spoza cyklu albo spoza skali, zła data rozmowy. Braki ocen nie blokują zapisu szkicu. */
function draftErrors(cycleId: string, d: AssessmentDraft): Record<string, string> {
  const criteria = cycleCriteria(cycleId);
  const ids = new Set(criteria.map((x) => x.id));
  const scale = POINTS as readonly number[];
  const errors: Record<string, string> = {};
  for (const [id, v] of Object.entries(d.scores)) {
    if (!ids.has(id)) errors[`_out-${id}`] = `Ocena dotyczy kryterium spoza tego cyklu (${id}). Odśwież stronę i wystaw oceny jeszcze raz.`;
    else if (!scale.includes(v)) errors[`score-${id}`] = `Wybierz ocenę cząstkową 1, 3, 5, 7 albo 9: ${criterion(id).name}.`;
  }
  if (d.interviewDate !== null && (!isIsoDate(d.interviewDate) || d.interviewDate > today())) {
    errors.interviewDate = "Wybierz z kalendarza datę rozmowy oceniającej: dzisiejszą albo wcześniejszą.";
  }
  if ((d.objectionRecipient?.length ?? 0) > 200) errors.objectionRecipient = "Adresat sprzeciwu może mieć najwyżej 200 znaków. Skróć wpis.";
  return errors;
}

/** Braki przy zatwierdzaniu jako błędy formularza: klucz = id pola na ekranie oceny. */
function blockerErrors(blockers: { field: string; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const b of blockers) {
    const m = /^score\[(.+)\]$/.exec(b.field);
    const key = m ? `score-${m[1]}` : b.field === "scores" ? "h-crits" : b.field === "gradeRequest" ? "grade-request" : b.field;
    const text = /[.?!]$/.test(b.message) ? b.message : `${b.message}.`;
    out[out[key] ? `${key}-${Object.keys(out).length}` : key] = text;
  }
  return out;
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
    blockers: approvalBlockers({ criteria: ids, draft, appointed, grade, sheet: cx.cycle.sheet }),
    gradeOption: gradeRequestOptions({ appointed, grade, outcome: result?.outcome ?? null }),
  };
}

function render(c: Context, cx: Ctx, extra: { status?: 200 | 403 | 409 | 422; errors?: Record<string, string>; errorTitle?: string; draft?: AssessmentDraft } = {}) {
  const state = assessmentState(cx.cycle.id);
  const status = extra.status ?? 200;
  const base = { viewer: cx.person, person: cx.appraisee, today: today() };
  if (state.stage === "no_part1") {
    return c.html(<AssessmentMessage {...base} text="Ocena nie może powstać bez potwierdzonej części I." action={{ label: "Przejdź do części I", href: `/cycles/${cx.cycle.id}/part1` }} />, status);
  }
  const appraiser = isAppraiser(cx);
  if (state.stage === "draft" && !appraiser) {
    const redo = reassessmentDeadline(cx.cycle.id);
    const text = redo
      ? `Sprzeciw uwzględniony: oceniający sporządza ocenę po raz drugi do ${formatDate(redo.date)} (art. 83 ust. 4 ustawy).`
      : "Ocena nie jest jeszcze zatwierdzona.";
    return c.html(<AssessmentMessage {...base} text={text} />, status);
  }
  const saved = extra.draft ?? state.draft ?? emptyDraft();
  const draft = cx.cycle.sheet === "A" && saved.objectionRecipient === undefined
    ? { ...saved, objectionRecipient: officeSettings().sheetAObjectionRecipient.value.trim() }
    : saved;
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
      periodFrom={assessmentPeriodFrom(cx.cycle.id, cx.cycle.period_start)}
      errors={extra.errors}
      errorTitle={extra.errorTitle ?? (extra.errors && Object.keys(extra.errors).every((k) => k.startsWith("_")) ? "Nie zapisano" : undefined)}
      canAcknowledge={isAppraisee(cx) && state.stage === "approved"}
      canFiction={appraiser && state.stage === "approved"}
      shifted={state.stage === "draft" ? shiftedDeadlineSentence(cx.cycle.id) : null}
      redo={state.stage === "draft" ? reassessmentDeadline(cx.cycle.id) : null}
    />,
    status,
  );
}

const app = new Hono();

app.get("/cycles/:id/assessment", (c) => {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraiser(g) && !isAppraisee(g) && g.person.role !== "hr") return errorPage(c, "Tę ocenę widzą oceniany, jego oceniający i kadry.", 403);
  return render(c, g);
});

app.get("/cycles/:id/assessment/export.json", (c) => {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraiser(g) && !isAppraisee(g) && g.person.role !== "hr") return errorPage(c, "Tę ocenę widzą oceniany, jego oceniający i kadry.", 403);
  const { snapshot, acknowledgement, fiction, approvedOn } = assessmentInForce(g.cycle.id);
  if (!snapshot) return errorPage(c, "Ocena nie jest jeszcze zatwierdzona. Wróć tu po zatwierdzeniu przez oceniającego.", 404);
  return c.json(
    { employee: g.appraisee.name, assessment: snapshot, approvedOn, acknowledgement, fiction },
    200,
    { "Content-Disposition": "attachment; filename=ocena.json", "Cache-Control": "no-store" },
  );
});

const CLOSED = "Ocena nie przyjmuje już zmian: została zatwierdzona albo cykl jest zamknięty.";

/** Wspólny początek tras zapisu oceniającego. Zwraca odpowiedź błędu albo kontekst. */
function writeGuard(c: Context): Ctx | Response | Promise<Response> {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraiser(g)) return errorPage(c, "Ocenę zapisuje oceniający.", 403);
  const stage = assessmentState(g.cycle.id).stage;
  if (stage === "no_part1") return render(c, g, { status: 409 });
  if (stage !== "draft") return render(c, g, { status: 409, errors: { _: CLOSED } });
  return g;
}

app.post("/cycles/:id/assessment", async (c) => {
  const g = writeGuard(c);
  if (!isCtx(g)) return g;
  const draft = readDraft(await c.req.parseBody(), g.cycle.sheet);
  const errors = draftErrors(g.cycle.id, draft);
  if (Object.keys(errors).length) return render(c, g, { status: 422, errors, draft });
  const ok = getDb().transaction(() => {
    if (assessmentState(g.cycle.id).stage !== "draft") return false;
    recordEvent("assessment_draft_saved", g.cycle.id, g.person.id, draft);
    return true;
  })();
  if (!ok) return render(c, g, { status: 409, errors: { _: CLOSED } });
  return c.redirect(`/cycles/${g.cycle.id}/assessment`, 303);
});

app.post("/cycles/:id/assessment/approve", async (c) => {
  const g = writeGuard(c);
  if (!isCtx(g)) return g;
  const draft = readDraft(await c.req.parseBody(), g.cycle.sheet);
  const errors = draftErrors(g.cycle.id, draft);
  if (Object.keys(errors).length) return render(c, g, { status: 422, errors, draft });
  const redo = assessmentState(g.cycle.id).redo;
  const lowered = redo?.first.snapshot ? redoLoweringErrors(redo.first.snapshot, draft.scores) : {};
  const outcome = getDb().transaction((): "closed" | "blocked" | "lowered" | "ok" => {
    const state = assessmentState(g.cycle.id);
    if (state.stage !== "draft") return "closed";
    recordEvent("assessment_draft_saved", g.cycle.id, g.person.id, draft);
    if (Object.keys(lowered).length) return "lowered";
    const { blockers } = screenData(g, draft);
    if (blockers.length) return "blocked";
    const snapshot = buildAssessmentSnapshot(g.cycle.id, draft);
    const r = state.redo;
    // Druga ocena: termin to termin rozpatrzenia sprzeciwu (art. 83 ust. 3 ustawy), który ją obejmuje.
    const due = r ? reassessmentDeadline(g.cycle.id) : null;
    recordEvent(
      "assessment_approved",
      g.cycle.id,
      g.person.id,
      r?.first.approvedOn ? { ...snapshot, ...(due ? { deadline: due } : {}), redo: { objectionFiledOn: r.filedOn, firstApprovedOn: r.first.approvedOn } } : snapshot,
    );
    return "ok";
  })();
  if (outcome === "closed") return render(c, g, { status: 409, errors: { _: CLOSED } });
  if (outcome === "lowered") return render(c, g, { status: 422, draft, errors: lowered, errorTitle: "Oceny nie można zatwierdzić" });
  if (outcome === "blocked") return render(c, g, { status: 422, draft, errors: blockerErrors(screenData(g, draft).blockers), errorTitle: "Oceny nie można jeszcze zatwierdzić" });
  return c.redirect(`/cycles/${g.cycle.id}/assessment`, 303);
});

app.post("/cycles/:id/assessment/acknowledge", (c) => {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraisee(g)) return errorPage(c, "Zapoznanie z oceną potwierdza oceniany.", 403);
  const ok = getDb().transaction(() => {
    const state = assessmentState(g.cycle.id);
    if (state.stage !== "approved" || !state.approvedOn || !state.snapshot) return false;
    recordEvent("assessment_acknowledged", g.cycle.id, g.person.id, {
      place: setting("office_city") ?? "",
      date: today(),
      name: g.person.name,
      objectionDeadline: objectionDeadline(today()),
    });
    (state.redo ? restartNextCycle : startNextCycle)(g.cycle, g.person.id, state.approvedOn, today(), state.snapshot.result.outcome);
    return true;
  })();
  if (!ok) return render(c, g, { status: 409, errors: { _: "Ocena nie czeka na potwierdzenie zapoznania." } });
  return c.redirect(`/cycles/${g.cycle.id}/assessment`, 303);
});

app.post("/cycles/:id/assessment/preview", async (c) => {
  const g = guard(c);
  if (!isCtx(g)) return g;
  if (!isAppraiser(g)) return c.text("Tylko oceniający może zobaczyć podgląd wyniku.", 403);
  const draft = readDraft(await c.req.parseBody(), g.cycle.sheet);
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
  if (!isAppraiser(g)) return errorPage(c, "Fikcję zapoznania wpisuje oceniający.", 403);
  const stage = assessmentState(g.cycle.id).stage;
  if (stage !== "approved") {
    return render(c, g, { status: 409, errors: { _: "Fikcję zapoznania można stwierdzić tylko po zatwierdzeniu oceny, dopóki oceniany jej nie potwierdził." } });
  }
  return g;
}

function fictionScreen(c: Context, cx: Ctx, extra: { status?: 200 | 422; errors?: Record<string, string>; values?: Record<string, string> } = {}) {
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
  const errors: Record<string, string> = {};
  if (!REASONS.includes(values.reason)) {
    const gender = g.appraisee.gender;
    const assessed = roleLabel({ role: "employee", gender });
    errors.reason = gender === "f"
      ? `Wybierz, czy ${assessed} nie mogła, czy nie chciała potwierdzić zapoznania.`
      : `Wybierz, czy ${assessed} nie mógł, czy nie chciał potwierdzić zapoznania.`;
  }
  const approvedOn = assessmentState(g.cycle.id).approvedOn ?? today();
  const dateOk = isIsoDate(values.deliveredOn) && values.deliveredOn >= approvedOn && values.deliveredOn <= today();
  if (!METHODS.includes(values.deliveryMethod)) errors.deliveryMethod = "Wybierz, jak doręczono kopię arkusza.";
  if (!dateOk) errors.deliveredOn = `Wybierz z kalendarza datę doręczenia kopii arkusza: od ${formatDate(approvedOn)} do dziś.`;
  if (Object.keys(errors).length) return fictionScreen(c, g, { status: 422, errors, values });
  const ok = getDb().transaction(() => {
    const state = assessmentState(g.cycle.id);
    if (state.stage !== "approved" || !state.approvedOn || !state.snapshot) return false;
    recordEvent("acknowledgement_fiction", g.cycle.id, g.person.id, {
      reason: values.reason,
      deliveryMethod: values.deliveryMethod,
      deliveredOn: values.deliveredOn,
      objectionDeadline: objectionDeadline(today()),
    });
    // Dniem zapoznania jest dzień wpisu fikcji (jak termin sprzeciwu); `deliveredOn` opisuje doręczenie kopii.
    (state.redo ? restartNextCycle : startNextCycle)(g.cycle, g.person.id, state.approvedOn, today(), state.snapshot.result.outcome);
    return true;
  })();
  if (!ok) return render(c, g, { status: 409, errors: { _: "Ocena nie czeka na potwierdzenie zapoznania." } });
  return c.redirect(`/cycles/${g.cycle.id}/assessment`, 303);
});

export default app;
