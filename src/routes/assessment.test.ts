import { describe, expect, test } from "bun:test";
import { assessmentState, type AssessmentSnapshot } from "../assessment/state";
import { cycleLinks } from "../cycle-links";
import { cycleById, effectiveDeadline, openCycle } from "../cycles";
import { currentGrade, personById } from "../people";
import { rulesVersion } from "../engine/rules";
import { seedEvent, visibleEvents } from "../events";
import { homeTasks } from "../home-tasks";
import { createTestApp } from "../test-helpers";

type App = ReturnType<typeof createTestApp>["app"];
const piotr = "cycle-piotr";
const tomasz = "cycle-tomasz";

async function call(app: App, as: string, path: string, params?: Record<string, string>) {
  const headers: Record<string, string> = { cookie: `person_id=${as}` };
  let body: string | undefined;
  if (params) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(params).toString();
  }
  return app.request(path, { method: params ? "POST" : "GET", headers, body, redirect: "manual" });
}

const PIOTR_IDS = ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja", "orientacja-na-klienta", "myslenie-analityczne"];
const TOMASZ_IDS = ["zarzadzanie-ludzmi", "podejmowanie-decyzji", "organizacja-pracy", "wspolpraca", "komunikacja"];

function form(ids: string[], over: Record<string, string> = {}, ones: string[] = []): Record<string, string> {
  const p: Record<string, string> = { justification: "", developmentConclusions: "", interviewDate: "" };
  for (const id of ids) p[`score[${id}]`] = ones.includes(id) ? "1" : "7";
  return { ...p, ...over };
}

const events = (type: string, cycle = piotr) => visibleEvents(cycle).filter((e) => e.type === type);
const setDate = (app: App, date: string) => call(app, "marek", "/demo/date", { date });
const fresh = (today = "2026-11-21") => createTestApp({ today, seedOptions: { afterStep1: true } }).app;

function stripResult(html: string): string {
  return html.replace(/<section class="rule res[^"]*" id="assessment-result"[\s\S]*?<\/section>/, "");
}

async function approvePiotr(app: App) {
  return call(app, "marek", `/cycles/${piotr}/assessment/approve`, form(PIOTR_IDS, { developmentConclusions: "Kurs pism urzędowych.", justification: "Powód oceny." }, ["rzetelnosc"]));
}

describe("krok 4 pokazu: ocena i blokady", () => {
  test("„1” przy Rzetelności i „Zapisz”: wynik negatywny mimo średniej 6,14, uzasadnienie wymagane", async () => {
    const app = fresh();
    const r = await call(app, "marek", `/cycles/${piotr}/assessment`, form(PIOTR_IDS, {}, ["rzetelnosc"]));
    expect(r.status).toBe(303);
    expect(events("assessment_draft_saved")).toHaveLength(1);
    const html = await (await call(app, "marek", `/cycles/${piotr}/assessment`)).text();
    expect(html).toContain("Ocena negatywna");
    expect(html).toContain("powyżej oczekiwań");
    expect(html).toContain("6,14");
    expect(html).toContain("§ 11 ust. 1 pkt 4");
    expect(html).toMatch(/Uzasadnienie oceny[\s\S]*wymagane<\/span>/);
    expect(html).toContain("Ten tekst przeczyta pracownik");
  });

  test("zatwierdzenie bez wniosków do IPRZ: 422 z przepisem, brak zdarzenia", async () => {
    const app = fresh();
    const r = await call(app, "marek", `/cycles/${piotr}/assessment/approve`, form(PIOTR_IDS, { justification: "Powód." }, ["rzetelnosc"]));
    expect(r.status).toBe(422);
    const html = await r.text();
    expect(html).toContain("art. 81 ust. 5 ustawy");
    expect(events("assessment_approved")).toHaveLength(0);
    expect(assessmentState(piotr).stage).toBe("draft");
  });

  test("wynik negatywny bez uzasadnienia: 422 z § 11 ust. 3", async () => {
    const app = fresh();
    const r = await call(app, "marek", `/cycles/${piotr}/assessment/approve`, form(PIOTR_IDS, { developmentConclusions: "Kurs." }, ["rzetelnosc"]));
    expect(r.status).toBe(422);
    expect(await r.text()).toContain("§ 11 ust. 3");
    expect(events("assessment_approved")).toHaveLength(0);
  });

  test("komplet: 303, pełna migawka, podgląd z terminem z migawki", async () => {
    const app = fresh();
    const r = await approvePiotr(app);
    expect(r.status).toBe(303);
    const ev = events("assessment_approved");
    expect(ev).toHaveLength(1);
    const s = ev[0].payload as AssessmentSnapshot;
    expect(s.periodFrom).toBe("2024-11-27");
    expect(s.deadline).toEqual(effectiveDeadline(piotr));
    expect(s.deadline.date).toBe("2026-11-27");
    expect(s.grade).toBeNull();
    expect(s.gradeAwardedOn).toBeNull();
    expect(s.rulesVersion).toEqual(rulesVersion());
    expect(s.confirmation).toEqual({ place: "Rzeszów", date: "2026-11-21", name: "Marek Zieliński" });
    expect(s.result.outcome).toBe("negative");
    expect(s.criteria).toHaveLength(7);
    const html = await (await call(app, "marek", `/cycles/${piotr}/assessment`)).text();
    expect(html).toContain("27.11.2026");
    expect(html).toContain("Potwierdzenie w systemie: Rzeszów, 21.11.2026, Marek Zieliński");
    expect(html).not.toContain("<form method=\"post\" action=\"/cycles/cycle-piotr/assessment\"");
  });
});

describe("bezpośrednie żądania z pominięciem formularza", () => {
  test("403 dla innych niż oceniający; zapis i zatwierdzenie", async () => {
    const app = fresh();
    for (const who of ["piotr", "joanna", "ewa"]) {
      expect((await call(app, who, `/cycles/${piotr}/assessment`, form(PIOTR_IDS))).status).toBe(403);
      expect((await call(app, who, `/cycles/${piotr}/assessment/approve`, form(PIOTR_IDS, { developmentConclusions: "x" }))).status).toBe(403);
    }
    expect(events("assessment_draft_saved")).toHaveLength(0);
    expect(events("assessment_approved")).toHaveLength(0);
  });

  test("bez potwierdzonej części I: 409, brak formularza i zapisu", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    const r = await call(app, "marek", `/cycles/${piotr}/assessment`, form(PIOTR_IDS));
    expect(r.status).toBe(409);
    const html = await (await call(app, "marek", `/cycles/${piotr}/assessment`)).text();
    expect(html).toContain("Ocena nie może powstać bez potwierdzonej części I");
    expect(html).not.toContain('id="assessment-form"');
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/approve`, form(PIOTR_IDS, { developmentConclusions: "x" }))).status).toBe(409);
    expect(visibleEvents(piotr).filter((e) => e.type.startsWith("assessment_"))).toHaveLength(0);
  });

  test("422: kryterium spoza cyklu, wartość 4, brak oceny, wniosek o stopień u pracownika", async () => {
    const app = fresh();
    const bad = [
      form(PIOTR_IDS, { "score[negocjowanie]": "5" }),
      form(PIOTR_IDS, { "score[rzetelnosc]": "4" }),
    ];
    for (const b of bad) {
      expect((await call(app, "marek", `/cycles/${piotr}/assessment`, b)).status).toBe(422);
      expect((await call(app, "marek", `/cycles/${piotr}/assessment/approve`, { ...b, developmentConclusions: "x" })).status).toBe(422);
    }
    const missing = form(PIOTR_IDS.slice(1), { developmentConclusions: "x" });
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/approve`, missing)).status).toBe(422);
    const gr = form(PIOTR_IDS, { developmentConclusions: "x", gradeRequestAttached: "1", gradeMotivation: "m" });
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/approve`, gr)).status).toBe(422);
    expect(events("assessment_approved")).toHaveLength(0);
  });

  test("dwa kolejne approve: drugie 409, jedno zdarzenie; zapis szkicu po zatwierdzeniu 409", async () => {
    const app = fresh();
    expect((await approvePiotr(app)).status).toBe(303);
    expect((await approvePiotr(app)).status).toBe(409);
    expect(events("assessment_approved")).toHaveLength(1);
    const before = events("assessment_draft_saved").length;
    expect((await call(app, "marek", `/cycles/${piotr}/assessment`, form(PIOTR_IDS))).status).toBe(409);
    expect(events("assessment_draft_saved")).toHaveLength(before);
  });

  test("po potwierdzeniu przez Piotra zapis i approve odpowiadają 409", async () => {
    const app = fresh();
    await approvePiotr(app);
    expect((await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {})).status).toBe(303);
    expect((await call(app, "marek", `/cycles/${piotr}/assessment`, form(PIOTR_IDS))).status).toBe(409);
    expect((await approvePiotr(app)).status).toBe(409);
    expect(events("assessment_approved")).toHaveLength(1);
  });
});

describe("wniosek o stopień (Tomasz, 2026-11-10)", () => {
  const ok = { developmentConclusions: "Kurs zarządzania." };
  const app10 = () => createTestApp({ today: "2026-11-10" }).app;

  test("pozytywna: bez umotywowania 422, z umotywowaniem stopień docelowy o jeden wyższy", async () => {
    const app = app10();
    const base = form(TOMASZ_IDS, { ...ok, gradeRequestAttached: "1" });
    expect((await call(app, "anna", `/cycles/${tomasz}/assessment/approve`, base)).status).toBe(422);
    expect(events("assessment_approved", tomasz)).toHaveLength(0);
    expect((await call(app, "anna", `/cycles/${tomasz}/assessment/approve`, { ...base, gradeMotivation: "Wyróżnia się." })).status).toBe(303);
    const s = events("assessment_approved", tomasz)[0].payload as AssessmentSnapshot;
    expect(s.gradeRequest.targetGrade).toBe(6);
    expect(s.grade).toBe(currentGrade("tomasz").grade === "V" ? 5 : -1);
    expect(s.gradeAwardedOn).toBe(currentGrade("tomasz").awardedOn);
  });

  test("negatywna: 422; po nadaniu stopnia IX: 422", async () => {
    const app = app10();
    const neg = form(TOMASZ_IDS, { ...ok, gradeRequestAttached: "1", gradeMotivation: "m", justification: "x" }, ["wspolpraca"]);
    expect((await call(app, "anna", `/cycles/${tomasz}/assessment/approve`, neg)).status).toBe(422);
    seedEvent("mandatory_grade_awarded", tomasz, "anna", { personId: "tomasz", fromGrade: 5, toGrade: 9, basis: "t" }, "2026-11-10");
    expect(currentGrade("tomasz").grade).toBe(9);
    const pos = form(TOMASZ_IDS, { ...ok, gradeRequestAttached: "1", gradeMotivation: "m" });
    expect((await call(app, "anna", `/cycles/${tomasz}/assessment/approve`, pos)).status).toBe(422);
    expect(events("assessment_approved", tomasz)).toHaveLength(0);
  });
});

describe("krok 5 pokazu: potwierdzenie i zegar", () => {
  test("22.11.2026: termin 30.11.2026; 21.11.2026 także", async () => {
    for (const day of ["2026-11-21", "2026-11-22"]) {
      const app = fresh();
      await approvePiotr(app);
      if (day !== "2026-11-21") await setDate(app, day);
      expect((await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {})).status).toBe(303);
      const ev = events("assessment_acknowledged");
      expect(ev).toHaveLength(1);
      expect(ev[0].payload).toEqual({ place: "Rzeszów", date: day, name: "Piotr Wójcik", objectionDeadline: "2026-11-30" });
      const html = await (await call(app, "piotr", `/cycles/${piotr}/assessment`)).text();
      expect(html).toContain("30.11.2026");
      expect(html).toContain("Potwierdzenie w systemie: Rzeszów");
    }
  });

  test("zegar: ostatni dzień, po terminie; payload bez zmian; w etapie approved zegara nie ma", async () => {
    const app = fresh("2026-11-22");
    await approvePiotr(app);
    expect(await (await call(app, "piotr", `/cycles/${piotr}/assessment`)).text()).not.toContain("objection-clock");
    await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {});
    await setDate(app, "2026-11-30");
    expect(await (await call(app, "piotr", `/cycles/${piotr}/assessment`)).text()).toContain("ostatni dzień");
    await setDate(app, "2026-12-01");
    expect(await (await call(app, "piotr", `/cycles/${piotr}/assessment`)).text()).toContain("Termin na sprzeciw minął 30.11.2026");
    expect(events("assessment_acknowledged")[0].payload.objectionDeadline).toBe("2026-11-30");
  });

  test("Marek 403, przed zatwierdzeniem 409, drugie potwierdzenie 409 i jedno zdarzenie", async () => {
    const app = fresh();
    expect((await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {})).status).toBe(409);
    await approvePiotr(app);
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/acknowledge`, {})).status).toBe(403);
    expect((await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {})).status).toBe(303);
    expect((await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {})).status).toBe(409);
    expect(events("assessment_acknowledged")).toHaveLength(1);
    expect(openCycle("piotr")).toBeNull();
  });
});

describe("lista spraw, odnośniki, etykiety", () => {
  test("Marek i Piotr trafiają do oceny; po potwierdzeniu pozycje znikają; Piotr przed zatwierdzeniem nie widzi oceny", async () => {
    const app = fresh();
    const m = () => homeTasks(personById("marek")!).map((t) => t.title);
    const p = () => homeTasks(personById("piotr")!).map((t) => t.title);
    expect(m()).toContain("Wystaw ocenę: Piotr Wójcik");
    expect(p()).not.toContain("Zapoznaj się z oceną");
    expect(await (await call(app, "piotr", `/cycles/${piotr}/assessment`)).text()).toContain("Ocena nie jest jeszcze zatwierdzona");
    await approvePiotr(app);
    expect(m()).toContain("Czeka na potwierdzenie zapoznania: Piotr Wójcik");
    expect(p()).toContain("Zapoznaj się z oceną");
    const cycle = cycleById(piotr)!;
    expect(cycleLinks(cycle, personById("piotr")!).map((l) => l.label)).toContain("Ocena");
    await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {});
    expect(m().join()).not.toContain("Piotr");
    expect(p()).not.toContain("Zapoznaj się z oceną");
  });

  test("przy nazwisku ocenianego nie ma wyniku ani etykiety; wynik tylko w #assessment-result", async () => {
    const app = fresh();
    await call(app, "marek", `/cycles/${piotr}/assessment`, form(PIOTR_IDS, {}, ["rzetelnosc"]));
    const outside = (html: string) => stripResult(html);
    const edit = await (await call(app, "marek", `/cycles/${piotr}/assessment`)).text();
    expect(edit).toContain('id="assessment-result"');
    expect(outside(edit)).not.toMatch(/Ocena (negatywna|pozytywna)|średnia|6,14/);
    const header = /<h1>[^<]*<\/h1>/.exec(edit)![0];
    expect(header).toBe("<h1>Piotr Wójcik</h1>");
    await approvePiotr(app);
    const view = await (await call(app, "piotr", `/cycles/${piotr}/assessment`)).text();
    expect(outside(view)).not.toMatch(/Ocena (negatywna|pozytywna)|6,14/);
    const home = await (await call(app, "marek", "/")).text();
    expect(home).toMatch(/<a href="\/cycles\/cycle-piotr\/assessment">Czeka na potwierdzenie zapoznania: Piotr Wójcik<\/a>/);
    expect(home).not.toMatch(/Ocena (negatywna|pozytywna)|6,14/);
    const part1 = await (await call(app, "marek", `/cycles/${piotr}/part1`)).text();
    expect(part1).toContain(">Ocena</a>");
    for (const h of [edit, view, home, part1]) expect(h.toLowerCase()).not.toContain("podpis");
  });
});
