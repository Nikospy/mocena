import { beforeAll, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
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
    expect(h).toContain("<dt>Urzędnik mianowany</dt><dd>Tomasz Kamiński</dd>");
    expect(h).toContain("14.12.2026");
    expect(h).toContain("sobotę 12.12.2026");
    expect(h).toContain("art. 89 ust. 2");
    expect(h).toContain('<dt>Stopień</dt><dd class="tnum">V → VI</dd>');
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

  test("nazwisko w wierszu prowadzi do cyklu, a tam są Arkusz i Historia ocen; start Joanny prowadzi do /hr", async () => {
    const h = await html(app, "joanna", "/hr");
    for (const [cycle, person] of [["cycle-tomasz", "tomasz"], ["cycle-katarzyna", "katarzyna"], ["cycle-anna", "anna"], ["cycle-piotr", "piotr"]]) {
      expect(h).toContain(`href="/cycles/${cycle}/part1"`);
      const hub = await html(app, "joanna", `/cycles/${cycle}/part1`);
      expect(hub).toContain(`href="/cycles/${cycle}/sheet"`);
      expect(hub).toContain(`href="/people/${person}/history"`);
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
    const h = await r.text();
    // Strona błędu w układzie: nagłówek, zdanie z trasy, wyjście do spraw i zmiana konta.
    expect(r.headers.get("content-type")).toContain("text/html");
    expect(h).toContain("Nie masz dostępu do tego ekranu");
    expect(h).toContain("Ten ekran widzą kadry.");
    expect(h).toContain('href="/account"');
    expect(h).toContain("Wróć do spraw");
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
    expect(await html(createTestApp({ today: "2024-12-15" }).app, "joanna", "/hr")).not.toContain("Anna Kwiatkowska</a></th>");
    expect(await html(createTestApp({ today: "2024-12-16" }).app, "joanna", "/hr")).toContain("Anna Kwiatkowska</a></th>");
  });

  test("zasada 7: dopisek „(ponowna ocena)” stoi tylko w kolumnie „Stan cyklu”, nie przy nazwisku", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    const ids = ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja", "orientacja-na-klienta", "myslenie-analityczne"];
    const form: Record<string, string> = { justification: "Powód.", developmentConclusions: "Kurs.", interviewDate: "2026-11-21" };
    for (const id of ids) form[`score[${id}]`] = id === "rzetelnosc" ? "1" : "5";
    expect((await call(app, "marek", "/cycles/cycle-piotr/assessment/approve", form)).status).toBe(303);
    expect((await call(app, "piotr", "/cycles/cycle-piotr/assessment/acknowledge", {})).status).toBe(303);

    const h = await html(app, "joanna", "/hr");
    expect(h.toLowerCase()).not.toContain("negatyw");
    const win = new Window();
    win.document.body.innerHTML = h;
    const rows = [...win.document.querySelectorAll("tr.hr-card")];
    const piotrRows = rows.filter((tr) => tr.querySelector("th")?.textContent?.includes("Piotr Wójcik"));
    expect(piotrRows).toHaveLength(2);
    for (const tr of piotrRows) {
      expect(tr.querySelector("th")!.textContent?.trim()).toBe("Piotr Wójcik");
    }
    const states = piotrRows.map((tr) => tr.querySelector('td[data-label="Stan cyklu"]')!.textContent?.trim() ?? "");
    expect(states).toContain("Kryteria do wyznaczenia (ponowna ocena)");
    expect(states.some((s) => s.startsWith("Zapoznanie potwierdzone"))).toBe(true);
    await win.close();
  });
});
