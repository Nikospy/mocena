import { Hono, type Context } from "hono";
import { card } from "../content";
import { cycleById, openCycle } from "../cycles";
import { registerCycleLinks } from "../cycle-links";
import { cycleCriteria } from "../cycles/part1";
import { getDb } from "../db";
import { rules } from "../engine/rules";
import { CRITERIA } from "../engine/scoring";
import { registerHomeTasks } from "../home-tasks";
import { addNote, canWriteNoteAbout, feedbackFor, noteById, notesByAuthor, sendFeedback, type Note, type Rating } from "../notes/repo";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { suggestForNote } from "../suggestions";
import { FeedbackFormView } from "../views/feedback-form";
import { FeedbackView } from "../views/feedback";
import { AssessmentCardView } from "../views/assessment-card";
import { NoteFormView, type CriteriaGroup, type NoteFormValues } from "../views/note-form";
import { NotesListView, type NoteGroup } from "../views/notes-list";

/** Adres przekierowania po zapisie notatki. S-05 podmienia go dla notatek ze zmianą zadań. */
export function afterNoteSaved(note: Note): string {
  return `/notes?saved=${note.id}`;
}

registerCycleLinks((cycle, person) =>
  cycle.appraiser_id === person.id ? [{ label: "Karta rozmowy oceniającej", href: `/cycles/${cycle.id}/cards/assessment-conversation` }] : [],
);

registerHomeTasks((person) => (person.role === "appraiser" ? [{ title: "Notatki o zespole", href: "/notes" }] : []));

registerHomeTasks((person) => (feedbackFor(person.id).length > 0 ? [{ title: "Informacja zwrotna", href: "/feedback" }] : []));

const app = new Hono();

function isIsoDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function criteriaGroups(personId: string): CriteriaGroup[] {
  const all = CRITERIA.map((c) => c.id);
  const cycle = openCycle(personId);
  const own = cycle ? cycleCriteria(cycle.id).map((c) => c.id) : [];
  if (own.length === 0) return [{ label: "Kryteria", ids: all }];
  return [
    { label: "Kryteria tego okresu oceny", ids: own },
    { label: "Inne kryteria", ids: all.filter((id) => !own.includes(id)) },
  ];
}

function blankValues(): NoteFormValues {
  return { criterion_id: "", text: "", rating: "", task_change: false, date: today() };
}

/** Konto i prawo zapisu notatki o osobie z adresu. */
function writeGuard(c: Context): { viewer: Person; subject: Person } | Response {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const subject = personById(c.req.param("personId") ?? "");
  if (!subject) return c.text("Nie ma takiej osoby.", 404);
  if (!canWriteNoteAbout(viewer.id, subject.id)) return c.text("Brak uprawnień do pisania notatek o tej osobie.", 403);
  return { viewer, subject };
}

app.get("/people/:personId/notes/new", (c) => {
  const g = writeGuard(c);
  if (g instanceof Response) return g;
  return c.html(<NoteFormView {...g} today={today()} groups={criteriaGroups(g.subject.id)} values={blankValues()} />);
});

app.post("/people/:personId/notes", async (c) => {
  const g = writeGuard(c);
  if (g instanceof Response) return g;
  const body = await c.req.parseBody();
  const text = str(body.text).trim();
  const criterionId = str(body.criterion_id);
  const rating = str(body.rating);
  const taskChange = str(body.task_change) !== "";
  const errors: Partial<Record<"criterion_id" | "text" | "date", string>> = {};
  if (!CRITERIA.some((k) => k.id === criterionId)) errors.criterion_id = "Wybierz kryterium.";
  if (text.length < 1 || text.length > 2000) errors.text = text ? "Notatka może mieć najwyżej 2000 znaków." : "Wpisz, co się wydarzyło.";
  const rawDate = str(body.date).trim();
  const date = rawDate || today();
  if (!isIsoDate(date)) errors.date = "Podaj poprawną datę.";
  else if (date > today()) errors.date = "Data nie może być późniejsza niż dziś.";
  const values: NoteFormValues = { criterion_id: criterionId, text: str(body.text), rating, task_change: taskChange, date };
  if (Object.keys(errors).length > 0) {
    const suggestion = taskChange ? await suggestForNote(text) : null;
    return c.html(
      <NoteFormView {...g} today={today()} groups={criteriaGroups(g.subject.id)} values={values} errors={errors} suggestion={suggestion} />,
      422,
    );
  }
  const suggestion = await suggestForNote(text);
  const note = addNote({
    authorId: g.viewer.id,
    subjectId: g.subject.id,
    criterionId,
    date,
    text,
    rating: rating === "good" || rating === "needs_improvement" ? (rating as Rating) : null,
    taskChange,
    suggestion: { source: suggestion.source, taskChange: suggestion.taskChange },
  });
  return c.redirect(afterNoteSaved(note), 303);
});

/** Podpowiedź na żywo dla formularza. Niczego nie zapisuje, więc odpowiada 200. */
app.post("/suggestions/note", async (c) => {
  if (!currentPerson(c)) return c.text("Brak uprawnień.", 403);
  const body = await c.req.parseBody();
  return c.json(await suggestForNote(str(body.text)));
});

function subjectsFor(viewer: Person, notes: Note[]): string[] {
  const db = getDb();
  const ids = new Set<string>(notes.map((n) => n.subject_id));
  for (const r of db.query("SELECT id FROM people WHERE supervisor_id = ?").all(viewer.id) as { id: string }[]) ids.add(r.id);
  for (const r of db.query("SELECT DISTINCT person_id AS id FROM cycles WHERE appraiser_id = ?").all(viewer.id) as { id: string }[]) ids.add(r.id);
  return [...ids];
}

app.get("/notes", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const notes = notesByAuthor(viewer.id);
  const groups: NoteGroup[] = [];
  for (const id of subjectsFor(viewer, notes)) {
    const person = personById(id);
    if (!person) continue;
    const canWrite = canWriteNoteAbout(viewer.id, id);
    const own = notes.filter((n) => n.subject_id === id);
    if (own.length === 0 && !canWrite) continue;
    groups.push({ person, notes: own, canWrite });
  }
  const latest = (g: NoteGroup) => g.notes[0]?.date ?? "";
  groups.sort((a, b) => latest(b).localeCompare(latest(a)) || a.person.name.localeCompare(b.person.name, "pl"));
  return c.html(<NotesListView viewer={viewer} today={today()} groups={groups} saved={c.req.query("saved") !== undefined} sent={c.req.query("sent") !== undefined} />);
});

/** Wspólny początek obu tras informacji zwrotnej: konto, notatka (404), autor (403). */
function feedbackGuard(c: Context): { viewer: Person; note: Note; subject: Person } | Response {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const id = Number(c.req.param("id"));
  const note = Number.isInteger(id) ? noteById(id) : null;
  const subject = note ? personById(note.subject_id) : null;
  if (!note || !subject) return c.text("Nie ma takiej notatki.", 404);
  if (note.author_id !== viewer.id) return c.text("Brak uprawnień do tej notatki.", 403);
  return { viewer, note, subject };
}

app.get("/notes/:id/feedback", (c) => {
  const g = feedbackGuard(c);
  if (g instanceof Response) return g;
  return c.html(<FeedbackFormView {...g} today={today()} text={g.note.text} />);
});

app.post("/notes/:id/feedback", async (c) => {
  const g = feedbackGuard(c);
  if (g instanceof Response) return g;
  const text = str((await c.req.parseBody()).text).trim();
  if (!text) return c.html(<FeedbackFormView {...g} today={today()} text="" error="Wpisz tekst dla pracownika." />, 422);
  sendFeedback({ noteId: g.note.id, authorId: g.viewer.id, text });
  return c.redirect("/notes?sent=1", 303);
});

app.get("/feedback", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const messages = feedbackFor(viewer.id).map((m) => ({ ...m, sender: personById(m.author_id)?.name ?? "" }));
  return c.html(<FeedbackView viewer={viewer} today={today()} messages={messages} />);
});

app.get("/cycles/:id/cards/assessment-conversation", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = cycleById(c.req.param("id") ?? "");
  if (!cycle) return c.text("Nie ma takiego cyklu.", 404);
  if (cycle.appraiser_id !== viewer.id) return c.text("Brak uprawnień do tego cyklu.", 403);
  return c.html(
    <AssessmentCardView
      viewer={viewer}
      today={today()}
      cycleId={cycle.id}
      card={card("assessment")}
      basis={rules.assessmentConversation.basis}
      topics={rules.assessmentConversation.topics}
    />,
  );
});

export default app;
