import { Hono } from "hono";
import "../hr/links";
import { cycleLinks } from "../cycle-links";
import { getDb } from "../db";
import { visibleEvents } from "../events";
import { cycleState } from "../hr/cycle-state";
import { mandatoryGradeOf } from "../hr/history";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { HrOverviewView, type StateRow } from "../views/hr-overview";
import type { Cycle } from "../cycles";

const app = new Hono();

/** Najnowszy widoczny cykl każdej osoby. */
function latestCycles(): Cycle[] {
  const all = getDb().query("SELECT * FROM cycles ORDER BY period_start DESC, id DESC").all() as Cycle[];
  const seen = new Set<string>();
  const out: Cycle[] = [];
  for (const c of all) {
    if (seen.has(c.person_id)) continue;
    if (!visibleEvents(c.id).some((e) => e.type === "cycle_started")) continue;
    seen.add(c.person_id);
    out.push(c);
  }
  return out;
}

export function overviewData(viewer: Person) {
  const rows: StateRow[] = latestCycles().map((c) => ({
    cycleId: c.id,
    personName: personById(c.person_id)?.name ?? c.person_id,
    appraiserName: personById(c.appraiser_id)?.name ?? c.appraiser_id,
    sheet: c.sheet,
    state: cycleState(c.id),
    today: today(),
    links: cycleLinks(c, viewer),
  }));
  rows.sort((a, b) => (a.state.deadline?.date ?? "9999").localeCompare(b.state.deadline?.date ?? "9999") || a.personName.localeCompare(b.personName));
  const people = getDb().query("SELECT id, name FROM people WHERE appointed = 1 ORDER BY name").all() as { id: string; name: string }[];
  const cards = people.flatMap((p) => {
    const grade = mandatoryGradeOf(p.id);
    return grade ? [{ personId: p.id, personName: p.name, grade }] : [];
  });
  return { rows, cards };
}

app.get("/hr", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "hr") return c.text("Ten ekran widzą kadry.", 403);
  const { rows, cards } = overviewData(viewer);
  return c.html(<HrOverviewView viewer={viewer} today={today()} cards={cards} rows={rows} />);
});

export default app;
