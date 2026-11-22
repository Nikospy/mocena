// Tight, high-resolution screenshots for the pitch deck (docs/pitch/img/).
// Runs the app locally on fresh demo data, walks the demo from demo.md (form POSTs and date shifts)
// and crops each screen around its evidence. Window width always equals crop width.
// Landscape files are 1600 × 1200 JPEG: 800 × 600 CSS px at DSF 2, or 1000 × 750 at DSF 1.6 (1200 × 900 at 4/3)
// where the two-column layout (from 1000 px) is the evidence. hero.jpg: 1000 × 625 at DSF 2.4. Phones: 360 × 780 at DSF 3, PNG.
// A script, not a route: do not import it from src/.
//   PLAYWRIGHT_MODULE=<dir>/node_modules/playwright/index.mjs bun run scripts/pitch-img.ts [name ...]
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import regulation from "../rules/regulation-2016-470.json";

const outDir = join(import.meta.dir, "..", "docs", "pitch", "img");
const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));

type Box = { x: number; y: number; width: number; height: number };
type Locator = { first(): Locator; boundingBox(): Promise<Box | null>; evaluate(fn: (el: Element) => void): Promise<void>; waitFor(o?: unknown): Promise<void> };
type Page = {
  goto(u: string): Promise<unknown>;
  locator(s: string): Locator;
  screenshot(o: unknown): Promise<unknown>;
  addStyleTag(o: { content: string }): Promise<unknown>;
  evaluate<T>(fn: (arg: any) => T, arg?: unknown): Promise<T>;
  fill(s: string, v: string): Promise<void>;
  click(s: string): Promise<void>;
  waitForLoadState(s?: string): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
};
type Context = { addCookies(c: unknown[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o: unknown): Promise<Context>; close(): Promise<void> };

let pw: { chromium: { launch(): Promise<Browser> } };
try {
  pw = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
} catch {
  console.error("Playwright not found. Set PLAYWRIGHT_MODULE to a playwright module installed outside the repo.");
  process.exit(1);
}
const browser = await pw.chromium.launch();

// Fresh database in a temp dir; demo data with step 2 left for the live walk.
const dir = mkdtempSync(join(tmpdir(), "mocena-pitch-img-"));
process.env.MOCENA_DB = join(dir, "pitch.sqlite");
process.argv = [process.argv[0], process.argv[1], "--live-step-2"];
await import("../src/seed-cli");
const { default: local } = await import("../src/local");
const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: local.fetch });
const base = `http://127.0.0.1:${server.port}`;

const CYCLE = "cycle-piotr";
let failed = 0;

async function post(who: string, path: string, fields: Record<string, string | string[]> = {}): Promise<Response> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) for (const x of Array.isArray(v) ? v : [v]) body.append(k, x);
  const res = await fetch(base + path, { method: "POST", body, redirect: "manual", headers: { cookie: `person_id=${who}` } });
  if (res.status >= 400) {
    failed++;
    console.log(`POST ${path} as ${who}: HTTP ${res.status}`);
  }
  return res;
}
const setDate = (date: string) => post("admin", "/demo/date", { date });

type Shot = {
  who: string;
  path: string;
  name: string;
  /** Crop size in CSS px. */
  crop?: { w: number; h: number };
  dsf?: number;
  /** Elements that must fit in the crop; the crop is placed around their union. */
  focus: string[];
  /** Evidence kept in full colour; the rest of the page dims under a white veil with a hole per element (8 px margin, no frame). */
  spot?: string[];
  /** Elements removed for the shot (display:none), e.g. the next card that would be cut at the crop edge. The page footer is always hidden. */
  hide?: string[];
  /** Extra CSS for the shot only. */
  css?: string;
  /** Repeated items (e.g. notes in a list): the first one that would be cut by the crop bottom and all later ones are removed,
   *  so their card closes after the last whole item; everything below that card is covered with the page background. */
  trim?: string;
  /** "top": union starts `pad` px below the crop top; "center": union centred vertically. */
  anchor?: "top" | "center" | "bottom";
  pad?: number;
  /** Phone: real viewport of crop size, page scrolled; PNG. */
  phone?: boolean;
  prepare?: (page: Page) => Promise<void>;
  /** Show only this element on the page background, centred in the crop (injected style only). */
  isolate?: string;
};

async function shot(s: Shot) {
  if (only.length && !only.includes(s.name)) return;
  const crop = s.crop ?? { w: 800, h: 600 };
  // Window width equals crop width, so nothing is cut horizontally.
  const width = crop.w;
  const ctx = await browser.newContext({
    viewport: { width: s.phone ? crop.w : width, height: s.phone ? crop.h : 2400 },
    deviceScaleFactor: s.dsf ?? 2,
    locale: "pl-PL",
    reducedMotion: "reduce",
  });
  await ctx.addCookies([{ name: "person_id", value: s.who, url: base }]);
  const page = await ctx.newPage();
  try {
    await page.goto(base + s.path);
    if (s.prepare) await s.prepare(page);
    if (process.env.PITCH_DEBUG) console.log(await page.evaluate(() => [...document.querySelectorAll("main h1, main h2, main h3, main .st, main p")].map((e) => `${Math.round(e.getBoundingClientRect().y)} ${e.tagName} ${(e as HTMLElement).innerText.slice(0, 90).replace(/\n/g, " ")}`).join("\n")));
    await page.addStyleTag({ content: `*{transition:none!important;animation:none!important;caret-color:transparent!important}.foot{display:none!important}${(s.hide ?? []).map((h) => `${h}{display:none!important}`).join("")}${s.css ?? ""}` });
    if (s.isolate) await page.addStyleTag({ content: `.foot{display:none!important}body *{visibility:hidden!important}${s.isolate},${s.isolate} *{visibility:visible!important}` });
    const boxes: Box[] = [];
    for (const sel of s.focus) {
      const loc = page.locator(sel).first();
      await loc.waitFor({ timeout: 5000 });
      const b = await loc.boundingBox();
      if (b) boxes.push(b);
    }
    const scrollY = await page.evaluate(() => window.scrollY);
        const y0 = Math.min(...boxes.map((b) => b.y)) + scrollY, y1 = Math.max(...boxes.map((b) => b.y + b.height)) + scrollY;
    const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
    const pad = s.pad ?? 24;
    let y = s.anchor === "center" ? (y0 + y1) / 2 - crop.h / 2 : s.anchor === "bottom" ? y1 + pad - crop.h : y0 - pad;
    y = Math.max(0, Math.min(y, pageH - crop.h));
    const x = 0;
    if (y1 - y0 > crop.h) console.log(`  ${s.name}: evidence ${Math.round(y1 - y0)} exceeds crop`);
    if (s.trim) {
      const cutoff = await page.evaluate(({ sel, bottom }: { sel: string; bottom: number }) => {
        const items = [...document.querySelectorAll(sel)];
        const i = items.findIndex((el) => el.getBoundingClientRect().bottom + window.scrollY > bottom);
        if (i <= 0) return 0;
        for (const el of items.slice(i)) (el as HTMLElement).style.setProperty("display", "none", "important");
        const keep = items[i - 1];
        const box = keep.parentElement?.closest(".card") ?? keep;
        return box.getBoundingClientRect().bottom + window.scrollY + 12;
      }, { sel: s.trim, bottom: y + crop.h - 12 });
      if (cutoff) await page.evaluate((top: number) => {
        const cover = document.createElement("div");
        cover.style.cssText = `position:absolute;left:0;top:${top}px;width:100%;height:${document.documentElement.scrollHeight - top}px;background:${getComputedStyle(document.body).backgroundColor};z-index:9998`;
        document.body.appendChild(cover);
      }, cutoff);
    }
    if (s.spot?.length) {
      const holes: Box[] = [];
      for (const sel of s.spot) {
        const b = await page.locator(sel).first().boundingBox();
        if (b) holes.push({ x: b.x, y: b.y + scrollY, width: b.width, height: b.height });
        else console.log(`  ${s.name}: spot ${sel} not found`);
      }
      await page.evaluate((hs: Box[]) => {
        const W = document.documentElement.scrollWidth, H = document.documentElement.scrollHeight, m = 8;
        const cut = hs.map((h) => `M${Math.round(h.x - m)} ${Math.round(h.y - m)} h${Math.round(h.width + 2 * m)} v${Math.round(h.height + 2 * m)} h-${Math.round(h.width + 2 * m)} Z`).join(" ");
        const veil = document.createElement("div");
        veil.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:rgba(255,255,255,.6);pointer-events:none;z-index:9999;clip-path:path(evenodd, "M0 0 H${W} V${H} H0 Z ${cut}")`;
        document.body.appendChild(veil);
      }, holes);
    }
    const file = join(outDir, s.phone ? `${s.name}.png` : `${s.name}.jpg`);
    if (s.phone) {
      await page.evaluate((top) => window.scrollTo(0, top), Math.round(y));
      await page.waitForTimeout(100);
      await page.screenshot({ path: file, type: "png" });
    } else {
      await page.screenshot({ path: file, type: "jpeg", quality: 82, clip: { x: Math.round(x), y: Math.round(y), width: crop.w, height: crop.h } });
    }
    console.log(`shot: ${file.slice(outDir.length + 1)}`);
  } catch (e) {
    failed++;
    console.log(`${s.name}: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await ctx.close();
  }
}

try {
  // Step 1: cycle start (9.12.2024).
  const extra = ["orientacja-na-klienta", "myslenie-analityczne"];
  await post("marek", `/cycles/${CYCLE}/part1/submit`, {
    additional: extra,
    "expectation[orientacja-na-klienta]": "Kompletne odpowiedzi dla interesantów, z numerem sprawy.",
  });
  await shot({
    who: "piotr", path: `/cycles/${CYCLE}/part1`, name: "phone-part1", phone: true, crop: { w: 360, h: 780 }, dsf: 3,
    focus: ['form[action$="/part1/confirm"]'], anchor: "bottom", pad: 110,
    // The two-line button would sit under the bottom bar while sticky; in normal flow it shows whole above it.
    css: ".part1-confirm{position:static!important}",
  });
  await post("piotr", `/cycles/${CYCLE}/part1/confirm`);

  // Step 2: note with a task change and the partner question (11.03.2026).
  await setDate("2026-03-11");
  const note = await post("marek", "/people/piotr/notes", {
    criterion_id: "wspolpraca",
    text: "Po odejściu koleżanki 9 marca przejął jej kolejkę wniosków i spisał, co jest otwarte.",
    rating: "good",
    task_change: "1",
    date: "2026-03-11",
  });
  const question = note.headers.get("location") ?? "";
  if (!question.includes("/task-change")) {
    failed++;
    console.log(`Note does not lead to the partner question: ${question}`);
  }
  await shot({ who: "marek", path: question, name: "phone-question", phone: true, crop: { w: 360, h: 780 }, dsf: 3, focus: [".page-h"], pad: 16 });
  await post("marek", question, { answer: "yes" });
  await shot({ who: "marek", path: "/notes", name: "notes", focus: ["main h1", ".person-notes:has-text('Piotr') .note-list > li:has-text('11.03.2026')"], pad: 16, spot: [".person-notes:has-text('Piotr') .note-list > li:has-text('11.03.2026')"], trim: ".note-list > li" });

  // Step 3: two absences split by a weekend (10.11.2026).
  await setDate("2026-11-10");
  await post("joanna", `/cycles/${CYCLE}/absences`, { from: "2026-10-05", to: "2026-10-16", excused: "1" });
  await post("joanna", `/cycles/${CYCLE}/absences`, { from: "2026-10-19", to: "2026-11-06", excused: "1" });
  await shot({
    who: "joanna", path: `/cycles/${CYCLE}/timeline`, name: "timeline", crop: { w: 1000, h: 750 }, dsf: 1.6,
    focus: ["main h1", "li.tl-item:has(.tl-cmp)", ".ct-side"],
    spot: ["li.tl-item:has(.tl-cmp)"], hide: ["li.tl-item:not(:nth-last-child(-n+2))", ".ct-side p:has(.btn)"], pad: 24,
  });

  // Step 4: before the meeting, then the draft with "1" for Rzetelność (21.11.2026).
  await setDate("2026-11-21");
  // Partner panel next to the 21.04.2026 note it points to: notes before the change and the later ones are hidden.
  await shot({
    who: "marek", path: `/cycles/${CYCLE}/before-meeting`, name: "partner", crop: { w: 1000, h: 750 }, dsf: 1.6,
    focus: [".b-sec h2", ".bm-asks"], spot: [".bm-asks", ".b-sec li:has-text('21.04.2026')"], pad: 16,
    hide: [".b-sec > h3:first-of-type", ".b-sec > h3:first-of-type + ul", ".b-sec > h3:nth-of-type(2) + ul > li:nth-child(n+3)", ".b-sec > h3:nth-of-type(2) + ul ~ *"],
  });
  await shot({ who: "marek", path: `/cycles/${CYCLE}/before-meeting`, name: "before-meeting", crop: { w: 1000, h: 750 }, dsf: 1.6, focus: [".bm-asks"], pad: 16 });
  const criteria = [...regulation.sheets.C.mandatoryCriteria, ...extra];
  const draft: Record<string, string> = {
    justification: "Trzy odpowiedzi wyszły po terminie (notatki z 11.02.2025 i 26.08.2026).",
    developmentConclusions: "Rozmowa o priorytetach i podziale kolejki wniosków.",
    interviewDate: "2026-11-21",
  };
  for (const id of criteria) draft[`score[${id}]`] = id === "rzetelnosc" ? "1" : "7";
  await post("marek", `/cycles/${CYCLE}/assessment`, draft);
  await shot({
    who: "marek", path: `/cycles/${CYCLE}/assessment`, name: "assessment", crop: { w: 1000, h: 750 }, dsf: 1.6, 
    focus: ["article.crit[data-crit='rzetelnosc']", "#assessment-result"], hide: ["#deadline-shift", "article.crit[data-crit='wykorzystywanie-wiedzy']"], trim: "article.crit", spot: ["article.crit[data-crit='rzetelnosc']", "#assessment-result"], pad: 24,
    prepare: async (page) => {
      await page.evaluate(() => {
        const art = document.querySelector("article.crit[data-crit='rzetelnosc']")!;
        art.querySelectorAll("details").forEach((d) => ((d as HTMLDetailsElement).open = true));
        const li = [...art.querySelectorAll(".note-list > li")].find((l) => l.textContent?.includes("26.08.2026"));
        const box = li?.querySelector("input[type=checkbox]") as HTMLInputElement | null;
        if (box) box.checked = true;
        else throw new Error("no checkbox at the 26.08.2026 note");
      });
    },
  });
  await shot({
    who: "marek", path: `/cycles/${CYCLE}/assessment`, name: "hero", crop: { w: 1000, h: 625 }, dsf: 2.4,
    focus: [".page-h", "#assessment-result"], pad: 16,
  });
  await post("marek", `/cycles/${CYCLE}/assessment/approve`, draft);

  // Step 5: acknowledgement and the HR screen (22.11.2026).
  await setDate("2026-11-22");
  await shot({
    who: "piotr", path: `/cycles/${CYCLE}/assessment`, name: "phone-confirm", phone: true, crop: { w: 360, h: 780 }, dsf: 3,
    focus: ["#assessment-result", 'form[action$="/assessment/acknowledge"]'], pad: 16,
  });
  await post("piotr", `/cycles/${CYCLE}/assessment/acknowledge`);
  await shot({ who: "joanna", path: "/hr", name: "hr", crop: { w: 1200, h: 900 }, dsf: 4 / 3, focus: ["main h1", ".hr-duty", ".card:has-text('Sprzeciw do rozpatrzenia')"], trim: "main .card" });

  // Feedback: Marek forwards the 18.06.2026 note, Piotr sees the message on his phone.
  const notesHtml = await (await fetch(base + "/notes", { headers: { cookie: "person_id=marek" } })).text();
  const fbId = notesHtml.slice(notesHtml.indexOf("Przepisał pismo do gminy")).match(/\/notes\/(\d+)\/feedback/)?.[1];
  if (!fbId) {
    failed++;
    console.log("No feedback link at the 18.06.2026 note");
  }
  await post("marek", `/notes/${fbId}/feedback`, { text: "Pismo do gminy z czerwca: jedno zdanie, czego brakuje, i termin. Gmina odpowiedziała raz, bez dopytywania. Tak pisz dalej." });
  await shot({ who: "piotr", path: "/feedback", name: "phone-feedback", phone: true, crop: { w: 360, h: 780 }, dsf: 3, focus: [".page-h"], pad: 16 });

  // Second assessment after an upheld objection (art. 83 ust. 4 ustawy).
  await post("joanna", "/cycles/cycle-katarzyna/objection-outcome", { outcome: "redone" });
  await shot({ who: "anna", path: "/cycles/cycle-katarzyna/assessment", name: "redo", focus: [".page-h", "#assessment-redo"], spot: ["#assessment-redo"], pad: 16 });

  // CSV import: check before saving.
  const importCsv = [
    "Osoba;Stanowisko;Komórka;Oceniający;Stan cyklu;Termin oceny;Termin sprzeciwu;Data ostatniej oceny;Wynik ostatniej oceny",
    "Jan Nowicki;Specjalista;Wydział Kadr i Szkoleń;Marek Zieliński;;;;10.03.2025;pozytywna",
    "Piotr Wójcik;Starszy specjalista;Wydział Organizacyjny;Marek Zieliński;Okres oceny;27.11.2026;;27.11.2024;pozytywna",
    "Ola Bez;Referent;Wydział Nieistniejący;Marek Zieliński;;;;10.03.2025;pozytywna",
  ].join("\n");
  await shot({
    who: "joanna", path: "/hr/people/import", name: "import", focus: [".imp-plan"], anchor: "center", isolate: ".imp-plan",
    prepare: async (page) => {
      await page.fill("#csv", importCsv);
      await page.click("button:has-text('Sprawdź plik')");
      await page.waitForLoadState("load");
    },
  });

  await shot({ who: "admin", path: "/admin/suggestion-sources", name: "suggestions", crop: { w: 1200, h: 900 }, dsf: 4 / 3, focus: ["section:has(> #h-src-places)", "section:has(> #h-src-never)"], pad: 24 });
  await shot({ who: "admin", path: "/admin/rules", name: "rules", crop: { w: 1000, h: 750 }, dsf: 1.6, focus: [".o-grid"], anchor: "center", isolate: ".o-grid" });
} finally {
  await browser.close();
  server.stop(true);
  rmSync(dir, { recursive: true, force: true });
}

console.log(failed ? `Errors: ${failed}.` : "All shots taken.");
process.exit(failed ? 1 : 0);
