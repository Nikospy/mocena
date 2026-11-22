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
