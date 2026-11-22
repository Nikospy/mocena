import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { getDb } from "../db";
import { isDemoMode } from "../settings";
import { PERSON_COOKIE } from "../people";
import { TOUR_COOKIE } from "../tour/context";
import { applyTourStop, isTourStopId } from "../tour/state";
import { cycleIdOf, stopById, stopScreenPath } from "../tour/stops";
import { TourDone } from "../views/tour-done";
import { TourEntry } from "../views/tour-entry";
import { errorPage } from "../views/error-page";

const app = new Hono();

app.use("/tour/*", (c, next) => isDemoMode() ? next() : errorPage(c, "Ta funkcja działa tylko w trybie pokazu.", 403));

const COOKIE_OPTS = { path: "/", httpOnly: true, sameSite: "Lax" } as const;

app.get("/tour", (c) => c.html(<TourEntry />));

app.get("/tour/done", (c) => {
  return c.html(<TourDone />);
});

app.post("/tour/end", async (c) => {
  const body = await c.req.parseBody();
  deleteCookie(c, TOUR_COOKIE, { path: "/" });
  return c.redirect(body.to === "/account" ? "/account" : "/", 303);
});

// Dodatki wersji 5-minutowej: ustawiają dane, konto i datę, zdejmują przewodnik i otwierają ekran.
app.post("/tour/extra/:id", (c) => {
  const id = c.req.param("id");
  const db = getDb();
  let personId: string;
  let path: string;
  if (id === "ewa-timeline") {
    const stop = stopById("5b");
    if (!stop) return errorPage(c, "Nie ma takiego kroku pokazu.", 404, <a href="/tour">Wróć do pokazu</a>);
    applyTourStop(db, stop);
    const ewa = cycleIdOf("ewa");
    if (!ewa) return errorPage(c, "Nie ma takiego kroku pokazu.", 404, <a href="/tour">Wróć do pokazu</a>);
    personId = "joanna";
    path = `/cycles/${ewa}/timeline`;
  } else if (id === "fiction") {
    const stop = stopById("5");
    if (!stop) return errorPage(c, "Nie ma takiego kroku pokazu.", 404, <a href="/tour">Wróć do pokazu</a>);
    applyTourStop(db, stop);
    const piotr = cycleIdOf("piotr");
    if (!piotr) return errorPage(c, "Nie ma takiego kroku pokazu.", 404, <a href="/tour">Wróć do pokazu</a>);
    personId = "marek";
    path = `/cycles/${piotr}/assessment/fiction`;
  } else if (id === "sources") {
    personId = "admin";
    path = "/admin/suggestion-sources";
  } else {
    return errorPage(c, "Nie ma takiego kroku pokazu.", 404, <a href="/tour">Wróć do pokazu</a>);
  }
  deleteCookie(c, TOUR_COOKIE, { path: "/" });
  setCookie(c, PERSON_COOKIE, personId, COOKIE_OPTS);
  return c.redirect(path, 303);
});

app.post("/tour/:stop", (c) => {
  const id = c.req.param("stop");
  const stop = isTourStopId(id) ? stopById(id) : null;
  if (!stop) return errorPage(c, "Nie ma takiego kroku pokazu.", 404, <a href="/tour">Wróć do pokazu</a>);
  applyTourStop(getDb(), stop);
  setCookie(c, PERSON_COOKIE, stop.personId, COOKIE_OPTS);
  setCookie(c, TOUR_COOKIE, stop.id, COOKIE_OPTS);
  return c.redirect(stopScreenPath(stop), 303);
});

export default app;
