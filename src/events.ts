import { getDb } from "./db";
import { today } from "./settings";

export type AppEvent = {
  id: number;
  type: string;
  cycleId: string | null;
  actorId: string | null;
  date: string;
  payload: any;
};

type Row = { id: number; type: string; cycle_id: string | null; actor_id: string | null; date: string; payload: string };

function toEvent(r: Row): AppEvent {
  return { id: r.id, type: r.type, cycleId: r.cycle_id, actorId: r.actor_id, date: r.date, payload: JSON.parse(r.payload) };
}

/** Zapis z jawną datą: tylko dane pokazowe i testy, nigdy trasy. */
export function seedEvent(type: string, cycleId: string | null, actorId: string | null, payload: unknown, date: string): number {
  const r = getDb()
    .query("INSERT INTO events (type, cycle_id, actor_id, date, payload) VALUES (?, ?, ?, ?, ?)")
    .run(type, cycleId, actorId, date, JSON.stringify(payload ?? {}));
  return Number(r.lastInsertRowid);
}

/** Zdarzenie z datą dnia. Gdy aktor działa w zastępstwie oceniającego cyklu, `payload.on_behalf_of` to id nieobecnego. */
export function recordEvent(type: string, cycleId: string | null, actorId: string | null, payload: unknown): number {
  const isObject = typeof payload === "object" && payload !== null && !Array.isArray(payload);
  const extra = isObject || payload === undefined ? onBehalfOf(cycleId, actorId) : null;
  return seedEvent(type, cycleId, actorId, extra ? { ...(payload as object | undefined), ...extra } : payload, today());
}

/** `{ on_behalf_of }`, gdy aktor ma dziś zastępstwo za oceniającego cyklu; inaczej `null`. */
export function onBehalfOf(cycleId: string | null, actorId: string | null): { on_behalf_of: string } | null {
  if (!cycleId || !actorId) return null;
  const cycle = getDb().query("SELECT person_id, appraiser_id FROM cycles WHERE id = ?").get(cycleId) as { person_id: string; appraiser_id: string } | null;
  if (!cycle || cycle.appraiser_id === actorId || cycle.person_id === actorId) return null;
  const now = today();
  const sub = getDb()
    .query("SELECT 1 FROM substitutions WHERE absent_id = ? AND substitute_id = ? AND date_from <= ? AND date_to >= ?")
    .get(cycle.appraiser_id, actorId, now, now);
  return sub ? { on_behalf_of: cycle.appraiser_id } : null;
}

/** Zdarzenia z datą nie późniejszą niż `asOf` (domyślnie `today()`), w porządku (date, id). `null` = zdarzenia bez cyklu. */
export function visibleEvents(cycleId: string | null, opts: { asOf?: string } = {}): AppEvent[] {
  const asOf = opts.asOf ?? today();
  const rows = getDb()
    .query("SELECT * FROM events WHERE cycle_id IS ? AND date <= ? ORDER BY date, id")
    .all(cycleId, asOf) as Row[];
  return rows.map(toEvent);
}

export function visibleEventsOfType(type: string): AppEvent[] {
  const rows = getDb()
    .query("SELECT * FROM events WHERE type = ? AND date <= ? ORDER BY date, id")
    .all(type, today()) as Row[];
  return rows.map(toEvent);
}
