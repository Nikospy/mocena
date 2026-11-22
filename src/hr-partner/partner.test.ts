import { describe, expect, test } from "bun:test";
import officeData from "../../rules/office-settings.json";
import { seedEvent } from "../events";
import { suggestDevelopmentForm } from "../suggestions";
import { createTestApp } from "../test-helpers";
import { answersForNotes, cycleCriteria, lastFeedbackDate, notesAbout } from "./data";
import { appreciationReminder, beforeMeetingSummary, nameForm, taskChangeBoundary } from "./partner";

function piotrSummary(today: string, opts: { answer?: "yes" | "no" } = {}) {
  const { db } = createTestApp({ today, seedOptions: { afterStep1: true } });
  const notes = notesAbout("piotr", { authorId: "marek", from: "2024-11-27" });
  if (opts.answer) {
    const n = notes.find((x) => x.task_change === 1)!;
    seedEvent("task_change_answered", n.cycle_id, "marek", { noteId: n.id, answer: opts.answer, developmentFormId: null }, today);
  }
  const input = {
    subject: { id: "piotr", name: "Piotr Wójcik" },
    cycleId: "cycle-piotr",
    periodStart: "2024-11-27",
    today,
    notes,
    events: answersForNotes(notes),
    criteriaIds: cycleCriteria("cycle-piotr").map((k) => k.id),
    lastFeedback: lastFeedbackDate("marek", "piotr"),
  };
  return { db, notes, summary: beforeMeetingSummary(input) };
}

describe("pytanie o pracę po godzinach", () => {
  test("wyzwala je notatka po zmianie zadań z „po 18:00”; karta rozmowy tylko po odpowiedzi „tak”", () => {
    const { summary } = piotrSummary("2026-11-21");
    expect(summary.afterHours?.notes.map((n) => n.date)).toEqual(["2026-04-21"]);
    // Bez odpowiedzi „tak” na notatce ze zmianą zadań nie ma karty rozmowy.
    expect(summary.afterHours?.cardHref).toBeNull();
    const yes = piotrSummary("2026-11-21", { answer: "yes" }).summary;
    expect(yes.afterHours?.cardHref).toMatch(/^\/notes\/\d+\/task-change$/);
  });

  test("odpowiedź „nie” znosi granicę zmiany zadań razem z pytaniem", () => {
    expect(piotrSummary("2026-11-21", { answer: "no" }).summary.afterHours).toBeNull();
  });
});

describe("granica zmiany zadań i zestawienie", () => {
  test("granica 11.03.2026, kryteria po obu stronach i bez notatek", () => {
    const { summary } = piotrSummary("2026-11-21");
    expect(summary.boundary).toBe("2026-03-11");
    const both = summary.bothSides.map((i) => i.text).join("|");
    for (const k of ["Rzetelność", "Komunikacja", "Współpraca"]) expect(both).toContain(`„${k}”`);
    expect(summary.criteriaWithoutNotes.map((i) => i.text).join("|")).toContain("Myślenie analityczne");
    expect(summary.pendingQuestion?.note.date).toBe("2026-03-11");
  });

  test("odpowiedź „nie” znosi granicę, „tak” jej nie zmienia", () => {
    expect(piotrSummary("2026-11-21", { answer: "no" }).summary.boundary).toBeNull();
    const yes = piotrSummary("2026-11-21", { answer: "yes" }).summary;
    expect(yes.boundary).toBe("2026-03-11");
    expect(yes.pendingQuestion).toBeNull();
  });

  test("przy dacie 2026-03-10 granicy nie ma", () => {
    const { notes } = piotrSummary("2026-03-10");
    expect(taskChangeBoundary(notes, [], "2024-11-27", "2026-03-10")).toBeNull();
  });
});

describe("przypomnienie o docenianiu", () => {
  const notes = () => notesAbout("piotr", { authorId: "marek", from: "2024-11-27" });
  const base = { subjectName: "Piotr Wójcik", talkDate: "2024-12-09", notes: [] as ReturnType<typeof notes>, reminderDays: 90 };

  test("jest bez informacji zwrotnej i niesie notatkę z 18.06.2026; znika, gdy informacja zwrotna jest z dnia dzisiejszego", () => {
    createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const r = appreciationReminder({ ...base, notes: notes(), lastFeedback: null, today: "2026-11-21" });
    expect(r?.sentence).toBe("Od 09.12.2024 brak zapisanej informacji zwrotnej dla Piotra.");
    expect(r?.goodNotes.some((n) => n.date === "2026-06-18")).toBe(true);
    expect(appreciationReminder({ ...base, lastFeedback: "2026-11-21", today: "2026-11-21" })).toBeNull();
  });
});

describe("formy rozwoju i imiona", () => {
  test("dokładnie jedna forma domyślna; „Współpraca” ma swoją, nieznane kryterium domyślną", () => {
    expect(officeData.developmentForms.filter((f: { default?: boolean }) => f.default)).toHaveLength(1);
    expect(suggestDevelopmentForm({ criterion_id: "wspolpraca" }).id).toBe("rozmowa-z-mentorem");
    expect(suggestDevelopmentForm({ criterion_id: "zarzadzanie-strategiczne" }).default).toBe(true);
  });

  test("brak formy imienia daje null", () => {
    expect(nameForm("Maria Dąbrowska", "loc")).toBe("Marii");
    expect(nameForm("Zenon Nieznany", "loc")).toBeNull();
  });
});
