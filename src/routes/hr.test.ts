import { beforeAll, describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

describe("ekran kadr /hr (krok 5 pokazu)", () => {
  let app: ReturnType<typeof createTestApp>["app"];
  beforeAll(async () => {
    app = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } }).app;
    await approveAndAcknowledgePiotr(app);
  });

  test("karta obowiązku urzędu: pole Urzędnik, termin, stopień, podstawa", async () => {
    const h = await html(app, "joanna", "/hr");
    expect(h).toContain("Obowiązek urzędu: stopień służbowy z mocy prawa");
    expect(h).toMatch(/Urzędnik<\/span>\s*<p>Tomasz Kamiński<\/p>/);
    expect(h).toContain("14.12.2026");
    expect(h).toContain("sobotę 12.12.2026");
    expect(h).toContain("art. 89 ust. 2");
    expect(h).toContain("Stopień V → VI");
    expect(h).toContain("To obowiązek, nie wniosek");
  });

  test("stany uproszczone: sprzeciw, wniosek o zmianę terminu, zapoznanie Piotra", async () => {
    const h = await html(app, "joanna", "/hr");
    expect(h).toContain("Sprzeciw wniesiony 20.11.2026 do dyrektora generalnego urzędu");
    expect(h).toContain("04.12.2026");
    expect(h).toContain("art. 81 ust. 8");
    expect(h).toContain("zawiadamia pracownika pisemnie");
    expect(h).toContain("Zapoznanie potwierdzone 22.11.2026");
    expect(h).toContain("30.11.2026");
    expect(h).toContain("Terminowość w urzędzie (bez nazwisk)");
  });

  test("zasada 7: ekran nie ma nazw poziomów ani słów pozytywna / negatywna", async () => {
    const h = (await html(app, "joanna", "/hr")).toLowerCase();
    expect(h).not.toContain("powyżej oczekiwań");
    expect(h).not.toContain("poziomie oczekiwań");
    expect(h).not.toContain("pozytywna");
    expect(h).not.toContain("negatywna");
  });

  test("każdy wiersz ma odnośniki Arkusz i Historia ocen; start Joanny prowadzi do /hr", async () => {
    const h = await html(app, "joanna", "/hr");
    for (const [cycle, person] of [["cycle-tomasz", "tomasz"], ["cycle-katarzyna", "katarzyna"], ["cycle-anna", "anna"], ["cycle-piotr", "piotr"]]) {
      expect(h).toContain(`href="/cycles/${cycle}/sheet"`);
      expect(h).toContain(`href="/people/${person}/history"`);
    }
    expect(await html(app, "joanna", "/")).toContain('href="/hr"');
  });

  test("ekran części I cyklu Tomasza z jego konta ma odnośniki Arkusz i Historia ocen", async () => {
    const h = await html(app, "tomasz", "/cycles/cycle-tomasz/part1");
    expect(h).toContain('href="/cycles/cycle-tomasz/sheet"');
    expect(h).toContain('href="/people/tomasz/history"');
  });

  test("dostęp: Piotr 403, bez konta przekierowanie na /account", async () => {
    const r = await call(app, "piotr", "/hr");
    expect(r.status).toBe(403);
    expect(await r.text()).toBe("Ten ekran widzą kadry.");
    expect((await app.request("/hr", { redirect: "manual" })).headers.get("location")).toBe("/account");
  });
});

describe("karta stopnia a data systemowa", () => {
  test("11.11.2026 nie ma karty, 12.11.2026 jest", async () => {
    const before = createTestApp({ today: "2026-11-11" }).app;
    expect(await html(before, "joanna", "/hr")).not.toContain("Obowiązek urzędu");
    const on = createTestApp({ today: "2026-11-12" }).app;
    expect(await html(on, "joanna", "/hr")).toContain("Obowiązek urzędu");
  });

  test("cykl Anny widoczny od 16.12.2024", async () => {
    expect(await html(createTestApp({ today: "2024-12-15" }).app, "joanna", "/hr")).not.toContain("Anna Kwiatkowska</th>");
    expect(await html(createTestApp({ today: "2024-12-16" }).app, "joanna", "/hr")).toContain("Anna Kwiatkowska</th>");
  });
});
