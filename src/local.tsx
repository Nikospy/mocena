import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { ensureDefaultDb } from "./db-bun";
import app from "./index";

// Bun-only entry: static files from ./public (on Workers they come from the assets binding).
const local = new Hono();
local.use("/*", async (_c, next) => {
  ensureDefaultDb();
  await next();
});
local.use("/*", serveStatic({ root: "./public" }));
local.route("/", app);

export default local;
