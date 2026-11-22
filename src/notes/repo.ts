import { activeSubstitution, actsAsAppraiser } from "../substitutions";
import { recordEvent, visibleEvents } from "../events";
import { getDb } from "../db";
import { openCycle } from "../cycles";
import { today } from "../settings";
import type { SuggestionSource } from "../suggestions/types";

export type Rating = "good" | "needs_improvement";
export type Note = {
  id: number; author_id: string; subject_id: string; cycle_id: string | null; criterion_id: string;
  date: string; text: string; rating: Rating | null; task_change: number; suggested_task_change: number | null;
  suggestion_source: SuggestionSource; created_at: string;
};
export type FeedbackMessage = { id: number; note_id: number; author_id: string; recipient_id: string; sent_on: string; text: string };

/** Zapis: oceniający otwartego cyklu osoby; bez cyklu — jej przełożony (`people.supervisor_id`). */
export function canWriteNoteAbout(viewerId: string, subjectId: string): boolean {
  const cycle = openCycle(subjectId);
  if (cycle) return actsAsAppraiser(cycle.appraiser_id, viewerId);
  const row = getDb().query("SELECT supervisor_id FROM people WHERE id = ?").get(subjectId) as { supervisor_id: string | null } | null;
  return !!row && actsAsAppraiser(row.supervisor_id, viewerId);
}

/** W samodzielnym pokazie przykładowe fakty pojawiają się po potwierdzeniu części I. */
function visibleNotes(notes: Note[]): Note[] {
  const events = visibleEvents("cycle-piotr");
  const seeded = events.find((event) => event.type === "demo_notes_seeded");
  if (!seeded || events.some((event) => event.type === "part1_confirmed")) return notes;
  const pending = new Set<number>(seeded.payload.noteIds);
  return notes.filter((note) => !pending.has(note.id));
}

export function noteById(id: number): Note | null {
  const note = getDb().query("SELECT * FROM notes WHERE id = ? AND date <= ?").get(id, today()) as Note | null;
  return note ? visibleNotes([note])[0] ?? null : null;
}

export function notesAbout(subjectId: string, opts: { authorId: string; from?: string }): Note[] {
  const notes = getDb()
    .query("SELECT * FROM notes WHERE subject_id = ? AND author_id = ? AND date >= ? AND date <= ? ORDER BY date, id")
    .all(subjectId, opts.authorId, opts.from ?? "", today()) as Note[];
  return visibleNotes(notes);
}

export function notesByAuthor(authorId: string): Note[] {
  const notes = getDb().query("SELECT * FROM notes WHERE author_id = ? AND date <= ? ORDER BY date DESC, id DESC").all(authorId, today()) as Note[];
  return visibleNotes(notes);
}

export function notesForCycle(cycleId: string, authorId: string): Note[] {
  const c = getDb().query("SELECT person_id, period_start FROM cycles WHERE id = ?").get(cycleId) as
    | { person_id: string; period_start: string }
    | null;
  if (!c) return [];
  const firstStart = visibleEvents(cycleId).filter((event) => event.type === "cycle_started").reduce((earliest, event) => {
    const start = event.payload.periodStart;
    return typeof start === "string" && start < earliest ? start : earliest;
  }, c.period_start);
  return notesAbout(c.person_id, { authorId, from: firstStart })
    .filter((note) => note.date >= c.period_start || note.cycle_id === cycleId);
}

export function lastFeedbackDate(authorId: string, recipientId: string): string | null {
  const r = getDb()
    .query("SELECT MAX(sent_on) AS d FROM feedback_messages WHERE author_id = ? AND recipient_id = ? AND sent_on <= ?")
    .get(authorId, recipientId, today()) as { d: string | null };
  return r.d;
}

export function addNote(n: {
  authorId: string; subjectId: string; criterionId: string; date: string; text: string; rating: Rating | null;
  taskChange: boolean; suggestion: { source: SuggestionSource; taskChange: boolean | null };
}): Note {
  const now = today();
  const res = getDb()
    .query(
      `INSERT INTO notes (author_id, subject_id, cycle_id, criterion_id, date, text, rating, task_change, suggested_task_change, suggestion_source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      n.authorId, n.subjectId, openCycle(n.subjectId)?.id ?? null, n.criterionId, n.date, n.text, n.rating,
      n.taskChange ? 1 : 0, n.suggestion.taskChange === null ? null : n.suggestion.taskChange ? 1 : 0, n.suggestion.source, now,
    );
  const note = getDb().query("SELECT * FROM notes WHERE id = ?").get(Number(res.lastInsertRowid)) as Note;
  const cycle = openCycle(n.subjectId);
  const supervisor = (getDb().query("SELECT supervisor_id FROM people WHERE id = ?").get(n.subjectId) as { supervisor_id: string | null } | null)?.supervisor_id;
  const absentId = cycle ? cycle.appraiser_id : supervisor;
  if (absentId && absentId !== n.authorId && activeSubstitution(absentId, n.authorId)) {
    recordEvent("note_added_in_substitution", cycle?.id ?? null, n.authorId, { note_id: note.id, subject_id: n.subjectId, on_behalf_of: absentId });
  }
  return note;
}

export function sendFeedback(f: { noteId: number; authorId: string; text: string }): void {
  const note = getDb().query("SELECT subject_id FROM notes WHERE id = ?").get(f.noteId) as { subject_id: string } | null;
  if (!note) throw new Error(`Brak notatki ${f.noteId}`);
  getDb()
    .query("INSERT INTO feedback_messages (note_id, author_id, recipient_id, sent_on, text) VALUES (?, ?, ?, ?, ?)")
    .run(f.noteId, f.authorId, note.subject_id, today(), f.text);
}

/** Wiadomości do osoby, od najnowszej. */
export function feedbackFor(recipientId: string): FeedbackMessage[] {
  return getDb()
    .query("SELECT * FROM feedback_messages WHERE recipient_id = ? AND sent_on <= ? ORDER BY sent_on DESC, id DESC")
    .all(recipientId, today()) as FeedbackMessage[];
}
