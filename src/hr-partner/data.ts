// Jedyne miejsce, w którym HR partner czyta cudze dane (notatki, cykle, zdarzenia, ludzi).
import { openCycle } from "../cycles";
import { cycleCriteria } from "../cycles/part1";
import { getDb } from "../db";
import { visibleEvents, type AppEvent } from "../events";
import { lastFeedbackDate, noteById, notesAbout, type Note } from "../notes/repo";
import { today } from "../settings";
import type { Cycle } from "../cycles";

export { noteById, lastFeedbackDate, notesAbout, openCycle, cycleCriteria };

/** Zdarzenia `task_change_answered` (odpowiedzi) dotyczące notatki: dla notatki bez cyklu zdarzenia bez cyklu. */
export function answersFor(note: Note): AppEvent[] {
  return visibleEvents(note.cycle_id).filter((e) => e.type === "task_change_answered" && e.payload?.noteId === note.id);
}

/** Odpowiedzi na wszystkie notatki podanej listy. */
export function answersForNotes(notes: Note[]): AppEvent[] {
  const events: AppEvent[] = [];
  const seen = new Set<string | null>();
  for (const n of notes) {
    if (seen.has(n.cycle_id)) continue;
    seen.add(n.cycle_id);
    events.push(...visibleEvents(n.cycle_id).filter((e) => e.type === "task_change_answered"));
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

/** Data rozmowy o kryteriach (`part1_submitted`); brak: początek okresu oceny. */
export function talkDate(cycle: Cycle): string {
  const ev = visibleEvents(cycle.id).find((e) => e.type === "part1_submitted");
  return ev?.date ?? cycle.period_start;
}

/** Otwarte cykle, w których osoba jest oceniającym. */
export function openCyclesOfAppraiser(appraiserId: string): Cycle[] {
  const ids = getDb().query("SELECT DISTINCT person_id FROM cycles WHERE appraiser_id = ?").all(appraiserId) as { person_id: string }[];
  return ids.map((r) => openCycle(r.person_id)).filter((c): c is Cycle => c !== null && c.appraiser_id === appraiserId);
}

export function personName(id: string): string {
  return (getDb().query("SELECT name FROM people WHERE id = ?").get(id) as { name: string } | null)?.name ?? id;
}

