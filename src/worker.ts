import { DurableObject } from "cloudflare:workers";
import { createSchema, withDb, type Db } from "./db";
import { durableObjectDb } from "./do-sql";
import app from "./index";
import { PERSON_COOKIE } from "./people";
import { runSeed } from "./seed";

const SESSION_COOKIE = "mocena_demo";

type Env = { DEMO_SESSION: DurableObjectNamespace<DemoSession>; CF_VERSION_METADATA?: { id: string } };

export class DemoSession extends DurableObject<Env> {
  private db: Db;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.db = durableObjectDb(ctx.storage);
    // A session started on an older deployment keeps its old schema and data.
    // Each deployment has its own version id; on mismatch the session is rebuilt.
    const version = env.CF_VERSION_METADATA?.id ?? "dev";
    ctx.blockConcurrencyWhile(async () => {
      const sql = ctx.storage.sql;
      const hasMeta = sql.exec("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'deploy_meta'").one().n;
      const stored = hasMeta ? (sql.exec("SELECT value FROM deploy_meta WHERE key = 'version'").toArray()[0]?.value ?? null) : null;
      if (stored === version) return;
      await ctx.storage.deleteAll();
      withDb(this.db, () => {
        createSchema(this.db);
        runSeed(this.db, { liveStep2: true });
      });
      sql.exec("CREATE TABLE IF NOT EXISTS deploy_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
      sql.exec("INSERT OR REPLACE INTO deploy_meta (key, value) VALUES ('version', ?)", version);
    });
  }

  async fetch(request: Request): Promise<Response> {
    return withDb(this.db, () => app.fetch(request));
  }
}

function sessionCookie(sid: string): string {
  return `${SESSION_COOKIE}=${sid}; Path=/; HttpOnly; SameSite=Lax`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cookies = request.headers.get("Cookie") ?? "";
    const existing = cookies.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([\\w-]+)`))?.[1];

    // Health check: answered by a fixed Durable Object (its name cannot match the cookie pattern), so it needs no cookie and creates no visitor session.
    if (url.pathname === "/healthz" && (request.method === "GET" || request.method === "HEAD")) {
      return env.DEMO_SESSION.get(env.DEMO_SESSION.idFromName("internal:healthz")).fetch(request);
    }

    if (url.pathname === "/demo/restart" && request.method === "POST") {
      const headers = new Headers({ Location: "/account" });
      headers.append("Set-Cookie", sessionCookie(crypto.randomUUID()));
      headers.append("Set-Cookie", `${PERSON_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
      return new Response(null, { status: 303, headers });
    }

    const sid = existing ?? crypto.randomUUID();
    const res = await env.DEMO_SESSION.get(env.DEMO_SESSION.idFromName(sid)).fetch(request);
    if (existing) return res;
    const out = new Response(res.body, res);
    out.headers.append("Set-Cookie", sessionCookie(sid));
    return out;
  },
};
