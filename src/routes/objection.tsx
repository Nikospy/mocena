import { withCycleRules } from "../assessment/rules-scope";
import { Hono, type Context } from "hono";
import { assessmentState, objectionRecipientFor } from "../assessment/state";
import { previousCycleOf, visibleCycleById, type Cycle } from "../cycles";
import { getDb } from "../db";
import { objectionReviewDeadline } from "../engine/deadlines";
import { rules } from "../engine/rules";
import { recordEvent } from "../events";
import { registerHomeTasks, type HomeTask } from "../home-tasks";
import { latestCycles, pendingReassessmentPredecessor } from "../hr/latest-cycles";
import { currentPerson, isDirectorGeneral, personById, type Person } from "../people";
import { today } from "../settings";
import { errorPage } from "../views/error-page";
import { formatDate } from "../views/layout";
import { ObjectionFormView, ObjectionResolveView } from "../views/objection-form";

const app = new Hono();

/** Dyrektor generalny widzi na stronie głównej otwarte sprzeciwy (arkusze B i C) z 14-dniowym terminem rozpatrzenia (art. 83 ust. 3 ustawy). */
registerHomeTasks((person) => {
  if (!isDirectorGeneral(person)) return [];
  const tasks: HomeTask[] = [];
  const seen = new Set<string>();
  const candidates = latestCycles().flatMap((latest) => {
    const redo = pendingReassessmentPredecessor(latest);
    if (redo) return [redo];
    const prev = previousCycleOf(latest.id);
    return prev ? [latest, prev] : [latest];
  });
  for (const cycle of candidates) {
    if (seen.has(cycle.id)) continue;
    seen.add(cycle.id);
    if (cycle.sheet === "A") continue;
    const state = assessmentState(cycle.id);
    if (!state.objection || state.objection.resolvedOn) continue;
    const appraisee = personById(cycle.person_id);
    if (!appraisee) continue;
    tasks.push({
      title: `Rozpatrz sprzeciw: ${appraisee.name}`,
      heading: "Rozpatrz sprzeciw",
      person: appraisee.name,
      detail: `Sprzeciw wniesiony ${formatDate(state.objection.filedOn)}.`,
      ...withCycleRules(cycle.id, () => ({ due: objectionReviewDeadline(state.objection!.filedOn), basis: rules.deadlines.objectionReviewDays.basis })),
      action: "Rozpatrz sprzeciw",
      href: `/cycles/${cycle.id}/objection`,
    });
  }
  return tasks;
});

type FileCtx = { viewer: Person; cycle: Cycle; recipient: string; deadline: string };

function fileGuard(c: Context): FileCtx | Response {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id") ?? "");
  if (!cycle) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  if (viewer.id !== cycle.person_id) return errorPage(c, "Sprzeciw od oceny wnosi wyłącznie oceniany.", 403);
  const state = assessmentState(cycle.id);
  if ((state.stage !== "acknowledged" && state.stage !== "fiction") || !state.snapshot || !state.objectionDeadline) {
    return errorPage(c, "Sprzeciw można wnieść dopiero po zapoznaniu się z oceną.", 409);
  }
  if (state.redo !== null) {
    return errorPage(
      c,
      "Od oceny sporządzonej po raz drugi po uwzględnieniu sprzeciwu nie przysługuje kolejny sprzeciw — przysługuje odwołanie do sądu pracy (art. 83 ust. 5 ustawy).",
      409,
    );
  }
  if (state.snapshot.changedOnObjection) {
    return errorPage(c, "Po zmianie oceny w wyniku rozpatrzenia sprzeciwu przysługuje wyłącznie odwołanie do sądu pracy (art. 83 ust. 5 ustawy).", 409);
  }
  if (state.objection) {
    return errorPage(c, "Sprzeciw w tym cyklu został już wniesiony.", 409);
  }
  if (today() > state.objectionDeadline) {
    return errorPage(c, `Termin wniesienia sprzeciwu minął ${formatDate(state.objectionDeadline)} (${rules.deadlines.objectionDays.basis}).`, 409);
  }
  const recipient = objectionRecipientFor(state.snapshot.sheet, state.snapshot.objectionRecipient) ?? rules.deadlines.objectionDays.toGenitive;
  return { viewer, cycle, recipient, deadline: state.objectionDeadline };
}

app.get("/cycles/:id/objection/new", (c) => {
  const g = fileGuard(c);
  if (g instanceof Response) return g;
  return c.html(
    <ObjectionFormView
      viewer={g.viewer}
      today={today()}
      cycleId={g.cycle.id}
      recipient={g.recipient}
      deadline={g.deadline}
    />,
  );
});

app.post("/cycles/:id/objection", async (c) => {
  const g = fileGuard(c);
  if (g instanceof Response) return g;
  const body = await c.req.parseBody();
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason || reason.length > 4000) {
    const errors = { reason: reason ? "Uzasadnienie sprzeciwu może mieć najwyżej 4000 znaków." : "Wpisz uzasadnienie sprzeciwu." };
    return c.html(
      <ObjectionFormView
        viewer={g.viewer}
        today={today()}
        cycleId={g.cycle.id}
        recipient={g.recipient}
        deadline={g.deadline}
        reason={typeof body.reason === "string" ? body.reason : ""}
        errors={errors}
      />,
      422,
    );
  }
  const ok = getDb().transaction(() => {
    const st = assessmentState(g.cycle.id);
    if (st.objection || st.redo !== null || !st.objectionDeadline || today() > st.objectionDeadline || st.snapshot?.changedOnObjection) return false;
    recordEvent("objection_filed", g.cycle.id, g.viewer.id, { to: g.recipient, reason });
    return true;
  })();
  if (!ok) return errorPage(c, "Sprzeciw w tym cyklu nie może zostać wniesiony.", 409);
  return c.redirect(`/cycles/${g.cycle.id}/assessment`, 303);
});

app.get("/cycles/:id/objection", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const isDirector = isDirectorGeneral(viewer);
  if (viewer.role !== "hr" && !isDirector) {
    return errorPage(c, "Rozpatrzenie sprzeciwu widzą dyrektor generalny urzędu oraz kadry.", 403);
  }
  const cycle = visibleCycleById(c.req.param("id") ?? "");
  if (!cycle) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  if (cycle.sheet === "A" && viewer.role !== "hr") {
    return errorPage(c, "W arkuszu A sprzeciw kierowany jest do wskazanego adresata; rozstrzygnięcie zapisują kadry.", 403);
  }
  const state = assessmentState(cycle.id);
  const effective = state.objection ? state : state.redo?.first;
  if (!effective?.objection || !effective.snapshot) {
    return errorPage(c, "W tym cyklu nie wniesiono sprzeciwu.", 404);
  }
  const person = personById(cycle.person_id);
  if (!person) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  const appraiserName = personById(cycle.appraiser_id)?.name ?? cycle.appraiser_id;
  const recipient = objectionRecipientFor(effective.snapshot.sheet, effective.snapshot.objectionRecipient) ?? rules.deadlines.objectionDays.toGenitive;
  return c.html(
    <ObjectionResolveView
      viewer={viewer}
      today={today()}
      cycleId={cycle.id}
      person={person}
      appraiserName={appraiserName}
      recipient={recipient}
      snapshot={effective.snapshot}
      objection={effective.objection}
      resolved={c.req.query("resolved") === "1"}
    />,
  );
});

export default app;
