// bun run scripts/design-report.ts <katalog z metrics.json>
import { join } from "node:path";

type Metrics = {
  under16PctMain: number | null;
  sizes: [number, number][];
  sizeCount: number;
  maxCpl: number;
  biggestCount: number;
  largestIsH1: boolean;
  primaryCount: number;
  h1Top: number | null;
  maxBoxDepth: number;
  boxes: number;
  shadows: number;
  pillLinks: number;
  assessmentForm: boolean;
  screens: number;
  overflowPx: number;
  under24: number;
  h1Count: number;
  contrastFails: number;
  unlabeled: number;
  controlsUnder48: number;
  mobileNavUnder48: number;
};
type Sample = {
  id: string;
  name: string;
  width: number;
  kind: "screen" | "print" | "download";
  screenshot: string;
  evidence: { pdf?: string; pages?: string[]; download?: string };
  metrics: Metrics;
  focus?: { visible: boolean };
};
const numeric = [
  "sizeCount", "maxCpl", "biggestCount", "primaryCount", "maxBoxDepth",
  "boxes", "shadows", "pillLinks", "screens", "overflowPx", "under24", "h1Count",
  "contrastFails", "unlabeled", "controlsUnder48", "mobileNavUnder48",
] as const satisfies readonly (keyof Metrics)[];

const mobile = (width: number) => width <= 360;

function failedThresholds({ width, metrics: m, focus, kind }: Sample): string[] {
  if (kind === "download") return []; // Podgląd treści technicznej, bez interfejsu aplikacji.
  const failures: string[] = [];
  const check = (failed: boolean, name: string, detail: string) => {
    if (failed) failures.push(`${name} (${detail})`);
  };
  const allowedSizes = [14, 16, 20, mobile(width) ? 24 : 28];
  const observedSizes = m.sizes.map(([size]) => size).sort((a, b) => a - b);
  const unexpected = observedSizes.filter((size) => !allowedSizes.includes(size));
  check(m.mobileNavUnder48 > 0, "N1", `${m.mobileNavUnder48} celów nawigacji poniżej 48 px`);
  check(m.under16PctMain !== null && m.under16PctMain > 50, "T1", `${m.under16PctMain}% tekstu w main poniżej 16 px`);
  check(m.sizeCount > 4 || unexpected.length > 0, "T2", `rozmiary: ${observedSizes.join(", ")} px; poza skalą: ${unexpected.join(", ") || "brak"}`);
  check(width === 1440 && m.maxCpl > 80, "T3", `${m.maxCpl} znaków w wierszu`);
  check(m.biggestCount !== 1 || !m.largestIsH1, "H1", `${m.biggestCount} największych; h1: ${m.largestIsH1 ? "tak" : "nie"}`);
  check(m.primaryCount > 1, "H2", `${m.primaryCount} akcji głównych`);
  check(width === 360 && (m.h1Top === null || m.h1Top > 180), "H3", m.h1Top === null ? "brak h1" : `h1 od ${m.h1Top} px`);
  check(m.maxBoxDepth > 1 || m.boxes > 10, "K1", `${m.boxes} ramek, zagnieżdżenie ${m.maxBoxDepth}`);
  check(m.shadows > 2, "K2", `${m.shadows} cieni`);
  check(m.pillLinks > 0, "K3", `${m.pillLinks} klikalnych pigułek`);
  check(width === 360 && m.assessmentForm && m.screens > 4, "K4", `${m.screens} wysokości ekranu`);
  check(mobile(width) && m.overflowPx > 0, "L2", `${m.overflowPx} px przepełnienia`);
  check(m.under24 > 0, "L3", `${m.under24} celów poniżej 24 px`);
  check(m.h1Count !== 1, "L4", `${m.h1Count} widocznych h1`);
  check(m.contrastFails > 0, "Kontrast", `${m.contrastFails} naruszeń`);
  check(m.unlabeled > 0, "Etykiety", `${m.unlabeled} pól bez etykiety`);
  check(m.controlsUnder48 > 0, "F1", `${m.controlsUnder48} kontrolek poniżej 48 px`);
  check(focus?.visible === false, "F6", "brak widocznego fokusu");
  return failures;
}

export async function readReport(dir: string) {
  const samples: Sample[] = await Bun.file(join(dir, "metrics.json")).json();
  if (!Array.isArray(samples) || !samples.length) throw new Error("metrics.json nie zawiera pomiarów");
  const captureFile = Bun.file(join(dir, "capture-errors.json"));
  const problems: string[] = await captureFile.exists() ? await captureFile.json() : [];
  const ids = new Set<string>();
  const textByWidth = new Map<number, number[]>();
  const rows = [];
  for (const sample of samples) {
    const m = sample.metrics;
    if (!m || numeric.some((key) => !Number.isFinite(m[key])) ||
        !(m.under16PctMain === null || Number.isFinite(m.under16PctMain)) ||
        typeof m.largestIsH1 !== "boolean" || typeof m.assessmentForm !== "boolean" ||
        !(m.h1Top === null || Number.isFinite(m.h1Top)) || !Array.isArray(m.sizes)) {
      throw new Error(`Brak miar wymaganych przez raport w wierszu ${sample.id}. Powtórz pomiar aktualnym skryptem.`);
    }
    if (ids.has(sample.id)) throw new Error(`Powtórzony pomiar ${sample.id}`);
    ids.add(sample.id);
    const expected = [sample.screenshot];
    if (sample.kind === "print") {
      const { pdf, pages } = sample.evidence;
      if (!pdf || !pages?.length) problems.push(`Brak PDF lub obrazów stron: ${sample.id}`);
      else expected.push(pdf, ...pages);
    }
    if (sample.kind === "download") {
      if (!sample.evidence.download) problems.push(`Brak pliku odpowiedzi: ${sample.id}`);
      else expected.push(sample.evidence.download);
    }
    for (const file of expected) {
      const artifact = Bun.file(join(dir, file));
      if (!(await artifact.exists()) || artifact.size === 0) problems.push(`Brak pliku lub pusty plik: ${file}`);
    }
    if (sample.kind !== "download" && m.under16PctMain !== null) {
      const text = textByWidth.get(sample.width) ?? [];
      text.push(m.under16PctMain);
      textByWidth.set(sample.width, text);
    }
    rows.push({ ...sample, failures: failedThresholds(sample) });
  }
  const medians = [...textByWidth].sort(([a], [b]) => a - b).map(([width, values]) => {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
    return { width, median, pass: median <= 30 };
  });
  return { rows, medians, problems };
}

if (import.meta.main) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Użycie: bun run scripts/design-report.ts <katalog>");
    process.exit(2);
  }
  try {
    const { rows, medians, problems } = await readReport(dir);
    console.log("| Ekran | Szerokość | Niespełnione progi |\n| --- | ---: | --- |");
    for (const row of rows) console.log(`| ${row.name} | ${row.width} | ${row.failures.join("; ") || "—"} |`);
    console.log("\n| Szerokość | T1 · mediana tekstu w main poniżej 16 px | Próg ≤ 30% |\n| ---: | ---: | --- |");
    for (const { width, median, pass } of medians) console.log(`| ${width} | ${median}% | ${pass ? "przechodzi" : "nie przechodzi"} |`);
    for (const problem of problems) console.error(problem);
    const failed = rows.filter((row) => row.failures.length > 0).length;
    console.log(`\nPomiary: ${rows.length}. Niespełnione progi ekranów: ${failed}. Błędy pomiaru: ${problems.length}.`);
    process.exitCode = failed || medians.some((row) => !row.pass) || problems.length ? 1 : 0;
  } catch (error) {
    console.error(String(error));
    process.exitCode = 2;
  }
}
