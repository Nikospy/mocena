import { previousAssessments } from "../hr/people";
import { Hono } from "hono";
import "../hr/links";
import { cycleById } from "../cycles";
import { assessmentHistory, canViewHistory } from "../hr/history";
import { canViewSheet } from "../hr/sheet-data";
import { currentPerson, personById } from "../people";
import { today } from "../settings";
import { HistoryView } from "../views/history";
import { errorPage } from "../views/error-page";

const app = new Hono();

app.get("/people/:id/history", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const person = personById(c.req.param("id"));
  if (!person) return errorPage(c, "Nie ma takiej osoby w danych urzędu.", 404);
  if (!canViewHistory(viewer, person.id)) return errorPage(c, "Historię ocen widzą ta osoba, jej oceniający i kadry.", 403);
  const entries = assessmentHistory(person.id).map((h) => ({ ...h, canOpenSheet: canViewSheet(viewer, cycleById(h.cycleId)!) }));
  return c.html(<HistoryView viewer={viewer} today={today()} person={person} entries={entries} previous={previousAssessments(person.id)} />);
});

export default app;
