import { Hono } from "hono";
import { assessmentState } from "../assessment/state";
import { effectiveDeadline, previousCycleOf } from "../cycles";
import { cycleState } from "../hr/cycle-state";
import { latestCycles } from "../hr/latest-cycles";
import { lastAssessmentOf, OUTCOME_LABEL } from "../hr/people";
import { personById } from "../people";
import { formatDate } from "../views/layout";
import { hrGuard } from "./hr-people";

const app = new Hono();

const HEADER = ["Osoba", "Stanowisko", "Komórka", "Oceniający", "Stan procesu", "Termin oceny", "Termin sprzeciwu", "Data ostatniej oceny", "Wynik ostatniej oceny"];

/** Pole CSV z separatorem `;`: cudzysłów przy `;`, `"` i końcach linii, a komórka zaczynająca się od `=`, `+`, `-`, `@` nie jest formułą w arkuszu. */
function field(v: string): string {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

app.get("/hr/export.csv", (c) => {
  const viewer = hrGuard(c);
  if (viewer instanceof Response) return viewer;
  const rows = latestCycles().map((cycle) => {
    const person = personById(cycle.person_id);
    const state = cycleState(cycle.id);
    const latest = assessmentState(cycle.id);
    const previous = !latest.snapshot ? previousCycleOf(cycle.id) : null;
    const deadline = latest.snapshot?.deadline ?? effectiveDeadline(cycle.id);
    const objection = latest.objectionDeadline ?? (previous ? assessmentState(previous.id).objectionDeadline : null);
    const last = lastAssessmentOf(cycle.person_id);
    return [
      person?.name ?? cycle.person_id,
      person?.position_title ?? "",
      person?.unit ?? "",
      personById(cycle.appraiser_id)?.name ?? cycle.appraiser_id,
      state.text,
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
