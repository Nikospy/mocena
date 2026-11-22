import { getDb, hasDb } from "./db";

export function setting(key: string): string | null {
  const row = getDb().query("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | null;
  return row?.value ?? null;
}

export const OFFICE_INIT_COMMAND = 'bun run init -- --office "Nazwa urzędu" --city "Miejscowość" --hr "Imię Nazwisko"';

export function isDemoMode(): boolean {
  return hasDb() && setting("demo_date") !== null;
}

const polishDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" });

/** Data kalendarzowa w Polsce. W pokazie zastępuje ją data ustawiona przez widza. */
export function today(): string {
  return setting("demo_date") ?? polishDate.format(new Date());
}
