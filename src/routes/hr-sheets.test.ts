import { beforeAll, describe, expect, test } from "bun:test";
import { visibleEvents } from "../events";
import { createTestApp } from "../test-helpers";
import { html } from "./hr-test-helpers";

describe("przejście z /hr do arkuszy wgranych osób (22.11.2026)", () => {
  let app: ReturnType<typeof createTestApp>["app"];
  let db: ReturnType<typeof createTestApp>["db"];
  beforeAll(() => {
    ({ app, db } = createTestApp({ today: "2026-11-22" }));
  });

  const hrefs = (h: string) => [...h.matchAll(/href="(\/cycles\/[^"/]+\/sheet)"/g)].map((m) => m[1]);

  test("arkusze Tomasza, Katarzyny i Anny otwierają się z /hr z potwierdzeniami", async () => {
    const overview = await html(app, "joanna", "/hr");
    for (const c of ["cycle-tomasz", "cycle-katarzyna", "cycle-anna"]) {
      expect(overview).toContain(`href="/cycles/${c}/part1"`);
      expect(hrefs(await html(app, "joanna", `/cycles/${c}/part1`))).toContain(`/cycles/${c}/sheet`);
    }

    const tomasz = await html(app, "joanna", "/cycles/cycle-tomasz/sheet");
    expect(tomasz).toContain("Potwierdzenie w systemie: Rzeszów, 02.12.2024, Anna Kwiatkowska");
    expect(tomasz).toContain("Potwierdzenie w systemie: Rzeszów, 03.12.2024, Tomasz Kamiński");
    expect(tomasz).toContain("Potwierdzenie w systemie: Rzeszów, 12.11.2026, Anna Kwiatkowska");
    expect(tomasz).toContain("Potwierdzenie w systemie: Rzeszów, 12.11.2026, Tomasz Kamiński");
    expect(tomasz).toMatch(/Dane poprzedniej oceny<\/span>\s*<p>12\.11\.2024/);

    const kat = await html(app, "joanna", "/cycles/cycle-katarzyna/sheet");
    expect(kat).toContain("Potwierdzenie w systemie: Rzeszów, 16.11.2026, Anna Kwiatkowska");
    expect(kat).toContain("Potwierdzenie w systemie: Rzeszów, 17.11.2026, Katarzyna Lewandowska");

    const anna = await html(app, "joanna", "/cycles/cycle-anna/sheet");
    expect(anna).toContain("Potwierdzenie w systemie: Rzeszów, 14.01.2025, Barbara Szymańska");
    expect(anna).toContain("Potwierdzenie w systemie: Rzeszów, 15.01.2025, Anna Kwiatkowska");
    expect(anna).toContain("—");
  });

  test("z historii Tomasza do arkusza z 12.11.2024: brak poprzedniej oceny", async () => {
    const h = await html(app, "joanna", "/people/tomasz/history");
    expect(hrefs(h)).toContain("/cycles/cycle-tomasz-2022/sheet");
    const sheet = await html(app, "joanna", "/cycles/cycle-tomasz-2022/sheet");
    expect(sheet).toMatch(/Dane poprzedniej oceny<\/span>\s*<p>brak w systemie/);
    expect(sheet).toContain("Potwierdzenie w systemie: Rzeszów, 12.11.2024, Anna Kwiatkowska");
  });

  test("dane: żadna ocena bez potwierdzonej części I, każde cycle_started ma pięć pól, migawki mają termin i stopień", () => {
    const cycles = db.query("SELECT id FROM cycles").all() as { id: string }[];
    for (const { id } of cycles) {
      const ev = visibleEvents(id, { asOf: "2099-01-01" });
      const approved = ev.find((e) => e.type === "assessment_approved");
      if (approved) {
        expect(ev.some((e) => e.type === "part1_confirmed" && e.date <= approved.date)).toBe(true);
        expect(approved.payload.deadline.date).toBeTruthy();
        expect("grade" in approved.payload && "gradeAwardedOn" in approved.payload).toBe(true);
      }
      const started = ev.find((e) => e.type === "cycle_started")!;
      expect(Object.keys(started.payload).sort()).toEqual(["periodStart", "previousAcknowledgedOn", "previousAssessmentOn", "previousOutcome", "reason"]);
    }
  });
});
