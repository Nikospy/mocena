import { beforeAll, describe, expect, test } from "bun:test";
import { seedEvent } from "../events";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html, type App } from "./hr-test-helpers";

describe("arkusz /cycles/:id/sheet", () => {
  let app: App;
  let db: ReturnType<typeof createTestApp>["db"];
  beforeAll(async () => {
    ({ app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } }));
    await approveAndAcknowledgePiotr(app);
  });

  test("dostęp: oceniany, oceniający i kadry; obca osoba 403; nieistniejący cykl 404", async () => {
    expect((await call(app, "piotr", "/cycles/cycle-piotr/sheet")).status).toBe(200);
    expect((await call(app, "piotr", "/cycles/cycle-piotr/sheet?part=1")).status).toBe(200);
    expect((await call(app, "ewa", "/cycles/cycle-piotr/sheet")).status).toBe(403);
    expect((await call(app, "joanna", "/cycles/cycle-piotr/sheet")).status).toBe(200);
    expect((await call(app, "marek", "/cycles/cycle-piotr/sheet")).status).toBe(200);
    expect((await call(app, "joanna", "/cycles/nie-ma/sheet")).status).toBe(404);
  });

  test("?part=1 zawiera tylko część I", async () => {
    const h = await html(app, "piotr", "/cycles/cycle-piotr/sheet?part=1");
    expect(h).toContain("Część I");
    expect(h).not.toContain("Część II");
    expect(h).toContain("Drukuj / pobierz PDF");
  });

  test("kolejność pól wzoru, pouczenie poza no-print, przycisk druku, nigdzie „podpis”", async () => {
    const h = await html(app, "piotr", "/cycles/cycle-piotr/sheet");
    const items = [
      "Część I",
      "Urząd",
      "Oceniany",
      "Oceniający",
      "Kryteria obowiązkowe",
      "Kryteria dodatkowe",
      "Termin sporządzenia oceny",
      "Potwierdzenie oceniającego",
      "Potwierdzenie ocenianego",
      "Część II",
      "Data rozmowy oceniającej",
      "Okres podlegania ocenie",
      "Oceny cząstkowe",
      "Średnia ocen cząstkowych",
      "Ogólny poziom spełniania kryteriów",
      "Ocena okresowa",
      "Uzasadnienie przyznanej oceny",
      "Wnioski do indywidualnego programu rozwoju zawodowego",
      "Czy dołączono wniosek o kolejny stopień służbowy",
      "Dane oceniającego",
      "Potwierdzenie oceniającego",
      "Potwierdzenie ocenianego",
      "Pouczenie",
    ];
    let pos = -1;
    for (const label of items) {
      const next = h.indexOf(label, pos + 1);
      expect(next).toBeGreaterThan(pos);
      pos = next;
    }
    expect(h).toContain("od 1 do 2");
    expect(h).toContain("powyżej 8 do 9");
    const notice = h.slice(h.indexOf('id="pouczenie"'));
    expect(notice).toContain("7 dni");
    expect(notice).toContain("art. 83 ust. 1");
    expect(h.slice(h.lastIndexOf("<section", h.indexOf('id="pouczenie"')), h.indexOf('id="pouczenie"'))).not.toContain("no-print");
    expect(h).toContain('onclick="window.print()"');
    expect(h).not.toContain("Drukuj część I");
    expect(h.match(/Drukuj/g)).toHaveLength(1);
    expect(h).toContain("Potwierdzenie w systemie: Rzeszów, 22.11.2026, Piotr Wójcik");
    expect(h.toLowerCase()).not.toContain("podpis");
  });

  test("przewijane tabele arkusza (.sheet-matrix) są dostępne z klawiatury", async () => {
    const h = await html(app, "piotr", "/cycles/cycle-piotr/sheet");
    const tables = [...h.matchAll(/<table\b[^>]*class="[^"]*\bsheet-matrix\b[^"]*"[^>]*>/g)].map((m) => m[0]);
    expect(tables.length).toBe(3);
    for (const tag of tables) {
      expect(tag).toContain('tabindex="0"');
      expect(tag).toMatch(/aria-label="[^"]+"/);
    }
  });

  test("styl druku: stopka nie ma position: fixed, tabele wracają do display: table, bez słowa „podpis”", async () => {
    const css = await Bun.file("public/print.css").text();
    const footerRule = css.match(/\.print-footer\s*\{[^}]*\}/)?.[0] ?? "";
    expect(footerRule).not.toBe("");
    expect(footerRule).not.toMatch(/position\s*:\s*fixed/i);
    expect(footerRule).toMatch(/position\s*:\s*static/i);
    expect(css).not.toMatch(/position\s*:\s*fixed/i);
    expect(css).toMatch(/\.demo\b/);
    expect(css).toMatch(/\.sheet-matrix\s*\{[^}]*display\s*:\s*table/s);
    expect(css).toMatch(/\.sheet-matrix\s*\{[^}]*overflow\s*:\s*visible/s);
    expect(css.toLowerCase()).not.toContain("podpis");
  });

  test("termin zatwierdzonej oceny z migawki: późniejsza zmiana nie rusza arkusza", async () => {
    const before = await html(app, "piotr", "/cycles/cycle-piotr/sheet");
    expect(before).toContain("27.11.2026");
    seedEvent("absence_recorded", "cycle-piotr", "joanna", { from: "2026-10-05", to: "2026-11-06" }, "2026-11-22");
    expect(await html(app, "piotr", "/cycles/cycle-piotr/sheet")).toContain("27.11.2026");
  });

  test("fikcja zapoznania: wpis z przyczyną i sposobem doręczenia", async () => {
    db.query("DELETE FROM events WHERE type = 'assessment_acknowledged' AND cycle_id = 'cycle-tomasz'").run();
    seedEvent("acknowledgement_fiction", "cycle-tomasz", "anna", { reason: "would_not", deliveryMethod: "email", deliveredOn: "2026-11-13", objectionDeadline: "2026-11-20" }, "2026-11-13");
    const h = await html(app, "joanna", "/cycles/cycle-tomasz/sheet");
    expect(h).toContain("nie chciał");
    expect(h).toContain("pocztą elektroniczną");
    expect(h).toContain("13.11.2026");
  });

  test("część I na cyklu bez części II: pola puste to „—” i miejsce na datę oraz potwierdzenie", async () => {
    const h = await html(app, "joanna", "/cycles/cycle-anna/sheet");
    expect(h).toContain("—");
    expect(h).toContain("Część II");
    expect(h).toContain("Miejscowość, data i potwierdzenie");
    expect(h.toLowerCase()).not.toContain("podpis");
  });

  test("część III idzie po części II z potwierdzeniem oceniającego i bez słowa „podpis”", async () => {
    db.query(
      "UPDATE events SET payload = json_set(payload, '$.gradeRequest.attached', json('true'), '$.gradeRequest.motivation', 'Stały wysoki poziom zadań.') WHERE type = 'assessment_approved' AND cycle_id = 'cycle-tomasz'",
    ).run();
    const h = await html(app, "joanna", "/cycles/cycle-tomasz/sheet");
    const order = ["Część I", "Część II", "Pouczenie", "Część III", "Wniosek o przyznanie kolejnego stopnia służbowego", "Stały wysoki poziom zadań."].map((s) => h.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(h.toLowerCase()).not.toContain("podpis");
  });
});
