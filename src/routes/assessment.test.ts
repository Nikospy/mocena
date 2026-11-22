import { describe, expect, test } from "bun:test";
import { assessmentState, type AssessmentSnapshot } from "../assessment/state";
import { cycleLinks } from "../cycle-links";
import { cycleById, effectiveDeadline, openCycle } from "../cycles";
import { currentGrade, personById } from "../people";
import { getDb } from "../db";
import { mandatoryCriteria } from "../engine/scoring";
import { officeSettings } from "../office-settings";
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
    const html = await r.text();
    expect(html).toContain("§ 11 ust. 3");
    // Podsumowanie błędów prowadzi do pola uzasadnienia; lista braków przy zatwierdzaniu zostaje.
    expect(html).toContain("Oceny nie można jeszcze zatwierdzić");
    expect(html).toContain('href="#justification"');
    expect(html).toContain('id="justification-error"');
    expect(html).toContain("Do zatwierdzenia brakuje");
    expect(events("assessment_approved")).toHaveLength(0);
  });

  test("zatwierdzenie bez ocen: odnośnik do kryteriów i do wniosków rozwojowych", async () => {
    const app = fresh();
    const html = await (await call(app, "marek", `/cycles/${piotr}/assessment/approve`, {})).text();
    expect(html).toContain('href="#h-crits"');
    expect(html).toContain('href="#developmentConclusions"');
    expect(html).toContain('id="h-crits" tabindex="-1"');
  });

  test("komplet: 303, pełna migawka, podgląd z terminem z migawki", async () => {
    const app = fresh();
    const r = await approvePiotr(app);
    expect(r.status).toBe(303);
    const ev = events("assessment_approved");
    expect(ev).toHaveLength(1);
    const s = ev[0].payload as AssessmentSnapshot;
    expect(s.periodFrom).toBe("2024-12-09");
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

  test("po pozytywnej ocenie nowy cykl i 30 dni od jej sporządzenia", async () => {
    const app = fresh();
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/approve`, form(PIOTR_IDS, { developmentConclusions: "Kurs." }))).status).toBe(303);
    await setDate(app, "2026-11-22");
    expect((await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {})).status).toBe(303);
    const successor = openCycle("piotr")!;
    expect(successor.period_start).toBe("2026-11-21");
    const home = await (await call(app, "marek", "/")).text();
    expect(home).toContain(`href="/cycles/${successor.id}/part1"`);
    expect(home).toContain("21.12.2026");
    expect(home).toContain("§ 7 pkt 1");
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
    const successor = openCycle("piotr")!;
    expect(successor.id).not.toBe(piotr);
    expect(effectiveDeadline(successor.id).date).toBe("2027-05-22");
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
    expect(m()).toContain("Ocena czeka na zapoznanie: Piotr Wójcik");
    expect(p()).toContain("Zapoznaj się z oceną");
    const cycle = cycleById(piotr)!;
    expect(cycleLinks(cycle, personById("piotr")!).map((l) => l.label)).toContain("Ocena");
    await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {});
    expect(m()).not.toContain("Ocena czeka na zapoznanie: Piotr Wójcik");
    expect(m().join()).toContain("Wyznacz kryteria oceny: Piotr Wójcik, do 30.11.2026 (§ 7 pkt 2)");
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
    expect(header).toBe("<h1>Ocena okresowa: Piotr Wójcik</h1>");
    await approvePiotr(app);
    const view = await (await call(app, "piotr", `/cycles/${piotr}/assessment`)).text();
    expect(outside(view)).not.toMatch(/Ocena (negatywna|pozytywna)|6,14/);
    const home = await (await call(app, "marek", "/")).text();
    expect(home).toMatch(/<h2><a class="task-link" href="[^"]+">Ocena czeka na zapoznanie: Piotr Wójcik<\/a><\/h2>/);
    expect(home).toContain('href="/cycles/cycle-piotr/assessment"');
    expect(home).not.toMatch(/Ocena (negatywna|pozytywna)|6,14/);
    const part1 = await (await call(app, "marek", `/cycles/${piotr}/part1`)).text();
    expect(part1).toContain(">Ocena</a>");
    for (const h of [edit, view, home, part1]) expect(h.toLowerCase()).not.toContain("podpis");
  });
});

describe("fikcja zapoznania i wgląd kadr", () => {
  const good = { reason: "would_not", deliveryMethod: "post", deliveredOn: "2026-11-22" };
  const closing = () => visibleEvents(piotr).filter((e) => e.type === "assessment_acknowledged" || e.type === "acknowledgement_fiction");

  test("422 przy braku wyboru, sposobu albo daty, z datą po today() i przed zatwierdzeniem", async () => {
    const app = fresh("2026-11-21");
    await approvePiotr(app);
    await setDate(app, "2026-11-22");
    const post = (p: Record<string, string>) => call(app, "marek", `/cycles/${piotr}/assessment/fiction`, p);
    const r = await post({ ...good, reason: "" });
    expect(r.status).toBe(422);
    expect(await r.text()).toContain("Wybierz, czy oceniany nie mógł, czy nie chciał potwierdzić zapoznania.");
    for (const bad of [{ deliveryMethod: "" }, { deliveredOn: "" }, { deliveredOn: "2026-11-23" }, { deliveredOn: "2026-11-20" }]) {
      const rr = await post({ ...good, ...bad });
      expect(rr.status).toBe(422);
      expect(await rr.text()).toMatch(/Wybierz, jak doręczono kopię arkusza\.|Wybierz z kalendarza datę doręczenia kopii arkusza/);
    }
    expect(closing()).toHaveLength(0);
  });

  test("403 dla Piotra i Joanny; would_not 22.11.2026 daje termin 30.11.2026, potem potwierdzenie Piotra 409", async () => {
    const app = fresh("2026-11-21");
    await approvePiotr(app);
    await setDate(app, "2026-11-22");
    for (const who of ["piotr", "joanna"]) {
      expect((await call(app, who, `/cycles/${piotr}/assessment/fiction`, good)).status).toBe(403);
      expect((await call(app, who, `/cycles/${piotr}/assessment/fiction`)).status).toBe(403);
    }
    const screen = await (await call(app, "marek", `/cycles/${piotr}/assessment/fiction`)).text();
    expect(screen).toContain("Od dziś system liczy 7 dni na sprzeciw");
    expect(screen).toContain("30.11.2026");
    expect(screen).not.toMatch(/biegnie|podpis/i);
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/fiction`, good)).status).toBe(303);
    expect(events("acknowledgement_fiction")[0].payload).toEqual({ ...good, objectionDeadline: "2026-11-30" });
    expect((await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {})).status).toBe(409);
    expect(closing()).toHaveLength(1);
    const successor = openCycle("piotr")!;
    expect(successor.id).not.toBe(piotr);
    expect(effectiveDeadline(successor.id).date).toBe("2027-05-23");
  });

  test("dniem zapoznania przy fikcji jest dzień wpisu, nie dzień doręczenia (ustalenie 3 audytu)", async () => {
    const app = fresh("2026-11-21");
    await approvePiotr(app);
    await setDate(app, "2026-11-22");
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/fiction`, { reason: "could_not", deliveryMethod: "post", deliveredOn: "2026-11-21" })).status).toBe(303);
    const successor = openCycle("piotr")!;
    const started = visibleEvents(successor.id).find((e) => e.type === "cycle_started")!;
    expect(started.payload.previousAcknowledgedOn).toBe("2026-11-22");
    expect(successor.period_start).toBe("2026-11-22");
    expect(effectiveDeadline(successor.id).date).toBe("2027-05-23");
    const tl = await (await call(app, "marek", `/cycles/${piotr}/timeline`)).text();
    expect(tl).toContain('<time datetime="2026-11-22">22.11.2026</time><div class="tl-body"><b>Fikcja zapoznania z oceną</b><p class="tl-detail">Kopię arkusza doręczono 21.11.2026.</p>');
    expect(await (await call(app, "joanna", `/cycles/${piotr}/assessment`)).text()).toContain("21.11.2026");
  });

  test("potwierdzenie, potem fikcja: 409; równoczesne żądania zostawiają jedno zdarzenie końcowe", async () => {
    const app = fresh("2026-11-22");
    await approvePiotr(app);
    await call(app, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {});
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/fiction`, good)).status).toBe(409);
    expect(closing()).toHaveLength(1);

    const app2 = fresh("2026-11-22");
    await approvePiotr(app2);
    await Promise.all([
      call(app2, "piotr", `/cycles/${piotr}/assessment/acknowledge`, {}),
      call(app2, "marek", `/cycles/${piotr}/assessment/fiction`, good),
    ]);
    expect(closing()).toHaveLength(1);
  });

  test("Joanna widzi wpis o fikcji bez przycisków; odnośnik „Ocena” dla kadr dopiero od zatwierdzenia", async () => {
    const app = fresh("2026-11-21");
    const joanna = personById("joanna")!;
    const links = () => cycleLinks(cycleById(piotr)!, joanna).map((l) => l.label);
    expect(links()).not.toContain("Ocena");
    expect(await (await call(app, "joanna", `/cycles/${piotr}/assessment`)).text()).toContain("Ocena nie jest jeszcze zatwierdzona");
    await approvePiotr(app);
    expect(links()).toContain("Ocena");
    await setDate(app, "2026-11-22");
    await call(app, "marek", `/cycles/${piotr}/assessment/fiction`, good);
    const html = await (await call(app, "joanna", `/cycles/${piotr}/assessment`)).text();
    expect(html).toContain("Zapoznanie uznane za dokonane: Piotr Wójcik");
    expect(html).toContain("nie chciał potwierdzić");
    expect(html).toContain("pocztą");
    expect(html).toContain("30.11.2026");
    expect(html.slice(html.indexOf("<main"))).not.toContain("<button");
    expect(html).not.toContain("Wpisz fikcję");
    expect(html).not.toContain("Potwierdzam zapoznanie");
  });
});

describe("dodatki: podgląd, pole wniosku o stopień, data rozmowy", () => {
  test("podgląd: 200, wynik negatywny, nic nie zapisuje; także przy ocenie spoza skali; Piotr 403", async () => {
    const app = fresh();
    const count = () => (getDb().query("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n;
    const before = count();
    const r = await call(app, "marek", `/cycles/${piotr}/assessment/preview`, form(PIOTR_IDS, {}, ["rzetelnosc"]));
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("Ocena negatywna");
    const bad = await call(app, "marek", `/cycles/${piotr}/assessment/preview`, form(PIOTR_IDS, { "score[rzetelnosc]": "4" }));
    expect(bad.status).toBe(200);
    expect(await bad.text()).toContain("musi wynosić 1, 3, 5, 7 albo 9");
    expect((await call(app, "piotr", `/cycles/${piotr}/assessment/preview`, form(PIOTR_IDS))).status).toBe(403);
    expect(count()).toBe(before);
  });

  test("formularz Tomasza ma pole wniosku o stopień, formularz Piotra nie", async () => {
    const app = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } }).app;
    expect(await (await call(app, "anna", `/cycles/${tomasz}/assessment`)).text()).toContain('name="gradeRequestAttached"');
    const p = await (await call(app, "marek", `/cycles/${piotr}/assessment`)).text();
    expect(p).not.toContain("gradeRequestAttached");
    expect(p).toContain('src="/assessment.js"');
  });

  test("data rozmowy z przyszłości: 422 i brak zdarzenia; poprawna trafia do migawki", async () => {
    const app = fresh();
    const future = form(PIOTR_IDS, { interviewDate: "2026-11-22", developmentConclusions: "x" });
    expect((await call(app, "marek", `/cycles/${piotr}/assessment`, future)).status).toBe(422);
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/approve`, future)).status).toBe(422);
    expect(visibleEvents(piotr).filter((e) => e.type.startsWith("assessment_"))).toHaveLength(0);
    const ok = form(PIOTR_IDS, { interviewDate: "2026-11-20", developmentConclusions: "x" });
    expect((await call(app, "marek", `/cycles/${piotr}/assessment/approve`, ok)).status).toBe(303);
    expect((events("assessment_approved")[0].payload as AssessmentSnapshot).interviewDate).toBe("2026-11-20");
  });
});

describe("S-04: notatki w formularzu oceny", () => {
  test("krok 4: notatki przy kryteriach, jedno ostrzeżenie, karta rozmowy i odnośniki", async () => {
    const app = fresh();
    const html = await (await call(app, "marek", `/cycles/${piotr}/assessment`)).text();
    expect(html).toContain("Notatka z 04.08.2025: „Interesant dzwonił");
    expect(html).toContain("<h1>Ocena okresowa: Piotr Wójcik</h1>");
    expect(html).toContain('data-target="developmentConclusions"');
    expect(html.match(/Wszystkie notatki przy tym kryterium są z ostatniego miesiąca/g)).toHaveLength(1);
    const think = html.slice(html.indexOf('data-crit="myslenie-analityczne"'));
    expect(think.slice(0, think.indexOf("</article>"))).toContain("Brak notatek przy tym kryterium");
    expect(html).toContain(`/cycles/${piotr}/cards/assessment-conversation`);
    expect((await call(app, "piotr", `/cycles/${piotr}/assessment`)).status).toBe(200);
    const pHtml = await (await call(app, "piotr", `/cycles/${piotr}/assessment`)).text();
    expect(pHtml).not.toContain("Pismo do gminy");

    const card = await call(app, "marek", `/cycles/${piotr}/cards/assessment-conversation`);
    expect(card.status).toBe(200);
    const cardHtml = await card.text();
    expect(cardHtml).toContain("§ 10");
    expect(cardHtml).toContain("kierunki dalszego rozwoju zawodowego");
    expect((await call(app, "piotr", `/cycles/${piotr}/cards/assessment-conversation`)).status).toBe(403);

    const part1 = await (await call(app, "marek", `/cycles/${piotr}/part1`)).text();
    expect(part1).toContain(`/cycles/${piotr}/cards/assessment-conversation`);
    expect(await (await call(app, "piotr", `/cycles/${piotr}/part1`)).text()).not.toContain("assessment-conversation");
  });
});

test("arkusz A wymaga adresata sprzeciwu i zachowuje adresata w zatwierdzonej ocenie", async () => {
  const { app, db } = createTestApp({ today: "2026-11-22" });
  db.query("UPDATE people SET has_account = 1 WHERE id IN ('office-head', 'office-head-supervisor')").run();
  const id = "cycle-office-head";
  const path = `/cycles/${id}/assessment`;
  const actor = "office-head-supervisor";
  const print = () => call(app, "joanna", `/cycles/${id}/sheet?print=1`).then((r) => r.text());
  const emptySheet = await print();
  expect(emptySheet).toContain("Sprzeciw przysługuje do:");
  expect(emptySheet).not.toContain("sprzeciw do kierownika urzędu");
  const draft = form(mandatoryCriteria("A"), { developmentConclusions: "Kurs." });
  const denied = await call(app, actor, `${path}/approve`, { ...draft, objectionRecipient: "  " });
  expect(denied.status).toBe(422);
  expect(await denied.text()).toContain("Wpisz, do kogo przysługuje sprzeciw.");
  expect(assessmentState(id).snapshot).toBeNull();

  const config = officeSettings().sheetAObjectionRecipient;
  const original = config.value;
  try {
    db.query("DELETE FROM events WHERE cycle_id = ? AND type = 'assessment_draft_saved'").run(id);
    config.value = "Organu wskazanego przez urząd";
    expect(await (await call(app, actor, path)).text()).toContain('value="Organu wskazanego przez urząd"');
    const entered = "Właściwego organu nadzorującego";
    expect((await call(app, actor, `${path}/approve`, { ...draft, objectionRecipient: entered })).status).toBe(303);
    config.value = "";
    expect(assessmentState(id).snapshot?.objectionRecipient).toBe(entered);
    expect(await print()).toContain(entered);
    expect((await call(app, "office-head", `${path}/acknowledge`, {})).status).toBe(303);
    expect(await (await call(app, "office-head", path)).text()).toContain(`Sprzeciw do ${entered}`);
  } finally {
    config.value = original;
  }
});
