import { Hono, type Context } from "hono";
import { card } from "../content";
import { registerCycleLinks } from "../cycle-links";
import { cycleById, type Cycle } from "../cycles";
import { recordEvent } from "../events";
import { registerHomeTasks } from "../home-tasks";
import {
  answersFor,
  answersForNotes,
  cycleCriteria,
  lastFeedbackDate,
  noteById,
  notesAbout,
  openCyclesOfAppraiser,
  talkDate,
  teamOf,
} from "../hr-partner/data";
import { appreciationReminder, beforeMeetingSummary, lastAnswer, nameForm } from "../hr-partner/partner";
import { officeSettings } from "../office-settings";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { suggestDevelopmentForm } from "../suggestions";
import type { Note } from "../notes/repo";
import { AppreciationView } from "../views/appreciation";
import { BeforeMeetingView } from "../views/before-meeting";
import { TaskChangeCardView, TaskChangeNoView, TaskChangeQuestionView } from "../views/task-change";

registerCycleLinks((cycle, person) =>
  cycle.appraiser_id === person.id
    ? [
        { label: "Przed rozmową z pracownikiem", href: `/cycles/${cycle.id}/before-meeting` },
        { label: "Docenienie", href: `/cycles/${cycle.id}/appreciation` },
      ]
    : [],
);

function reminderFor(cycle: Cycle, viewerId: string) {
  const subject = personById(cycle.person_id);
  if (!subject) return null;
  const notes = notesAbout(subject.id, { authorId: viewerId, from: cycle.period_start });
  return appreciationReminder({
    subjectName: subject.name,
    talkDate: talkDate(cycle),
    lastFeedback: lastFeedbackDate(viewerId, subject.id),
    notes,
    today: today(),
    reminderDays: officeSettings().appreciationReminderDays,
  });
}

registerHomeTasks((person) =>
  person.role !== "appraiser"
    ? []
    : openCyclesOfAppraiser(person.id).flatMap((cycle) => {
        const r = reminderFor(cycle, person.id);
        const subject = personById(cycle.person_id);
        return r && subject ? [{ title: `Docenienie: ${subject.name}`, href: `/cycles/${cycle.id}/appreciation`, detail: r.sentence }] : [];
      }),
);

const app = new Hono();

/** Notatka z pytaniem: konto, notatka (404), autor (403), zaznaczenie zmiany zadań (404). */
function noteGuard(c: Context): { viewer: Person; note: Note } | Response {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const id = Number(c.req.param("noteId"));
  const note = Number.isInteger(id) ? noteById(id) : null;
  if (!note) return c.text("Nie ma takiej notatki.", 404);
  if (note.author_id !== viewer.id) return c.text("Brak uprawnień do tej notatki.", 403);
  if (note.task_change !== 1) return c.text("Ta notatka nie ma zaznaczonej zmiany zadań.", 404);
  return { viewer, note };
}

/** Osoba, której dotyczy notatka, w dopełniaczu („zmianę zadań Piotra”). */
function subjectGenitive(note: Note): string {
  const name = personById(note.subject_id)?.name ?? "";
  return nameForm(name, "gen") ?? name;
}
app.get("/notes/:noteId/task-change", (c) => {
  const g = noteGuard(c);
  if (g instanceof Response) return g;
  const answered = answersFor(g.note).pop();
  if (!answered) return c.html(<TaskChangeQuestionView viewer={g.viewer} today={today()} note={g.note} card={card("taskChange")} subjectGenitive={subjectGenitive(g.note)} />);
  if (answered.payload.answer === "yes") {
    const forms = officeSettings().developmentForms;
    const form = forms.find((f) => f.id === answered.payload.developmentFormId) ?? suggestDevelopmentForm(g.note);
    return c.html(<TaskChangeCardView viewer={g.viewer} today={today()} note={g.note} card={card("taskChange")} form={form} />);
  }
  return c.html(<TaskChangeNoView viewer={g.viewer} today={today()} card={card("taskChange")} />);
});

app.post("/notes/:noteId/task-change", async (c) => {
  const g = noteGuard(c);
  if (g instanceof Response) return g;
  if (lastAnswer(g.note.id, answersFor(g.note)) !== null) return c.text("Na to pytanie już odpowiedziano.", 409);
  const raw = (await c.req.parseBody()).answer;
  const answer = raw === "yes" || raw === "no" ? raw : null;
  if (!answer) {
    return c.html(
      <TaskChangeQuestionView viewer={g.viewer} today={today()} note={g.note} card={card("taskChange")} subjectGenitive={subjectGenitive(g.note)} error="Wybierz „Tak” albo „Nie”." />,
      422,
    );
  }
  const developmentFormId = answer === "yes" ? suggestDevelopmentForm(g.note).id : null;
  recordEvent("task_change_answered", g.note.cycle_id, g.note.author_id, { noteId: g.note.id, answer, developmentFormId });
  return c.redirect(`/notes/${g.note.id}/task-change`, 303);
});

/** Cykl, oceniający (403), osoba oceniana. */
function cycleGuard(c: Context): { viewer: Person; cycle: Cycle; subject: Person } | Response {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = cycleById(c.req.param("id") ?? "");
  const subject = cycle ? personById(cycle.person_id) : null;
  if (!cycle || !subject) return c.text("Nie ma takiego cyklu.", 404);
  if (cycle.appraiser_id !== viewer.id) return c.text("Brak uprawnień do tego cyklu.", 403);
  return { viewer, cycle, subject };
}

app.get("/cycles/:id/before-meeting", (c) => {
  const g = cycleGuard(c);
  if (g instanceof Response) return g;
  const notes = notesAbout(g.subject.id, { authorId: g.viewer.id, from: g.cycle.period_start });
  const summary = beforeMeetingSummary({
    subject: { id: g.subject.id, name: g.subject.name },
    cycleId: g.cycle.id,
    periodStart: g.cycle.period_start,
    today: today(),
    notes,
    events: answersForNotes(notes),
    criteriaIds: cycleCriteria(g.cycle.id).map((k) => k.id),
    lastFeedback: lastFeedbackDate(g.viewer.id, g.subject.id),
    team: teamOf(g.viewer.id),
    silenceMonths: officeSettings().teamSilenceMonths,
  });
  return c.html(
    <BeforeMeetingView
      viewer={g.viewer}
      today={today()}
      cycleId={g.cycle.id}
      titleName={nameForm(g.subject.name, "ins") ?? g.subject.name}
      card={card("beforeMeeting")}
      summary={summary}
    />,
  );
});

app.get("/cycles/:id/appreciation", (c) => {
  const g = cycleGuard(c);
  if (g instanceof Response) return g;
  const r = reminderFor(g.cycle, g.viewer.id);
  const notes = r
    ? r.goodNotes
    : notesAbout(g.subject.id, { authorId: g.viewer.id, from: g.cycle.period_start }).filter((n) => n.rating === "good" && n.date > talkDate(g.cycle));
  return c.html(
    <AppreciationView
      viewer={g.viewer}
      today={today()}
      cycleId={g.cycle.id}
      card={card("appreciation")}
      sentence={r?.sentence ?? null}
      notes={notes}
      canForward
    />,
  );
});

export default app;
