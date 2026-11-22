import { Database } from "bun:sqlite";
import { Hono } from "hono";
import { createSchema, withDb, type Db } from "./db";
import app, { notFoundHandler } from "./index";
import { PERSON_COOKIE } from "./people";
import { runSeed } from "./seed";

// Vercel entry (Bun runtime). Each demo visitor gets an in-memory database keyed by a session cookie,
// so nothing is written to paid or rate-limited storage. Static files from ./public are served by Vercel.
// A session lives as long as the function instance; a new instance starts the demo again from the seed.

const SESSION_COOKIE = "mocena_demo";
const MAX_SESSIONS = 300;
const sessions = new Map<string, Db>();

function sessionDb(sid: string): Db {
  let db = sessions.get(sid);
  if (db) {
    sessions.delete(sid);
    sessions.set(sid, db); // most recently used goes last
    return db;
  }
  db = new Database(":memory:") as unknown as Db;
  const fresh = db;
  withDb(fresh, () => {
    createSchema(fresh);
    runSeed(fresh, { liveStep2: true });
  });
  sessions.set(sid, db);
  while (sessions.size > MAX_SESSIONS) sessions.delete(sessions.keys().next().value!);
  return db;
}

function sessionCookie(sid: string): string {
  return `${SESSION_COOKIE}=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

const inner = new Hono();
inner.route("/", app);
inner.notFound(notFoundHandler);
inner.onError(app.errorHandler);

export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const cookies = request.headers.get("Cookie") ?? "";
  const existing = cookies.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([\\w-]+)`))?.[1];

  if (url.pathname === "/demo/restart" && request.method === "POST") {
    if (existing) sessions.delete(existing);
    const headers = new Headers({ Location: "/account" });
    headers.append("Set-Cookie", sessionCookie(crypto.randomUUID()));
    headers.append("Set-Cookie", `${PERSON_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    return new Response(null, { status: 303, headers });
  }

  const sid = existing ?? crypto.randomUUID();
  const db = sessionDb(sid);
  const res = await withDb(db, () => inner.fetch(request));
  if (existing) return res;
  const out = new Response(res.body, res);
  out.headers.append("Set-Cookie", sessionCookie(sid));
  return out;
}
