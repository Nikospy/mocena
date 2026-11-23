import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { ensureDefaultDb } from "./db-bun";
import app, { notFoundHandler } from "./index";

// Bun-only entry: static files from ./public (on Workers they come from the assets binding).
const local = new Hono();
local.use("/*", async (_c, next) => {
  try {
    ensureDefaultDb();
  } catch (error) {
    // A broken database file must not turn the health check into an HTML 500.
    if (new URL(_c.req.url).pathname !== "/healthz") throw error;
    return _c.json({ status: "error", db: "error" }, 503);
  }
  await next();
});
local.use("/*", serveStatic({ root: "./public" }));
local.route("/", app);
local.notFound(notFoundHandler);
local.onError(app.errorHandler);

export default Object.assign(local, { hostname: "127.0.0.1" });
