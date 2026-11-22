// Pomiar wyglądu na żywej stronie: przechodzi pokaz z demo.md, robi zrzuty każdego ekranu
// w 360 px i 1440 px i liczy to, co da się policzyć (pismo, kontrast, cele kliknięcia, długość wiersza,
// przepełnienie, liczba ramek, pigułek i cieni). Wynik: <outDir>/metrics.json i zrzuty z zaznaczonymi miejscami.
// To skrypt, nie trasa: nie importuj go z src/.
//   bun run scripts/design-audit.ts <outDir> [--only ekran,ekran] [--css plik.css]
// --css dokłada arkusz przed pomiarem: tak sprawdzasz poprawkę, zanim trafi do public/style.css.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import regulation from "../rules/regulation-2016-470.json";

const argv = process.argv.slice(2);
const flag = (name: string) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const only = flag("--only")?.split(",");
const cssFile = flag("--css");
const extraCss = cssFile ? await Bun.file(resolve(cssFile)).text() : null;
const outDir = resolve(argv.find((a, i) => !a.startsWith("--") && !["--only", "--css"].includes(argv[i - 1] ?? "")) ?? "design-audit-out");
mkdirSync(outDir, { recursive: true });

type Rect = { x: number; y: number; w: number; h: number; label: string };
type Measured = { metrics: Record<string, unknown>; off: Record<string, Rect[]>; pageHeight: number };
type Page = {
  goto(u: string): Promise<unknown>;
  screenshot(o: unknown): Promise<unknown>;
  evaluate<T>(fn: string | ((arg: never) => T), arg?: unknown): Promise<T>;
  addStyleTag(o: { content: string }): Promise<{ evaluate(fn: string): Promise<unknown> }>;
};
type Context = { addCookies(c: unknown[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o: unknown): Promise<Context>; close(): Promise<void> };

const pw = (await import("playwright")) as { chromium: { launch(): Promise<Browser> } };
const browser = await pw.chromium.launch();

const dir = mkdtempSync(join(tmpdir(), "mocena-audit-"));
process.env.MOCENA_DB = join(dir, "audit.sqlite");
process.argv = [process.argv[0], process.argv[1], "--live-step-2"];
await import("../src/seed-cli");
const { default: local } = await import("../src/local");
const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: local.fetch });
const base = `http://127.0.0.1:${server.port}`;
const CYCLE = "cycle-piotr";

async function post(who: string, path: string, fields: Record<string, string | string[]>): Promise<Response> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) for (const x of Array.isArray(v) ? v : [v]) body.append(k, x);
  const res = await fetch(base + path, { method: "POST", body, redirect: "manual", headers: { cookie: `person_id=${who}` } });
  if (res.status >= 400) console.log(`POST ${path} jako ${who}: HTTP ${res.status}`);
  return res;
}
const setDate = (date: string) => post("admin", "/demo/date", { date });

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
  const biggest = new Set(texts.filter((x) => parseFloat(x.cs.fontSize) === maxSize).map((x) => x.el)).size;

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
      h1Count: heads.filter((h) => h === 1).length, headings: heads.join(""), skippedLevels: skipped, biggestSize: maxSize, biggestCount: biggest,
      h1Top: h1 ? Math.round(h1.getBoundingClientRect().top + scrollY) : null, mainTop: Math.round(main.getBoundingClientRect().top + scrollY),
      screens: +(document.documentElement.scrollHeight / vh).toFixed(1),
      overflowPx: Math.max(0, overflow), unlabeled,
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

const results: unknown[] = [];
const VIEWS = [
  { width: 360, height: 800, scale: 2 },
  { width: 1440, height: 900, scale: 1 },
];
// Które listy miejsc trafiają na zrzut z zaznaczeniem i ile ramek najwyżej.
const EVIDENCE: Record<string, number> = { contrast: 12, tiny: 30, lineLength: 6, target24: 20, target44: 30, primary: 12, nestedBox: 30, box: 60, pill: 60, pillLink: 60, shadow: 60, overflow: 10, unlabeled: 10 };

async function stop(who: string | null, path: string, name: string) {
  if (only && !only.includes(name)) return;
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.scale, locale: "pl-PL" });
    if (who) await ctx.addCookies([{ name: "person_id", value: who, url: base }]);
    const page = await ctx.newPage();
    await page.goto(base + path);
    if (extraCss) await page.addStyleTag({ content: extraCss });
    const id = `${name}-${v.width}`;
    await page.screenshot({ path: join(outDir, `${id}.jpg`), fullPage: true, type: "jpeg", quality: 72 });
    const m = (await page.evaluate(MEASURE)) as Measured;
    const evidence: Record<string, string> = {};
    for (const [key, cap] of Object.entries(EVIDENCE)) {
      const list = (m.off[key] ?? []).slice(0, cap);
      if (!list.length) continue;
      await page.evaluate(`${DRAW}(${JSON.stringify(list)})`);
      const y0 = Math.max(0, Math.min(...list.map((r) => r.y)) - 60);
      const h = Math.min(m.pageHeight - y0, v.height);
      const file = `${id}--${key}.jpg`;
      await page.screenshot({ path: join(outDir, file), fullPage: true, clip: { x: 0, y: y0, width: v.width, height: h }, type: "jpeg", quality: 62 });
      await page.evaluate(`document.getElementById("__audit").remove()`);
      evidence[key] = file;
    }
    // Próba rozmycia: czy widać jeden element poziomu 1 i grupy.
    await page.evaluate(`document.documentElement.style.filter = "blur(${v.width === 360 ? 3 : 5}px)"`);
    await page.screenshot({ path: join(outDir, `${id}--blur.jpg`), type: "jpeg", quality: 60 });
    results.push({ id, name, who, path, width: v.width, metrics: m.metrics, counts: Object.fromEntries(Object.entries(m.off).map(([k, l]) => [k, l.length])), evidence });
    await ctx.close();
  }
  console.log(`ekran: ${name}`);
}

try {
  // Krok 1: początek cyklu (9.12.2024).
  await stop(null, "/account", "account");
  await stop("marek", "/", "home-marek");
  await stop("marek", `/cycles/${CYCLE}/part1`, "part1-edit");
  const extra = ["orientacja-na-klienta", "myslenie-analityczne"];
  await post("marek", `/cycles/${CYCLE}/part1/submit`, { additional: extra, "expectation[orientacja-na-klienta]": "Kompletne odpowiedzi dla interesantów, z numerem sprawy." });
  await stop("marek", `/cycles/${CYCLE}/part1`, "part1-submitted");
  await stop("marek", `/cycles/${CYCLE}/cards/opening`, "card-opening");
  await stop("piotr", "/", "home-piotr");
  await stop("piotr", `/cycles/${CYCLE}/part1`, "part1-to-confirm");
  await post("piotr", `/cycles/${CYCLE}/part1/confirm`, {});
  await stop("piotr", `/cycles/${CYCLE}/part1`, "part1-confirmed");

  // Krok 2: notatka ze zmianą zadań (11.03.2026).
  await setDate("2026-03-11");
  await stop("marek", "/people/piotr/notes/new", "note-form");
  const note = await post("marek", "/people/piotr/notes", { criterion_id: "wspolpraca", text: "Po odejściu koleżanki 9 marca przejął jej kolejkę wniosków i spisał, co jest otwarte.", rating: "good", task_change: "1", date: "2026-03-11" });
  const question = note.headers.get("location") ?? "";
  if (question.includes("/task-change")) {
    await stop("marek", question, "task-change-question");
    await post("marek", question, { answer: "yes" });
    await stop("marek", question, "task-change-card");
  }
  await stop("marek", "/notes", "notes-list");

  // Krok 3: nieobecności i oś czasu (10.11.2026).
  await setDate("2026-11-10");
  await stop("joanna", `/cycles/${CYCLE}/absences`, "absence-form");
  await post("joanna", `/cycles/${CYCLE}/absences`, { from: "2026-10-05", to: "2026-10-16", excused: "1" });
  await post("joanna", `/cycles/${CYCLE}/absences`, { from: "2026-10-19", to: "2026-11-06", excused: "1" });
  await stop("joanna", `/cycles/${CYCLE}/timeline`, "timeline");

  // Krok 4: przed rozmową i ocena (21.11.2026).
  await setDate("2026-11-21");
  await stop("marek", "/", "home-marek-late");
  await stop("marek", `/cycles/${CYCLE}/before-meeting`, "before-meeting");
  await stop("marek", `/cycles/${CYCLE}/cards/assessment-conversation`, "card-assessment");
  await stop("marek", `/cycles/${CYCLE}/assessment`, "assessment-empty");
  const criteria = [...regulation.sheets.C.mandatoryCriteria, ...extra];
  const draft: Record<string, string> = { justification: "Trzy odpowiedzi wyszły po terminie (notatki z 11.02.2025 i 26.08.2026).", developmentConclusions: "Rozmowa o priorytetach i podziale kolejki wniosków.", interviewDate: "2026-11-21" };
  for (const id of criteria) draft[`score[${id}]`] = id === "rzetelnosc" ? "1" : "7";
  await post("marek", `/cycles/${CYCLE}/assessment`, draft);
  await stop("marek", `/cycles/${CYCLE}/assessment`, "assessment-draft");
  await post("marek", `/cycles/${CYCLE}/assessment/approve`, draft);
  await stop("marek", `/cycles/${CYCLE}/assessment`, "assessment-approved");

  // Krok 5: potwierdzenie zapoznania i kadry (22.11.2026).
  await setDate("2026-11-22");
  await stop("piotr", `/cycles/${CYCLE}/assessment`, "assessment-piotr");
  await post("piotr", `/cycles/${CYCLE}/assessment/acknowledge`, {});
  await stop("piotr", `/cycles/${CYCLE}/assessment`, "assessment-acknowledged");
  await stop("joanna", "/hr", "hr");
  await stop("joanna", "/hr/people", "hr-people");
  await stop("marek", `/cycles/${CYCLE}/sheet`, "sheet");
  await stop("marek", "/tour", "tour");
  await stop("marek", "/no-such-page", "error-404");
} finally {
  await browser.close();
  server.stop(true);
  rmSync(dir, { recursive: true, force: true });
}

writeFileSync(join(outDir, "metrics.json"), JSON.stringify(results, null, 1));
console.log(`Zapisano ${results.length} pomiarów w ${outDir}`);
process.exit(0);
