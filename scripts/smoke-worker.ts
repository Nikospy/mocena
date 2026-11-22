import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const STARTUP_TIMEOUT_MS = 90_000;

async function freePort(): Promise<number> {
  const server = Bun.listen({ hostname: "127.0.0.1", port: 0, socket: { data() {} } });
  const port = server.port;
  server.stop(true);
  return port;
}

class Jar {
  private cookies = new Map<string, string>();

  async request(base: string, path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.cookies.size) {
      headers.set("Cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    }
    const res = await fetch(base + path, { ...init, headers, redirect: "manual" });
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(";");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a));
      if (expired || value === "") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return res;
  }

  post(base: string, path: string, fields: Record<string, string>) {
    return this.request(base, path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString(),
    });
  }
}

let failed = 0;
function report(name: string, ok: boolean, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}${!ok && detail ? ` (${detail})` : ""}`);
}

async function check(name: string, fn: () => Promise<string | null>) {
  try {
    const problem = await fn();
    report(name, problem === null, problem ?? "");
  } catch (e) {
    report(name, false, String(e));
  }
}

const stateDir = mkdtempSync(join(tmpdir(), "mocena-smoke-"));
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
let output = "";
const wranglerBin = join(import.meta.dir, "..", "node_modules", ".bin", "wrangler");
const child = spawn(
  wranglerBin,
  ["dev", "--port", String(port), "--ip", "127.0.0.1", "--persist-to", stateDir],
  { detached: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, CI: "1", WRANGLER_SEND_METRICS: "false" } },
);
child.stdout.on("data", (d) => (output += d));
child.stderr.on("data", (d) => (output += d));
let exited = false;
child.on("exit", () => (exited = true));

function cleanup() {
  if (child.pid && !exited) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {}
  }
  rmSync(stateDir, { recursive: true, force: true });
}
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    cleanup();
    process.exit(1);
  });
}

try {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let ready = false;
  while (Date.now() < deadline && !exited) {
    try {
      const res = await fetch(`${base}/account`, { redirect: "manual" });
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await Bun.sleep(500);
  }
  report("wrangler dev odpowiada", ready, exited ? "proces zakończył się" : "przekroczono czas");
  if (!ready) {
    console.log(`--- koniec wyjścia wranglera ---\n${output.slice(-3000)}`);
    cleanup();
    process.exit(1);
  }

  if (ready) {
    const a = new Jar();
    const b = new Jar();

    await check("GET /account: Wybierz konto", async () => {
      const res = await new Jar().request(base, "/account");
      const text = await res.text();
      return res.status === 200 && text.includes("Wybierz konto") ? null : `status ${res.status}`;
    });

    for (const [label, jar] of [["A", a], ["B", b]] as const) {
      await check(`sesja ${label}: POST /account marek + GET /`, async () => {
        const login = await jar.post(base, "/account", { person_id: "marek" });
        if (login.status < 300 || login.status >= 400) return `POST status ${login.status}`;
        const res = await jar.request(base, "/");
        const text = await res.text();
        return res.status === 200 && text.includes("Sprawy do załatwienia") ? null : `GET / status ${res.status}`;
      });
    }

    await check("GET /style.css", async () => {
      const res = await a.request(base, "/style.css");
      await res.arrayBuffer();
      return res.status === 200 ? null : `status ${res.status}`;
    });

    await check("sesja A: POST /demo/date 2026-03-11 → 303, data w nagłówku", async () => {
      const res = await a.post(base, "/demo/date", { date: "2026-03-11" });
      if (res.status !== 303) return `status ${res.status}`;
      const text = await (await a.request(base, "/")).text();
      return text.includes("11 marca 2026") ? null : "brak „11 marca 2026”";
    });

    await check("sesja B: data bez zmian (9 grudnia 2024)", async () => {
      const text = await (await b.request(base, "/")).text();
      if (!text.includes("9 grudnia 2024")) return "brak „9 grudnia 2024”";
      if (text.includes("11 marca 2026")) return "wyciek daty z sesji A";
      if (/<input[^>]*type="date"/.test(text) && !text.includes('min="2024-12-09"')) return "brak min=2024-12-09";
      return null;
    });
  }
} catch (e) {
  report("skrypt", false, String(e));
} finally {
  if (failed) console.log(`--- wyjście wranglera ---\n${output.slice(-3000)}`);
  cleanup();
}

console.log(failed ? `${failed} FAIL` : "Wszystko OK");
process.exit(failed ? 1 : 0);
