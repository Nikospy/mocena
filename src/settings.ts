import { getDb } from "./db";

export function setting(key: string): string | null {
  const row = getDb().query("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | null;
  return row?.value ?? null;
}

/** Data systemowa (RRRR-MM-DD) z `settings.demo_date`. */
export function today(): string {
  const v = setting("demo_date");
  if (!v) throw new Error("Brak ustawienia demo_date (uruchom bun run seed)");
  return v;
}
