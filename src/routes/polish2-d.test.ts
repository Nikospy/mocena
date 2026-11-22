import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";

const get = async (app: ReturnType<typeof createTestApp>["app"], as: string, path: string, form?: Record<string, string>) => {
  const headers: Record<string, string> = { cookie: `person_id=${as}` };
  if (form) headers["content-type"] = "application/x-www-form-urlencoded";
  const res = await app.request(path, { method: form ? "POST" : "GET", headers, body: form ? new URLSearchParams(form).toString() : undefined });
  return res.text();
};

describe("pola dat: data słownie", () => {
  const { app } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true } });

  test("formularz notatki: data słownie dla wartości domyślnej i skrypt", async () => {
    const h = await get(app, "marek", "/people/piotr/notes/new");
    expect(h).toMatch(/data-date-words-for="date"[^>]*>11 marca 2026</);
    expect(h).toContain('src="/date-words.js"');
  });

  test("formularz nieobecności: puste pola puste, wpisana data słownie, skrypt", async () => {
    const empty = await get(app, "joanna", "/cycles/cycle-piotr/absences");
    expect(empty).toMatch(/data-date-words-for="from"[^>]*><\/p>/);
    expect(empty).toContain('src="/date-words.js"');
    const bad = await get(app, "joanna", "/cycles/cycle-piotr/absences", { from: "2026-10-20", to: "2026-10-09" });
    expect(bad).toMatch(/data-date-words-for="from"[^>]*>20 października 2026</);
    expect(bad).toMatch(/data-date-words-for="to"[^>]*>9 października 2026</);
  });
});
