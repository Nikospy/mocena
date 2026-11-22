import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { call, html } from "./hr-test-helpers";

describe("GET /cycles/:id/timeline", () => {
  const { app } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });

  test("oceniany, oceniający i kadry 200; osoba spoza cyklu 403", async () => {
    for (const who of ["piotr", "marek", "joanna"]) expect((await call(app, who, "/cycles/cycle-piotr/timeline")).status).toBe(200);
    expect((await call(app, "tomasz", "/cycles/cycle-piotr/timeline")).status).toBe(403);
    expect((await call(app, "joanna", "/cycles/nie-ma/timeline")).status).toBe(404);
  });

  test("oś ma listę z <time>, początek okresu, termin i przepis przy dacie", async () => {
    const h = await html(app, "marek", "/cycles/cycle-piotr/timeline");
    expect(h).toContain('<ol class="tl-list">');
    expect(h).toContain('<time datetime="2024-11-27">27.11.2024</time>');
    expect(h).toContain("Początek okresu oceny");
    expect(h).toContain("27.11.2026");
    expect(h).toContain("art. 81 ust. 4 ustawy");
  });
});

describe("oś Ewy po zmianie oceniającego", () => {
  test("2024-12-09: wpis z § 9 ust. 3 na koncie Marka, brak na koncie Ewy", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    expect(await html(app, "marek", "/cycles/cycle-ewa/timeline")).toContain("§ 9 ust. 3");
    expect(await html(app, "ewa", "/cycles/cycle-ewa/timeline")).not.toContain("§ 9 ust. 3");
  });
});
