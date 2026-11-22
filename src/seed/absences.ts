// Dane pokazowe S-03: zmiana oceniającego Ewy (przejęcie wydziału) i jej nieobecność wpisana w dniu końca.
// Nieobecności Piotra nie są wgrywane: kadry wpisują je na żywo w kroku 3 pokazu.
import { getDb } from "../db";
import { seedEvent } from "../events";

export function seedAbsences(): void {
  const db = getDb();
  // Marek jest oceniającym Ewy od początku (base.ts); zdarzenie dokumentuje przejęcie od poprzedniego naczelnika.
  seedEvent("appraiser_changed", "cycle-ewa", "joanna", { from_id: "poprzedni-naczelnik", to_id: "marek" }, "2024-12-05");
  const r = db
    .query("INSERT INTO absences (person_id, date_from, date_to, excused, recorded_on, recorded_by) VALUES (?, ?, ?, 1, ?, ?)")
    .run("ewa", "2026-02-16", "2026-08-28", "2026-08-28", "joanna");
  seedEvent("absence_recorded", "cycle-ewa", "joanna", { absence_id: Number(r.lastInsertRowid), notified: ["marek", "ewa"] }, "2026-08-28");
}
