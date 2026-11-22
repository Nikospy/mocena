import { describe, expect, test } from "bun:test";
import { getDb } from "./db";
import { effectiveDeadline } from "./cycles";
import { call, html } from "./routes/hr-test-helpers";
import { createTestApp } from "./test-helpers";

describe("dane Ewy", () => {
  test("zmiana oceniającego: wpis na koncie Marka, brak na koncie Ewy", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    expect(await html(app, "marek", "/cycles/cycle-ewa/timeline")).toContain("§ 9 ust. 3");
    expect(await html(app, "ewa", "/cycles/cycle-ewa/timeline")).not.toContain("§ 9 ust. 3");
    expect((getDb().query("SELECT appraiser_id FROM cycles WHERE id = 'cycle-ewa'").get() as any).appraiser_id).toBe("marek");
  });

  test("nieobecność odsłania się w dniu końca; termin 2027-06-02", async () => {
    const { app } = createTestApp({ today: "2026-08-27" });
    expect(effectiveDeadline("cycle-ewa").date).toBe("2026-11-20");
    expect(await html(app, "marek", "/cycles/cycle-ewa/timeline")).not.toContain("16.02.2026");
    for (const d of ["2026-08-28", "2026-08-29"]) {
      const t = createTestApp({ today: d });
      expect(effectiveDeadline("cycle-ewa").date).toBe("2027-06-02");
      expect(await html(t.app, "marek", "/cycles/cycle-ewa/timeline")).toContain("16.02.2026–28.08.2026");
      expect(await html(t.app, "ewa", "/cycles/cycle-ewa/timeline")).not.toContain("16.02.2026");
    }
  });
});
