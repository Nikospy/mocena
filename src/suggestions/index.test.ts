import { describe, expect, test } from "bun:test";
import { officeSettings } from "../office-settings";
import { createTestApp } from "../test-helpers";
import { DEMO_NOTES } from "../seed/notes";
import { checkSensitiveData, detectSensitiveData, suggestForNote, suggestionMode } from "./index";
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

  test("strażnik danych wrażliwych wykrywa zdrowie, rodzinę i wyznanie (także bez polskich znaków), a nie łapie notatek pokazowych ani fałszywych trafień z pracy urzędu", async () => {
    createTestApp({ today: "2026-03-11" });
    for (const row of DEMO_NOTES) {
      const r = await suggestForNote(row[5]);
      expect(r.sensitiveCategories ?? []).toEqual([]);
    }
    // Tekst kroku 2 przewodnika (/tour).
    expect((await suggestForNote("Piotr przejął kolejkę wniosków po odejściu kolegi.")).sensitiveCategories).toEqual([]);

    // Testy negatywne: zwykłe zdania z pracy urzędu nie mogą wywoływać fałszywych alarmów.
    const officeFalsePositives = [
      "Wypełnił obowiązek ciążący na wydziale w terminie.",
      "Rozpatrzył wniosek o zwolnienie z opłaty skarbowej.",
      "Przygotował diagnozę potrzeb szkoleniowych zespołu.",
      "Sprawa z lekarzem weterynarii została uzgodniona.",
      "Przeprowadził kontrolę w szpitalu powiatowym.",
      "Zaproponował terapię zmian procesu obiegu pism.",
      "Opracował odpowiedź na wniosek o religię w szkołach.",
    ];
    for (const sentence of officeFalsePositives) {
      expect((await suggestForNote(sentence)).sensitiveCategories).toEqual([]);
    }

    // Testy pozytywne: luki czułości z recenzji (zdrowie, rodzina, wyznanie, zapis bez polskich znaków).
    const healthSamples = [
      "Był na zwolnieniu lekarskim po pobycie w szpitalu.",
      "W tym tygodniu był chory i choruje od poniedziałku.",
      "Wróciła do pracy po porodzie.",
      "Jest w ciazy i zgłosiła nieobecność.",
      "Dostarczył orzeczenie jako niepelnosprawny pracownik.",
      "Poszedł na L4 po wizycie u lekarza.",
    ];
    for (const sample of healthSamples) {
      const r = await suggestForNote(sample);
      expect(r.sensitiveCategories?.map((c) => c.category)).toContain("health");
      expect(r.sensitiveToken).toBeTruthy();
    }

    const familySamples = [
      "W trakcie rozwodu poprosił o przesunięcie dyżuru.",
      "Zgłosiła urlop macierzyński od przyszłego miesiąca.",
      "Rozmawiał o urlopie rodzicielskim i alimentach.",
    ];
    for (const sample of familySamples) {
      const r = await suggestForNote(sample);
      expect(r.sensitiveCategories?.map((c) => c.category)).toContain("family");
    }

    const religionSamples = [
      "Ze względu na swoje wyznanie nie pracował w święto.",
      "Chodzi do kosciola przed pracą i wspomniał o modlitwie.",
      "Rozmawialiśmy o swiatopogladzie pracownika.",
    ];
    for (const sample of religionSamples) {
      const r = await suggestForNote(sample);
      expect(r.sensitiveCategories?.map((c) => c.category)).toContain("religion");
    }

    // Fail-closed: brak listy słów nie wyłącza strażnika po cichu.
    expect(() => detectSensitiveData("Był chory.", {} as any)).toThrow();
    const orig = officeSettings().sensitiveDataWords;
    try {
      (officeSettings() as any).sensitiveDataWords = undefined;
      expect(() => checkSensitiveData("Był chory.")).toThrow();
    } finally {
      (officeSettings() as any).sensitiveDataWords = orig;
    }
  });
});
