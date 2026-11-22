import { Hono } from "hono";
import { assessmentState } from "../assessment/state";
import { effectiveDeadline, previousCycleOf } from "../cycles";
import { part1DeadlinesAfterObjection } from "../cycles/part1";
import { cycleState } from "../hr/cycle-state";
import { latestCycles, pendingReassessmentPredecessor } from "../hr/latest-cycles";
import { EXPORT_HEADER } from "../hr/csv-import";
import { lastAssessmentOf, OUTCOME_LABEL } from "../hr/people";
import { personById } from "../people";
import { formatDate } from "../views/layout";
import { hrGuard } from "./hr-people";

const app = new Hono();

const HEADER = EXPORT_HEADER;

/** Pole CSV z separatorem `;`: cudzysłów przy `;`, `"` i końcach linii, a komórka zaczynająca się od `=`, `+`, `-`, `@` nie jest formułą w arkuszu. */
function field(v: string): string {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

app.get("/hr/export.csv", (c) => {
  const viewer = hrGuard(c);
  if (viewer instanceof Response) return viewer;
  const rows = latestCycles().map((latestCycle) => {
    const cycle = pendingReassessmentPredecessor(latestCycle) ?? latestCycle;
    const person = personById(cycle.person_id);
    const state = cycleState(cycle.id);
    const latest = assessmentState(cycle.id);
    const previous = !latest.snapshot && !latest.redo ? previousCycleOf(cycle.id) : null;
    const redoDeadline = latest.redo && latest.stage === "draft" ? state.deadline : null;
    const deadline = redoDeadline ?? latest.snapshot?.deadline ?? effectiveDeadline(cycle.id);
    const objectionState = previous ? assessmentState(previous.id) : latest;
    const objection = objectionState.objection?.resolvedOn ? null : objectionState.objectionDeadline;
    const last = lastAssessmentOf(cycle.person_id);
    const previousDeadline = part1DeadlinesAfterObjection(cycle.id, deadline.date)?.previous;
    return [
      person?.name ?? cycle.person_id,
      person?.position_title ?? "",
      person?.unit ?? "",
      personById(cycle.appraiser_id)?.name ?? cycle.appraiser_id,
      previousDeadline ? `${state.text}. Termin przekazany w części I: ${formatDate(previousDeadline.date)}.` : state.text,
      formatDate(deadline.date),
      objection ? formatDate(objection) : "",
      last ? formatDate(last.on) : "",
      last?.outcome ? OUTCOME_LABEL[last.outcome] : "",
    ];
  });
  rows.sort((a, b) => a[0].localeCompare(b[0], "pl"));
  const body = [HEADER, ...rows].map((r) => r.map(field).join(";")).join("\r\n") + "\r\n";
  return new Response("\uFEFF" + body, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="zestawienie-ocen.csv"' },
  });
});

export default app;
