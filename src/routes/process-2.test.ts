import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

describe("proces 2: wniosek ocenianego o zmianę terminu jest zawsze do znalezienia", () => {
  test("Ewa 22.11.2026 ma odnośnik na stronie głównej i na osi czasu, obok innych spraw", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const home = await html(app, "ewa", "/");
    expect(home).toContain("Twoje możliwości");
    expect(home).toContain('href="/cycles/cycle-ewa/deadline-change/request"');
    const tl = await html(app, "ewa", "/cycles/cycle-ewa/timeline");
    expect(tl).toContain('href="/cycles/cycle-ewa/deadline-change/request"');
    expect((await call(app, "ewa", "/cycles/cycle-ewa/deadline-change/request")).status).toBe(200);
  });

  test("oceniający nie widzi odnośnika ocenianego na osi czasu", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const tl = await html(app, "marek", "/cycles/cycle-ewa/timeline");
    expect(tl).not.toContain("deadline-change/request");
  });

  test("Piotr po zatwierdzeniu oceny nie ma odnośnika", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    expect(await html(app, "piotr", "/")).not.toContain("deadline-change/request");
    expect(await html(app, "piotr", "/cycles/cycle-piotr/timeline")).not.toContain("deadline-change/request");
  });
});

describe("proces 2: okres podlegania ocenie od ustalenia kryteriów", () => {
  test("arkusz Piotra po zatwierdzeniu: od 09.12.2024 (potwierdzenie części I), termin oceny bez zmian", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    const sheet = await html(app, "piotr", "/cycles/cycle-piotr/sheet");
    expect(sheet).toContain("od 09.12.2024");
    expect(sheet).not.toContain("od 27.11.2024");
    const { effectiveDeadline } = await import("../cycles");
    expect(effectiveDeadline("cycle-piotr").date).toBe("2026-11-27");
  });

  test("arkusz Tomasza: od dnia potwierdzenia jego części I (03.12.2024)", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const sheet = await html(app, "joanna", "/cycles/cycle-tomasz/sheet");
    expect(sheet).toContain("od 03.12.2024");
  });
});

describe("proces 2: korekta błędów w zatwierdzonym arkuszu przez administratora", () => {
  const FORM = { field: "interviewDate", value: "20.11.2026", reason: "Rozmowa odbyła się dzień wcześniej, wpisano złą datę" };

  test("administrator poprawia datę rozmowy; arkusz pokazuje nową wartość i historię (kto, kiedy, co, dlaczego)", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    expect(await html(app, "admin", "/")).toContain("/admin/corrections");
    expect(await html(app, "admin", "/admin/corrections")).toContain("/cycles/cycle-piotr/sheet/correction");
    const before = db.query("SELECT payload FROM events WHERE type = 'assessment_approved' AND cycle_id = 'cycle-piotr'").get() as { payload: string };

    const r = await call(app, "admin", "/cycles/cycle-piotr/sheet/correction", FORM);
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("/cycles/cycle-piotr/sheet/correction?saved=1");
    const ev = db.query("SELECT actor_id, payload FROM events WHERE type = 'sheet_corrected'").get() as { actor_id: string; payload: string };
    expect(ev.actor_id).toBe("admin");
    expect(JSON.parse(ev.payload)).toMatchObject({ field: "interviewDate", from: "2026-11-22", to: "2026-11-20", reason: FORM.reason });
    // migawka zatwierdzenia bez zmian
    expect((db.query("SELECT payload FROM events WHERE type = 'assessment_approved' AND cycle_id = 'cycle-piotr'").get() as { payload: string }).payload).toBe(before.payload);

    const sheet = await html(app, "piotr", "/cycles/cycle-piotr/sheet");
    expect(sheet).toContain("Korekty błędów po zatwierdzeniu");
    expect(sheet).toContain("Administrator");
    expect(sheet).toContain("Było: 22.11.2026. Jest: 20.11.2026. Powód: Rozmowa odbyła się dzień wcześniej");
    expect(await html(app, "admin", "/cycles/cycle-piotr/sheet/correction")).toContain("Historia korekt");
  });

  test("bez powodu nic się nie zapisuje; nie-administrator dostaje 403; cykl bez zatwierdzonej oceny 404", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    expect((await call(app, "admin", "/cycles/cycle-piotr/sheet/correction")).status).toBe(404);
    await approveAndAcknowledgePiotr(app);
    const bad = await call(app, "admin", "/cycles/cycle-piotr/sheet/correction", { ...FORM, reason: "" });
    expect(bad.status).toBe(422);
    expect(await bad.text()).toContain("Podaj powód korekty");
    expect((await call(app, "marek", "/cycles/cycle-piotr/sheet/correction", FORM)).status).toBe(403);
    expect((await call(app, "joanna", "/cycles/cycle-piotr/sheet/correction")).status).toBe(403);
    expect(db.query("SELECT COUNT(*) AS n FROM events WHERE type = 'sheet_corrected'").get()).toEqual({ n: 0 });
  });
});
