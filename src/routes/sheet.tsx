import { Hono } from "hono";
import "../hr/links";
import { cycleLinks } from "../cycle-links";
import { cycleById } from "../cycles";
import { visibleEvents } from "../events";
import { canViewSheet, sheetData } from "../hr/sheet-data";
import { currentPerson } from "../people";
import { today } from "../settings";
import { SheetView } from "../views/sheet";

const app = new Hono();

app.get("/cycles/:id/sheet", (c) => {
  const person = currentPerson(c);
  if (!person) return c.redirect("/account");
  const cycle = cycleById(c.req.param("id"));
  if (!cycle || !visibleEvents(cycle.id).some((e) => e.type === "cycle_started")) return c.text("Nie ma takiego cyklu.", 404);
  if (!canViewSheet(person, cycle)) return c.text("Ten arkusz widzi oceniany, oceniający i kadry.", 403);
  const data = sheetData(cycle.id, c.req.query("part") === "1" ? { part: 1 } : {});
  return c.html(<SheetView viewer={person} today={today()} data={data} links={cycleLinks(cycle, person)} />);
});

export default app;
