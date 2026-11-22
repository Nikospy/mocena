import { expect, test } from "bun:test";
import { createTestApp } from "./test-helpers";

test("restart wraca do świeżych danych bez duplikatów i czyści osobę", async () => {
  const { app, db } = createTestApp();
  const count = () => (db.query("SELECT count(*) AS n FROM people").get() as { n: number }).n;
  const before = count();
  await app.request("/demo/date", {
    method: "POST",
    body: new URLSearchParams({ date: "2026-03-11" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  const res = await app.request("/demo/restart", { method: "POST", headers: { cookie: "person_id=marek" } });
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("/account");
  expect(res.headers.get("set-cookie")).toContain("person_id=;");
  expect(count()).toBe(before);
  expect((db.query("SELECT value FROM settings WHERE key='demo_date'").get() as { value: string }).value).toBe("2024-12-09");
});
