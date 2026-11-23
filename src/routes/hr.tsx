import { withActiveRules } from "../engine/rules";
import { Hono } from "hono";
import "../hr/links";
import { assessmentState, objectionRecipientFor } from "../assessment/state";
import { registerHomeTasks } from "../home-tasks";
import { cycleLinks } from "../cycle-links";
import { getDb } from "../db";
import { recordEvent, visibleEvents, visibleEventsOfType } from "../events";
import { cycleState, type CycleStep } from "../hr/cycle-state";
import "../hr/reassessment-task";
import { fullNameForm } from "../hr-partner/partner";
import { mandatoryGradeOf } from "../hr/history";
import { latestCycles, pendingReassessmentPredecessor } from "../hr/latest-cycles";
import { officeStats, protectedOfficeStats } from "../hr/stats";
import { cycleById, previousCycleOf } from "../cycles";
import { currentPerson, isDirectorGeneral, personById, type Person } from "../people";
import { today } from "../settings";
import { Layout } from "../views/layout";
import { PageHeader } from "../views/components";
import { HR_JSON_EXPORT_LABEL } from "../views/assessment";
import { HrOverviewView, StatsBlock, objectionField, type StateRow } from "../views/hr-overview";
import { ObjectionResolveView } from "../views/objection-form";
import { errorPage } from "../views/error-page";

const app = new Hono();

registerHomeTasks((person) => isDirectorGeneral(person)
  ? [{ title: "Terminowość w urzędzie", href: "/office/statistics", action: "Otwórz terminowość w urzędzie" }]
  : []);

app.get("/office/statistics", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (!isDirectorGeneral(viewer)) return errorPage(c, "Ten ekran widzi dyrektor generalny urzędu. Zmień konto na „Barbara Szymańska”.", 403);
  return c.html(
    <Layout title="Terminowość w urzędzie" person={viewer} today={today()}>
      <PageHeader title="Terminowość w urzędzie" lead="Ile ocen powstało w terminie i na jakim etapie są cykle w całym urzędzie." />
      <StatsBlock protectedStats={protectedOfficeStats()} title="Liczby dla całego urzędu (bez nazwisk)" />
    </Layout>,
  );
});


const CLOSED_STEPS = new Set<CycleStep>(["acknowledged", "fiction", "objection_resolved"]);
export function overviewData(viewer: Person) {
  const cycles = latestCycles().flatMap((cycle) => {
    const redo = pendingReassessmentPredecessor(cycle);
    if (redo) return [redo];
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
      ...(assessmentState(c.id).snapshot || assessmentState(c.id).redo ? [{ label: HR_JSON_EXPORT_LABEL, href: `/cycles/${c.id}/assessment/export.json` }] : []),
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
  const isDirector = isDirectorGeneral(viewer);
  if (viewer.role !== "hr" && !isDirector) return errorPage(c, "Sprzeciw rozstrzygają dyrektor generalny urzędu albo kadry.", 403);
  const cycle = cycleById(c.req.param("id"));
  if (!cycle || !visibleEvents(cycle.id).some((e) => e.type === "cycle_started")) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  if (cycle.sheet === "A" && viewer.role !== "hr") {
    return errorPage(c, "W arkuszu A sprzeciw kierowany jest do wskazanego adresata; rozstrzygnięcie zapisują kadry.", 403);
  }
  const body = await c.req.parseBody();
  const outcome = typeof body.outcome === "string" ? body.outcome : "";
  const state = assessmentState(cycle.id);
  if (!OUTCOMES.includes(outcome)) {
    const msg = "Wybierz wynik rozpatrzenia sprzeciwu: zmiana oceny, ponowne sporządzenie oceny albo nieuwzględnienie sprzeciwu.";
    if (isDirector && viewer.role !== "hr") {
      const person = personById(cycle.person_id);
      if (person && state.objection && state.snapshot) {
        return c.html(
          <ObjectionResolveView
            viewer={viewer}
            today={today()}
            cycleId={cycle.id}
            person={person}
            appraiserName={personById(cycle.appraiser_id)?.name ?? cycle.appraiser_id}
            recipient={objectionRecipientFor(state.snapshot.sheet, state.snapshot.objectionRecipient) ?? undefined}
            snapshot={state.snapshot}
            objection={state.objection}
            errors={{ outcome: msg }}
          />,
          422,
        );
      }
      return errorPage(c, msg, 422);
    }
    // Ten sam ekran z formularzem sprzeciwu, komunikat przy polu wyboru wyniku (422).
    // Ekran zbiorczy kadr liczy się w regułach obowiązujących dziś, nie w wersji reguł tego jednego cyklu.
    const page = withActiveRules(() => {
      const { rows, cards, stats } = overviewData(viewer);
      // Bez formularza tego sprzeciwu na ekranie komunikat stoi tylko w podsumowaniu (klucz „_” nie robi odnośnika).
      const field = rows.some((r) => r.cycleId === cycle.id && r.state.step === "objection_filed") ? objectionField(cycle.id) : "_outcome";
      const errors = { [field]: msg };
      return String(<HrOverviewView viewer={viewer} today={today()} cards={cards} rows={rows} stats={stats} errors={errors} />);
    });
    return c.html(page, 422);
  }
  if (!state.objection || state.objection.resolvedOn) {
    return errorPage(c, "Ten sprzeciw jest już rozpatrzony albo nie został wniesiony. Wróć do „Stan cykli”.", 409);
  }
  // „Zmiana oceny”: rozstrzygnięcie zapisuje się dopiero razem ze zmienionymi ocenami cząstkowymi (`/cycles/:id/objection-change`).
  if (outcome === "changed") return c.redirect(`/cycles/${cycle.id}/objection-change`, 303);
  recordEvent("objection_resolved", cycle.id, viewer.id, { outcome });
  return c.redirect(viewer.role === "hr" ? "/hr" : `/cycles/${cycle.id}/objection?resolved=1`, 303);
});

export default app;
