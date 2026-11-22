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
    const at = (s: string) => h.indexOf(s);
    const order = ["Część I", "Część II", "Uzasadnienie", "Wnioski do indywidualnego programu", "Pouczenie"].map(at);
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const notice = h.slice(h.indexOf('id="pouczenie"'));
    expect(notice).toContain("7 dni");
    expect(notice).toContain("art. 83 ust. 1");
    expect(h.slice(h.lastIndexOf("<section", h.indexOf('id="pouczenie"')), h.indexOf('id="pouczenie"'))).not.toContain("no-print");
    expect(h).toContain('onclick="window.print()"');
    expect(h).toContain("Drukuj część I");
    expect(h).toContain("Potwierdzenie w systemie: Rzeszów, 22.11.2026, Piotr Wójcik");
    expect(h.toLowerCase()).not.toContain("podpis");
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

  test("część I na cyklu bez części II: pola puste to „—”", async () => {
    const h = await html(app, "joanna", "/cycles/cycle-anna/sheet");
    expect(h).toContain("—");
    expect(h).toContain("Część II");
  });
});
