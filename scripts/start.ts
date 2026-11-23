// Jedna komenda na pokaz lokalny: `bun run start`. Zakłada demonstracyjną bazę, jeśli jej nie ma, i uruchamia serwer.
// Istniejącej bazy nie rusza: wgranie danych pokazowych czyści tabele (src/seed-cli.ts).
import { existsSync, statSync } from "node:fs";

export const DEFAULT_DEMO_DB = "mocena-demo.sqlite";

function seedWithCli(file: string): void {
  const res = Bun.spawnSync(["bun", "run", "src/seed-cli.ts"], {
    env: { ...process.env, MOCENA_DB: file },
    stdout: "inherit",
    stderr: "inherit",
  });
  if (res.exitCode !== 0) throw new Error(`Wgranie danych pokazowych do ${file} nie powiodło się.`);
}

/** Wgrywa dane pokazowe tylko wtedy, gdy pliku bazy nie ma (albo jest pusty). Zwraca true, gdy wgrano. */
export function ensureDemoDb(file: string, seed: (file: string) => void = seedWithCli): boolean {
  if (existsSync(file) && statSync(file).size > 0) return false;
  seed(file);
  return true;
}

if (import.meta.main) {
  const file = process.env.MOCENA_DB?.trim() || DEFAULT_DEMO_DB;
  const port = process.env.PORT?.trim() || "3000";
  const seeded = ensureDemoDb(file);
  console.log(seeded ? `Wgrano dane pokazowe do ${file}.` : `Używam istniejącej bazy ${file} (bez wgrywania danych).`);
  console.log(`Otwórz http://localhost:${port} i kliknij „Rozpocznij pokaz”.`);
  const server = Bun.spawn(["bun", "run", "src/local.tsx"], {
    env: { ...process.env, MOCENA_DB: file, PORT: port },
    stdout: "inherit",
    stderr: "inherit",
  });
  for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => server.kill());
  process.exit(await server.exited);
}
