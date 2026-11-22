// Okładka zgłoszenia 4:3 z docs/pitch/cover.html: każdy wariant (#a, #b) jako PNG 1600 × 1200 px.
// Playwright jak w scripts/pitch-pdf.ts:
//   PLAYWRIGHT_MODULE=<katalog>/node_modules/playwright/index.mjs bun run scripts/pitch-cover.ts
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dir, "..");
const html = pathToFileURL(join(root, "docs", "pitch", "cover.html")).href;
const pw = (await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")) as { chromium: { launch(): Promise<any> } };

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 2 });
await page.goto(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
for (const id of ["a", "b"]) {
  const out = join(root, "docs", "pitch", `cover-${id}.png`);
  await page.locator(`#${id}`).screenshot({ path: out });
  console.log(out);
}
await browser.close();
