import { describe, expect, test } from "bun:test";
import { getDb } from "./db";
import { call, html } from "./routes/hr-test-helpers";
import { createTestApp } from "./test-helpers";

const criteria = () => getDb().query("SELECT * FROM cycle_criteria WHERE cycle_id = 'cycle-piotr' ORDER BY criterion_id").all();

describe("zmiana oceniającego z formularza", () => {
  const { app } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });

  test("403 bez roli kadr, 422 dla tej samej osoby i spoza listy, bez zapisu", async () => {
    expect((await call(app, "marek", "/cycles/cycle-piotr/appraiser")).status).toBe(403);
    expect((await call(app, "marek", "/cycles/cycle-piotr/appraiser", { appraiser_id: "anna" })).status).toBe(403);
    expect((await call(app, "joanna", "/cycles/cycle-piotr/appraiser", { appraiser_id: "marek" })).status).toBe(422);
    expect((await call(app, "joanna", "/cycles/cycle-piotr/appraiser", { appraiser_id: "piotr" })).status).toBe(422);
    expect((getDb().query("SELECT appraiser_id FROM cycles WHERE id = 'cycle-piotr'").get() as any).appraiser_id).toBe("marek");
  });

  test("zostawia kryteria, przenosi oceniającego i dostęp do osi", async () => {
    const before = criteria();
    expect(before.length).toBeGreaterThan(0);
    expect((await call(app, "anna", "/cycles/cycle-piotr/timeline")).status).toBe(403);
    const r = await call(app, "joanna", "/cycles/cycle-piotr/appraiser", { appraiser_id: "anna" });
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("/cycles/cycle-piotr/timeline");
    expect(criteria()).toEqual(before);
    expect((getDb().query("SELECT appraiser_id FROM cycles WHERE id = 'cycle-piotr'").get() as any).appraiser_id).toBe("anna");
    expect((await call(app, "anna", "/cycles/cycle-piotr/timeline")).status).toBe(200);
    expect((await call(app, "marek", "/cycles/cycle-piotr/timeline")).status).toBe(403);
    expect(await html(app, "anna", "/cycles/cycle-piotr/timeline")).toContain("§ 9 ust. 3");
  });
});
