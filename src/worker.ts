import { DurableObject } from "cloudflare:workers";
import { createSchema, withDb, type Db } from "./db";
import { durableObjectDb } from "./do-sql";
import app from "./index";
import { PERSON_COOKIE } from "./people";
import { runSeed } from "./seed";

const SESSION_COOKIE = "mocena_demo";

type Env = { DEMO_SESSION: DurableObjectNamespace<DemoSession> };

export class DemoSession extends DurableObject<Env> {
  private db: Db;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.db = durableObjectDb(ctx.storage);
    ctx.blockConcurrencyWhile(async () => {
      const seeded = ctx.storage.sql
        .exec("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'people'")
        .one().n;
      if (seeded) return;
      withDb(this.db, () => {
        createSchema(this.db);
        runSeed(this.db, { liveStep2: true });
      });
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
