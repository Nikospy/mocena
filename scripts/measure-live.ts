// Pomiar szybkości żywej strony: bun run scripts/measure-live.ts [BASE_URL] [--runs N]
import { readdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const runsAt = args.indexOf("--runs");
const runs = runsAt >= 0 ? Number(args[runsAt + 1]) : 5;
const base = (args.find((a, i) => !a.startsWith("--") && i !== runsAt + 1) ?? "http://localhost:8787").replace(/\/$/, "");
if (!Number.isInteger(runs) || runs < 1) throw new Error("--runs musi być liczbą całkowitą >= 1");

const font = readdirSync(join(import.meta.dir, "..", "public", "fonts")).find((f) => f.endsWith(".woff2"));
if (!font) throw new Error("brak fontu w public/fonts");

class Jar {
  private cookies = new Map<string, string>();
  header(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  store(res: Response) {
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(";");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value === "" || /max-age=0/i.test(line)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  // Ręczne podążanie za przekierowaniami z przenoszeniem Set-Cookie.
  async request(path: string, method = "GET"): Promise<Response> {
    let url = new URL(path, base + "/").toString();
    let m = method;
    for (let hop = 0; hop < 10; hop++) {
      const res = await fetch(url, { method: m, headers: { cookie: this.header() }, redirect: "manual" });
      this.store(res);
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        url = new URL(loc, url).toString();
        m = "GET";
        await res.arrayBuffer();
        continue;
      }
      await res.arrayBuffer();
      return res;
    }
    throw new Error(`za dużo przekierowań: ${path}`);
  }
}

type Sample = { ms: number[]; status: number; cache: string };
const names = ["GET / (nowa sesja)", "POST /tour/1", "POST /tour/4", "POST /tour/5b", "GET /style.css", `GET /fonts/${font}`];
const samples = new Map<string, Sample>(names.map((n) => [n, { ms: [], status: 0, cache: "" }]));

async function time(name: string, jar: Jar, path: string, method = "GET") {
  const t = performance.now();
  const res = await jar.request(path, method);
  const s = samples.get(name)!;
  s.ms.push(performance.now() - t);
  s.status = res.status;
  s.cache = res.headers.get("cache-control") ?? "";
}

for (let i = 0; i < runs; i++) {
  const jar = new Jar();
  await time(names[0], jar, "/");
  await time(names[1], jar, "/tour/1", "POST");
  await time(names[2], jar, "/tour/4", "POST");
  await time(names[3], jar, "/tour/5b", "POST");
  await time(names[4], jar, "/style.css");
  await time(names[5], jar, `/fonts/${font}`);
}

const pct = (a: number[], p: number) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};
console.log(`Pomiar ${base}, przebiegi: ${runs}`);
console.table(
  names.map((n) => {
    const s = samples.get(n)!;
    return {
      pomiar: n,
      "mediana ms": Math.round(pct(s.ms, 50)),
      "p90 ms": Math.round(pct(s.ms, 90)),
      status: s.status,
      "cache-control": s.cache,
    };
  }),
);
