// Nagrywa przewodnik pokazu mOceny jako film ok. 90 s (webm z Playwrighta, potem mp4 przez ffmpeg).
// Użycie: bun run scripts/record-demo.ts [BASE_URL] [--out docs/video/mocena-demo.mp4]
// Playwright: import "playwright" albo ścieżka z PLAYWRIGHT_PATH.
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const out = resolve(outIdx >= 0 ? (args[outIdx + 1] ?? "") : "docs/video/mocena-demo.mp4");
const base = (args.find((a, i) => !a.startsWith("--") && i !== outIdx + 1) ?? "http://localhost:4711").replace(/\/$/, "");
const FFMPEG = process.env.FFMPEG ?? (await Bun.file("/opt/homebrew/bin/ffmpeg").exists() ? "/opt/homebrew/bin/ffmpeg" : "ffmpeg");

async function loadPlaywright(): Promise<any> {
  try {
    return await import("playwright");
  } catch (e) {
    const p = process.env.PLAYWRIGHT_PATH;
    if (!p) throw new Error("Brak pakietu playwright; ustaw PLAYWRIGHT_PATH na plik index.mjs");
    return await import(p);
  }
}
const pw = await loadPlaywright();
const chromium = pw.chromium ?? pw.default?.chromium;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const STOPS = ["1", "1b", "2", "3", "4", "5", "5b"];
const HOLD_MS = 10_000;

const tmp = mkdtempSync(join(tmpdir(), "mocena-rec-"));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "pl-PL",
  recordVideo: { dir: tmp, size: { width: 1440, height: 900 } },
});
const page = await ctx.newPage();
page.setDefaultTimeout(5000);

async function step(name: string, fn: () => Promise<void>) {
  try { await fn(); } catch (e) { console.warn(`[pominięto] ${name}: ${String(e).split("\n")[0]}`); }
}

async function smoothScrollToLook() {
  await page.evaluate(async () => {
    const el = document.querySelector("[data-look]") as HTMLElement | null;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 160;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    await new Promise((r) => setTimeout(r, 900));
  });
}

async function tryAction(id: string) {
  if (id === "1") {
    for (const name of ["Orientacja na klienta", "Myślenie analityczne"]) {
      await step(`zaznacz ${name}`, async () => {
        const l = page.locator("label.cb", { hasText: name }).first();
        await l.scrollIntoViewIfNeeded();
        await l.click();
        await wait(800);
      });
    }
  } else if (id === "4") {
    await step("ocena 1 przy Rzetelności", async () => {
      const l = page.locator('[role="radiogroup"][aria-label*="Rzetelność"] label:has(input[value="1"])').first();
      await l.scrollIntoViewIfNeeded();
      await l.click();
      await wait(800);
    });
  } else if (id === "5") {
    await step("potwierdzenie zapoznania", async () => {
      const b = page.getByRole("button", { name: "Potwierdzam zapoznanie z oceną" }).first();
      await b.scrollIntoViewIfNeeded();
      await b.click();
      await page.waitForLoadState("load");
      await wait(500);
    });
  }
}

const t0 = Date.now();
await page.goto(`${base}/tour`);
await wait(5000);
await step("Rozpocznij pokaz", async () => {
  await page.getByRole("button", { name: /Rozpocznij pokaz/ }).first().click();
  await page.waitForLoadState("load");
});

for (const id of STOPS) {
  console.log(`przystanek ${id}`);
  await step(`load ${id}`, () => page.waitForLoadState("load"));
  await wait(800);
  await step(`scroll ${id}`, smoothScrollToLook);
  const holdStart = Date.now();
  await wait(5000);
  await tryAction(id);
  const left = HOLD_MS - (Date.now() - holdStart);
  if (left > 0) await wait(left);
  await step(`Dalej ${id}`, async () => {
    await page.locator("[data-tour-next] button:visible").first().click();
    await page.waitForLoadState("load");
  });
}
console.log("koniec: /tour/done");
await wait(5000);

await ctx.close(); // zapisuje wideo
await browser.close();
const webm = readdirSync(tmp).find((f) => f.endsWith(".webm"));
if (!webm) throw new Error("Brak pliku wideo");
mkdirSync(dirname(out), { recursive: true });
const ff = Bun.spawnSync([FFMPEG, "-y", "-loglevel", "error", "-i", join(tmp, webm), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23", "-preset", "veryfast", "-movflags", "+faststart", out]);
if (ff.exitCode !== 0) throw new Error(`ffmpeg: ${ff.stderr.toString()}`);
rmSync(tmp, { recursive: true, force: true });
const probe = Bun.spawnSync(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]);
const dur = parseFloat(probe.stdout.toString()) || (Date.now() - t0) / 1000;
console.log(`Gotowe: ${out} (${dur.toFixed(1)} s)`);
