// Automatyczne przejście pokazu z context/foundation/demo.md: te same formularze, własny słoik ciasteczek,
// po każdym kroku sprawdzenie faktów (daty, liczby, nazwiska, kody HTTP). Bez bazy i bez przeglądarki,
// więc ten sam kod działa na `app.request`, na `fetch` z adresem i w buildzie Cloudflare Workers.
import { assessmentDeadline } from "../engine/absences";

export type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;
export type StepResult = { step: string; status: "ok" | "error" | "skipped"; description: string; detail?: string };
export type DemoOptions = { onResult?: (result: StepResult) => void };

type Form = [string, string][];
type Reply = { status: number; location: string | null; html: string };

class Mismatch extends Error {
  constructor(
    readonly expected: string,
    readonly actual: string,
  ) {
    super(`oczekiwano ${expected}, było ${actual}`);
  }
}

class Skip extends Error {}

const fmt = (iso: string): string => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** Jedna sesja widza: słoik ciasteczek (konto, `mocena_demo` na Cloudflare) i kontrole wspólne dla każdej odpowiedzi. */
class Session {
  private jar = new Map<string, string>();
  private current: string | null = null;

  constructor(private fetcher: Fetcher) {}

  private store(res: Response): void {
    const lines = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const line of lines) {
      const [pair, ...attrs] = line.split(";").map((x) => x.trim());
      const eq = pair.indexOf("=");
      if (eq < 1) continue;
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      const expired = attrs.some((a) => /^max-age=0$/i.test(a));
      if (value === "" || expired) this.jar.delete(name);
      else this.jar.set(name, value);
    }
  }

  async req(path: string, opts: { form?: Form; method?: string; expect?: number } = {}): Promise<Reply> {
    const method = opts.method ?? (opts.form ? "POST" : "GET");
    const headers: Record<string, string> = {};
    if (this.jar.size) headers.cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    let body: string | undefined;
    if (opts.form) {
      headers["content-type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams(opts.form).toString();
    }
    const res = await this.fetcher(path, { method, headers, body, redirect: "manual" });
    this.store(res);
    const html = await res.text();
    const expected = opts.expect ?? (method === "GET" ? 200 : 303);
    if (res.status !== expected) throw new Mismatch(`${method} ${path} → ${expected}`, `${res.status}`);
    if (/podpis/i.test(html)) throw new Mismatch(`${method} ${path} bez słowa „podpis”`, "słowo „podpis” w treści");
    let location = res.headers.get("location");
    if (location && /^https?:\/\//.test(location)) {
      const u = new URL(location);
      location = u.pathname + u.search;
    }
    return { status: res.status, location, html };
  }

  get(path: string, expect = 200): Promise<Reply> {
    return this.req(path, { expect });
  }

  post(path: string, form: Form, expect = 303): Promise<Reply> {
    return this.req(path, { form, expect });
  }

  async restart(): Promise<void> {
    const r = await this.post("/demo/restart", [], 303);
    if (r.location !== "/account") throw new Mismatch("przekierowanie na /account po restarcie", String(r.location));
    this.current = null;
  }

  async date(iso: string): Promise<void> {
    await this.post("/demo/date", [["date", iso]]);
  }

  async login(personId: string): Promise<void> {
    if (this.current === personId) return;
    await this.post("/account", [["person_id", personId]]);
    this.current = personId;
  }
}

function includes(html: string, needle: string | RegExp, what: string): void {
  const ok = typeof needle === "string" ? html.includes(needle) : needle.test(html);
  if (!ok) throw new Mismatch(what, "brak w odpowiedzi");
}

function excludes(html: string, needle: string | RegExp, what: string): void {
  const found = typeof needle === "string" ? html.includes(needle) : needle.test(html);
  if (found) throw new Mismatch(`bez: ${what}`, "jest w odpowiedzi");
}

function equal(actual: unknown, expected: unknown, what: string): void {
  if (actual !== expected) throw new Mismatch(`${what}: ${String(expected)}`, String(actual));
}

/** Identyfikator cyklu z odnośnika `/cycles/<id>/part1` najbliższego nazwisku na stronie głównej oceniającego. */
function cycleIdFor(html: string, personName: string): string {
  const at = html.indexOf(personName);
  if (at < 0) throw new Mismatch(`zadanie dla ${personName} na stronie głównej`, "brak nazwiska");
  const links = [...html.matchAll(/\/cycles\/([\w-]+)\/part1/g)];
  const after = links.find((m) => (m.index ?? 0) > at);
  const pick = after ?? links.filter((m) => (m.index ?? 0) < at).pop();
  if (!pick) throw new Mismatch(`odnośnik do części I dla ${personName}`, "brak odnośnika");
  return pick[1];
}

const ADDITIONAL = ["orientacja-na-klienta", "myslenie-analityczne"];

function part1Form(): Form {
  return [
    ...ADDITIONAL.map((id): [string, string] => ["additional", id]),
    ["expectation[orientacja-na-klienta]", "Interesant wychodzi z okienka z kompletnym wnioskiem i bez drugiej wizyty."],
  ];
}

/** Krok 1 do końca potwierdzenia części I przez Piotra. Zostawia konto Piotra. Zwraca id cyklu. */
async function openCycleAndConfirm(s: Session): Promise<string> {
  await s.restart();
  await s.login("marek");
  const home = await s.get("/");
  const id = cycleIdFor(home.html, "Piotr Wójcik");
  await s.post(`/cycles/${id}/part1/criteria`, part1Form());
  await s.post(`/cycles/${id}/part1/submit`, part1Form());
  await s.login("piotr");
  await s.post(`/cycles/${id}/part1/confirm`, []);
  return id;
}

function criteriaIn(html: string): string[] {
  return [...new Set([...html.matchAll(/name="score\[([^\]]+)\]"/g)].map((m) => m[1]))];
}

function assessmentForm(ids: string[], scores: Record<string, number>, today: string, text: { justification?: string; conclusions?: string } = {}): Form {
  const form: Form = ids.map((id): [string, string] => [`score[${id}]`, String(scores[id] ?? 5)]);
  form.push(["interviewDate", today]);
  form.push(["justification", text.justification ?? ""]);
  form.push(["developmentConclusions", text.conclusions ?? ""]);
  return form;
}

type Ctx = { cycleId: string };
type Step = { step: string; description: string; run: (s: Session, ctx: Ctx) => Promise<string | void> };

const steps: Step[] = [
  {
    step: "1",
    description: "Marek rozpoczyna cykl Piotra, Piotr potwierdza część I",
    async run(s, ctx) {
      await s.restart();
      await s.login("marek");
      const home = await s.get("/");
      includes(home.html, "27.12.2024", "termin rozmowy o kryteriach 27.12.2024 na stronie głównej Marka");
      ctx.cycleId = cycleIdFor(home.html, "Piotr Wójcik");
      const part1 = await s.get(`/cycles/${ctx.cycleId}/part1`);
      includes(part1.html, /arkusz C\b/i, "arkusz C");
      await s.post(`/cycles/${ctx.cycleId}/part1/criteria`, part1Form());
      await s.post(`/cycles/${ctx.cycleId}/part1/submit`, part1Form());
      await s.get(`/cycles/${ctx.cycleId}/cards/opening`);
      await s.login("piotr");
      const waiting = await s.get(`/cycles/${ctx.cycleId}/part1`);
      includes(waiting.html, `/cycles/${ctx.cycleId}/part1/confirm`, "formularz potwierdzenia części I u Piotra");
      await s.post(`/cycles/${ctx.cycleId}/part1/confirm`, []);
      const done = await s.get(`/cycles/${ctx.cycleId}/part1`);
      includes(done.html, "09.12.2024", "data potwierdzenia 09.12.2024");
      includes(done.html, "Rzeszów", "miejscowość w potwierdzeniu");
      includes(done.html, "Piotr Wójcik", "nazwisko w potwierdzeniu");
      await s.login("marek");
      await s.post(`/cycles/${ctx.cycleId}/part1/criteria`, part1Form(), 409);
      return "termin 27.12.2024, arkusz C, potwierdzenie 09.12.2024, kryteria zablokowane (409)";
    },
  },
  {
    step: "2",
    description: "notatka o przejęciu kolejki, pytanie o stałą zmianę zadań",
    async run(s) {
      await s.date("2026-03-11");
      await s.login("marek");
      const text = "Po odejściu koleżanki 9 marca przejął jej kolejkę wniosków i spisał, co jest otwarte. Przekazał listę mnie i Marii.";
      const hint = await s.post("/suggestions/note", [["text", text]], 200);
      equal(JSON.parse(hint.html).taskChange, true, "podpowiedź pola zmiany zadań");
      const saved = await s.post("/people/piotr/notes", [
        ["criterion_id", "rzetelnosc"],
        ["text", text],
        ["rating", "good"],
        ["task_change", "1"],
        ["date", "2026-03-11"],
      ]);
      const noteId = /^\/notes\/(\d+)\/task-change$/.exec(saved.location ?? "")?.[1];
      if (!noteId) throw new Mismatch("przekierowanie na /notes/<id>/task-change", String(saved.location));
      const question = await s.get(`/notes/${noteId}/task-change`);
      includes(question.html, /name="answer"/, "pytanie z przyciskami Tak / Nie");
      await s.post(`/notes/${noteId}/task-change`, [["answer", "yes"]]);
      const card = await s.get(`/notes/${noteId}/task-change`);
      excludes(card.html, /name="answer"/, "pytanie po odpowiedzi „tak”");

      const plain = "Przepisał pismo do gminy: jedno zdanie, czego brakuje, i termin.";
      const none = await s.post("/suggestions/note", [["text", plain]], 200);
      equal(JSON.parse(none.html).taskChange, false, "podpowiedź pola dla notatki bez zmiany zadań");
      const second = await s.post("/people/piotr/notes", [
        ["criterion_id", "komunikacja"],
        ["text", plain],
        ["rating", "good"],
        ["date", "2026-03-11"],
      ]);
      if (!/^\/notes\?saved=\d+$/.test(second.location ?? "")) throw new Mismatch("przekierowanie na listę notatek, bez pytania", String(second.location));
      return "pole zmiany zadań podpowiedziane, pytanie, karta po „tak”; druga notatka bez pytania";
    },
  },
  {
    step: "3",
    description: "Joanna wpisuje dwie nieobecności, oś czasu łączy je w jedną",
    async run(s, ctx) {
      await s.date("2026-11-10");
      await s.login("joanna");
      await s.get(`/cycles/${ctx.cycleId}/absences`);
      const first = await s.post(`/cycles/${ctx.cycleId}/absences`, [["from", "2026-10-05"], ["to", "2026-10-16"], ["excused", "on"]]);
      includes(first.location ?? "", "saved=unchanged", "pierwsza nieobecność (12 dni) nie zmienia terminu");
      const second = await s.post(`/cycles/${ctx.cycleId}/absences`, [["from", "2026-10-19"], ["to", "2026-11-06"], ["excused", "on"]]);
      includes(second.location ?? "", "saved=extended", "druga nieobecność przedłuża termin");
      const expected = assessmentDeadline(
        { kind: "regular", periodStart: "2024-11-27", previousAcknowledgedOn: null },
        [
          { from: "2026-10-05", to: "2026-10-16", excused: true },
          { from: "2026-10-19", to: "2026-11-06", excused: true },
        ],
      );
      const hr = await s.get(`/cycles/${ctx.cycleId}/timeline`);
      const absences = hr.html.match(/Nieobecność \d{2}\.\d{2}\.\d{4}–\d{2}\.\d{2}\.\d{4}/g) ?? [];
      equal(absences.length, 1, "liczba nieobecności na osi czasu");
      includes(absences[0], "05.10.2026", "początek nieobecności 05.10.2026");
      includes(absences[0], "06.11.2026", "koniec nieobecności 06.11.2026");
      includes(hr.html, `datetime="${expected.deadline}"`, `nowy termin oceny ${fmt(expected.deadline)} z silnika`);
      includes(hr.html, fmt(expected.base), `dawny termin ${fmt(expected.base)}`);
      await s.login("piotr");
      const own = await s.get(`/cycles/${ctx.cycleId}/timeline`);
      includes(own.html, `datetime="${expected.deadline}"`, `nowy termin oceny ${fmt(expected.deadline)} u Piotra`);
      return `jedna nieobecność 05.10.2026–06.11.2026, termin ${fmt(expected.base)} → ${fmt(expected.deadline)}`;
    },
  },
  {
    step: "4",
    description: "Marek: przed rozmową, formularz oceny, wynik negatywny, blokada zatwierdzenia",
    async run(s, ctx) {
      await s.date("2026-11-21");
      await s.login("marek");
      const before = await s.get(`/cycles/${ctx.cycleId}/before-meeting`);
      includes(before.html, "Myślenie analityczne", "kryterium „Myślenie analityczne” bez notatek na ekranie przed rozmową");
      await s.get(`/cycles/${ctx.cycleId}/cards/assessment-conversation`);
      const form = await s.get(`/cycles/${ctx.cycleId}/assessment`);
      const ids = criteriaIn(form.html);
      for (const id of ["rzetelnosc", "wykorzystywanie-wiedzy", "myslenie-analityczne"]) {
        if (!ids.includes(id)) throw new Mismatch(`kryterium ${id} w formularzu`, `są: ${ids.join(", ")}`);
      }
      const article = (id: string): string => {
        const from = form.html.indexOf(`data-crit="${id}"`);
        if (from < 0) throw new Mismatch(`sekcja kryterium ${id}`, "brak");
        const rest = form.html.slice(from);
        const end = rest.indexOf("</article>");
        return end < 0 ? rest : rest.slice(0, end);
      };
      includes(article("wykorzystywanie-wiedzy"), /st warn/, "ostrzeżenie „tylko ostatni miesiąc” przy „Wykorzystywanie wiedzy…”");
      excludes(article("myslenie-analityczne"), /note-list/, "notatki przy „Myślenie analityczne”");

      const draft = assessmentForm(ids, { rzetelnosc: 1 }, "2026-11-21");
      const preview = await s.post(`/cycles/${ctx.cycleId}/assessment/preview`, draft, 200);
      includes(preview.html, /res neg/, "wynik negatywny przy ocenie „1” z Rzetelności");
      const blocked = await s.post(`/cycles/${ctx.cycleId}/assessment/approve`, draft, 422);
      includes(blocked.html, /name="score\[rzetelnosc\]"[^>]*value="1"[^>]*checked/, "zachowana ocena „1” przy Rzetelności po odmowie");
      const approved = await s.post(
        `/cycles/${ctx.cycleId}/assessment/approve`,
        assessmentForm(ids, { rzetelnosc: 1 }, "2026-11-21", {
          justification: "Rzetelność: trzy odpowiedzi po terminie w sierpniu 2026, wcześniej pismo do gminy z 11.02.2025 wysłane po terminie.",
          conclusions: "Uzgodnić z Piotrem priorytety kolejki wniosków i realny termin odpowiedzi.",
        }),
      );
      equal(approved.location, `/cycles/${ctx.cycleId}/assessment`, "przekierowanie po zatwierdzeniu");
      const view = await s.get(`/cycles/${ctx.cycleId}/assessment`);
      includes(view.html, /res neg/, "wynik negatywny po zatwierdzeniu");
      return "ostrzeżenie przy „Wykorzystywanie wiedzy…”, wynik negatywny, 422 bez wniosków, zatwierdzenie po uzupełnieniu (303)";
    },
  },
  {
    step: "5",
    description: "Piotr potwierdza zapoznanie, Joanna widzi stopień Tomasza i arkusz",
    async run(s, ctx) {
      await s.date("2026-11-22");
      await s.login("piotr");
      await s.post(`/cycles/${ctx.cycleId}/assessment/acknowledge`, []);
      const view = await s.get(`/cycles/${ctx.cycleId}/assessment`);
      includes(view.html, "30.11.2026", "termin sprzeciwu 30.11.2026");
      await s.login("joanna");
      const hr = await s.get("/hr");
      includes(hr.html, "Tomasz Kamiński", "karta stopnia Tomasza");
      includes(hr.html, "14.12.2026", "termin przyznania stopnia 14.12.2026");
      includes(hr.html, "/hr/grades/tomasz", "przycisk „Odnotuj przyznanie stopnia”");
      const sheet = await s.get(`/cycles/${ctx.cycleId}/sheet`);
      includes(sheet.html, "window.print()", "przycisk druku na arkuszu");
      return "termin sprzeciwu 30.11.2026, karta Tomasza do 14.12.2026, arkusz 200 z przyciskiem druku";
    },
  },
  {
    step: "5a",
    description: "oś czasu Ewy ze zmianą oceniającego",
    async run(s) {
      await s.login("joanna");
      const tl = await s.get("/cycles/cycle-ewa/timeline");
      includes(tl.html, "Jerzy Malinowski", "poprzedni oceniający na osi czasu Ewy");
      includes(tl.html, "Marek Zieliński", "nowy oceniający na osi czasu Ewy");
      includes(tl.html, 'datetime="2024-12-05"', "data zmiany oceniającego 05.12.2024");
      return "zmiana oceniającego 05.12.2024 na osi czasu Ewy";
    },
  },
  {
    step: "5b",
    description: "„Odnotuj przyznanie stopnia” usuwa kartę Tomasza",
    async run(s) {
      await s.login("joanna");
      await s.post("/hr/grades/tomasz", []);
      const hr = await s.get("/hr");
      excludes(hr.html, "/hr/grades/tomasz", "przycisk stopnia Tomasza po odnotowaniu");
      return "karta stopnia Tomasza zniknęła z ekranu kadr";
    },
  },
];

/** Osobny przebieg od czystych danych: fikcja zapoznania zamiast potwierdzenia Piotra. */
async function fictionStep(s: Session): Promise<string> {
  const id = await openCycleAndConfirm(s);
  await s.date("2026-11-21");
  await s.login("marek");

  const form = await s.get(`/cycles/${id}/assessment`);
  const ids = criteriaIn(form.html);
  await s.post(`/cycles/${id}/assessment/approve`, assessmentForm(ids, {}, "2026-11-21", { conclusions: "Utrzymać dotychczasowy sposób pracy z interesantami." }));
  let screen: Reply;
  try {
    screen = await s.req(`/cycles/${id}/assessment/fiction`, { expect: 200 });
  } catch (e) {
    if (e instanceof Mismatch && e.actual === "404") throw new Skip("trasa fikcji zapoznania nie istnieje (404)");
    throw e;
  }
  includes(screen.html, 'name="reason"', "formularz fikcji zapoznania");
  await s.post(`/cycles/${id}/assessment/fiction`, [], 422);
  await s.post(`/cycles/${id}/assessment/fiction`, [
    ["reason", "could_not"],
    ["deliveryMethod", "post"],
    ["deliveredOn", "2026-11-21"],
  ]);
  const tl = await s.get(`/cycles/${id}/timeline`);
  includes(tl.html, "30.11.2026", "termin sprzeciwu 30.11.2026 po fikcji zapoznania");
  return "fikcja zapoznania: 422 bez danych, 303 po uzupełnieniu, termin sprzeciwu 30.11.2026";
}

/** Przechodzi cały pokaz w nowej sesji. Kroki od pierwszego błędu do końca zasadniczego przebiegu są „pominięte”. */
export async function runDemo(fetcher: Fetcher, options: DemoOptions = {}): Promise<StepResult[]> {
  const results: StepResult[] = [];
  const push = (r: StepResult) => {
    results.push(r);
    options.onResult?.(r);
  };
  const attempt = async (step: string, description: string, body: () => Promise<string | void>): Promise<boolean> => {
    try {
      const detail = await body();
      push({ step, status: "ok", description: detail || description });
      return true;
    } catch (e) {
      if (e instanceof Skip) push({ step, status: "skipped", description, detail: e.message });
      else if (e instanceof Mismatch) push({ step, status: "error", description, detail: e.message });
      else push({ step, status: "error", description, detail: `oczekiwano przebiegu bez wyjątku, było ${e instanceof Error ? e.message : String(e)}` });
      return false;
    }
  };

  const session = new Session(fetcher);
  const ctx: Ctx = { cycleId: "" };
  let broken = false;
  for (const st of steps) {
    if (broken) {
      push({ step: st.step, status: "skipped", description: st.description, detail: "wcześniejszy krok nie przeszedł" });
      continue;
    }
    broken = !(await attempt(st.step, st.description, () => st.run(session, ctx)));
  }
  await attempt("5c", "fikcja zapoznania w osobnej sesji", () => fictionStep(new Session(fetcher)));
  return results;
}

type TourCheck = (s: Session, screen: Reply) => Promise<string>;
type TourStopCheck = { id: string; title: string; next: string; location: string; facts: TourCheck };

/** Przystanki przewodnika (src/tour/stops.ts, state.ts) z faktami ze „Stanów danych” planu guided-demo-tour. Tytuły i adresy z kodu, bez zdań z ekranu. */
const tourStops: TourStopCheck[] = [
  {
    id: "1",
    title: "Kryteria na początku cyklu",
    next: "1b",
    location: "/cycles/cycle-piotr/part1",
    facts: async (_s, r) => {
      includes(r.html, 'action="/cycles/cycle-piotr/part1/criteria"', "formularz kryteriów Marka");
      excludes(r.html, "/part1/confirm", "potwierdzenie części I (jeszcze nie przekazana)");
      includes(r.html, "27.11.2026", "termin oceny 27.11.2026");
      return "część I jeszcze nieprzekazana, termin oceny 27.11.2026";
    },
  },
  {
    id: "1b",
    title: "Piotr potwierdza kryteria",
    next: "2",
    location: "/cycles/cycle-piotr/part1",
    facts: async (_s, r) => {
      includes(r.html, 'action="/cycles/cycle-piotr/part1/confirm"', "formularz potwierdzenia części I");
      includes(r.html, "Orientacja na klienta/interesanta", "kryterium dodatkowe Orientacja na klienta/interesanta");
      includes(r.html, "Myślenie analityczne", "kryterium dodatkowe Myślenie analityczne");
      return "część I przekazana, kryteria dodatkowe 2, czeka na potwierdzenie Piotra";
    },
  },
  {
    id: "2",
    title: "Notatka w dniu, w którym coś się stało",
    next: "3",
    location: "/people/piotr/notes/new",
    facts: async (s, r) => {
      includes(r.html, 'action="/people/piotr/notes"', "formularz notatki o Piotrze");
      includes(r.html, "11 marca 2026", "data przystanku 11 marca 2026");
      const tl = await s.get("/cycles/cycle-piotr/timeline");
      includes(tl.html, "09.12.2024", "część I potwierdzona 09.12.2024");
      excludes(tl.html, "05.10.2026", "nieobecność Piotra");
      return "11.03.2026, część I potwierdzona, bez nieobecności";
    },
  },
  {
    id: "3",
    title: "Nieobecność przesuwa termin",
    next: "4",
    location: "/cycles/cycle-piotr/absences",
    facts: async (_s, r) => {
      includes(r.html, 'action="/cycles/cycle-piotr/absences"', "formularz nieobecności");
      excludes(r.html, "05.10.2026", "wpisana nieobecność Piotra");
      return "10.11.2026, żadnej nieobecności Piotra";
    },
  },
  {
    id: "4",
    title: "Jedna „1” przesądza o wyniku",
    next: "5",
    location: "/cycles/cycle-piotr/assessment",
    facts: async (s, r) => {
      includes(r.html, 'name="score[rzetelnosc]"', "pole punktów przy Rzetelności");
      includes(r.html, "11.03.2026", "notatka z 11.03.2026");
      excludes(r.html, "/assessment/acknowledge", "zapoznanie (ocena jeszcze niezatwierdzona)");
      const tl = await s.get("/cycles/cycle-piotr/timeline");
      includes(tl.html, "05.10.2026–06.11.2026", "jedna nieobecność 05.10–06.11.2026");
      includes(tl.html, "33 dni", "nieobecność 33 dni");
      return "formularz oceny, dwie nieobecności jako jedna 05.10–06.11.2026 (33 dni)";
    },
  },
  {
    id: "5",
    title: "Zapoznanie i 7 dni na sprzeciw",
    next: "5b",
    location: "/cycles/cycle-piotr/assessment",
    facts: async (s, r) => {
      includes(r.html, 'action="/cycles/cycle-piotr/assessment/acknowledge"', "formularz zapoznania Piotra");
      excludes(r.html, 'name="score[', "pola punktów (ocena zatwierdzona)");
      const tl = await s.get("/cycles/cycle-piotr/timeline");
      includes(tl.html, "21.11.2026", "ocena zatwierdzona 21.11.2026");
      excludes(tl.html, "30.11.2026", "termin sprzeciwu przed zapoznaniem");
      return "ocena zatwierdzona 21.11.2026, zapoznanie jeszcze nie potwierdzone";
    },
  },
  {
    id: "5b",
    title: "Kadry widzą cały urząd",
    next: "done",
    location: "/hr",
    facts: async (s, r) => {
      includes(r.html, "/hr/grades/tomasz", "obowiązek stopnia Tomasza");
      includes(r.html, "14.12.2026", "termin przyznania stopnia 14.12.2026");
      const tl = await s.get("/cycles/cycle-piotr/timeline");
      includes(tl.html, "30.11.2026", "termin sprzeciwu 30.11.2026 po zapoznaniu 22.11.2026");
      includes(r.html, /Rozmowa o kryteriach do:\s*(<[^>]+>)*30\.11\.2026/, "termin kryteriów nowego cyklu Piotra");
      await s.login("marek");
      const home = await s.get("/");
      const cycle = cycleIdFor(home.html, "Piotr Wójcik");
      if (cycle === "cycle-piotr" || cycle === "cycle-piotr-2022") throw new Mismatch("nowego cyklu", cycle);
      includes(home.html, "§ 7 pkt 2", "sprawa Marka z terminem kryteriów po ocenie negatywnej");
      includes(home.html, "Termin ponownej oceny: 23.05.2027", "pierwszy dzień po upływie 6 miesięcy od zapoznania");
      return "stopień Tomasza do 14.12.2026, zapoznanie Piotra, sprzeciw i kryteria nowego cyklu do 30.11.2026";
    },
  },
];

/** Przewodnik pokazu: nowa sesja, `/demo/restart`, potem `POST /tour/<przystanek>` po kolei i `/tour/done`. Kroki: id przystanku albo „done”. */
export async function runTour(fetcher: Fetcher, options: DemoOptions = {}): Promise<StepResult[]> {
  const results: StepResult[] = [];
  const push = (r: StepResult) => {
    results.push(r);
    options.onResult?.(r);
  };
  const s = new Session(fetcher);
  const fail = (step: string, description: string, e: unknown) =>
    push({ step, status: "error", description, detail: e instanceof Mismatch ? e.message : `oczekiwano przebiegu bez wyjątku, było ${e instanceof Error ? e.message : String(e)}` });
  const skip = (step: string, description: string) => push({ step, status: "skipped", description, detail: "wcześniejszy krok nie przeszedł" });

  let broken = false;
  try {
    await s.restart();
  } catch (e) {
    fail("start", "nowa sesja i /demo/restart", e);
    broken = true;
  }
  for (const st of tourStops) {
    const description = `przystanek ${st.id}: ${st.title}`;
    if (broken) {
      skip(st.id, description);
      continue;
    }
    try {
      const go = await s.post(`/tour/${st.id}`, []);
      const loc = go.location ?? "";
      equal(loc, st.location, `przekierowanie 303 z /tour/${st.id}`);
      const screen = await s.get(loc);
      includes(screen.html, st.title, `tytuł przystanku „${st.title}”`);
      includes(screen.html, st.next === "done" ? 'action="/tour/done"' : `action="/tour/${st.next}"`, `formularz „Dalej” do /tour/${st.next}`);
      const facts = await st.facts(s, screen);
      push({ step: st.id, status: "ok", description: `${description}: 303 → ${loc}, ${facts}` });
    } catch (e) {
      fail(st.id, description, e);
      broken = true;
    }
  }
  if (broken) {
    skip("done", "ekran końcowy przewodnika");
    return results;
  }
  try {
    const done = await s.get("/tour/done");
    includes(done.html, 'action="/tour/1"', "formularz powtórki od przystanku 1");
    push({ step: "done", status: "ok", description: "ekran końcowy /tour/done: 200, powtórka od przystanku 1" });
  } catch (e) {
    fail("done", "ekran końcowy przewodnika", e);
  }
  return results;
}
