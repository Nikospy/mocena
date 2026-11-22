import type { Cycle } from "../cycles";
import { getDb } from "../db";
import { visibleEvents } from "../events";

/** Najnowszy widoczny cykl każdej osoby (cykl istnieje od widocznego `cycle_started`). */
export function latestCycles(): Cycle[] {
  const all = getDb().query("SELECT * FROM cycles ORDER BY period_start DESC, id DESC").all() as Cycle[];
  const seen = new Set<string>();
  const out: Cycle[] = [];
  for (const c of all) {
    if (seen.has(c.person_id)) continue;
    if (!visibleEvents(c.id).some((e) => e.type === "cycle_started")) continue;
    seen.add(c.person_id);
    out.push(c);
  }
  return out;
}
