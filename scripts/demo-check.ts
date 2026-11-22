// Użycie: bun run demo-check [BASE_URL] [--runs N]
import { runDemo } from "../src/demo-check/run";

const args = process.argv.slice(2);
let base = "http://localhost:3000";
let runs = 1;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--runs") runs = Number(args[++i]);
  else base = args[i];
}
if (!Number.isInteger(runs) || runs < 1) {
  console.error("Liczba przebiegów (--runs) musi być liczbą całkowitą od 1.");
  process.exit(2);
}

const fetcher = (path: string, init?: RequestInit) => fetch(new URL(path, base), init);
let failed = false;
for (let run = 1; run <= runs; run++) {
  console.log(`Przebieg ${run} z ${runs}: ${base}`);
  const results = await runDemo(fetcher, {
    onResult: (r) => {
      if (r.status === "ok") console.log(`✓ krok ${r.step}: ${r.description}`);
      else if (r.status === "skipped") console.log(`- krok ${r.step}: pominięty (${r.detail ?? r.description})`);
      else console.log(`✗ krok ${r.step}: ${r.detail ?? r.description}`);
    },
  });
  if (results.some((r) => r.status === "error")) failed = true;
}
process.exit(failed ? 1 : 0);
