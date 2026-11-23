// Rozstrzygnięcie sprzeciwu „zmiana oceny” (art. 83 ust. 3 ustawy): kadry zapisują decyzję rozpatrującego sprzeciw razem ze zmienionymi ocenami.
import { Hono, type Context } from "hono";
import { redoLoweringErrors } from "../assessment/redo";
import { assessmentState, type AssessmentSnapshot } from "../assessment/state";
import { cycleById, cycleDeadlineDetails, openCycle, previousCycleOf, restartNextCycle } from "../cycles";
import { getDb } from "../db";
import { rules } from "../engine/rules";
import { computeAssessment, POINTS } from "../engine/scoring";
import { recordEvent, visibleEvents } from "../events";
import { currentPerson, isDirectorGeneral, personById, type Person } from "../people";
import { today } from "../settings";
import { errorPage } from "../views/error-page";
import { ObjectionChangeView } from "../views/objection-change";

const app = new Hono();

type Ctx = { viewer: Person; cycleId: string; person: Person; first: AssessmentSnapshot; filedOn: string };

function guard(c: Context): Ctx | Response | Promise<Response> {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "hr" && !isDirectorGeneral(viewer)) {
    return errorPage(c, "Tę czynność wykonują dyrektor generalny urzędu albo kadry.", 403);
  }
  const cycle = cycleById(c.req.param("id") ?? "");
  const ev = cycle ? visibleEvents(cycle.id) : [];
  if (!cycle || !ev.some((e) => e.type === "cycle_started")) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  if (cycle.sheet === "A" && viewer.role !== "hr") {
    return errorPage(c, "W arkuszu A decyzję rozpatrującego sprzeciw zapisują kadry.", 403);
  }
  const state = assessmentState(cycle.id);
  if (!state.objection || state.objection.resolvedOn || !state.snapshot) {
    return errorPage(c, "Ten sprzeciw jest już rozpatrzony albo nie został wniesiony. Wróć do „Stan cykli”.", 409);
  }
  const person = personById(cycle.person_id);
  if (!person) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  return { viewer, cycleId: cycle.id, person, first: state.snapshot, filedOn: state.objection.filedOn };
}

const isCtx = (g: unknown): g is Ctx => typeof g === "object" && g !== null && "first" in g;

function decidedByFor(first: AssessmentSnapshot): string {
  return first.sheet === "A" && first.objectionRecipient?.trim()
    ? first.objectionRecipient.trim()
    : rules.deadlines.objectionDays.to;
}

function screen(c: Context, g: Ctx, scores: Record<string, number>, errors?: Record<string, string>) {
  return c.html(
    <ObjectionChangeView viewer={g.viewer} person={g.person} cycleId={g.cycleId} today={today()} first={g.first} filedOn={g.filedOn} scores={scores} errors={errors}
      decidedBy={decidedByFor(g.first)} />,
    errors ? 422 : 200,
  );
}

app.get("/cycles/:id/objection-change", (c) => {
  const g = guard(c);
  if (!isCtx(g)) return g;
  return screen(c, g, g.first.scores);
});

app.post("/cycles/:id/objection-change", async (c) => {
  const g = guard(c);
  if (!isCtx(g)) return g;
  const body = await c.req.parseBody();
  const scale = POINTS as readonly number[];
  const scores: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const cr of g.first.criteria) {
    const v = Number(body[`score[${cr.id}]`]);
    if (scale.includes(v)) scores[cr.id] = v;
    else errors[`score-${cr.id}`] = `Wybierz ocenę cząstkową 1, 3, 5, 7 albo 9: ${cr.name}.`;
  }
  Object.assign(errors, redoLoweringErrors(g.first, scores, "Ocena zmieniona po sprzeciwie"));
  if (!Object.keys(errors).length && g.first.criteria.every((cr) => scores[cr.id] === g.first.scores[cr.id])) {
    errors[`score-${g.first.criteria[0].id}`] = "Zmiana oceny musi podnieść co najmniej jedną ocenę cząstkową. Jeśli ocena zostaje bez zmian, wybierz w „Stan cykli” inne rozstrzygnięcie.";
  }
  if (Object.keys(errors).length) return screen(c, g, { ...g.first.scores, ...scores }, errors);
  const r = computeAssessment(scores);
  const changed: AssessmentSnapshot = {
    ...g.first,
    scores,
    criteria: g.first.criteria.map((cr) => ({ ...cr, score: scores[cr.id] })),
    result: { mean: r.mean, overallLevel: r.overallLevel, outcome: r.outcome, reasons: r.reasons, justificationRequired: r.justificationRequired },
    changedOnObjection: { objectionFiledOn: g.filedOn, changedOn: today(), recordedBy: g.viewer.name, decidedBy: decidedByFor(g.first) },
  };
  const ok = getDb().transaction(() => {
    const cur = assessmentState(g.cycleId);
    if (!cur.objection || cur.objection.resolvedOn) return false;
    if (g.first.result.outcome === "negative" && r.outcome === "positive") {
      const state = assessmentState(g.cycleId);
      const acquaintedOn = state.acknowledgement?.eventDate ?? state.fiction?.eventDate;
      const next = openCycle(g.person.id);
      const previous = next && previousCycleOf(next.id);
      if (previous?.id === g.cycleId && state.approvedOn && acquaintedOn && next && cycleDeadlineDetails(next.id).kind === "after_negative") {
        restartNextCycle(previous, g.viewer.id, state.approvedOn, acquaintedOn, r.outcome, "previous_assessment_changed");
      }
    }
    recordEvent("objection_resolved", g.cycleId, g.viewer.id, { outcome: "changed" });
    recordEvent("assessment_changed", g.cycleId, g.viewer.id, changed);
    return true;
  })();
  if (!ok) return errorPage(c, "Ten sprzeciw jest już rozpatrzony albo nie został wniesiony. Wróć do „Stan cykli”.", 409);
  return c.redirect(g.viewer.role === "hr" ? `/cycles/${g.cycleId}/assessment` : `/cycles/${g.cycleId}/objection?resolved=1`, 303);
});

export default app;
