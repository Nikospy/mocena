import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Page, Response as BrowserResponse } from "playwright";
import { auditScenarios, type CaptureOptions, type Fields } from "./design-scenarios";

// bun run scripts/design-audit.ts <outDir> [--widths 320,360,768,1024,1440] [--only ekran,ekran] [--css plik.css]
const argv = process.argv.slice(2);
const flags = new Map<string, string>();
let output: string | undefined;
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (["--widths", "--only", "--css"].includes(arg)) {
    const value = argv[++i];
    if (!value || value.startsWith("--")) throw new Error(`Brak wartości dla ${arg}`);
    flags.set(arg, value);
  } else if (!arg.startsWith("--") && output === undefined) {
    output = arg;
  } else {
    throw new Error(`Nieznany argument: ${arg}`);
  }
}
const only = flags.get("--only")?.split(",");
const widths = [...new Set((flags.get("--widths") ?? "360,1440").split(",").map(Number))];
if (widths.some((width) => ![320, 360, 768, 1024, 1440].includes(width))) {
  throw new Error("Dozwolone szerokości: 320,360,768,1024,1440.");
}
const cssFile = flags.get("--css");
const extraCss = cssFile ? await Bun.file(resolve(cssFile)).text() : null;
const outDir = resolve(output ?? "design-audit-out");
mkdirSync(outDir, { recursive: true });

type Rect = { x: number; y: number; w: number; h: number; label: string };
type Measured = { metrics: Record<string, unknown>; off: Record<string, Rect[]>; pageHeight: number };

const { chromium } = await import("playwright");
const singleProcess = process.platform === "darwin" && process.env.MOCENA_AUDIT_SINGLE_PROCESS === "1";
const browser = await chromium.launch({
  headless: true,
  // Na macOS pojedynczy proces działa także bez usług Mach wymaganych przez renderery potomne.
  args: singleProcess ? ["--single-process", "--disable-gpu"] : [],
});
const dir = mkdtempSync(join(tmpdir(), "mocena-audit-"));
process.env.MOCENA_DB = join(dir, "audit.sqlite");
process.argv = [process.argv[0], process.argv[1], "--live-step-2"];
await import("../src/seed-cli");
const { default: local } = await import("../src/local");
const { default: app } = await import("../src/index");
// Playwright przechwytuje żądania HTTP i przekazuje je rzeczywistej aplikacji Hono
// razem z plikami public/. Pomiar nie potrzebuje portu ani dostępu do sieci.
const base = "http://mocena.test";
async function post(who: string | null, path: string, fields: Fields = {}) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of Array.isArray(value) ? value : [value]) body.append(key, item);
  }
  const res = await local.request(base + path, {
    method: "POST", body,
    headers: who ? { cookie: `person_id=${who}` } : {},
  });
  if (res.status !== 303) throw new Error(`POST ${path} (${who}): HTTP ${res.status} ${(await res.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(-300)}`);
  const location = res.headers.get("location");
  if (!location?.startsWith("/")) throw new Error(`POST ${path}: brak przekierowania`);
  return location;
}

// Pomiar w przeglądarce. Zwraca liczby i listy miejsc (współrzędne strony) do zaznaczenia na zrzucie.
const MEASURE = String.raw`(() => {
  const vw = innerWidth, vh = innerHeight;
  const rgb = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const p = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const bgOf = (el) => { const layers = []; let img = false; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== "none") img = true; const c = rgb(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } } let b = { r: 255, g: 255, b: 255 }; for (let i = layers.length - 1; i >= 0; i--) { const l = layers[i]; b = { r: l.r * l.a + b.r * (1 - l.a), g: l.g * l.a + b.g * (1 - l.a), b: l.b * l.a + b.b * (1 - l.a) }; } return { c: b, img }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const box = (r, label) => ({ x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), label });
  const shown = (el) => { const r = el.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; const cs = getComputedStyle(el); return cs.visibility !== "hidden" && +cs.opacity !== 0 && r.right > 0 && r.bottom + scrollY > 0; };
  const inc = (m, k, n) => { m[k] = (m[k] || 0) + n; };
  const off = {};
  const push = (k, r) => { (off[k] = off[k] || []).push(r); };

  // Tekst: węzły tekstowe z widocznym prostokątem.
  const texts = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) {
    const n = tw.currentNode; const t = n.textContent.replace(/\s+/g, " ").trim(); if (!t) continue;
    const el = n.parentElement; if (!el || el.closest("script,style,noscript,[hidden],.skip-link")) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const rects = [...rg.getClientRects()].filter((x) => x.width > 0 && x.height > 0 && x.right > 0); if (!rects.length) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
    texts.push({ el, t, rects, cs });
  }
  const sizes = {}, weights = {}, colors = {}, lefts = {}; let chars = 0, bold = 0, small = 0, tiny = 0, upper = 0;
  const lowContrast = []; let unknownBg = 0;
  for (const x of texts) {
    const n = x.t.length, fs = parseFloat(x.cs.fontSize), fw = +x.cs.fontWeight;
    chars += n; inc(sizes, fs, n); inc(weights, fw, n); if (fw >= 600) bold += n; if (fs < 16) small += n; if (fs <= 12) tiny += n;
    if (x.cs.textTransform === "uppercase") upper += n;
    if (fs <= 12) push("tiny", box(x.rects[0], fs + "px"));
    inc(lefts, Math.round(x.rects[0].left), 1);
    const fg = rgb(x.cs.color); const bg = bgOf(x.el);
    if (!fg) continue; if (bg.img) { unknownBg++; continue; }
    const fgc = fg.a < 1 ? { r: fg.r * fg.a + bg.c.r * (1 - fg.a), g: fg.g * fg.a + bg.c.g * (1 - fg.a), b: fg.b * fg.a + bg.c.b * (1 - fg.a) } : fg;
    inc(colors, hex(fgc), n);
    const cr = ratio(fgc, bg.c); const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    if (cr < (large ? 3 : 4.5)) lowContrast.push({ cr, r: box(x.rects[0], cr.toFixed(2) + ":1 " + hex(fgc) + " na " + hex(bg.c)) });
  }
  lowContrast.sort((a, b) => a.cr - b.cr); for (const l of lowContrast) push("contrast", l.r);

  // Długość wiersza: bloki, w których tekst siedzi tylko w elementach liniowych.
  const blocks = new Set();
  for (const x of texts) { let e = x.el; while (e && getComputedStyle(e).display.startsWith("inline")) e = e.parentElement; if (e) blocks.add(e); }
  let maxCpl = 0; const longLines = [];
  for (const b of blocks) {
    if ([...b.children].some((c) => !getComputedStyle(c).display.startsWith("inline") && c.innerText && c.innerText.trim())) continue;
    const t = (b.innerText || "").replace(/\s+/g, " ").trim(); if (t.length < 90) continue;
    const rg = document.createRange(); rg.selectNodeContents(b);
    const tops = []; for (const r of rg.getClientRects()) { if (r.width <= 0) continue; if (!tops.some((v) => Math.abs(v - r.top) < 4)) tops.push(r.top); }
    if (tops.length < 2) { if (t.length > 80) { maxCpl = Math.max(maxCpl, t.length); longLines.push({ cpl: t.length, r: box(b.getBoundingClientRect(), t.length + " zn. w 1 wierszu") }); } continue; }
    const cpl = Math.round(t.length / tops.length); maxCpl = Math.max(maxCpl, cpl);
    if (cpl > 80) longLines.push({ cpl, r: box(b.getBoundingClientRect(), "ok. " + cpl + " zn./wiersz") });
  }
  longLines.sort((a, b) => b.cpl - a.cpl); for (const l of longLines) push("lineLength", l.r);

  // Cele kliknięcia.
  let targets = 0, under24 = 0, under44 = 0; const firstScreenTargets = [];
  for (const el of document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button]")) {
    if (!shown(el) || el.closest(".skip-link")) continue;
    let r = el.getBoundingClientRect();
    if ((el.type === "checkbox" || el.type === "radio") && el.labels && el.labels[0]) { const lr = el.labels[0].getBoundingClientRect(); if (lr.width * lr.height > r.width * r.height) r = lr; }
    const cs = getComputedStyle(el);
    const inline = el.tagName === "A" && cs.display === "inline" && el.parentElement && el.parentElement.innerText.trim().length > el.innerText.trim().length + 8;
    targets++; if (r.top < vh) firstScreenTargets.push(el);
    if (inline) continue;
    const name = (el.innerText || el.value || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 24);
    if (r.width < 24 || r.height < 24) { under24++; push("target24", box(r, Math.round(r.width) + "×" + Math.round(r.height) + " " + name)); }
    else if (r.width < 44 || r.height < 44) { under44++; push("target44", box(r, Math.round(r.width) + "×" + Math.round(r.height) + " " + name)); }
  }

  // Akcja główna: przyciski w kolorze akcentu.
  const primaryCss = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const probe = document.createElement("i"); probe.style.color = primaryCss || "#0452a8"; document.body.append(probe); const primary = getComputedStyle(probe).color; probe.remove();
  const primaries = [];
  for (const el of document.querySelectorAll("a,button,input[type=submit]")) { if (shown(el) && getComputedStyle(el).backgroundColor === primary) { primaries.push((el.innerText || el.value || "").trim()); push("primary", box(el.getBoundingClientRect(), "akcja główna")); } }

  // Ramki, pigułki, cienie.
  let boxes = 0, maxDepth = 0, shadows = 0, pills = 0, pillLinks = 0; const boxEls = new Set(); const boxBgs = {};
  for (const el of document.querySelectorAll("body *")) {
    if (!shown(el)) continue; const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const control = /^(INPUT|BUTTON|SELECT|TEXTAREA|A|LABEL|SUMMARY|OPTION)$/.test(el.tagName);
    if (cs.boxShadow !== "none" && !control) { shadows++; push("shadow", box(r, "cień")); }
    const rad = parseFloat(cs.borderTopLeftRadius) || 0;
    if (r.height <= 40 && r.width > r.height * 1.3 && rad >= r.height / 2 - 1 && el.innerText && el.innerText.trim() && (rgb(cs.backgroundColor)?.a > 0 || parseFloat(cs.borderTopWidth) > 0)) {
      if (control || el.closest("a,button,label,summary")) { pillLinks++; push("pillLink", box(r, "klikalna")); } else { pills++; push("pill", box(r, "etykieta")); }
      if (!control) continue;
    }
    if (control || r.width < 120 || r.height < 32) continue;
    const bw = ["Top", "Right", "Bottom", "Left"].filter((s) => parseFloat(cs["border" + s + "Width"]) > 0 && (rgb(cs["border" + s + "Color"])?.a ?? 0) > 0).length;
    const own = rgb(cs.backgroundColor); const parentBg = el.parentElement ? bgOf(el.parentElement).c : { r: 255, g: 255, b: 255 };
    const filled = own && own.a > 0 && hex(own) !== hex(parentBg);
    if (!(bw >= 3 || filled || cs.boxShadow !== "none")) continue;
    if (el.tagName === "BODY" || el.tagName === "MAIN" || el.tagName === "HEADER") continue;
    boxes++; boxEls.add(el); if (filled) inc(boxBgs, hex(own), 1);
    let d = 0; for (let e = el.parentElement; e; e = e.parentElement) if (boxEls.has(e)) d++;
    maxDepth = Math.max(maxDepth, d); push(d >= 1 ? "nestedBox" : "box", box(r, d >= 1 ? "ramka w ramce (" + d + ")" : "ramka"));
  }

  // Odstępy pionowe między sąsiadami w treści.
  const gaps = {}; const main = document.querySelector("main") || document.body;
  for (const p of [main, ...main.querySelectorAll("*")]) {
    const kids = [...p.children].filter((c) => shown(c) && !getComputedStyle(c).display.startsWith("inline") && getComputedStyle(c).position !== "absolute" && getComputedStyle(c).position !== "fixed");
    for (let i = 1; i < kids.length; i++) { const a = kids[i - 1].getBoundingClientRect(), b = kids[i].getBoundingClientRect(); const g = Math.round(b.top - a.bottom); if (g >= 0 && g < 200 && Math.abs(a.left - b.left) < 4) inc(gaps, g, 1); }
  }

  // Nagłówki.
  const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(shown).map((h) => +h.tagName[1]);
  let skipped = 0; for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i - 1] > 1) skipped++;
  const h1 = [...document.querySelectorAll("h1")].filter(shown)[0];
  const maxSize = Math.max(...Object.keys(sizes).map(Number));
  const biggest = new Set(texts.filter((x) => parseFloat(x.cs.fontSize) === maxSize).map((x) => x.el.closest("h1") || x.el));
  const mobileNavUnder48 = vw <= 360
    ? [...document.querySelectorAll("nav.nav a")].filter((el) => shown(el) && el.getBoundingClientRect().height < 48).length
    : 0;
  const controlHeights = [...document.querySelectorAll("main input:not([type=hidden],[type=radio],[type=checkbox]),main select,main button.btn:not(.text),main a.btn:not(.text)")]
    .filter(shown).map((el) => Math.round(el.getBoundingClientRect().height));

  // Przepełnienie w poziomie.
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (overflow > 0) for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(); if (shown(el) && r.right > vw + 1 && r.width < vw * 3 && ![...el.children].some((c) => c.getBoundingClientRect().right > vw + 1)) push("overflow", box(r, "wystaje o " + Math.round(r.right - vw) + " px")); }

  // Pola bez etykiety.
  let unlabeled = 0;
  for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea")) { if (shown(el) && !(el.labels && el.labels.length) && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")) { unlabeled++; push("unlabeled", box(el.getBoundingClientRect(), "bez etykiety")); } }

  const body = document.body.innerText;
  const sorted = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]);
  const pct = (n) => chars ? Math.round((n / chars) * 100) : 0;
  return {
    pageHeight: document.documentElement.scrollHeight,
    off,
    metrics: {
      title: document.title, chars,
      sizes: sorted(sizes).map(([k, v]) => [Number(k), pct(v)]),
      sizeCount: Object.keys(sizes).length,
      weights: sorted(weights).map(([k, v]) => [Number(k), pct(v)]),
      boldPct: pct(bold), under16Pct: pct(small), tinyPct: pct(tiny), upperPct: pct(upper),
      textColors: sorted(colors).map(([k, v]) => [k, pct(v)]), textColorCount: Object.keys(colors).length,
      contrastFails: lowContrast.length, worstContrast: lowContrast[0] ? +lowContrast[0].cr.toFixed(2) : null, unknownBg,
      maxCpl, longLineBlocks: longLines.length,
      targets, under24, under44, firstScreenTargets: firstScreenTargets.length,
      primaries, primaryCount: primaries.length,
      boxes, maxBoxDepth: maxDepth, boxBgCount: Object.keys(boxBgs).length, boxBgs: sorted(boxBgs), shadows, pills, pillLinks,
      gaps: sorted(gaps).map(([k, v]) => [Number(k), v]), gapCount: Object.keys(gaps).length,
      leftEdges: sorted(lefts).filter(([, v]) => v >= 2).map(([k, v]) => [Number(k), v]),
      h1Count: heads.filter((h) => h === 1).length, headings: heads.join(""), skippedLevels: skipped, biggestSize: maxSize, biggestCount: biggest.size, largestIsH1: biggest.has(h1),
      h1Top: h1 ? Math.round(h1.getBoundingClientRect().top + scrollY) : null, mainTop: Math.round(main.getBoundingClientRect().top + scrollY),
      screens: +(document.documentElement.scrollHeight / vh).toFixed(1),
      mobileNavUnder48, assessmentForm: !!document.querySelector("#assessment-form"), overflowPx: Math.max(0, overflow), unlabeled, controlsUnder48: controlHeights.filter((h) => h < 48).length,
      straightQuotes: (body.match(/"/g) || []).length, hyphenDashes: (body.match(/ - /g) || []).length,
    },
  };
})()`;

const DRAW = String.raw`((list) => {
  const c = document.createElement("div"); c.id = "__audit"; c.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none";
  for (const r of list) {
    const d = document.createElement("div"); d.style.cssText = "position:absolute;box-sizing:border-box;border:2px solid #e6007e;background:rgba(230,0,126,.08);left:" + r.x + "px;top:" + r.y + "px;width:" + r.w + "px;height:" + r.h + "px";
    if (r.label) { const l = document.createElement("span"); l.textContent = r.label; l.style.cssText = "position:absolute;left:-2px;top:-17px;font:700 11px/15px system-ui,sans-serif;background:#e6007e;color:#fff;padding:0 4px;white-space:nowrap"; d.append(l); }
    c.append(d);
  }
  document.body.append(c);
})`;

const coverageFile = join(import.meta.dir, "../context/changes/final-polish/coverage.md");
const coverage = new Map<string, { route: string; who: string | null }>();
for (const line of (await Bun.file(coverageFile).text()).split("\n")) {
  const row = /^\| `([^`]+)` \| `([^`]+)` \| [^|]+ \| `([^`]+)` \|/.exec(line);
  if (!row) continue;
  const [, route, who, name] = row;
  if (coverage.has(name)) throw new Error(`Powtórzony wiersz w coverage.md: ${name}`);
  coverage.set(name, { route, who: who === "anonim" ? null : who });
}

const results: Record<string, unknown>[] = [];
const visited = new Set<string>();
const errors: string[] = [];
// Limity zaznaczeń na pomocniczym zrzucie.
const EVIDENCE: Record<string, number> = { contrast: 12, tiny: 30, lineLength: 6, target24: 20, target44: 30, primary: 12, nestedBox: 30, box: 60, pill: 60, pillLink: 60, shadow: 60, overflow: 10, unlabeled: 10 };

async function responseOfForm(page: Page, form: NonNullable<CaptureOptions["form"]>) {
  const submit = page.locator(form.button ?? `form[action="${form.action}"] button[type=submit]`).first();
  for (const [name, value] of Object.entries(form.fields ?? {})) {
    await page.locator(`form[action="${form.action}"] [name="${name}"]`).fill(value);
  }
  if (form.checks) {
    const inputs = page.locator(form.checks.selector);
    for (let i = 0; i < form.checks.count; i++) await inputs.nth(i).check();
  }
  if (form.omitSubmitter) await submit.evaluate((el) => el.removeAttribute("name"));
  const [response] = await Promise.all([
    page.waitForResponse((res) => res.request().method() === "POST" && new URL(res.url()).pathname === form.action),
    submit.click(),
  ]);
  await page.waitForLoadState("load");
  return response;
}

async function focusAfterTabs(page: Page, tabs: number) {
  for (let i = 0; i < tabs; i++) await page.keyboard.press("Tab");
  return page.evaluate(() => {
    const el = document.querySelector(":focus-visible");
    if (!el) return { visible: false, element: null };
    const style = getComputedStyle(el);
    const painted = (color: string) => color !== "transparent" && !/^rgba\([^)]*, 0\)$/.test(color);
    const outline = !["none", "hidden"].includes(style.outlineStyle) && parseFloat(style.outlineWidth) > 0 && painted(style.outlineColor);
    const shadow = style.boxShadow !== "none" && (style.boxShadow.match(/rgba?\([^)]*\)/g) ?? []).some(painted);
    const rect = el.getBoundingClientRect();
    const onScreen = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
    return {
      visible: onScreen && (outline || shadow),
      element: el.tagName,
      label: el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 100),
      outline: style.outline,
      boxShadow: style.boxShadow,
    };
  });
}

const sharedContext = singleProcess ? await browser.newContext({ locale: "pl-PL" }) : undefined;

async function capture(who: string | null, path: string, name: string, width: number, options: CaptureOptions) {
  const id = `${name}-${width}`;
  const height = width < 768 ? 800 : 900;
  const ctx = sharedContext ?? await browser.newContext({ viewport: { width, height }, deviceScaleFactor: width < 768 ? 2 : 1, locale: "pl-PL", acceptDownloads: true });
  try {
    if (sharedContext) await ctx.clearCookies();
    if (who) await ctx.addCookies([{ name: "person_id", value: who, url: base }]);
    if (options.tour) await ctx.addCookies([{ name: "mocena_tour", value: options.tour, url: base }]);
    const page = await ctx.newPage();
    await page.setViewportSize({ width, height });
    await page.route(`${base}/**`, async (route) => {
      const request = route.request();
      const headers = await request.allHeaders();
      // Przechwycona nawigacja może nie przekazać nagłówka Cookie.
      const cookies = await ctx.cookies(request.url());
      if (cookies.length) headers.cookie = cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
      const res = await local.request(request.url(), {
        method: request.method(), headers, body: request.postData(),
      });
      await route.fulfill({
        status: res.status,
        headers: Object.fromEntries(res.headers),
        body: Buffer.from(await res.arrayBuffer()),
      });
    });
    page.setDefaultTimeout(5000);
    let status: number;
    let responsePath: string;
    let redirectStatus: number | undefined;
    const evidence: Record<string, string | string[]> = {};
    if (options.download) {
      const download = await local.request(base + path, { headers: who ? { cookie: `person_id=${who}` } : {} });
      const contentType = download.headers.get("content-type");
      if (!contentType?.startsWith(options.download === "csv" ? "text/csv" : "text/calendar")) {
        throw new Error(`Oczekiwano pliku ${options.download}, otrzymano ${contentType}`);
      }
      const content = await download.text();
      const file = `${id}.${options.download}`;
      await Bun.write(join(outDir, file), content);
      evidence.download = file;
      // Załącznik sam nie ma widoku HTML. Pokazujemy rzeczywistą treść odpowiedzi.
      await page.setContent("<!doctype html><html lang=pl><meta charset=utf-8><title></title><main><h1></h1><pre style='white-space:pre-wrap;overflow-wrap:anywhere'></pre></main></html>");
      await page.evaluate(({ name, content }) => {
        document.title = name;
        document.querySelector("h1")!.textContent = name;
        document.querySelector("pre")!.textContent = content;
      }, { name: options.download === "csv" ? "Eksport CSV" : "Zaproszenie ICS", content });
      status = download.status;
      responsePath = path;
    } else {
      if (options.redirect) {
        const res = await local.request(base + path, { headers: who ? { cookie: `person_id=${who}` } : {} });
        redirectStatus = res.status;
        if (redirectStatus !== 302 || res.headers.get("location") !== options.redirect) {
          throw new Error(`Oczekiwano 302 do ${options.redirect}`);
        }
      }
      const visitedPage: BrowserResponse | null = await page.goto(base + (options.redirect ?? path));
      if (!visitedPage) throw new Error("Nawigacja bez odpowiedzi HTTP");
      const response = options.form ? await responseOfForm(page, options.form) : visitedPage;
      status = response.status();
      responsePath = new URL(response.url()).pathname;
    }
    if (status !== (options.status ?? 200)) throw new Error(`HTTP ${status}, oczekiwano ${options.status ?? 200}`);
    if (options.check) {
      const body = await page.locator("body").innerText();
      if (!body.includes(options.check)) throw new Error(`Brak tekstu „${options.check}”`);
    }
    if (options.selector && !(await page.locator(options.selector).count())) {
      throw new Error(`Brak elementu ${options.selector}`);
    }
    if (options.tour) {
      const guide = page.locator("#tour-guide:visible, #tour-guide-m:visible");
      const summary = guide.locator("details:not([open]) > summary");
      if (await summary.count()) await summary.first().click();
    }
    if (extraCss) await page.addStyleTag({ content: extraCss });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    if (options.hover) {
      const target = page.locator(options.hover).first();
      await target.hover();
      if (!(await target.evaluate((el) => el.matches(":hover")))) throw new Error("Brak stanu :hover");
    }
    const focus = options.tabs ? await focusAfterTabs(page, options.tabs) : undefined;
    const viewportShot = !!(options.tabs || options.hover);
    if (options.print) await page.emulateMedia({ media: "print" });
    const screenshot = `${id}.jpg`;
    const measured = await page.evaluate<Measured>(MEASURE);
    await page.screenshot({ path: join(outDir, screenshot), fullPage: !viewportShot, type: "jpeg", quality: 72 });
    if (options.print) {
      const pdf = `${id}.pdf`;
      await page.pdf({ path: join(outDir, pdf), format: "A4", printBackground: true, preferCSSPageSize: true });
      const raster = Bun.spawnSync(["pdftoppm", "-r", "120", "-png", join(outDir, pdf), join(outDir, id)]);
      if (raster.exitCode !== 0) throw new Error(`pdftoppm: ${raster.stderr.toString()}`);
      const pages = [...new Bun.Glob(`${id}-*.png`).scanSync(outDir)].sort();
      if (!pages.length) throw new Error("Brak obrazów stron PDF");
      evidence.pdf = pdf;
      evidence.pages = pages;
    }
    for (const [key, cap] of Object.entries(EVIDENCE)) {
      const list = (measured.off[key] ?? []).slice(0, cap);
      if (!list.length) continue;
      await page.evaluate(`${DRAW}(${JSON.stringify(list)})`);
      const y = Math.max(0, Math.min(...list.map((rect) => rect.y)) - 60);
      const file = `${id}--${key}.jpg`;
      await page.screenshot({ path: join(outDir, file), fullPage: true, clip: { x: 0, y, width, height: Math.min(measured.pageHeight - y, height) }, type: "jpeg", quality: 62 });
      await page.evaluate(() => document.getElementById("__audit")?.remove());
      evidence[key] = file;
    }
    await page.evaluate((px) => { document.documentElement.style.filter = `blur(${px}px)`; }, width < 768 ? 3 : 5);
    await page.screenshot({ path: join(outDir, `${id}--blur.jpg`), type: "jpeg", quality: 60 });
    results.push({
      id, name, who, path, finalUrl: responsePath, width, status, redirectStatus, screenshot, focus,
      kind: options.print ? "print" : options.download ? "download" : "screen",
      metrics: measured.metrics, counts: Object.fromEntries(Object.entries(measured.off).map(([key, list]) => [key, list.length])), evidence,
    });
  } finally {
    if (sharedContext) await Promise.all(ctx.pages().map((page) => page.close()));
    else await ctx.close();
  }
}

function routeMatches(route: string, path: string) {
  const segments = route.split("/").map((segment) => {
    if (!segment.startsWith(":")) return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return /^:[^{]+\{(.*)\}$/.exec(segment)?.[1] ?? "[^/]+";
  });
  return new RegExp(`^${segments.join("/")}$`).test(new URL(path, base).pathname);
}

async function stop(who: string | null, path: string, name: string, options: CaptureOptions = {}) {
  if (visited.has(name)) throw new Error(`Powtórzony scenariusz ${name}`);
  visited.add(name);
  const row = coverage.get(name);
  if (!row || row.who !== who || (row.route !== "(brak trasy)" && !routeMatches(row.route, path))) {
    errors.push(`${name}: coverage.md nie odpowiada żądaniu GET ${path} (${who ?? "anonim"})`);
  }
  if (only && !only.includes(name)) return;
  const atWidth = async (width: number) => {
    try {
      await capture(who, path, name, width, options);
    } catch (error) {
      const message = `${name}-${width}: ${error}`;
      errors.push(message);
      console.error(message);
    }
  };
  if (sharedContext) {
    for (const width of widths) await atWidth(width);
  } else {
    await Promise.all(widths.map(atWidth));
  }
  console.log(`ekran: ${name}`);
}

try {
  await auditScenarios(stop, post);
  for (const name of only ?? coverage.keys()) {
    if (!visited.has(name)) errors.push(`Brak scenariusza: ${name}`);
  }
  const documented = new Set([...coverage.values()].map((row) => row.route));
  for (const route of app.routes.filter((route) => route.method === "GET")) {
    if (!documented.has(route.path)) errors.push(`Brak trasy GET w coverage.md: ${route.path}`);
  }
} catch (error) {
  errors.push(String(error));
  console.error(error);
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
  results.sort((a, b) => String(a.name).localeCompare(String(b.name)) || Number(a.width) - Number(b.width));
  writeFileSync(join(outDir, "metrics.json"), JSON.stringify(results, null, 1));
  writeFileSync(join(outDir, "capture-errors.json"), JSON.stringify(errors, null, 1));
  console.log(`Zapisano ${results.length} pomiarów w ${outDir}; błędy zapisu: ${errors.length}`);
}
process.exitCode = errors.length ? 1 : 0;
