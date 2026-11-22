import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { getDb } from "../db";
import { createTestApp } from "../test-helpers";

test("„Wstaw do uzasadnienia” dopisuje zaznaczone notatki i niczego nie zapisuje", async () => {
  const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
  const events = () => (getDb().query("SELECT COUNT(*) AS n FROM events WHERE type = 'assessment_draft_saved'").get() as { n: number }).n;
  const before = events();
  const res = await app.request("/cycles/cycle-piotr/assessment", { headers: { cookie: "person_id=marek" } });
  const html = await res.text();

  const window = new Window({ url: "http://localhost/" });
  window.document.body.innerHTML = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const doc = window.document;
  const boxes = [...doc.querySelectorAll("input[data-insert]")] as unknown as HTMLInputElement[];
  expect(boxes.length).toBeGreaterThanOrEqual(3);
  const [a, b, skipped] = boxes;
  a.checked = true;
  b.checked = true;
  let submitted = false;
  doc.querySelector("form")!.addEventListener("submit", () => (submitted = true));
  let inputEvents = 0;
  const field = doc.getElementById("justification") as unknown as HTMLTextAreaElement;
  field.addEventListener("input", () => inputEvents++);

  new Function("document", "Event", readFileSync("public/insert-notes.js", "utf8"))(doc, window.Event);
  (doc.querySelector('button[data-target="justification"]') as unknown as HTMLButtonElement).click();

  expect(field.value).toBe(`${a.getAttribute("data-insert")}\n${b.getAttribute("data-insert")}`);
  expect(field.value).not.toContain(skipped.getAttribute("data-insert")!);
  expect(inputEvents).toBe(1);
  field.value += " Poprawka.";
  expect(field.value.endsWith("Poprawka.")).toBe(true);
  expect(submitted).toBe(false);
  expect(events()).toBe(before);
});
