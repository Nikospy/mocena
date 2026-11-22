import { Hono } from "hono";
import "../hr/links";
import { cycleById } from "../cycles";
import { assessmentHistory, canViewHistory } from "../hr/history";
import { canViewSheet } from "../hr/sheet-data";
import { currentPerson, personById } from "../people";
import { today } from "../settings";
import { HistoryView } from "../views/history";

const app = new Hono();

app.get("/people/:id/history", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const person = personById(c.req.param("id"));
  if (!person) return c.text("Nie ma takiej osoby.", 404);
  if (!canViewHistory(viewer, person.id)) return c.text("Historię ocen widzi ta osoba, jej oceniający i kadry.", 403);
  const entries = assessmentHistory(person.id).map((h) => ({ ...h, canOpenSheet: canViewSheet(viewer, cycleById(h.cycleId)!) }));
  return c.html(<HistoryView viewer={viewer} today={today()} person={person} entries={entries} />);
});

export default app;
