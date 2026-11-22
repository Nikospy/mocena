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
