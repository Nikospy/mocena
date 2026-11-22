import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { call, html } from "./hr-test-helpers";

const K = "/cycles/cycle-katarzyna/assessment";
const clock = (h: string) => h.match(/<div class="st [a-z]+" id="objection-clock"><div><b>([^<]*)<\/b>/)?.[1] ?? "";

describe("zdanie o sprzeciwie na ekranie oceny (stan, adresat w dopełniaczu, rodzaj)", () => {
  test("przed wniesieniem: zegar, „do dyrektora generalnego urzędu”, „oceniana”", async () => {
    const { app } = createTestApp({ today: "2026-11-18" });
    const t = clock(await html(app, "anna", K));
    expect(t).toBe("Sprzeciw do dyrektora generalnego urzędu oceniana może złożyć do 24.11.2026. Zostało: 6 dni.");
  });

  test("po wniesieniu: stan faktyczny bez zegara", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const t = clock(await html(app, "anna", K));
    expect(t).toBe("Sprzeciw do dyrektora generalnego urzędu wniesiony 20.11.2026. Rozpatrzenie do 04.12.2026.");
  });

  test("po rozstrzygnięciu: data i wynik, bez zegara", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    expect((await call(app, "joanna", "/cycles/cycle-katarzyna/objection-outcome", { outcome: "rejected" })).status).toBe(303);
    for (const who of ["anna", "joanna"]) {
      const h = await html(app, who, K);
      expect(clock(h)).toBe("Sprzeciw do dyrektora generalnego urzędu wniesiony 20.11.2026, rozpatrzony 22.11.2026: nieuwzględniony.");
      expect(h).not.toContain("Zostało:");
      expect(h).not.toContain("dyrektor generalny urzędu oceniany");
    }
  });
});

describe("zdanie o sprzeciwie: oceniany mężczyzna i własny widok", () => {
  test("Marek widzi „oceniany może złożyć”, Piotr „możesz złożyć”, adresat w dopełniaczu", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const ids = ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja", "orientacja-na-klienta", "myslenie-analityczne"];
    const form: Record<string, string> = { justification: "Powód oceny.", developmentConclusions: "Kurs pism urzędowych.", interviewDate: "" };
    for (const id of ids) form[`score[${id}]`] = "7";
    expect((await call(app, "marek", "/cycles/cycle-piotr/assessment/approve", form)).status).toBe(303);
    expect((await call(app, "piotr", "/cycles/cycle-piotr/assessment/acknowledge", {})).status).toBe(303);
    expect(clock(await html(app, "marek", "/cycles/cycle-piotr/assessment"))).toMatch(/^Sprzeciw do dyrektora generalnego urzędu oceniany może złożyć do /);
    expect(clock(await html(app, "piotr", "/cycles/cycle-piotr/assessment"))).toMatch(/^Sprzeciw do dyrektora generalnego urzędu możesz złożyć do /);
    expect(await html(app, "piotr", "/")).toContain("Sprzeciw do dyrektora generalnego urzędu możesz złożyć");
  });
});
