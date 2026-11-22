import { describe, expect, test } from "bun:test";
import { getDb } from "../db";
import { createTestApp } from "../test-helpers";
import { call, html, type App } from "./hr-test-helpers";

const CYCLE = "/cycles/cycle-katarzyna";

function setToday(d: string) {
  getDb().query("UPDATE settings SET value = ? WHERE key = 'demo_date'").run(d);
}

function ids(): string[] {
  return (getDb().query("SELECT criterion_id AS id FROM cycle_criteria WHERE cycle_id = 'cycle-katarzyna' ORDER BY rowid").all() as { id: string }[]).map((r) => r.id);
}

function form(scores: number[]): Record<string, string> {
  const f: Record<string, string> = { justification: "", developmentConclusions: "Szkolenie z zarządzania zespołem w ciągu roku.", interviewDate: "2026-11-22" };
  ids().forEach((id, i) => (f[`score[${id}]`] = String(scores[i])));
  return f;
}

async function redone(): Promise<App> {
  const { app } = createTestApp({ today: "2026-11-22" });
  // W danych pokazowych Katarzyna nie ma konta (pokaz idzie oczami Anny i kadr); w testach loguje się, żeby potwierdzić zapoznanie.
  getDb().query("UPDATE people SET has_account = 1 WHERE id = 'katarzyna'").run();
  const r = await call(app, "joanna", `${CYCLE}/objection-outcome`, { outcome: "redone" });
  expect(r.status).toBe(303);
  return app;
}

describe("ocena sporządzona po raz drugi (art. 83 ust. 4 ustawy)", () => {
  test("Anna otwiera formularz wypełniony pierwszą oceną, z terminem i zwiniętą pierwszą oceną", async () => {
    const app = await redone();
    const page = await html(app, "anna", `${CYCLE}/assessment`);
    expect(page).toContain('id="assessment-form"');
    expect(page).toContain("sporządzasz ocenę po raz drugi do 04.12.2026");
    expect(page).toContain("Pierwsza ocena z dnia 16.11.2026");
    for (const id of ids()) expect(page).toContain(`name="score[${id}]" value="5" checked`);
    expect(page).toContain("Szkolenie z zarządzania zespołem w ciągu roku.");
    const home = await html(app, "anna", "/");
    expect(home).toContain("Sporządź ocenę po raz drugi");
    expect(home).toContain(`${CYCLE}/assessment`);
  });

  test("ocena cząstkowa niższa niż w pierwszej: 422 przy kryterium, bez zatwierdzenia", async () => {
    const app = await redone();
    const r = await call(app, "anna", `${CYCLE}/assessment/approve`, form([3, 5, 5, 5, 5]));
    expect(r.status).toBe(422);
    const body = await r.text();
    expect(body).toContain("Ocena sporządzona po raz drugi nie może być niższa niż pierwsza");
    expect(body).toContain(`href="#score-${ids()[0]}"`);
    const approvals = getDb().query("SELECT COUNT(*) AS n FROM events WHERE cycle_id = 'cycle-katarzyna' AND type = 'assessment_approved'").get() as { n: number };
    expect(approvals.n).toBe(1);
  });

  test("równa albo wyższa: 303, nowe zatwierdzenie z oznaczeniem, pierwsza w historii, arkusz z dopiskiem", async () => {
    const app = await redone();
    const r = await call(app, "anna", `${CYCLE}/assessment/approve`, form([7, 5, 5, 5, 5]));
    expect(r.status).toBe(303);
    const rows = getDb().query("SELECT payload FROM events WHERE cycle_id = 'cycle-katarzyna' AND type = 'assessment_approved' ORDER BY id").all() as { payload: string }[];
    expect(rows.length).toBe(2);
    expect(JSON.parse(rows[0].payload).redo).toBeUndefined();
    expect(JSON.parse(rows[1].payload).redo).toEqual({ objectionFiledOn: "2026-11-20", firstApprovedOn: "2026-11-16" });
    expect(JSON.parse(rows[1].payload).deadline).toEqual({ date: "2026-12-04", basis: ["art. 83 ust. 3 ustawy"] });
    const view = await html(app, "anna", `${CYCLE}/assessment`);
    expect(view).toContain("Ocena sporządzona po raz drugi po uwzględnieniu sprzeciwu z dnia 20.11.2026");
    expect(view).toContain("Pierwsza ocena z dnia 16.11.2026");
    const sheet = await html(app, "joanna", `${CYCLE}/sheet`);
    expect(sheet).toContain("Ocena sporządzona po raz drugi po uwzględnieniu sprzeciwu z dnia 20.11.2026");
    const tl = await html(app, "anna", `${CYCLE}/timeline`);
    expect(tl).toContain("Ocena zatwierdzona po raz drugi");
    expect((tl.match(/Ocena zatwierdzona/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(await html(app, "anna", "/")).not.toContain("Sporządź ocenę po raz drugi");
    const json = (await (await call(app, "joanna", `${CYCLE}/assessment/export.json`)).json()) as any;
    expect(json.assessment.redo.objectionFiledOn).toBe("2026-11-20");
    expect(json.assessment.scores[ids()[0]]).toBe(7);
    expect(json.acknowledgement).toBeNull();
    expect(await html(app, "joanna", "/hr")).toContain("Ocena zatwierdzona (ocena sporządzona po raz drugi), czeka na potwierdzenie zapoznania");
  });

  test("Katarzyna dostaje sprawę zapoznania, potwierdza; zegar sprzeciwu od zapoznania; następny cykl od drugiej oceny", async () => {
    const app = await redone();
    expect((await call(app, "anna", `${CYCLE}/assessment/approve`, form([5, 5, 5, 5, 5]))).status).toBe(303);
    expect(await html(app, "katarzyna", "/")).toContain("Zapoznaj się z oceną sporządzoną po raz drugi");
    setToday("2026-11-24");
    expect((await call(app, "katarzyna", `${CYCLE}/assessment/acknowledge`, {})).status).toBe(303);
    const { assessmentState } = await import("../assessment/state");
    const s = assessmentState("cycle-katarzyna");
    expect(s.stage).toBe("acknowledged");
    expect(s.objectionDeadline).toBe("2026-12-01");
    expect(s.objection).toBeNull();
    expect(s.redo?.first.acknowledgement?.date).toBe("2026-11-17");
    const { cycleState } = await import("../hr/cycle-state");
    const st = cycleState("cycle-katarzyna");
    expect(st.step).toBe("acknowledged");
    expect(st.deadline?.date).toBe("2026-12-01");
    const next = getDb().query("SELECT id, period_start FROM cycles WHERE person_id = 'katarzyna' AND id != 'cycle-katarzyna'").all() as { id: string; period_start: string }[];
    expect(next.length).toBe(1);
    expect(next[0].period_start).toBe("2026-11-22");
    expect(await html(app, "katarzyna", "/")).not.toContain("Zapoznaj się z oceną sporządzoną po raz drugi");
  });

  test("następny cykl założony przy pierwszym zapoznaniu: bez drugiego cyklu, termin liczony od drugiej oceny", async () => {
    const app = await redone();
    // Następny cykl jak po zapoznaniu z pierwszą oceną w aplikacji (dane pokazowe go nie mają).
    const { startNextCycle, cycleById, effectiveDeadline } = await import("../cycles");
    startNextCycle(cycleById("cycle-katarzyna")!, "katarzyna", "2026-11-16", "2026-11-17", "positive");
    const before = getDb().query("SELECT id, period_start FROM cycles WHERE person_id = 'katarzyna' AND id != 'cycle-katarzyna'").get() as { id: string; period_start: string };
    expect(before.period_start).toBe("2026-11-16");
    expect((await call(app, "anna", `${CYCLE}/assessment/approve`, form([5, 7, 5, 5, 5]))).status).toBe(303);
    setToday("2026-11-23");
    expect((await call(app, "katarzyna", `${CYCLE}/assessment/acknowledge`, {})).status).toBe(303);
    const after = getDb().query("SELECT id, period_start FROM cycles WHERE person_id = 'katarzyna' AND id != 'cycle-katarzyna'").all() as { id: string; period_start: string }[];
    expect(after.length).toBe(1);
    expect(after[0].period_start).toBe("2026-11-22");
    expect(effectiveDeadline(after[0].id).date >= "2028-11-22").toBe(true);
  });

  test("fikcja zapoznania działa dla drugiej oceny", async () => {
    const app = await redone();
    expect((await call(app, "anna", `${CYCLE}/assessment/approve`, form([5, 5, 5, 5, 5]))).status).toBe(303);
    const r = await call(app, "anna", `${CYCLE}/assessment/fiction`, { reason: "would_not", deliveryMethod: "post", deliveredOn: "2026-11-22" });
    expect(r.status).toBe(303);
    const { assessmentState } = await import("../assessment/state");
    expect(assessmentState("cycle-katarzyna").stage).toBe("fiction");
    // 29.11.2026 to niedziela: termin przechodzi na poniedziałek (art. 115 Kodeksu cywilnego).
    expect(assessmentState("cycle-katarzyna").objectionDeadline).toBe("2026-11-30");
  });

  test("zastępca Anny sporządza drugą ocenę; oceniana przed zatwierdzeniem widzi zdanie zamiast formularza", async () => {
    const app = await redone();
    getDb()
      .query("INSERT INTO substitutions (absent_id, substitute_id, date_from, date_to, recorded_on, recorded_by) VALUES ('anna', 'marek', '2026-11-20', '2026-12-10', '2026-11-20', 'joanna')")
      .run();
    const own = await html(app, "katarzyna", `${CYCLE}/assessment`);
    expect(own).toContain("oceniający sporządza ocenę po raz drugi do 04.12.2026");
    expect(own).not.toContain('id="assessment-form"');
    const home = await html(app, "marek", "/");
    expect(home).toContain("Sporządź ocenę po raz drugi");
    expect(home).toContain("Katarzyna Lewandowska");
    expect((await call(app, "marek", `${CYCLE}/assessment/approve`, form([5, 5, 5, 5, 3]))).status).toBe(422);
    expect((await call(app, "marek", `${CYCLE}/assessment/approve`, form([5, 5, 5, 5, 5]))).status).toBe(303);
    const last = getDb().query("SELECT payload FROM events WHERE cycle_id = 'cycle-katarzyna' AND type = 'assessment_approved' ORDER BY id DESC").get() as { payload: string };
    expect(JSON.parse(last.payload).on_behalf_of).toBe("anna");
  });
});

test("kadry, CSV i statystyki pokazują drugą ocenę aż do zapoznania", async () => {
  const { cycleById, startNextCycle } = await import("../cycles");
  const { officeStats } = await import("../hr/stats");
  for (const hasSuccessor of [true, false]) {
    const app = await redone();
    if (hasSuccessor) startNextCycle(cycleById("cycle-katarzyna")!, "katarzyna", "2026-11-16", "2026-11-17", "positive");
    const exportRow = async () => {
      const csv = await html(app, "joanna", "/hr/export.csv");
      return csv.split("\r\n").find((line) => line.startsWith("Katarzyna Lewandowska;"))!.split(";");
    };
    setToday("2026-12-04");
    const due = officeStats().overdueOpen;
    setToday("2026-12-06");
    const draft = await exportRow();
    expect(draft[4]).toContain("ponowne sporządzenie oceny");
    expect(draft.slice(5, 7)).toEqual(["04.12.2026", ""]);
    expect(officeStats().byStep.objection_resolved).toBe(1);
    expect(officeStats().overdueOpen).toBe(due + 1);
    const overview = await html(app, "joanna", "/hr");
    expect(overview.match(/>Katarzyna Lewandowska<\/a>/g)).toHaveLength(1);
    expect(overview).toMatch(/Ponowna ocena do: <b[^>]*>04\.12\.2026<\/b>/);
    const office = await html(app, "dyrektor-urzedu", "/office/statistics");
    expect(office).toContain("Ponowne sporządzenie oceny lub zapoznanie z nią");
    expect(office).not.toContain("Katarzyna Lewandowska");

    expect((await call(app, "anna", `${CYCLE}/assessment/approve`, form([5, 5, 5, 5, 5]))).status).toBe(303);
    const approved = await exportRow();
    expect(approved[4]).toContain("po raz drugi");
    expect(approved[5]).toBe("04.12.2026");
    expect(officeStats().overdueOpen).toBe(due);
    expect((await call(app, "katarzyna", `${CYCLE}/assessment/acknowledge`, {})).status).toBe(303);
    expect((await exportRow())[5]).toBe("06.12.2028");
    expect(await html(app, "dyrektor-urzedu", "/office/statistics")).not.toContain("Ponowne sporządzenie oceny lub zapoznanie z nią");
  }
});

test("notatka przypisana do następnego cyklu pozostaje po przesunięciu jego początku", async () => {
  const { cycleById, openCycle, startNextCycle } = await import("../cycles");
  const { notesForCycle } = await import("../notes/repo");
  const app = await redone();
  startNextCycle(cycleById("cycle-katarzyna")!, "katarzyna", "2026-11-16", "2026-11-17", "positive");
  const next = openCycle("katarzyna")!;
  const note = "Notatka przypisana do rozpoczętego cyklu.";
  expect((await call(app, "anna", "/people/katarzyna/notes", { criterion_id: "rzetelnosc", date: "2026-11-18", text: note })).status).toBe(303);
  expect(notesForCycle(next.id, "anna").map((n) => n.text)).toContain(note);
  expect((await call(app, "anna", `${CYCLE}/assessment/approve`, form([7, 5, 5, 5, 5]))).status).toBe(303);
  setToday("2026-11-24");
  expect((await call(app, "katarzyna", `${CYCLE}/assessment/acknowledge`, {})).status).toBe(303);
  expect(openCycle("katarzyna")).toMatchObject({ id: next.id, period_start: "2026-11-22" });
  expect(notesForCycle(next.id, "anna").map((n) => n.text)).toContain(note);
  expect(notesForCycle(next.id, "marek").map((n) => n.text)).not.toContain(note);
});

test("fikcja zapoznania z drugą oceną odmienia opis według ocenianej", async () => {
  const app = await redone();
  expect((await call(app, "anna", `${CYCLE}/assessment/approve`, form([5, 5, 5, 5, 5]))).status).toBe(303);
  setToday("2026-11-24");
  const formPage = await html(app, "anna", `${CYCLE}/assessment/fiction`);
  expect(formPage).toContain("Oceniana nie mogła potwierdzić zapoznania");
  expect(formPage).toContain("Oceniana nie chciała potwierdzić zapoznania");
  expect((await call(app, "anna", `${CYCLE}/assessment/fiction`, { reason: "could_not", deliveryMethod: "post", deliveredOn: "2026-11-22" })).status).toBe(303);
  for (const path of [`${CYCLE}/assessment`, `${CYCLE}/sheet`, "/hr"]) {
    expect(await html(app, "joanna", path)).toContain("nie mogła potwierdzić");
  }
  const assessment = await html(app, "katarzyna", `${CYCLE}/assessment`);
  expect(assessment).toContain("22.11.2026");
  expect(assessment).toContain("24.11.2026");
  expect(assessment).toContain("01.12.2026");
});

test("część I zachowuje przekazany termin i pokazuje bieżący po zapoznaniu z drugą oceną", async () => {
  const { cycleById, openCycle, startNextCycle } = await import("../cycles");
  const app = await redone();
  startNextCycle(cycleById("cycle-katarzyna")!, "katarzyna", "2026-11-16", "2026-11-17", "positive");
  const part1 = `/cycles/${openCycle("katarzyna")!.id}/part1`;
  expect((await call(app, "anna", `${part1}/submit`, {})).status).toBe(303);
  expect((await call(app, "katarzyna", `${part1}/confirm`, {})).status).toBe(303);
  const before = await html(app, "katarzyna", part1);
  expect(before).toContain("16.11.2028");
  expect(before).not.toContain("Termin bieżący");

  expect((await call(app, "anna", `${CYCLE}/assessment/approve`, form([5, 5, 5, 5, 5]))).status).toBe(303);
  setToday("2026-11-24");
  expect((await call(app, "katarzyna", `${CYCLE}/assessment/acknowledge`, {})).status).toBe(303);
  const after = await html(app, "katarzyna", part1);
  expect(after).toMatch(/Termin przekazany w części I[\s\S]*16\.11\.2028/);
  expect(after).toMatch(/Termin bieżący[\s\S]*22\.11\.2028/);
});
