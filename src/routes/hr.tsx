import { Hono } from "hono";
import "../hr/links";
import { assessmentState } from "../assessment/state";
import { registerHomeTasks } from "../home-tasks";
import { cycleLinks } from "../cycle-links";
import { getDb } from "../db";
import { recordEvent, visibleEvents, visibleEventsOfType } from "../events";
import { cycleState, type CycleStep } from "../hr/cycle-state";
import "../hr/reassessment-task";
import { fullNameForm } from "../hr-partner/partner";
import { mandatoryGradeOf } from "../hr/history";
import { latestCycles } from "../hr/latest-cycles";
import { officeStats } from "../hr/stats";
import { cycleById, previousCycleOf } from "../cycles";
import { currentPerson, DEMO_DIRECTOR_GENERAL_ID, personById, type Person } from "../people";
import { today } from "../settings";
import { Layout } from "../views/layout";
import { PageHeader } from "../views/components";
import { HrOverviewView, StatsBlock, objectionField, type StateRow } from "../views/hr-overview";
import { errorPage } from "../views/error-page";

const app = new Hono();

registerHomeTasks((person) => person.id === DEMO_DIRECTOR_GENERAL_ID
  ? [{ title: "Terminowość w urzędzie", href: "/office/statistics", action: "Otwórz terminowość w urzędzie" }]
  : []);

app.get("/office/statistics", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.id !== DEMO_DIRECTOR_GENERAL_ID) return errorPage(c, "Ten ekran widzi dyrektor generalny urzędu. Zmień konto na „Barbara Szymańska”.", 403);
  return c.html(
    <Layout title="Terminowość w urzędzie" person={viewer} today={today()}>
      <PageHeader title="Terminowość w urzędzie" lead="Ile ocen powstało w terminie i na jakim etapie są cykle w całym urzędzie." />
      <StatsBlock stats={officeStats()} title="Liczby dla całego urzędu (bez nazwisk)" />
    </Layout>,
  );
});


const CLOSED_STEPS = new Set<CycleStep>(["acknowledged", "fiction", "objection_resolved"]);
export function overviewData(viewer: Person) {
  const cycles = latestCycles().flatMap((cycle) => {
    const previous = previousCycleOf(cycle.id);
    return previous ? [cycle, previous] : [cycle];
  });
  const rows: StateRow[] = cycles.map((c) => ({
    cycleId: c.id,
    personName: personById(c.person_id)?.name ?? c.person_id,
    appraiserName: personById(c.appraiser_id)?.name ?? c.appraiser_id,
    sheet: c.sheet,
    state: cycleState(c.id),
    today: today(),
    links: [
      ...cycleLinks(c, viewer),
      ...(assessmentState(c.id).snapshot || assessmentState(c.id).redo ? [{ label: "Pobierz ocenę do systemu kadrowego (plik JSON)", href: `/cycles/${c.id}/assessment/export.json` }] : []),
    ],
  }));
  // Najpierw cykle wymagające działania, zamknięte (zapoznanie, fikcja, rozpatrzony sprzeciw) na końcu; w grupie od najbliższego terminu.
  const closed = (r: StateRow) => (CLOSED_STEPS.has(r.state.step) && !(r.state.step === "objection_resolved" && r.state.deadline) ? 1 : 0);
  rows.sort(
    (a, b) =>
      closed(a) - closed(b) ||
      (a.state.deadline?.date ?? "9999").localeCompare(b.state.deadline?.date ?? "9999") ||
      a.personName.localeCompare(b.personName),
  );
  const people = getDb().query("SELECT id, name FROM people WHERE appointed = 1 ORDER BY name").all() as { id: string; name: string }[];
  const cards = people.flatMap((p) => {
    const grade = mandatoryGradeOf(p.id);
    return grade ? [{ personId: p.id, personName: p.name, grade }] : [];
  });
  return { rows, cards, stats: officeStats() };
}

app.get("/hr", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "hr") return errorPage(c, "Ten ekran widzą kadry.", 403);
  const { rows, cards, stats } = overviewData(viewer);
  // Komunikat po „Odnotuj przyznanie stopnia”: tylko gdy taki wpis naprawdę istnieje.
  const awardedId = c.req.query("awarded");
  const awardedPerson = awardedId ? personById(awardedId) : null;
  const awardedEvent = awardedPerson ? visibleEventsOfType("mandatory_grade_awarded").filter((e) => e.payload.personId === awardedPerson.id).pop() : undefined;
  const awarded =
    awardedPerson && awardedEvent
      ? { dative: fullNameForm(awardedPerson.name, "dat") ?? awardedPerson.name, date: awardedEvent.date }
      : undefined;
  return c.html(<HrOverviewView viewer={viewer} today={today()} cards={cards} rows={rows} stats={stats} awarded={awarded} />);
});

const OUTCOMES = ["changed", "redone", "rejected"];

app.post("/hr/grades/:personId", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "hr") return errorPage(c, "Tę czynność wykonują kadry.", 403);
  const person = personById(c.req.param("personId"));
  if (!person) return errorPage(c, "Nie ma takiej osoby w danych urzędu.", 404);
  const grade = mandatoryGradeOf(person.id);
  if (!grade || grade.toGrade === null) return errorPage(c, "Przyznanie stopnia jest już odnotowane albo obowiązek nie powstał. Wróć do „Stan cykli”.", 409);
  recordEvent("mandatory_grade_awarded", grade.cycleId, viewer.id, { personId: person.id, fromGrade: grade.fromGrade, toGrade: grade.toGrade, basis: grade.basis });
  return c.redirect(`/hr?awarded=${person.id}`, 303);
});

app.post("/cycles/:id/objection-outcome", async (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "hr") return errorPage(c, "Tę czynność wykonują kadry.", 403);
  const cycle = cycleById(c.req.param("id"));
  if (!cycle || !visibleEvents(cycle.id).some((e) => e.type === "cycle_started")) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  const body = await c.req.parseBody();
  const outcome = typeof body.outcome === "string" ? body.outcome : "";
  if (!OUTCOMES.includes(outcome)) {
    // Ten sam ekran z formularzem sprzeciwu, komunikat przy polu wyboru wyniku (422).
    const { rows, cards, stats } = overviewData(viewer);
    // Bez formularza tego sprzeciwu na ekranie komunikat stoi tylko w podsumowaniu (klucz „_” nie robi odnośnika).
    const field = rows.some((r) => r.cycleId === cycle.id && r.state.step === "objection_filed") ? objectionField(cycle.id) : "_outcome";
    const errors = { [field]: "Wybierz wynik rozpatrzenia sprzeciwu: zmiana oceny, ponowne sporządzenie oceny albo nieuwzględnienie sprzeciwu." };
    return c.html(<HrOverviewView viewer={viewer} today={today()} cards={cards} rows={rows} stats={stats} errors={errors} />, 422);
  }
  const ev = visibleEvents(cycle.id);
  if (!ev.some((e) => e.type === "objection_filed") || ev.some((e) => e.type === "objection_resolved")) {
    return errorPage(c, "Ten sprzeciw jest już rozpatrzony albo nie został wniesiony. Wróć do „Stan cykli”.", 409);
  }
  recordEvent("objection_resolved", cycle.id, viewer.id, { outcome });
  return c.redirect("/hr", 303);
});

export default app;
