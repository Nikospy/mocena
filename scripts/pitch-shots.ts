// Zrzuty ekranów do prezentacji docs/pitch/index.html.
// Uruchamia aplikację lokalnie na świeżych danych pokazowych, przechodzi pokaz z demo.md
// przez POST formularzy i przesuwanie daty, a zrzuty robi Playwright (jeśli jest dostępny).
// To skrypt, nie trasa: nie importuj go z src/, żeby nie trafił do paczki workera.
//   bun run scripts/pitch-shots.ts            zrzuty do docs/pitch/shots/
//   bun run scripts/pitch-shots.ts --dry      tylko przejście pokazu, bez Playwrighta
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import regulation from "../rules/regulation-2016-470.json";

const dry = process.argv.includes("--dry");
const shotsDir = join(import.meta.dir, "..", "docs", "pitch", "shots");

type Browser = { newContext(o: unknown): Promise<Context>; close(): Promise<void> };
type Context = { addCookies(c: unknown[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Page = { goto(u: string): Promise<unknown>; screenshot(o: unknown): Promise<unknown> };
let browser: Browser | null = null;
if (!dry) {
  try {
    const pw = (await import("playwright")) as { chromium: { launch(): Promise<Browser> } };
    browser = await pw.chromium.launch();
  } catch {
    console.log(
      "Pominięto zrzuty ekranów: Playwright albo jego przeglądarka nie jest dostępna.\n" +
        "Slajdy w docs/pitch/index.html pokażą ramki z nazwami ekranów. " +
        "Zainstaluj Playwright poza repozytorium (np. `bunx playwright install chromium`) i uruchom skrypt ponownie.",
    );
    process.exit(0);
  }
}

// Świeża baza w katalogu tymczasowym; dane pokazowe z opcją „krok 2 na żywo”.
const dir = mkdtempSync(join(tmpdir(), "mocena-pitch-"));
process.env.MOCENA_DB = join(dir, "pitch.sqlite");
process.argv = [process.argv[0], process.argv[1], "--live-step-2"];
await import("../src/seed-cli");
const { default: local } = await import("../src/local");
const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: local.fetch });
const base = `http://127.0.0.1:${server.port}`;

const CYCLE = "cycle-piotr";
let failed = 0;

async function post(who: string, path: string, fields: Record<string, string | string[]>): Promise<Response> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) for (const x of Array.isArray(v) ? v : [v]) body.append(k, x);
  const res = await fetch(base + path, { method: "POST", body, redirect: "manual", headers: { cookie: `person_id=${who}` } });
  if (res.status >= 400) {
    failed++;
    console.log(`POST ${path} jako ${who}: HTTP ${res.status}`);
  }
  return res;
}

const setDate = (date: string) => post("admin", "/demo/date", { date });

async function shot(who: string, path: string, name: string, width: number, height: number) {
  if (!browser) return;
  const ctx = await browser.newContext({ viewport: { width, height }, locale: "pl-PL" });
  await ctx.addCookies([{ name: "person_id", value: who, url: base }]);
  const page = await ctx.newPage();
  await page.goto(base + path);
  await page.screenshot({ path: join(shotsDir, `${name}.png`) });
  await ctx.close();
  console.log(`zrzut: ${name}.png`);
}

if (browser) {
  rmSync(shotsDir, { recursive: true, force: true });
  mkdirSync(shotsDir, { recursive: true });
}

try {
  // Krok 1: początek cyklu (9.12.2024).
  const extra = ["orientacja-na-klienta", "myslenie-analityczne"];
  await post("marek", `/cycles/${CYCLE}/part1/submit`, {
    additional: extra,
    "expectation[orientacja-na-klienta]": "Kompletne odpowiedzi dla interesantów, z numerem sprawy.",
  });
  await shot("marek", `/cycles/${CYCLE}/part1`, "step1-start", 1440, 900);
  await post("piotr", `/cycles/${CYCLE}/part1/confirm`, {});
  await shot("piotr", `/cycles/${CYCLE}/part1`, "step1-confirm", 360, 800);

  // Krok 2: notatka ze zmianą zadań i pytanie partnera (11.03.2026).
  await setDate("2026-03-11");
  const note = await post("marek", "/people/piotr/notes", {
    criterion_id: "wspolpraca",
    text: "Po odejściu koleżanki 9 marca przejął jej kolejkę wniosków i spisał, co jest otwarte.",
    rating: "good",
    task_change: "1",
    date: "2026-03-11",
  });
  const question = note.headers.get("location") ?? "";
  if (question.includes("/task-change")) {
    await shot("marek", question, "step2-question", 360, 800);
    await post("marek", question, { answer: "yes" });
    await shot("marek", question, "step2-card", 360, 900);
  } else {
    failed++;
    console.log(`Notatka nie prowadzi do pytania partnera: ${question}`);
  }

  // Krok 3: dwie nieobecności rozdzielone weekendem (10.11.2026).
  await setDate("2026-11-10");
  await post("joanna", `/cycles/${CYCLE}/absences`, { from: "2026-10-05", to: "2026-10-16", excused: "1" });
  await post("joanna", `/cycles/${CYCLE}/absences`, { from: "2026-10-19", to: "2026-11-06", excused: "1" });
  await shot("joanna", `/cycles/${CYCLE}/timeline`, "step3-timeline", 1440, 900);

  // Krok 4: przed rozmową i ocena z „1” przy Rzetelności (21.11.2026).
  await setDate("2026-11-21");
  await shot("marek", `/cycles/${CYCLE}/before-meeting`, "step4-before-meeting", 1440, 900);
  const criteria = [...regulation.sheets.C.mandatoryCriteria, ...extra];
  const draft: Record<string, string> = {
    justification: "Trzy odpowiedzi wyszły po terminie (notatki z 11.02.2025 i 26.08.2026).",
    developmentConclusions: "Rozmowa o priorytetach i podziale kolejki wniosków.",
    interviewDate: "2026-11-21",
  };
  for (const id of criteria) draft[`score[${id}]`] = id === "rzetelnosc" ? "1" : "7";
  await post("marek", `/cycles/${CYCLE}/assessment`, draft);
  await shot("marek", `/cycles/${CYCLE}/assessment`, "step4-assessment", 1440, 1200);
  await post("marek", `/cycles/${CYCLE}/assessment/approve`, draft);

  // Krok 5: potwierdzenie zapoznania i ekran kadr (22.11.2026).
  await setDate("2026-11-22");
  await post("piotr", `/cycles/${CYCLE}/assessment/acknowledge`, {});
  await shot("piotr", `/cycles/${CYCLE}/assessment`, "step5-acknowledged", 360, 900);
  await shot("joanna", "/hr", "step5-hr", 1440, 900);
} finally {
  await browser?.close();
  server.stop(true);
  rmSync(dir, { recursive: true, force: true });
}

console.log(
  dry ? "Przebieg bez zrzutów (--dry)." : "Zrzuty zapisane w docs/pitch/shots/.",
  failed ? `Błędy w przebiegu: ${failed}.` : "Przebieg bez błędów.",
);
process.exit(failed ? 1 : 0);
