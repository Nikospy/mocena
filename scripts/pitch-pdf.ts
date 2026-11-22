// PDF prezentacji dla jury z docs/pitch/index.html: jedna strona = jeden slajd 1920 × 1080 px.
// Wymaga Playwrighta z Chromium poza repozytorium (np. `bun add playwright` w katalogu tymczasowym
// i `bun x playwright install chromium`). Ścieżkę do modułu podaje zmienna PLAYWRIGHT_MODULE.
//   PLAYWRIGHT_MODULE=<katalog>/node_modules/playwright/index.mjs bun run scripts/pitch-pdf.ts [--png <katalog>]
// Opcja --png zapisuje dodatkowo podgląd każdego slajdu jako slajd-NN.png.
import { mkdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dir, "..");
const html = pathToFileURL(join(root, "docs", "pitch", "index.html")).href;
const out = join(root, "docs", "pitch", "mocena-prezentacja.pdf");
const pngIdx = process.argv.indexOf("--png");
const pngDir = pngIdx > 0 ? resolve(process.argv[pngIdx + 1]) : null;

type PW = { chromium: { launch(): Promise<any> } };
let pw: PW;
try {
  pw = (await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")) as PW;
} catch {
  console.error("Brak Playwrighta. Ustaw PLAYWRIGHT_MODULE na moduł playwright zainstalowany poza repozytorium.");
  process.exit(1);
}

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

// Kontrola: żaden tekst nie wychodzi poza slajd ani poza swój blok.
await page.emulateMedia({ media: "print" });
const overflow: string[] = await page.evaluate(() => {
  const bad: string[] = [];
  document.querySelectorAll<HTMLElement>(".slide").forEach((s) => {
    const sr = s.getBoundingClientRect();
    s.querySelectorAll<HTMLElement>("h1,h2,h3,p,li,td,th,figcaption,span,img").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > sr.bottom - 40 + 0.5 || r.right > sr.right - 80 + 0.5) bad.push(`${s.id}: ${el.tagName} „${(el.textContent ?? "").slice(0, 40)}”`);
    });
    const body = s.querySelector<HTMLElement>(".body");
    if (body && body.scrollHeight > body.clientHeight + 1) bad.push(`${s.id}: treść wyższa niż slajd`);
  });
  return bad;
});
if (overflow.length) console.warn("Uwaga, możliwe ucięcie:\n" + overflow.join("\n"));

await page.pdf({ path: out, width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true });
const slides = await page.locator(".slide").count();

if (pngDir) {
  mkdirSync(pngDir, { recursive: true });
  await page.emulateMedia({ media: "screen" });
  await page.addStyleTag({ content: ".deck{zoom:1!important;gap:0} body{padding:0} .slide{border:0;border-radius:0}" });
  for (let i = 0; i < slides; i++) {
    await page.locator(".slide").nth(i).screenshot({ path: join(pngDir, `slajd-${String(i + 1).padStart(2, "0")}.png`) });
  }
}
await browser.close();
console.log(`PDF: ${out}, slajdów: ${slides}, rozmiar: ${(statSync(out).size / 1024 / 1024).toFixed(2)} MB`);
