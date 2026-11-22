// Logika HR partnera: reguły, daty i pola notatek. System nie czyta treści notatek (AGENTS.md, zasada 4).
import fullNameForms from "../../content/full-name-forms.json";
import nameForms from "../../content/name-forms.json";
import { card } from "../content";
import type { AppEvent } from "../events";
import { criterion } from "../engine/scoring";
import { officeSettings, type DevelopmentForm } from "../office-settings";
import type { Note } from "../notes/repo";

export type NameCase = "gen" | "dat" | "ins" | "loc";
export type Answer = "yes" | "no";
export type Link = { label: string; href: string };
export type Item = { text: string; prompt?: string; action?: Link };

export function fillTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

function text(cardId: string, key: string): string {
  const t = card(cardId).texts?.[key];
  if (!t) throw new Error(`Karta „${cardId}” nie ma tekstu „${key}”`);
  return t;
}

/** Forma imienia w przypadku zależnym; `null`, gdy nie ma wpisu w `content/name-forms.json`. */
export function nameForm(fullName: string, kase: NameCase): string | null {
  const first = fullName.split(/\s+/)[0] ?? "";
  return (nameForms as Record<string, Record<NameCase, string>>)[first]?.[kase] ?? null;
}

/** Pełne imię i nazwisko w przypadku zależnym; `null`, gdy nie ma wpisu w `content/full-name-forms.json`. */
export function fullNameForm(fullName: string, kase: NameCase): string | null {
  return (fullNameForms as Record<string, Record<NameCase, string>>)[fullName]?.[kase] ?? null;
}

/** Pierwsza forma z katalogu pasująca do kryterium; inaczej jedyna forma z `default: true`. */
export function pickDevelopmentForm(criterionId: string): DevelopmentForm {
  const forms = officeSettings().developmentForms;
  const found = forms.find((f) => f.criteria.includes(criterionId)) ?? forms.find((f) => f.default);
  if (!found) throw new Error("Katalog form rozwoju nie ma formy domyślnej");
  return found;
}

/** Ostatnia (według `(date, id)`) odpowiedź na notatkę; zdarzenia podane w porządku `(date, id)`. */
export function lastAnswer(noteId: number, events: AppEvent[]): Answer | null {
  const mine = events.filter((e) => e.type === "task_change_answered" && e.payload?.noteId === noteId);
  const last = mine[mine.length - 1];
  return last ? (last.payload.answer as Answer) : null;
}

/** Data najwcześniejszej notatki ze zmianą zadań (od `periodStart` do `today`), na którą ostatnia odpowiedź nie brzmi „nie”. */
export function taskChangeBoundary(notes: Note[], events: AppEvent[], periodStart: string, today: string): string | null {
  const dates = notes
    .filter((n) => n.task_change === 1 && n.date >= periodStart && n.date <= today && lastAnswer(n.id, events) !== "no")
    .map((n) => n.date)
    .sort();
  return dates[0] ?? null;
}

export function fullMonthsBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

export type TeamMember = { id: string; name: string; latestNoteDate: string | null; canWrite: boolean };

/** Podwładni bez notatek albo bez notatki od `teamSilenceMonths` pełnych miesięcy. Bez liczby notatek. */
export function teamWithoutNotes(team: TeamMember[], today: string, silenceMonths: number): Item[] {
  const items: Item[] = [];
  for (const m of team) {
    let sentence: string | null = null;
    if (m.latestNoteDate === null) {
      const loc = nameForm(m.name, "loc");
      sentence = loc ? fillTemplate(text("beforeMeeting", "teamNone"), { loc }) : fillTemplate(text("beforeMeeting", "teamFallback"), { name: m.name });
    } else {
      const months = fullMonthsBetween(m.latestNoteDate, today);
      if (months >= silenceMonths) {
        const loc = nameForm(m.name, "loc");
        sentence = loc ? fillTemplate(text("beforeMeeting", "teamOld"), { loc, n: months }) : fillTemplate(text("beforeMeeting", "teamFallback"), { name: m.name });
      }
    }
    if (sentence === null) continue;
    items.push({
      text: sentence,
      prompt: "Czy jest coś, co warto zapisać o tej osobie?",
      action: m.canWrite ? { label: "Dopisz notatkę", href: `/people/${m.id}/notes/new` } : undefined,
    });
  }
  return items;
}

export type BeforeMeetingInput = {
  subject: { id: string; name: string };
  cycleId: string;
  periodStart: string;
  today: string;
  notes: Note[];
  /** Zdarzenia `task_change_answered` do odczytania odpowiedzi (cykl i zdarzenia bez cyklu). */
  events: AppEvent[];
  criteriaIds: string[];
  lastFeedback: string | null;
  team: TeamMember[];
  silenceMonths: number;
};

export type BeforeMeetingSummary = {
  boundary: string | null;
  boundarySentence: string | null;
  before: Note[];
  after: Note[];
  bothSides: Item[];
  pendingQuestion: { note: Note; prompt: string } | null;
  criteriaWithoutNotes: Item[];
  feedback: Item;
  team: Item[];
};

export function beforeMeetingSummary(i: BeforeMeetingInput): BeforeMeetingSummary {
  const notes = i.notes.filter((n) => n.date >= i.periodStart && n.date <= i.today);
  const boundary = taskChangeBoundary(notes, i.events, i.periodStart, i.today);
  const before = boundary ? notes.filter((n) => n.date < boundary) : [];
  const after = boundary ? notes.filter((n) => n.date >= boundary) : [];
  const gen = nameForm(i.subject.name, "gen") ?? i.subject.name;

  const bothSides: Item[] = [];
  if (boundary) {
    const ids = new Set([...before, ...after].map((n) => n.criterion_id));
    for (const id of ids) {
      if (!before.some((n) => n.criterion_id === id) || !after.some((n) => n.criterion_id === id)) continue;
      bothSides.push({
        text: fillTemplate(text("beforeMeeting", "bothSides"), { criterion: criterion(id).name }),
        prompt: "Co się zmieniło po przejęciu nowych zadań?",
      });
    }
  }

  const pending = notes.find((n) => n.task_change === 1 && lastAnswer(n.id, i.events) === null);

  const criteriaWithoutNotes: Item[] = i.criteriaIds
    .filter((id) => !notes.some((n) => n.criterion_id === id))
    .map((id) => ({
      text: fillTemplate(text("beforeMeeting", "noNotes"), { criterion: criterion(id).name }),
      prompt: "Jak pracownik widzi to kryterium?",
      action: { label: "Dopisz notatkę", href: `/people/${i.subject.id}/notes/new` },
    }));

  const feedback: Item = i.lastFeedback
    ? {
        text: fillTemplate(text("beforeMeeting", "feedbackLast"), { gen, date: fmt(i.lastFeedback) }),
        prompt: "Czy informacja zwrotna była pomocna?",
      }
    : {
        text: fillTemplate(text("beforeMeeting", "feedbackNever"), { gen }),
        prompt: "O jakim dobrym fakcie możesz powiedzieć?",
        action: { label: "Karta docenienia", href: `/cycles/${i.cycleId}/appreciation` },
      };

  return {
    boundary,
    boundarySentence: boundary ? fillTemplate(text("beforeMeeting", "boundary"), { date: fmt(boundary) }) : null,
    before,
    after,
    bothSides,
    pendingQuestion: pending ? { note: pending, prompt: text("beforeMeeting", "pending") } : null,
    criteriaWithoutNotes,
    feedback,
    team: teamWithoutNotes(i.team.filter((m) => m.id !== i.subject.id), i.today, i.silenceMonths),
  };
}

function fmt(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export type AppreciationReminder = { since: string; sentence: string; goodNotes: Note[] };

/** Kotwica = późniejsza z dat: rozmowa i ostatnia informacja zwrotna. `null`, gdy od kotwicy minęło mniej niż `reminderDays` dni. */
export function appreciationReminder(i: {
  subjectName: string;
  talkDate: string;
  lastFeedback: string | null;
  notes: Note[];
  today: string;
  reminderDays: number;
}): AppreciationReminder | null {
  const since = i.lastFeedback && i.lastFeedback > i.talkDate ? i.lastFeedback : i.talkDate;
  if (daysBetween(since, i.today) < i.reminderDays) return null;
  const gen = nameForm(i.subjectName, "gen") ?? i.subjectName;
  return {
    since,
    sentence: fillTemplate(text("beforeMeeting", "reminder"), { date: fmt(since), gen }),
    goodNotes: i.notes.filter((n) => n.rating === "good" && n.date > since && n.date <= i.today),
  };
}
