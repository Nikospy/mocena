import { Hono, type Context } from "hono";
import { visibleCycleById, effectiveDeadline, type Cycle } from "../cycles";
import { deadlineCase, deadlineChangeBlocked, newDeadlineError, pendingRequest, requestState } from "../deadline-change";
import { toWorkingDay } from "../engine/deadlines";
import { recordEvent, visibleEvents } from "../events";
import { currentPerson, personById, type Person } from "../people";
import { setting, today } from "../settings";
import { ChangeFormView, LetterView, RequestFormView, type ChangeFormErrors } from "../views/deadline-change";
import "../deadline-change-links";

const app = new Hono();

type Ctx = { viewer: Person; cycle: Cycle };
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function guard(c: Context, who: "appraiser" | "appraisee"): Response | Ctx {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id") ?? "");
  if (!cycle) return c.text("Nie ma takiego cyklu.", 404);
  if (who === "appraiser" && viewer.id !== cycle.appraiser_id) return c.text("Termin zmienia oceniający tego cyklu.", 403);
  if (who === "appraisee" && viewer.id !== cycle.person_id) return c.text("Wniosek o zmianę terminu składa oceniany.", 403);
  return { viewer, cycle };
}

const name = (id: string) => personById(id)?.name ?? id;

function renderChange(c: Context, cx: Ctx, values: { case: string; newDate: string; reason: string }, errors: ChangeFormErrors = {}, status: 200 | 422 = 200, requestId?: number) {
  const pending = pendingRequest(cx.cycle.id);
  const req = pending && (requestId === undefined || pending.id === requestId) ? pending : null;
  return c.html(
    <ChangeFormView
      viewer={cx.viewer}
      today={today()}
      cycleId={cx.cycle.id}
      personName={name(cx.cycle.person_id)}
      currentDeadline={effectiveDeadline(cx.cycle.id).date}
      blocked={deadlineChangeBlocked(cx.cycle)}
      values={values}
      errors={errors}
      request={req ? { id: req.id, date: req.date, reason: req.payload.reason, requestedDate: req.payload.requestedDate ?? null } : null}
    />,
    status,
  );
}

app.get("/cycles/:id/deadline-change", (c) => {
  const g = guard(c, "appraiser");
  if (g instanceof Response) return g;
  const pending = pendingRequest(g.cycle.id);
  return renderChange(c, g, { case: pending ? "4" : "", newDate: pending?.payload.requestedDate ?? "", reason: "" });
});

app.post("/cycles/:id/deadline-change", async (c) => {
  const g = guard(c, "appraiser");
  if (g instanceof Response) return g;
  const { viewer, cycle } = g;
  const blocked = deadlineChangeBlocked(cycle);
  const body = await c.req.parseBody();
  const values = { case: str(body.case), newDate: str(body.newDate), reason: str(body.reason) };
  if (blocked) return blocked.code === "six_months" ? renderChange(c, g, values, { case: blocked.message }, 422) : c.text(blocked.message, 409);
  const pending = pendingRequest(cycle.id);
  const errors: ChangeFormErrors = {};
  const kase = deadlineCase(Number(values.case));
  if (!kase) errors.case = "Wybierz przypadek z art. 81 ust. 8 ustawy.";
  else if (kase.n === 4 && !pending) errors.case = "Przypadek z pkt 4 wymaga wniosku ocenianego. Wybierz inny przypadek.";
  const dateErr = newDeadlineError(values.newDate);
  if (dateErr) errors.newDate = dateErr;
  if (!values.reason) errors.reason = "Podaj uzasadnienie zmiany terminu.";
  if (Object.keys(errors).length) return renderChange(c, g, values, errors, 422);

  const id = recordEvent("deadline_changed", cycle.id, viewer.id, {
    case: kase!.n,
    oldDeadline: effectiveDeadline(cycle.id).date,
    newDeadline: toWorkingDay(values.newDate),
    reason: values.reason,
    ...(kase!.n === 4 ? { requestId: pending!.id } : {}),
  });
  return c.redirect(`/cycles/${cycle.id}/deadline-change/${id}/letter`, 303);
});

app.post("/cycles/:id/deadline-change/reject", async (c) => {
  const g = guard(c, "appraiser");
  if (g instanceof Response) return g;
  const { viewer, cycle } = g;
  const pending = pendingRequest(cycle.id);
  if (!pending) return c.text("Nie ma wniosku do rozpatrzenia.", 409);
  const reason = str((await c.req.parseBody()).reason);
  if (!reason) return renderChange(c, g, { case: "4", newDate: "", reason: "" }, { "reject-reason": "Podaj powód odrzucenia wniosku." }, 422);
  recordEvent("deadline_change_rejected", cycle.id, viewer.id, { requestId: pending.id, reason });
  return c.redirect("/", 303);
});

app.get("/cycles/:id/deadline-change/request", (c) => {
  const g = guard(c, "appraisee");
  if (g instanceof Response) return g;
  return renderRequest(c, g, { reason: "", requestedDate: "" });
});

function renderRequest(c: Context, cx: Ctx, values: { reason: string; requestedDate: string }, errors: { reason?: string; requestedDate?: string } = {}, status: 200 | 422 = 200) {
  return c.html(
    <RequestFormView
      viewer={cx.viewer}
      today={today()}
      cycleId={cx.cycle.id}
      currentDeadline={effectiveDeadline(cx.cycle.id).date}
      blocked={deadlineChangeBlocked(cx.cycle)}
      state={requestState(cx.cycle.id)}
      values={values}
      errors={errors}
    />,
    status,
  );
}

app.post("/cycles/:id/deadline-change/request", async (c) => {
  const g = guard(c, "appraisee");
  if (g instanceof Response) return g;
  const { viewer, cycle } = g;
  const blocked = deadlineChangeBlocked(cycle);
  if (blocked) return c.text(blocked.message, blocked.code === "six_months" ? 422 : 409);
  if (pendingRequest(cycle.id)) return c.text("Wniosek czeka już na decyzję oceniającego.", 409);
  const body = await c.req.parseBody();
  const values = { reason: str(body.reason), requestedDate: str(body.requestedDate) };
  const errors: { reason?: string; requestedDate?: string } = {};
  if (!values.reason) errors.reason = "Podaj uzasadnienie wniosku.";
  if (values.requestedDate) {
    const e = newDeadlineError(values.requestedDate);
    if (e) errors.requestedDate = e;
  }
  if (errors.reason || errors.requestedDate) return renderRequest(c, g, values, errors, 422);
  recordEvent("due_change_requested", cycle.id, viewer.id, { requestedDate: values.requestedDate || null, reason: values.reason });
  return c.redirect(`/cycles/${cycle.id}/deadline-change/request`, 303);
});

app.get("/cycles/:id/deadline-change/:eventId/letter", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id"));
  if (!cycle) return c.text("Nie ma takiego cyklu.", 404);
  const event = visibleEvents(cycle.id).find((e) => e.type === "deadline_changed" && String(e.id) === c.req.param("eventId"));
  if (!event) return c.text("Nie ma takiego pisma.", 404);
  if (viewer.id !== cycle.person_id && viewer.id !== cycle.appraiser_id && viewer.role !== "hr") return c.text("Pismo widzi oceniany, oceniający i kadry.", 403);
  const appraiser = personById(cycle.appraiser_id);
  return c.html(
    <LetterView
      viewer={viewer}
      today={today()}
      cycleId={cycle.id}
      officeName={setting("office_name") ?? ""}
      city={setting("office_city") ?? ""}
      event={event}
      appraiseeName={name(cycle.person_id)}
      appraiserName={appraiser?.name ?? cycle.appraiser_id}
      appraiserTitle={appraiser?.position_title ?? null}
    />,
  );
});

export default app;
