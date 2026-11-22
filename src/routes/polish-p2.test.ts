import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

const text = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");

describe("2.1 strona główna Joanny przed terminami ocen", () => {
  test("10.11.2026: sprawa „Wpisz nieobecności” z Piotrem i terminem z silnika", async () => {
    const { app } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    const h = await html(app, "joanna", "/");
    expect(text(h)).toContain("Wpisz nieobecności");
    expect(text(h)).toContain("Piotr Wójcik");
    expect(text(h)).toContain("do 27.11.2026");
    expect(h).toContain('href="/cycles/cycle-piotr/absences"');
    // po wpisaniu nieobecności termin wychodzi poza okno i sprawa znika
    await call(app, "joanna", "/cycles/cycle-piotr/absences", { from: "2026-10-05", to: "2026-10-16", excused: "1" });
    await call(app, "joanna", "/cycles/cycle-piotr/absences", { from: "2026-10-19", to: "2026-11-06", excused: "1" });
    expect(text(await html(app, "joanna", "/"))).not.toContain("Wpisz nieobecności: Piotr Wójcik");
  });
});

describe("2.3 „Wstaw do uzasadnienia”", () => {
  test("notatki trafiają jako cytaty w osobnych wierszach", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const page = await html(app, "marek", "/cycles/cycle-piotr/assessment");
    const window = new Window({ url: "http://localhost/" });
    window.document.body.innerHTML = page.slice(page.indexOf("<main"), page.indexOf("</main>"));
    const doc = window.document;
    const boxes = [...doc.querySelectorAll("input[data-insert]")] as unknown as HTMLInputElement[];
    for (const b of boxes.slice(0, 3)) b.checked = true;
    const field = doc.getElementById("justification") as unknown as HTMLTextAreaElement;
    field.value = "Zdanie wstępne.";
    new Function("document", "Event", readFileSync("public/insert-notes.js", "utf8"))(doc, window.Event);
    (doc.querySelector('button[data-target="justification"]') as unknown as HTMLButtonElement).click();
    const lines = field.value.split("\n");
    expect(lines).toHaveLength(5);
    expect(lines[0]).toBe("Zdanie wstępne.");
    expect(lines[1]).toBe("");
    for (const line of lines.slice(2)) expect(line).toMatch(/^Notatka z \d{2}\.\d{2}\.\d{4}: „.+”$/);
  });
});

describe("2.6 statystyki bez samych zer", () => {
  test("gdy wszystko jest zerem: jedno zdanie zamiast kafli; inaczej kafle", async () => {
    const { app } = createTestApp({ today: "2020-01-01" });
    const empty = await html(app, "joanna", "/hr");
    expect(text(empty)).toContain("Nie ma jeszcze cykli ani ocen do policzenia.");
    expect(empty).not.toContain('class="stat"');
    createTestApp({ today: "2026-11-22" });
    const full = await html(app, "joanna", "/hr");
    expect(full).toContain('class="stat"');
    expect(text(full)).not.toContain("Nie ma jeszcze cykli ani ocen do policzenia.");
  });
});

describe("2.7 sortowanie /hr", () => {
  test("cykle wymagające działania przed zamkniętymi", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    const h = await html(app, "joanna", "/hr");
    const at = (name: string) => h.indexOf(`<th scope="row">${name}</th>`);
    const open = ["Anna Kwiatkowska", "Ewa Nowak", "Katarzyna Lewandowska"].map(at);
    const closed = [
      h.lastIndexOf('<th scope="row">Piotr Wójcik</th>'),
      at("Tomasz Kamiński"),
    ];
    expect([...open, ...closed].every((i) => i > 0)).toBe(true);
    expect(Math.max(...open)).toBeLessThan(Math.min(...closed));
  });
});

describe("2.8 blokada oceny bez części I", () => {
  test("ekran blokady ma przycisk „Przejdź do części I”", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    for (const who of ["marek", "piotr", "joanna"]) {
      const h = await html(app, who, "/cycles/cycle-piotr/assessment");
      expect(text(h)).toContain("Ocena nie może powstać bez potwierdzonej części I.");
      expect(h, who).toContain('<a class="btn primary" href="/cycles/cycle-piotr/part1">Przejdź do części I</a>');
    }
  });
});
