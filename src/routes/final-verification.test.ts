import { expect, test } from "bun:test";
import { cycleCriteria } from "../cycles/part1";
import { createTestApp } from "../test-helpers";
import { call, type App } from "./hr-test-helpers";

const PIOTR = "/cycles/cycle-piotr";

function assessmentForm(cycleId: string, score: number) {
  return {
    ...Object.fromEntries(cycleCriteria(cycleId).map(({ id }) => [`score[${id}]`, String(score)])),
    developmentConclusions: "Kurs pism urzędowych.",
  };
}

async function page(app: App, who: string, path: string, fields?: Record<string, string>, status = 200) {
  const response = await call(app, who, path, fields);
  expect(response.status).toBe(status);
  const contents = await response.text();
  expect(contents).not.toMatch(/\b(?:undefined|null)\b/);
  return contents;
}

test("brak rodzaju w danych daje spójną formę w fikcji, zegarze, kadrach i zaproszeniach", async () => {
  for (const gender of [null, ""]) {
    const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    db.query("UPDATE people SET gender = ? WHERE id IN ('piotr', 'marek')").run(gender);
    const account = (await page(app, "", "/account")).match(/value="piotr"[\s\S]*?<\/button>/)?.[0];
    expect(account).toContain("· oceniany</span>");
    const invited = await call(app, "marek", `${PIOTR}/invitations`, {
      kind: "assessment", date: "2026-11-23", time: "10:00", place: "pokój 214",
    });
    expect(invited.status).toBe(303);
    const invitation = invited.headers.get("location")!;
    expect(await page(app, "piotr", invitation)).toContain("Czeka na potwierdzenie ocenianego");
    expect((await call(app, "piotr", `${invitation}/confirm`, {})).status).toBe(303);
    expect(await page(app, "marek", invitation)).toContain("Potwierdzone przez ocenianego");

    expect((await call(app, "marek", `${PIOTR}/assessment/approve`, assessmentForm("cycle-piotr", 5))).status).toBe(303);
    expect(await page(app, "marek", "/")).toContain("Oceniany nie potwierdza zapoznania");
    expect(await page(app, "marek", `${PIOTR}/assessment/fiction`)).toContain("Oceniany nie mógł potwierdzić zapoznania");
    expect(await page(app, "marek", `${PIOTR}/assessment/fiction`, {}, 422)).toContain("Wybierz, czy oceniany nie mógł, czy nie chciał");
    expect((await call(app, "marek", `${PIOTR}/assessment/fiction`, {
      reason: "could_not", deliveryMethod: "post", deliveredOn: "2026-11-22",
    })).status).toBe(303);
    const assessment = await page(app, "joanna", `${PIOTR}/assessment`);
    expect(assessment).toContain("oceniany może złożyć do 30.11.2026");
    expect(assessment).toContain("nie mógł potwierdzić");
    expect(await page(app, "joanna", `${PIOTR}/sheet`)).toContain("nie mógł potwierdzić");
    expect(await page(app, "joanna", "/hr")).toContain("oceniany nie mógł potwierdzić");
    expect(await page(app, "piotr", "/")).toContain("możesz złożyć w ustawowym terminie");
  }
});

test("po pozytywnym wyniku sprzeciwu zachowuje się termin przekazany i pokazuje termin bieżący", async () => {
  const { assessmentState } = await import("../assessment/state");
  const { cycleById, openCycle, startNextCycle } = await import("../cycles");
  const { computeAssessment } = await import("../engine/scoring");
  const id = "cycle-katarzyna";
  const original = `/cycles/${id}`;
  for (const outcome of ["changed", "redone"]) {
    const { app, db } = createTestApp({ today: "2026-11-22" });
    db.query("UPDATE people SET has_account = 1 WHERE id = 'katarzyna'").run();
    const first = assessmentState(id).snapshot!;
    const scores = Object.fromEntries(first.criteria.map((criterion) => [criterion.id, 1]));
    const negative = { ...first, scores, result: computeAssessment(scores),
      criteria: first.criteria.map((criterion) => ({ ...criterion, score: 1 })) };
    db.query("UPDATE events SET payload = ? WHERE cycle_id = ? AND type = 'assessment_approved'").run(JSON.stringify(negative), id);
    startNextCycle(cycleById(id)!, "katarzyna", "2026-11-16", "2026-11-17", "negative");
    const next = openCycle("katarzyna")!;
    const path = `/cycles/${next.id}`;
    expect((await call(app, "anna", `${path}/part1/submit`, {})).status).toBe(303);
    expect((await call(app, "katarzyna", `${path}/part1/confirm`, {})).status).toBe(303);
    expect(await page(app, "katarzyna", `${path}/part1`)).toContain("18.05.2027");

    if (outcome === "changed") {
      expect((await call(app, "joanna", `${original}/objection-change`, assessmentForm(id, 5))).status).toBe(303);
    } else {
      expect((await call(app, "joanna", `${original}/objection-outcome`, { outcome })).status).toBe(303);
      expect((await call(app, "anna", `${original}/assessment/approve`, assessmentForm(id, 5))).status).toBe(303);
      expect((await call(app, "katarzyna", `${original}/assessment/acknowledge`, {})).status).toBe(303);
    }
    expect(openCycle("katarzyna")?.id).toBe(next.id);
    const current = outcome === "changed" ? "16.11.2028" : "22.11.2028";
    const bothDates = (contents: string) => {
      expect(contents).toContain("18.05.2027");
      expect(contents).toContain(current);
      expect(contents).not.toMatch(/(?:termin|do) ponownej oceny|§ 7 pkt 2/i);
    };
    const part1 = await page(app, "katarzyna", `${path}/part1`);
    expect(part1).toContain("Termin bieżący");
    bothDates(part1);
    for (const who of ["anna", "katarzyna"]) {
      const home = await page(app, who, "/");
      const item = home.match(new RegExp(`<li class="task"><div class="task-main"><h3><a class="task-link" href="${path}/part1">[\\s\\S]*?</li>`))?.[0] ?? "";
      bothDates(item);
    }
    const hr = await page(app, "joanna", "/hr");
    const row = hr.split('<tr class="hr-card">').find((part) => part.startsWith(`<th scope="row"><a href="${path}/part1"`))?.split("</tr>")[0] ?? "";
    bothDates(row);
    const csv = await page(app, "joanna", "/hr/export.csv");
    const line = csv.split("\r\n").find((part) => part.startsWith("Katarzyna Lewandowska;")) ?? "";
    expect(line.split(";")[5]).toBe(current);
    bothDates(line);
    bothDates(await page(app, "anna", `${path}/timeline`));
    bothDates(await page(app, "joanna", `${path}/sheet`));
    const invitation = await page(app, "anna", `${path}/invitations/new?kind=opening`);
    expect(invitation).toContain("§ 7 pkt 1");
    expect(invitation).not.toContain("§ 7 pkt 2");
    expect(invitation).toContain(outcome === "changed" ? "16.12.2026" : "22.12.2026");
  }
});
