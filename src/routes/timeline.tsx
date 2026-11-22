import { Hono } from "hono";
import { cycleLinks } from "../cycle-links";
import { visibleCycleById, openCycle } from "../cycles";
import { currentPerson, personById } from "../people";
import { today } from "../settings";
import { buildTimeline, canRecordAbsence, canViewTimeline, timelineRulesVersion } from "../timeline";
import { TimelineView } from "../views/timeline";

const app = new Hono();

/** Na osi własnego cyklu oceniany zawsze widzi drogę do wniosku o zmianę terminu (art. 81 ust. 8 pkt 4 ustawy). */
const deadlineLinks = (cycle: Parameters<typeof cycleLinks>[0], viewer: Parameters<typeof cycleLinks>[1]) =>
  cycleLinks(cycle, viewer).filter((l) => l.href.includes("/deadline-change"));

app.get("/cycles/:id/timeline", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id"));
  if (!cycle) return c.text("Nie ma takiego cyklu.", 404);
  if (!canViewTimeline(viewer, cycle)) return c.text("Oś czasu widzi oceniany, jego oceniający i kadry.", 403);
  const person = personById(cycle.person_id);
  const saved = c.req.query("saved");
  const notices: Record<string, string> = {
    extended: `Zapisano. Nowy termin oceny widzą: ${personById(cycle.appraiser_id)?.name} (oceniający), ${person?.name} (oceniany).`,
    unchanged: "Zapisano. Termin oceny się nie zmienił.",
    approved: "Zapisano. Ocena jest już zatwierdzona, jej termin się nie zmienia.",
  };
  return c.html(
    <TimelineView
      viewer={viewer}
      today={today()}
      cycleId={cycle.id}
      personName={person?.name ?? cycle.person_id}
      entries={buildTimeline(cycle.id, viewer)}
      rulesVersion={timelineRulesVersion(cycle.id)}
      notice={viewer.role === "hr" && saved ? notices[saved] : undefined}
      canAddAbsence={canRecordAbsence(viewer, cycle) && openCycle(cycle.person_id)?.id === cycle.id}
      links={viewer.id === cycle.person_id ? deadlineLinks(cycle, viewer) : []}
    />,
  );
});

export default app;
