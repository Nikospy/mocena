import { describe, expect, test } from "bun:test";
import { cycleLinks } from "../cycle-links";
import { cycleById } from "../cycles";
import { personById } from "../people";
import { createTestApp } from "../test-helpers";
import { LegalBasis } from "../views/components";
import { call, html } from "./hr-test-helpers";

const PIOTR = "cycle-piotr";
const IDS = ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja", "orientacja-na-klienta", "myslenie-analityczne"];

function scores(): Record<string, string> {
  const f: Record<string, string> = { justification: "", developmentConclusions: "Kurs pism urzędowych.", interviewDate: "" };
  for (const id of IDS) f[`score[${id}]`] = "7";
  return f;
}

describe("2.1 pusta pigułka przepisu", () => {
  test("pusta lista podstaw nie daje pigułki, niepusta tak", () => {
    expect(LegalBasis({ basis: [] })).toBeNull();
    expect(LegalBasis({ basis: "" })).toBeNull();
    expect(LegalBasis({ basis: ["§ 12"] })).not.toBeNull();
  });
});

describe("2.2 lista braków przed zatwierdzeniem", () => {
  test("jedna linia „Brakuje ocen cząstkowych: 7” z jedną pigułką i rozwijaną listą kryteriów", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const h = await html(app, "marek", `/cycles/${PIOTR}/assessment`);
    const box = /<div id="assessment-blockers"[\s\S]*?<\/div><\/div>/.exec(h)![0];
    expect(box.match(/Brakuje ocen cząstkowych: 7/g)).toHaveLength(1);
    expect(box).not.toContain("Brakuje oceny cząstkowej");
    expect(box).toMatch(/<details[^>]*><summary>Brakuje ocen cząstkowych: 7 <span class="basis"><span class="art">§ 11 ust\. 1<\/span><\/span><\/summary>/);
    expect(box.match(/<details/g)).toHaveLength(1);
    expect(box).toContain("<li>Rzetelność</li>");
  });

  test("zatwierdzenie bez ocen nadal odmawia (422)", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const r = await call(app, "marek", `/cycles/${PIOTR}/assessment/approve`, { developmentConclusions: "Kurs." });
    expect(r.status).toBe(422);
  });
});

describe("2.5 potwierdzenie zapoznania z oceną", () => {
  test("oceniany widzi przepis § 12 w pigułce", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    expect((await call(app, "marek", `/cycles/${PIOTR}/assessment/approve`, scores())).status).toBe(303);
    const h = await html(app, "piotr", `/cycles/${PIOTR}/assessment`);
    expect(h).toContain('Potwierdzenie zapoznania z oceną: <span class="basis"><span class="art">§ 12</span></span>');
  });
});

describe("2.6 odnośniki cyklu według fazy (termin 27.11.2026, okno 30 dni)", () => {
  const labels = () => cycleLinks(cycleById(PIOTR)!, personById("marek")!).map((l) => l.label);

  test("27.10 ich nie ma, 28.10 są", () => {
    createTestApp({ today: "2026-10-27", seedOptions: { afterStep1: true } });
    expect(labels()).not.toContain("Przed rozmową z pracownikiem");
    expect(labels()).not.toContain("Docenienie");
    createTestApp({ today: "2026-10-28", seedOptions: { afterStep1: true } });
    expect(labels()).toContain("Przed rozmową z pracownikiem");
    expect(labels()).toContain("Docenienie");
  });
});
