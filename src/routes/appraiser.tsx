import { Hono, type Context } from "hono";
import { visibleCycleById, openCycle, type Cycle } from "../cycles";
import { getDb } from "../db";
import { rules } from "../engine/rules";
import { recordEvent } from "../events";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { AppraiserChangeFormView } from "../views/appraiser-change-form";

const app = new Hono();

type Ctx = { viewer: Person; cycle: Cycle };

function guard(c: Context): Response | Ctx {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id") ?? "");
  if (!cycle) return c.text("Nie ma takiego cyklu.", 404);
  if (viewer.role !== "hr") return c.text("Oceniającego zmieniają kadry.", 403);
  return { viewer, cycle };
}

const isOpen = (cycle: Cycle) => openCycle(cycle.person_id)?.id === cycle.id;

function candidates(cycle: Cycle): Person[] {
  return getDb()
    .query("SELECT * FROM people WHERE role = 'appraiser' AND id <> ? AND id <> ? ORDER BY name")
    .all(cycle.appraiser_id, cycle.person_id) as Person[];
}

function render(c: Context, cx: Ctx, error?: string, status: 200 | 422 = 200) {
  const criteria = (getDb().query("SELECT criterion_id AS id FROM cycle_criteria WHERE cycle_id = ? ORDER BY rowid").all(cx.cycle.id) as { id: string }[]).map((r) => ({
    id: r.id,
    name: rules.criteria.find((k) => k.id === r.id)?.name ?? r.id,
  }));
  return c.html(
    <AppraiserChangeFormView
      viewer={cx.viewer}
      today={today()}
      cycleId={cx.cycle.id}
      personName={personById(cx.cycle.person_id)?.name ?? cx.cycle.person_id}
      currentName={personById(cx.cycle.appraiser_id)?.name ?? cx.cycle.appraiser_id}
      candidates={candidates(cx.cycle)}
      criteria={criteria}
      error={error}
      selected={c.req.query("to")}
    />,
    status,
  );
}

app.get("/cycles/:id/appraiser", (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  return render(c, g);
});

app.post("/cycles/:id/appraiser", async (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  const { viewer, cycle } = g;
  if (!isOpen(cycle)) return c.text("Cykl jest zamknięty, oceniającego nie zmienia się.", 409);
  const body = await c.req.parseBody();
  const to = typeof body.appraiser_id === "string" ? body.appraiser_id : "";
  if (!candidates(cycle).some((p) => p.id === to)) return render(c, g, "Wybierz nowego oceniającego z listy", 422);
  getDb().transaction(() => {
    recordEvent("appraiser_changed", cycle.id, viewer.id, { from_id: cycle.appraiser_id, to_id: to });
    getDb().query("UPDATE cycles SET appraiser_id = ? WHERE id = ?").run(to, cycle.id);
  })();
  return c.redirect(`/cycles/${cycle.id}/timeline`, 303);
});

export default app;
