import { Hono, type Context } from "hono";
import { assessmentState } from "../assessment/state";
import { registerCycleLinks } from "../cycle-links";
import { openCycle, visibleCycleById, type Cycle } from "../cycles";
import { recordEvent, visibleEvents } from "../events";
import { registerHomeTasks } from "../home-tasks";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { errorPage } from "../views/error-page";
import { SelfPrepView, type SelfPrepData } from "../views/self-prep";

/** Ostatni widoczny wkład ocenianego przed rozmową w danym cyklu (zdarzenie `appraisee_prep_saved`). */
export function latestSelfPrep(cycleId: string): (SelfPrepData & { savedOn: string }) | null {
  const ev = visibleEvents(cycleId).filter((e) => e.type === "appraisee_prep_saved").pop();
  if (!ev) return null;
  const achievements = typeof ev.payload?.achievements === "string" ? ev.payload.achievements.trim() : "";
  const topics = typeof ev.payload?.topics === "string" ? ev.payload.topics.trim() : "";
  if (!achievements && !topics) return null;
  return { achievements, topics, savedOn: ev.date };
}

registerCycleLinks((cycle, person) =>
  person.id === cycle.person_id && !assessmentState(cycle.id).snapshot
    ? [{ label: "Przygotuj się do rozmowy", href: `/cycles/${cycle.id}/self-prep` }]
    : [],
);

registerHomeTasks((person) => {
  const own = openCycle(person.id);
  if (!own || assessmentState(own.id).snapshot) return [];
  return [
    {
      title: "Przygotuj się do rozmowy z oceniającym",
      detail: "Zapisz swoje najważniejsze osiągnięcia oraz tematy i uwagi do rozmowy. Wpis nie trafia automatycznie do arkusza.",
      href: `/cycles/${own.id}/self-prep`,
      standing: true,
    },
  ];
});

const app = new Hono();

function guard(c: Context): { viewer: Person; cycle: Cycle; appraiserName: string } | Response {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id") ?? "");
  if (!cycle) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  if (viewer.id !== cycle.person_id) return errorPage(c, "Przygotowanie do rozmowy uzupełnia wyłącznie oceniany.", 403);
  const appraiserName = personById(cycle.appraiser_id)?.name ?? cycle.appraiser_id;
  return { viewer, cycle, appraiserName };
}

app.get("/cycles/:id/self-prep", (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  const current = latestSelfPrep(g.cycle.id);
  const locked = assessmentState(g.cycle.id).snapshot !== null;
  return c.html(
    <SelfPrepView
      viewer={g.viewer}
      today={today()}
      cycleId={g.cycle.id}
      appraiserName={g.appraiserName}
      values={current ?? { achievements: "", topics: "" }}
      locked={locked}
      saved={c.req.query("saved") === "1"}
    />,
  );
});

app.post("/cycles/:id/self-prep", async (c) => {
  const g = guard(c);
  if (g instanceof Response) return g;
  if (assessmentState(g.cycle.id).snapshot !== null) {
    return errorPage(c, "Ocena jest już zatwierdzona — przygotowanie do rozmowy jest zamknięte.", 409);
  }
  const body = await c.req.parseBody();
  const achievements = typeof body.achievements === "string" ? body.achievements.trim() : "";
  const topics = typeof body.topics === "string" ? body.topics.trim() : "";
  const errors: Record<string, string> = {};
  if (!achievements && !topics) {
    errors.achievements = "Wpisz co najmniej jedno pole: najważniejsze osiągnięcia albo tematy i uwagi do rozmowy.";
  }
  if (achievements.length > 2000) errors.achievements = "Pole osiągnięć może mieć najwyżej 2000 znaków.";
  if (topics.length > 2000) errors.topics = "Pole tematów i uwag może mieć najwyżej 2000 znaków.";
  if (Object.keys(errors).length > 0) {
    return c.html(
      <SelfPrepView
        viewer={g.viewer}
        today={today()}
        cycleId={g.cycle.id}
        appraiserName={g.appraiserName}
        values={{ achievements: typeof body.achievements === "string" ? body.achievements : "", topics: typeof body.topics === "string" ? body.topics : "" }}
        locked={false}
        errors={errors}
      />,
      422,
    );
  }
  recordEvent("appraisee_prep_saved", g.cycle.id, g.viewer.id, { achievements, topics });
  return c.redirect(`/cycles/${g.cycle.id}/self-prep?saved=1`, 303);
});

export default app;
