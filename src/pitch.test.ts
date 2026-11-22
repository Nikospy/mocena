import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");
const deck = readFileSync("docs/pitch/index.html", "utf8");
const files = { "README.md": readme, "docs/pitch/index.html": deck };

describe("materiały dla jury", () => {
  test("README ma adres wdrożenia i przycisk pokazu", () => {
    expect(readme).toContain("https://mocena.pietkiewicz-mikolaj.workers.dev");
    expect(readme).toContain("Rozpocznij pokaz");
  });

  for (const [name, text] of Object.entries(files)) {
    test(`${name}: bez słowa „podpis”, ścieżek prywatnych i e-maili`, () => {
      // Zdanie 11b (słownik, „Zdania, których nie mówimy”) jest jedynym dopuszczalnym użyciem „podpis”; reszta tekstu go nie ma.
      const elevenB = "Kliknięcie to potwierdzenie w systemie. Moc prawną daje dziś wydruk z podpisem. Urząd może w tym miejscu podpiąć podpis kwalifikowany albo zaufany.";
      expect(text.replace(elevenB, "").toLowerCase()).not.toContain("podpis");
      expect(text).not.toContain("/Users/");
      expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    });
  }

  test("prezentacja ma od 10 do 15 slajdów", () => {
    const n = (deck.match(/<section\s+class="slide"/g) ?? []).length;
    expect(n).toBeGreaterThanOrEqual(10);
    expect(n).toBeLessThanOrEqual(15);
  });
});
