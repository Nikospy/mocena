import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");

describe("README", () => {
  test("sekcja „Jak to wygląda” wskazuje istniejące zrzuty z polskim opisem", () => {
    expect(readme).toContain("## Jak to wygląda");
    const shots = [...readme.matchAll(/!\[([^\]]+)\]\((docs\/pitch\/img\/[^)]+)\)/g)];
    expect(shots.length).toBeGreaterThanOrEqual(2);
    for (const [, alt, path] of shots) {
      expect(alt.length).toBeGreaterThan(10);
      expect(existsSync(path)).toBe(true);
    }
  });
});

describe("wykluczenie pierwszej oceny", () => {
  test("README i docs/coverage.md wymieniają art. 37–38", () => {
    expect(readme).toContain("art. 37–38");
    expect(readFileSync("docs/coverage.md", "utf8")).toContain("art. 37–38");
  });
});
