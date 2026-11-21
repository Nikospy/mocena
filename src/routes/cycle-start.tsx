import { Hono, type Context } from "hono";
import { card } from "../content";
import { cycleById, effectiveDeadline, openCycle, type Cycle } from "../cycles";
import { cycleLinks, registerCycleLinks } from "../cycle-links";
import { confirmPart1, cycleCriteria, isPart1Locked, part1Status, saveCriteria, submitPart1, type Part1Input } from "../cycles/part1";
import { sheetForPosition } from "../engine/criteria";
import { criteriaTalkDeadline } from "../engine/deadlines";
import { rules } from "../engine/rules";
import { selectableCriteria, type Sheet } from "../engine/scoring";
import { visibleEvents } from "../events";
import { registerHomeTasks } from "../home-tasks";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { suggestCriteria } from "../suggestions";
import { OpeningCardView, Part1View } from "../views/part1";
import { getDb } from "../db";
import { formatDate } from "../views/layout";

const isParty = (c: Cycle, p: Person) => c.appraiser_id === p.id || c.person_id === p.id;

registerCycleLinks((cycle, person) =>
  isParty(cycle, person) ? [{ label: "Karta rozmowy rozpoczynającej", href: `/cycles/${cycle.id}/cards/opening` }] : [],
);

registerHomeTasks((person) => {
  const tasks: { title: string; href: string; detail?: string }[] = [];
  if (person.role === "appraiser") {
    for (const personId of appraiseeIds(person.id)) {
      const cycle = openCycle(personId);
      if (!cycle || cycle.appraiser_id !== person.id) continue;
      const { state } = part1Status(cycle.id);
      if (state !== "not_started" && state !== "draft") continue;
      const started = visibleEvents(cycle.id).filter((e) => e.type === "cycle_started").pop()?.payload;
      const negative = started?.previousOutcome === "negative";
      const due = criteriaTalkDeadline(started?.previousAssessmentOn ?? started?.periodStart ?? cycle.period_start, negative);
      const basis = negative ? rules.deadlines.criteriaTalkAfterNegativeDays.basis : rules.deadlines.criteriaTalkDays.basis;
      tasks.push({
        title: `Wyznacz kryteria oceny: ${personById(cycle.person_id)?.name}, do ${formatDate(due)} (${basis})`,
        href: `/cycles/${cycle.id}/part1`,
      });
    }
  }
  const own = openCycle(person.id);
  if (own && part1Status(own.id).state === "submitted") {
    tasks.push({ title: "Potwierdź część I oceny", href: `/cycles/${own.id}/part1` });
  }
  return tasks;
});

function appraiseeIds(appraiserId: string): string[] {
  return (getDb().query("SELECT DISTINCT person_id FROM cycles WHERE appraiser_id = ?").all(appraiserId) as { person_id: string }[]).map((r) => r.person_id);
}

const app = new Hono();

type Ctx = { cycle: Cycle; person: Person };

/** Wspólna kontrola: konto, cykl, uczestnictwo. Zwraca odpowiedź błędu albo kontekst. */
function guard(c: Context, opts: { hrRead?: boolean } = {}): Response | Ctx {
  const person = currentPerson(c);
  if (!person) return c.redirect("/account");
  const cycle = cycleById(c.req.param("id") ?? "");
  if (!cycle) return c.text("Nie ma takiego cyklu.", 404);
  if (!isParty(cycle, person) && !(opts.hrRead && person.role === "hr")) return c.text("Brak uprawnień do tego cyklu.", 403);
  return { cycle, person };
}

function readInput(body: Record<string, unknown>): Part1Input {
  const raw = body.additional;
  const additional = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter((x): x is string => typeof x === "string");
  const expectations: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    const m = /^expectation\[(.+)\]$/.exec(k);
    if (m && typeof v === "string") expectations[m[1]] = v;
  }
  return { additional, expectations };
}

function sheetOf(cycle: Cycle) {
  const kind = personById(cycle.person_id)?.position_kind;
  if (!kind) throw new Error("Brak rodzaju stanowiska");
  return sheetForPosition(kind);
}

function renderPart1(c: Context, cx: Ctx, extra: { errors?: string[]; input?: Part1Input; status?: 200 | 422 | 409 } = {}) {
  const { cycle, person } = cx;
  const status = part1Status(cycle.id);
  const locked = isPart1Locked(cycle.id);
  const submitted = visibleEvents(cycle.id).find((e) => e.type === "part1_submitted");
  const { sheet, basis } = submitted ? { sheet: submitted.payload.sheet as Sheet, basis: sheetOf(cycle).basis } : sheetOf(cycle);
  const mode = cycle.appraiser_id === person.id && !locked ? "edit" : "read";
  const criteria = cycleCriteria(cycle.id);
  const duties: string[] = JSON.parse(personById(cycle.person_id)?.duty_types ?? "[]");
  const selected = extra.input?.additional ?? criteria.filter((x) => x.kind === "additional").map((x) => x.id);
  const expectations = extra.input?.expectations ?? Object.fromEntries(criteria.map((x) => [x.id, x.expectation ?? ""]));
  const deadline = submitted
    ? { label: "Termin przekazany w części I", date: submitted.payload.dueDate as string, basis: submitted.payload.dueDateBasis as string[] }
    : { label: "Termin oceny", ...effectiveDeadline(cycle.id) };
  const confirmed = visibleEvents(cycle.id).find((e) => e.type === "part1_confirmed");
  return c.html(
    <Part1View
      viewer={person}
      today={today()}
      cycleId={cycle.id}
      employeeName={personById(cycle.person_id)?.name ?? ""}
      mode={mode}
      canConfirm={cycle.person_id === person.id && status.state === "submitted"}
      sheet={sheet}
      sheetBasis={basis}
      state={status.state}
      mandatory={criteria.filter((x) => x.kind === "mandatory")}
      additional={criteria.filter((x) => x.kind === "additional")}
      suggestions={suggestCriteria(sheet, duties).items}
      selectable={selectableCriteria(sheet)}
      selected={selected}
      expectations={expectations}
      deadline={deadline}
      confirmation={confirmed ? { name: confirmed.payload.appraiseeName, place: confirmed.payload.place, date: confirmed.date } : undefined}
      links={cycleLinks(cycle, person)}
      errors={extra.errors}
    />,
    extra.status ?? 200,
  );
}

app.get("/cycles/:id", (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  return c.redirect(`/cycles/${g.cycle.id}/part1`, 302);
});

app.get("/cycles/:id/part1", (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  return renderPart1(c, g);
});

const LOCKED = "Część I jest już przekazana. Kryteriów i terminu nie można zmienić.";

async function write(c: Context, submit: boolean) {
  const g = guard(c);
  if (g instanceof Response) return g;
  if (g.cycle.appraiser_id !== g.person.id) return c.text("Tylko bieżący oceniający może wyznaczyć kryteria.", 403);
  if (isPart1Locked(g.cycle.id)) return renderPart1(c, g, { errors: [LOCKED], status: 409 });
  const input = readInput(await c.req.parseBody({ all: true }));
  const res = (submit ? submitPart1 : saveCriteria)(g.cycle.id, g.person.id, input);
  if (!res.ok) return renderPart1(c, g, { errors: res.errors, input, status: 422 });
  return c.redirect(`/cycles/${g.cycle.id}/part1`, 303);
}

app.post("/cycles/:id/part1/criteria", (c) => write(c, false));
app.post("/cycles/:id/part1/submit", (c) => write(c, true));

app.post("/cycles/:id/part1/confirm", (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  if (g.cycle.person_id !== g.person.id) return c.text("Tylko oceniany może potwierdzić część I.", 403);
  const res = confirmPart1(g.cycle.id, g.person.id);
  if (!res.ok) return renderPart1(c, g, { errors: res.errors, status: 409 });
  return c.redirect(`/cycles/${g.cycle.id}/part1`, 303);
});

app.get("/cycles/:id/cards/opening", (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  return c.html(
    <OpeningCardView
      viewer={g.person}
      today={today()}
      cycleId={g.cycle.id}
      card={card("opening")}
      basis={rules.criteriaConversation.basis}
      topics={rules.criteriaConversation.topics}
    />,
  );
});

export default app;
