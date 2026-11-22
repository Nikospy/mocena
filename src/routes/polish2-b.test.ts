import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

describe("review-polish-2 faza 2: kadry i fikcja zapoznania", () => {
  test("/hr: karty cykli i Więcej przy więcej niż 3 odnośnikach", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    const h = await html(app, "joanna", "/hr");
    expect(h).toContain('class="hr-card"');
    expect(h).toContain('class="disc hr-more"');
    expect(h).toMatch(/<summary>Więcej/);
  });

  test("karta stopnia: kropka przed pigułką, bez nawiasu", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const h = await html(app, "joanna", "/hr");
    const i = h.indexOf("Przyznać do");
    const para = h.slice(i, h.indexOf("</p>", i));
    expect(para).not.toContain("(");
    expect(para).toMatch(/więc poniedziałek\. <span class="basis">/);
  });

  test("fikcja: domyślnie Osobiście i dzisiejsza data", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const form: Record<string, string> = { justification: "", developmentConclusions: "x", interviewDate: "" };
    for (const id of ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja", "orientacja-na-klienta", "myslenie-analityczne"]) form[`score[${id}]`] = "7";
    expect((await call(app, "marek", "/cycles/cycle-piotr/assessment/approve", form)).status).toBe(303);
    const h = await html(app, "marek", "/cycles/cycle-piotr/assessment/fiction");
    expect(h).toMatch(/value="in_person"\s+checked/);
    expect(h).not.toMatch(/value="could_not"\s+checked/);
    expect(h).toContain('value="2026-11-21"');
  });
});
