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
    for (const t of ["Wyznacz kryteria oceny", "Piotr Wójcik", "27.12.2024", "§ 7 pkt 1"]) expect(home).toContain(t);
    const r = await as(app, "marek", `/cycles/${piotr}`);
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toBe(`/cycles/${piotr}/part1`);
    const html = await (await as(app, "marek", `/cycles/${piotr}/part1`)).text();
    expect(html).toContain("arkusz C");
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
    expect(await (await as(app, "marek", `/cycles/${piotr}/part1`)).text()).toContain("Przekazano 09.12.2024. Czeka na potwierdzenie Piotra.");
    await app.request("/demo/date", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie: "person_id=marek" }, body: "date=2024-12-11" });
    expect(await (await as(app, "marek", `/cycles/${piotr}/part1`)).text()).toContain("Przekazano 09.12.2024. Czeka na potwierdzenie Piotra.");
    expect(await (await as(app, "marek", "/")).text()).toContain("Część I czeka na potwierdzenie Piotra");
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
    expect(await (await as(app, "marek", `/cycles/${piotr}/part1`)).text()).toContain('<details class="disc">');
  });

  test("dane pokazowe: Ewa i Tomasz mają potwierdzoną część I", () => {
    createTestApp({ today: "2024-12-09" });
    expect(part1Status("cycle-ewa").state).toBe("confirmed");
    expect(part1Status("cycle-tomasz").state).toBe("confirmed");
  });
});

describe("część I: stany formularza", () => {
  test("zapis szkicu daje komunikat sukcesu; za dużo kryteriów dodatkowych: podsumowanie błędów z odnośnikiem", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    const saved = await app.request(`/cycles/${piotr}/part1/criteria`, { method: "POST", body: new URLSearchParams(), headers: { cookie: "person_id=marek" } });
    expect(saved.status).toBe(303);
    expect(saved.headers.get("location")).toBe(`/cycles/${piotr}/part1?saved=1`);
    expect(await (await as(app, "marek", `/cycles/${piotr}/part1?saved=1`)).text()).toContain("Zapisano szkic części I");
    const body = new URLSearchParams();
    for (const id of ["kreatywnosc", "negocjowanie", "myslenie-analityczne", "sytuacje-kryzysowe"]) body.append("additional", id);
    const bad = await app.request(`/cycles/${piotr}/part1/criteria`, { method: "POST", body, headers: { cookie: "person_id=marek" } });
    expect(bad.status).toBe(422);
    const html = await bad.text();
    expect(html).toContain("Popraw wybór kryteriów dodatkowych");
    expect(html).toContain('href="#p1-extra-h"');
    expect(html).toContain("Odznacz pozostałe.");
  });

  test("zastępca widzi „Wyznacz kryteria” w czasie zastępstwa, po jego końcu nie; oceniający ma ją dalej", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    db.query("INSERT INTO substitutions (absent_id, substitute_id, date_from, date_to, recorded_on, recorded_by) VALUES ('marek', 'anna', '2026-11-01', '2026-12-31', '2026-11-01', 'joanna')").run();
    // Sprawa „Wyznacz kryteria” istnieje, dopóki część I nie jest przekazana: cofamy zdarzenia kroku 1.
    db.query("DELETE FROM events WHERE cycle_id = 'cycle-piotr' AND type IN ('part1_submitted', 'part1_confirmed')").run();
    // Widok dzieli sprawę na nagłówek i osobę: para „Wyznacz kryteria oceny … Piotr Wójcik”.
    const pair = (html: string) => /Wyznacz kryteria oceny[\s\S]{0,300}Piotr Wójcik/.test(html);
    expect(pair(await (await as(app, "anna", "/")).text())).toBe(true);
    expect(pair(await (await as(app, "marek", "/")).text())).toBe(true);
    expect((await as(app, "joanna", "/demo/date", "date=2027-01-01")).status).toBe(303);
    expect(await (await as(app, "anna", "/")).text()).not.toContain("Wyznacz kryteria oceny");
    expect(pair(await (await as(app, "marek", "/")).text())).toBe(true);
  });

  test("brak rodzaju stanowiska: 422 ze zdaniem, odnośnik do kartoteki tylko u kadr", async () => {
    const { app, db } = createTestApp({ today: "2024-12-09" });
    db.query("UPDATE people SET position_kind = NULL WHERE id = 'piotr'").run();
    const r = await as(app, "marek", `/cycles/${piotr}/part1`);
    expect(r.status).toBe(422);
    const html = await r.text();
    expect(html).toContain("nie ma rodzaju stanowiska");
    expect(html).toContain("Nie zapisano zmian");
    expect(html).not.toContain("arkusz C");
    expect(html).not.toContain("/hr/people/piotr/edit");
    const hr = await as(app, "joanna", `/cycles/${piotr}/part1`);
    expect(hr.status).toBe(422);
    expect(await hr.text()).toContain('href="/hr/people/piotr/edit"');
  });
});
