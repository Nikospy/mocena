// Generuje docs/licenses.md: zestawienie licencji zależności z package.json (wersje i licencje z node_modules).
// Użycie: bun run scripts/license-report.ts [--stdout]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Row = { name: string; version: string; license: string; kind: string; paid: string };

/** Identyfikatory SPDX znanych licencji darmowych; wszystko inne wymaga sprawdzenia przez człowieka. */
const FREE_SPDX = new Set(["MIT", "Apache-2.0", "ISC", "0BSD", "BSD-2-Clause", "BSD-3-Clause"]);

export function paidLabel(license: string): string {
  const parts = license.replace(/[()]/g, "").split(/\s+(?:OR|AND)\s+/);
  return parts.every((p) => FREE_SPDX.has(p.trim())) ? "nie" : "do sprawdzenia";
}

export function dependencyRows(root = "."): Row[] {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const rows: Row[] = [];
  for (const [kind, deps] of [
    ["zależność", pkg.dependencies ?? {}],
    ["zależność deweloperska", pkg.devDependencies ?? {}],
  ] as const) {
    for (const name of Object.keys(deps).sort()) {
      const installed = JSON.parse(readFileSync(join(root, "node_modules", name, "package.json"), "utf8"));
      const license = typeof installed.license === "string" ? installed.license : (installed.license?.type ?? "brak w pliku");
      rows.push({ name, version: String(installed.version), license, kind, paid: paidLabel(license) });
    }
  }
  return rows;
}

export function renderLicenses(root = "."): string {
  const rows = dependencyRows(root);
  const dep = rows.map((r) => `| \`${r.name}\` | ${r.version} | ${r.license} | ${r.kind} | ${r.paid} | \`node_modules/${r.name}/package.json\` |`).join("\n");
  return `# Licencje składników

Zestawienie składników, z których działa mOcena. Wszystkie są darmowe: prototyp działa bez płatnych licencji i usług, a dane nie wychodzą poza komputer, na którym działa aplikacja.

Tabelę zależności generuje \`bun run scripts/license-report.ts\` z \`package.json\` i \`node_modules\`. Po zmianie zależności uruchom skrypt ponownie.

## Zależności z package.json

| Składnik | Wersja | Licencja | Rodzaj | Płatne | Źródło |
|---|---|---|---|---|---|
${dep}

## Środowisko i zasoby

| Składnik | Licencja | Płatne | Uwagi |
|---|---|---|---|
| Bun (środowisko uruchomieniowe, \`bun:sqlite\`) | MIT | nie | Uruchamia serwer, testy i bazę SQLite. |
| htmx | nie dotyczy | nie | Nie jest używany: w repo nie ma pliku htmx ani odwołania w kodzie. |
| Open Sans (fonty w \`public/fonts/\`) | SIL Open Font License 1.1 | nie | Pełny tekst w \`public/fonts/OFL.txt\`. |
| Model językowy | brak | nie | Prototyp nie używa modelu językowego; wszystko działa na regułach. |

## Prawa do własnego kodu

Prawa autorskie do kodu ma autor. Zgodnie z regulaminem zadania zwycięzca konkursu przenosi je na organizatora pisemną umową.
`;
}

if (import.meta.main) {
  const out = renderLicenses();
  if (process.argv.includes("--stdout")) process.stdout.write(out);
  else {
    writeFileSync("docs/licenses.md", out);
    console.log("Zapisano docs/licenses.md");
  }
}
