import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { DEMO_NOTES } from "../seed/notes";
import { suggestForNote, suggestionMode } from "./index";
import { redact } from "./redact";

describe("adapter podpowiedzi notatek", () => {
  test("słowa z listy łapią notatkę z 11.03.2026, nie łapią drugiej z kroku 2 ani pozostałych", async () => {
    createTestApp({ today: "2026-03-11" });
    const hit = DEMO_NOTES.filter((n) => n[4] === 1);
    expect(hit.length).toBe(1);
    const r = await suggestForNote(hit[0]![5]);
    expect(r.source).toBe("rules");
    expect(r.taskChange).toBe(true);
    expect(r.matched).toContain("przejął");
    const step2other = DEMO_NOTES.find((n) => n[0] === "2026-04-21")!;
    expect((await suggestForNote(step2other[5])).taskChange).toBe(false);
    expect((await suggestForNote("Interesant przyszedł z niekompletnym wnioskiem.")).taskChange).toBe(false);
  });

  test("pusty tekst daje none; tryb to rules", async () => {
    createTestApp({ today: "2026-03-11" });
    expect(await suggestForNote("  ")).toEqual({ source: "none", taskChange: null, matched: [] });
    expect(suggestionMode()).toBe("rules");
  });

  test("redakcja zamienia też odmienione imiona", () => {
    expect(redact("Piotra i Marii nie było; Wójcik wrócił", ["Piotr Wójcik", "Maria Dąbrowska"])).toBe("[osoba] i [osoba] nie było; [osoba] wrócił");
  });
});
