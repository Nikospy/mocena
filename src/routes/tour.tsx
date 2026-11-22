import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { getDb } from "../db";
import { PERSON_COOKIE } from "../people";
import { TOUR_COOKIE } from "../tour/context";
import { applyTourStop, isTourStopId } from "../tour/state";
import { cycleIdOf, stopById, stopScreenPath } from "../tour/stops";
import { TourDone } from "../views/tour-done";
import { TourEntry } from "../views/tour-entry";

const app = new Hono();

const COOKIE_OPTS = { path: "/", httpOnly: true, sameSite: "Lax" } as const;

app.get("/tour", (c) => c.html(<TourEntry />));

app.get("/tour/done", (c) => {
  const ewa = cycleIdOf("ewa");
  return c.html(<TourDone ewaTimeline={ewa ? `/cycles/${ewa}/timeline` : null} />);
});

app.post("/tour/end", async (c) => {
  const body = await c.req.parseBody();
  deleteCookie(c, TOUR_COOKIE, { path: "/" });
  return c.redirect(body.to === "/account" ? "/account" : "/", 303);
});

app.post("/tour/:stop", (c) => {
  const id = c.req.param("stop");
  const stop = isTourStopId(id) ? stopById(id) : null;
  if (!stop) return c.text("Nie ma takiego przystanku.", 404);
  applyTourStop(getDb(), stop);
  setCookie(c, PERSON_COOKIE, stop.personId, COOKIE_OPTS);
  setCookie(c, TOUR_COOKIE, stop.id, COOKIE_OPTS);
  return c.redirect(stopScreenPath(stop), 303);
});

export default app;
