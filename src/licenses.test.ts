import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { paidLabel, renderLicenses } from "../scripts/license-report";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const doc = readFileSync("docs/licenses.md", "utf8");

describe("docs/licenses.md", () => {
  test("ma wiersz dla każdej zależności z package.json", () => {
    const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(doc).toContain(`| \`${name}\` |`);
  });

  test("wymienia Bun, Open Sans OFL, brak modelu językowego i brak płatnych licencji", () => {
    for (const t of ["Bun", "Open Sans", "SIL Open Font License", "Model językowy", "bez płatnych licencji", "Prawa autorskie do kodu ma autor"]) {
      expect(doc).toContain(t);
    }
  });

  test("generator odtwarza nazwę, wersję i licencję z pliku, bez wpisów do sprawdzenia", () => {
    const generated = renderLicenses(".");
    const rows = (s: string) => s.split("\n").filter((l) => l.startsWith("| `")).map((l) => l.split("|").slice(1, 6).map((c) => c.trim()));
    expect(rows(generated)).toEqual(rows(doc));
    expect(doc).not.toContain("do sprawdzenia");
    expect(doc).not.toContain("brak w pliku");
  });

  test("kolumna Płatne: nieznana licencja daje „do sprawdzenia”", () => {
    expect(paidLabel("MIT")).toBe("nie");
    expect(paidLabel("MIT OR Apache-2.0")).toBe("nie");
    expect(paidLabel("UNLICENSED")).toBe("do sprawdzenia");
    expect(paidLabel("brak w pliku")).toBe("do sprawdzenia");
    expect(paidLabel("MIT AND Proprietary")).toBe("do sprawdzenia");
  });
});
