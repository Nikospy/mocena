import { Hono, type Context } from "hono";
import { visibleCycleById, effectiveDeadline, cycleDeadlineDetails, openCycle, visibleAbsences, type Cycle } from "../cycles";
import { addDays } from "../engine/deadlines";
import { getDb } from "../db";
import { recordEvent, visibleEvents } from "../events";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { currentTour } from "../tour/context";
import { STEP3_PREFILL } from "../tour/state";
import { AbsenceFormView, type AbsenceFormValues, type AbsenceSummary } from "../views/absence-form";
import { errorPage } from "../views/error-page";

const app = new Hono();

type Ctx = { viewer: Person; cycle: Cycle };

function guard(c: Context): Response | Ctx {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id") ?? "");
  if (!cycle) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  if (viewer.role !== "hr") return errorPage(c, "Nieobecności wpisują kadry.", 403);
  return { viewer, cycle };
}

function validDate(s: string): boolean {
  try {
    addDays(s, 0);
    return true;
  } catch {
    return false;
  }
}

function render(c: Context, cx: Ctx, values: AbsenceFormValues, errors: Partial<Record<"from" | "to", string>> = {}, status: 200 | 422 = 200) {
  return c.html(
    <AbsenceFormView
      viewer={cx.viewer}
      today={today()}
      cycleId={cx.cycle.id}
      personName={personById(cx.cycle.person_id)?.name ?? cx.cycle.person_id}
      values={values}
      errors={errors}
      absences={visibleAbsences(cx.cycle.person_id)}
      summary={isOpen(cx.cycle) ? summaryOf(cx.cycle) : null}
    />,
    status,
  );
}

/** Podsumowanie z silnika: scalone nieobecności i termin oceny po nich (art. 81 ust. 7 ustawy). */
function summaryOf(cycle: Cycle): AbsenceSummary | null {
  const d = cycleDeadlineDetails(cycle.id);
  if (d.merged.length === 0) return null;
  return {
    merged: d.merged.map((m) => ({ from: m.from, to: m.to, days: m.days, parts: m.parts.length, counted: m.counted, longerThanMonth: m.longerThanMonth })),
    afterNegative: d.kind === "after_negative",
    deadline: d.deadline,
    previous: d.extensionDays > 0 ? d.base : null,
    extensionDays: d.extensionDays,
    basis: d.basis,
  };
}

export const FUTURE_START = "Wpisz nieobecność, która już się zaczęła: początek najpóźniej dziś.";

const closed = (c: Context) => errorPage(c, "Cykl jest zamknięty. Nieobecność wpisuje się tylko w otwartym cyklu.", 409);
const isOpen = (cycle: Cycle) => openCycle(cycle.person_id)?.id === cycle.id;

/** Przewodnik, krok 3: druga nieobecność Piotra wpisana w formularz, dopóki jej nie zapisano. Zapisuje dopiero kliknięcie widza. */
function tourPrefill(cycle: Cycle): AbsenceFormValues | null {
  if (currentTour().stop !== "3" || cycle.person_id !== "piotr" || !isOpen(cycle)) return null;
  if (visibleAbsences(cycle.person_id).some((a) => a.date_from === STEP3_PREFILL.from)) return null;
  return { from: STEP3_PREFILL.from, to: STEP3_PREFILL.to, excused: true };
}

app.get("/cycles/:id/absences", (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  return render(c, g, tourPrefill(g.cycle) ?? { from: "", to: "", excused: true });
});

app.post("/cycles/:id/absences", async (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  const { viewer, cycle } = g;
  if (!isOpen(cycle)) return closed(c);
  const body = await c.req.parseBody();
  const from = typeof body.from === "string" ? body.from : "";
  const to = typeof body.to === "string" ? body.to : "";
  const excused = body.excused !== undefined;
  const errors: Partial<Record<"from" | "to", string>> = {};
  if (!validDate(from)) errors.from = "Wybierz z kalendarza datę początku nieobecności.";
  // Art. 81 ust. 7 przedłuża termin o nieobecność, która już trwa; przewidywaną załatwia zmiana terminu (art. 81 ust. 8 pkt 2).
  else if (from > today()) errors.from = FUTURE_START;
  if (!validDate(to)) errors.to = "Wybierz z kalendarza datę końca nieobecności.";
  else if (!errors.from && to < from) errors.to = "Wybierz datę końca równą dacie początku albo późniejszą.";
  if (errors.from || errors.to) return render(c, g, { from, to, excused }, errors, 422);

  const before = effectiveDeadline(cycle.id).date;
  const now = today();
  const r = getDb()
    .query("INSERT INTO absences (person_id, date_from, date_to, excused, recorded_on, recorded_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(cycle.person_id, from, to, excused ? 1 : 0, now, viewer.id);
  recordEvent("absence_recorded", cycle.id, viewer.id, { absence_id: Number(r.lastInsertRowid), notified: [cycle.appraiser_id, cycle.person_id] });
  const approved = visibleEvents(cycle.id).some((e) => e.type === "assessment_approved");
  const saved = approved ? "approved" : effectiveDeadline(cycle.id).date !== before ? "extended" : "unchanged";
  return c.redirect(`/cycles/${cycle.id}/timeline?saved=${saved}`, 303);
});

export default app;
