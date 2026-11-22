import { Hono } from "hono";
import "../hr/links";
import { cycleLinks } from "../cycle-links";
import { visibleCycleById } from "../cycles";
import { canViewSheet, sheetData } from "../hr/sheet-data";
import { currentPerson } from "../people";
import { today } from "../settings";
import { SheetView } from "../views/sheet";
import { errorPage } from "../views/error-page";

const app = new Hono();

app.get("/cycles/:id/sheet", (c) => {
  const person = currentPerson(c);
  if (!person) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id"));
  if (!cycle) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  if (!canViewSheet(person, cycle)) return errorPage(c, "Ten arkusz widzą oceniany, jego oceniający i kadry.", 403);
  const data = sheetData(cycle.id, c.req.query("part") === "1" ? { part: 1 } : {});
  return c.html(<SheetView viewer={person} today={today()} data={data} links={cycleLinks(cycle, person)} autoPrint={c.req.query("print") === "1"} />);
});

export default app;
