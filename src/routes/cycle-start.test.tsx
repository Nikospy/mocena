import { describe, expect, test } from "bun:test";
import { cycleLinks } from "../cycle-links";
import { cycleById } from "../cycles";
import { cycleCriteria, part1Status } from "../cycles/part1";
import { visibleEvents } from "../events";
import { homeTasks } from "../home-tasks";
import { personById } from "../people";
import { createTestApp } from "../test-helpers";

type App = ReturnType<typeof createTestApp>["app"];
const piotr = "cycle-piotr";

async function as(app: App, person: string, path: string, body?: string) {
  const headers: Record<string, string> = { cookie: `person_id=${person}` };
  if (body !== undefined) headers["content-type"] = "application/x-www-form-urlencoded";
  return app.request(path, { method: body === undefined ? "GET" : "POST", headers, body, redirect: "manual" });
}

const good = "additional=orientacja-na-klienta&additional=myslenie-analityczne&expectation%5Borientacja-na-klienta%5D=Szybko";

describe("krok 1 pokazu", () => {
  test("Marek: sprawa, przekierowanie, ekran części I, karta rozmowy", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    const home = await (await as(app, "marek", "/")).text();
    expect(home).toContain("Wyznacz kryteria oceny: Piotr Wójcik, do 27.12.2024 (§ 7 pkt 1)");
    const r = await as(app, "marek", `/cycles/${piotr}`);
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toBe(`/cycles/${piotr}/part1`);
    const html = await (await as(app, "marek", `/cycles/${piotr}/part1`)).text();
    expect(html).toContain("Arkusz C");
    expect(html).toContain("§ 3 ust. 4");
    expect(html.match(/bo w opisie stanowiska jest obowiązek/g)).toHaveLength(3);
    expect(html).toContain("ustawienie urzędu");
    expect(html).toContain("27.11.2026");
    expect(html).toContain("Termin oceny");
    expect(html).not.toContain("Termin przekazany w części I");
    expect(html).not.toContain("checked");
    expect(html).toContain(`/cycles/${piotr}/cards/opening`);
    const cardHtml = await (await as(app, "marek", `/cycles/${piotr}/cards/opening`)).text();
    expect(cardHtml).toContain("§ 5 ust. 1");
    expect(cardHtml).toContain("główne obowiązki wynikające z opisu stanowiska");
    expect(cardHtml).toContain("cele do osiągnięcia");
  });

  test("zapis kryteriów: 422 przy limicie, 303 przy poprawnych, 403 dla ocenianego", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    const four = "additional=orientacja-na-klienta&additional=myslenie-analityczne&additional=negocjowanie&additional=kreatywnosc";
    const bad = await as(app, "marek", `/cycles/${piotr}/part1/criteria`, four);
    expect(bad.status).toBe(422);
    expect(await bad.text()).toContain("najwyżej 3");
    expect(cycleCriteria(piotr)).toHaveLength(0);
    expect((await as(app, "marek", `/cycles/${piotr}/part1/criteria`, good)).status).toBe(303);
    expect(cycleCriteria(piotr)).toHaveLength(7);
    expect((await as(app, "piotr", `/cycles/${piotr}/part1/criteria`, good)).status).toBe(403);
  });

  test("przekazanie, blokada, potwierdzenie przez Piotra", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    expect((await as(app, "marek", `/cycles/${piotr}/part1/submit`, good)).status).toBe(303);
    const p = visibleEvents(piotr).find((e) => e.type === "part1_submitted")!.payload;
    expect(p.dueDate).toBe("2026-11-27");
    expect(p.place).toBe("Rzeszów");
    expect(p.appraiserName).toBe("Marek Zieliński");
    expect(Object.keys(p.rulesVersion).sort()).toEqual(["act", "effectiveFrom", "version"]);
    for (const who of ["marek", "piotr"]) {
      const html = await (await as(app, who, `/cycles/${piotr}/part1`)).text();
      expect(html).toContain("Termin przekazany w części I");
      expect(html).toContain("27.11.2026");
    }
    expect((await as(app, "marek", `/cycles/${piotr}/part1/criteria`, good)).status).toBe(409);
    expect((await as(app, "marek", `/cycles/${piotr}/part1/submit`, good)).status).toBe(409);

    expect((await as(app, "ewa", `/cycles/${piotr}/part1/confirm`, "")).status).toBe(403);
    expect(await (await as(app, "piotr", "/")).text()).toContain("Potwierdź część I oceny");
    expect((await as(app, "piotr", `/cycles/${piotr}/part1/confirm`, "")).status).toBe(303);
    const c = visibleEvents(piotr).find((e) => e.type === "part1_confirmed")!;
    expect(c.date).toBe("2024-12-09");
    expect(c.payload).toEqual({ place: "Rzeszów", appraiseeName: "Piotr Wójcik" });
    expect((await as(app, "piotr", `/cycles/${piotr}/part1/confirm`, "")).status).toBe(409);
    const done = await (await as(app, "marek", `/cycles/${piotr}/part1`)).text();
    expect(done).toContain("Potwierdzenie w systemie: Rzeszów, 09.12.2024, Piotr Wójcik");
  });

  test("żaden ekran nie zawiera słowa „podpis”", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    await as(app, "marek", `/cycles/${piotr}/part1/submit`, good);
    for (const [who, path] of [["marek", `/cycles/${piotr}/part1`], ["piotr", `/cycles/${piotr}/part1`], ["marek", `/cycles/${piotr}/cards/opening`], ["piotr", "/"]]) {
      expect((await (await as(app, who, path)).text()).toLowerCase()).not.toContain("podpis");
    }
  });

  test("termin rozmowy o kryteriach: 7 dni po ocenie negatywnej, 30 po pozytywnej", () => {
    const { db } = createTestApp({ today: "2024-12-09" });
    const marek = personById("marek")!;
    expect(homeTasks(marek).some((t) => t.title.includes("do 27.12.2024 (§ 7 pkt 1)"))).toBe(true);
    db.query("INSERT INTO events (type, cycle_id, actor_id, date, payload) VALUES ('cycle_started', ?, 'marek', '2024-12-09', ?)").run(
      piotr,
      JSON.stringify({ reason: "previous_assessment", periodStart: "2024-11-27", previousAssessmentOn: "2024-11-27", previousAcknowledgedOn: "2024-11-28", previousOutcome: "negative" }),
    );
    expect(homeTasks(marek).some((t) => t.title.includes("do 04.12.2024 (§ 7 pkt 2)"))).toBe(true);
  });

  test("Ewa nie ma wstępu do cudzej części I", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    expect((await as(app, "ewa", `/cycles/${piotr}/part1`)).status).toBe(403);
  });

  test("oczekiwanie: Marek widzi „od 2 dni”; kadry czytają, nie zapisują, mają odnośnik „Część I”", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    await as(app, "marek", `/cycles/${piotr}/part1/submit`, good);
    expect(await (await as(app, "marek", `/cycles/${piotr}/part1`)).text()).toContain("od dziś");
    await app.request("/demo/date", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie: "person_id=marek" }, body: "date=2024-12-11" });
    expect(await (await as(app, "marek", `/cycles/${piotr}/part1`)).text()).toContain("Część I czeka na potwierdzenie od 2 dni");
    expect(await (await as(app, "marek", "/")).text()).toContain("od 2 dni");
    const hr = await as(app, "joanna", `/cycles/${piotr}/part1`);
    expect(hr.status).toBe(200);
    expect(await hr.text()).not.toContain("part1/criteria");
    expect((await as(app, "joanna", `/cycles/${piotr}/part1/confirm`, "")).status).toBe(403);
    expect((await as(app, "joanna", `/cycles/${piotr}/part1/criteria`, good)).status).toBe(403);
    expect(cycleLinks(cycleById(piotr)!, personById("joanna")!).map((l) => l.label)).toContain("Część I");
  });

  test("karta: pytania i trudne sytuacje; opisy kryteriów w details", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    const card = await (await as(app, "marek", `/cycles/${piotr}/cards/opening`)).text();
    expect(card).toContain("Trudne sytuacje");
    expect(card).toContain("Pytania");
    expect(await (await as(app, "marek", `/cycles/${piotr}/part1`)).text()).toContain("<details>");
  });

  test("dane pokazowe: Ewa i Tomasz mają potwierdzoną część I", () => {
    createTestApp({ today: "2024-12-09" });
    expect(part1Status("cycle-ewa").state).toBe("confirmed");
    expect(part1Status("cycle-tomasz").state).toBe("confirmed");
  });
});
