import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { addNote, canWriteNoteAbout, lastFeedbackDate, noteById, notesAbout, notesByAuthor, notesForCycle, sendFeedback } from "./repo";

describe("notatki: odczyty i dostęp", () => {
  test("granica widoczności to date <= today(), nie created_at", () => {
    const { db } = createTestApp({ today: "2024-12-09", seedOptions: { afterStep1: true } });
    expect(notesByAuthor("marek")).toEqual([]);
    db.query("UPDATE settings SET value = '2025-02-11' WHERE key = 'demo_date'").run();
    const dates = notesByAuthor("marek").map((n) => n.date);
    expect(dates).toEqual(["2025-02-11", "2024-12-12"]);
    const future = db.query("SELECT id FROM notes WHERE date = '2025-05-20'").get() as { id: number };
    expect(noteById(future.id)).toBeNull();
  });

  test("notesForCycle: tylko autor i okres od period_start, rosnąco", () => {
    createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const own = notesForCycle("cycle-piotr", "marek");
    expect(own.length).toBe(9);
    expect(own.map((n) => n.date)).toEqual([...own.map((n) => n.date)].sort());
    expect(notesForCycle("cycle-piotr", "anna")).toEqual([]);
    expect(notesAbout("piotr", { authorId: "marek", from: "2026-01-01" }).length).toBe(5);
  });

  test("dostęp zapisu: oceniający cyklu albo przełożony bez cyklu", () => {
    createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    expect(canWriteNoteAbout("marek", "piotr")).toBe(true);
    expect(canWriteNoteAbout("anna", "piotr")).toBe(false);
    expect(canWriteNoteAbout("marek", "maria")).toBe(true);
    expect(canWriteNoteAbout("anna", "maria")).toBe(false);
  });

  test("addNote: cycle_id z openCycle, created_at = dziś; Maria bez cyklu", () => {
    createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const p = addNote({ authorId: "marek", subjectId: "piotr", criterionId: "rzetelnosc", date: "2026-11-20", text: "x", rating: null, taskChange: true, suggestion: { source: "rules", taskChange: false } });
    expect([p.cycle_id, p.created_at, p.task_change, p.suggested_task_change]).toEqual(["cycle-piotr", "2026-11-21", 1, 0]);
    const m = addNote({ authorId: "marek", subjectId: "maria", criterionId: "rzetelnosc", date: "2026-11-21", text: "y", rating: null, taskChange: false, suggestion: { source: "none", taskChange: null } });
    expect([m.cycle_id, m.suggested_task_change]).toEqual([null, null]);
  });

  test("lastFeedbackDate: ostatnia widoczna wysyłka autora do osoby", () => {
    createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    expect(lastFeedbackDate("marek", "piotr")).toBeNull();
    const id = notesAbout("piotr", { authorId: "marek" })[0]!.id;
    sendFeedback({ noteId: id, authorId: "marek", text: "ok" });
    expect(lastFeedbackDate("marek", "piotr")).toBe("2026-11-21");
    expect(lastFeedbackDate("anna", "piotr")).toBeNull();
  });
});
