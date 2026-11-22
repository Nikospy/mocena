import { Hono, type Context } from "hono";
import { openCycle } from "../cycles";
import { visibleCyclesOf } from "../hr/history";
import { createPerson, deleteEmployee, employeeDeletionBlock, emptyForm, formFromPerson, listPeople, readForm, supervisorCandidates, updatePerson, validateForm, type FormErrors, type PersonForm, type Sort } from "../hr/people";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { Layout } from "../views/layout";
import { PeopleListView, PersonFormView } from "../views/hr-people";

const app = new Hono();

/** Dostęp: kadry i administrator. Brak konta prowadzi na wybór konta. */
export function hrGuard(c: Context): Person | Response {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "hr" && viewer.role !== "admin") return c.text("Ten ekran widzą kadry.", 403);
  return viewer;
}

app.get("/hr/people", (c) => {
  const viewer = hrGuard(c);
  if (viewer instanceof Response) return viewer;
  const q = c.req.query("q") ?? "";
  const s = c.req.query("sort");
  const sort: Sort = s === "deadline" || s === "unit" ? s : "name";
  const saved = c.req.query("saved");
  return c.html(<PeopleListView viewer={viewer} today={today()} rows={listPeople(q, sort)} deleted={c.req.query("deleted") === "1"} q={q} sort={sort} saved={saved ? personById(saved)?.name : undefined} />);
});

function renderForm(c: Context, viewer: Person, o: { title: string; action: string; values: PersonForm; errors?: FormErrors; person?: Person; status?: 200 | 422 }) {
  const hasCycle = o.person ? visibleCyclesOf(o.person.id).length > 0 : false;
  return c.html(
    <PersonFormView
      viewer={viewer}
      today={today()}
      action={o.action}
      title={o.title}
      values={o.values}
      errors={o.errors ?? {}}
      supervisors={supervisorCandidates(o.person?.id)}
      hasCycle={hasCycle}
      hasOpenCycle={o.person ? openCycle(o.person.id) !== null : false}
      personId={o.person?.id}
    />,
    o.status ?? 200,
  );
}

app.get("/hr/people/new", (c) => {
  const viewer = hrGuard(c);
  if (viewer instanceof Response) return viewer;
  return renderForm(c, viewer, { title: "Nowy pracownik", action: "/hr/people", values: emptyForm() });
});

app.post("/hr/people", async (c) => {
  const viewer = hrGuard(c);
  if (viewer instanceof Response) return viewer;
  const values = readForm(await c.req.parseBody());
  const errors = validateForm(values, { hasCycle: false, needsSupervisor: true });
  if (Object.keys(errors).length > 0) return renderForm(c, viewer, { title: "Nowy pracownik", action: "/hr/people", values, errors, status: 422 });
  const { personId } = createPerson(values, viewer.id);
  return c.redirect(`/hr/people?saved=${personId}`, 303);
});

function editGuard(c: Context): { viewer: Person; person: Person } | Response {
  const viewer = hrGuard(c);
  if (viewer instanceof Response) return viewer;
  const person = personById(c.req.param("id") ?? "");
  if (!person) return c.text("Nie ma takiej osoby.", 404);
  return { viewer, person };
}

app.get("/hr/people/:id/edit", (c) => {
  const g = editGuard(c);
  if (g instanceof Response) return g;
  return renderForm(c, g.viewer, { title: `Edycja: ${g.person.name}`, action: `/hr/people/${g.person.id}/edit`, values: formFromPerson(g.person), person: g.person });
});

app.post("/hr/people/:id/edit", async (c) => {
  const g = editGuard(c);
  if (g instanceof Response) return g;
  const { viewer, person } = g;
  const values = readForm(await c.req.parseBody());
  const open = openCycle(person.id);
  const hasCycle = visibleCyclesOf(person.id).length > 0;
  const errors = validateForm(values, { personId: person.id, hasCycle, needsSupervisor: open !== null || (!hasCycle && !!(values.hired_on || values.prev_on)) });
  if (Object.keys(errors).length > 0) {
    return renderForm(c, viewer, { title: `Edycja: ${person.name}`, action: `/hr/people/${person.id}/edit`, values, errors, person, status: 422 });
  }
  const result = updatePerson(person, values, viewer.id);
  if (result.appraiserChange) return c.redirect(`/cycles/${result.appraiserChange.cycleId}/appraiser?to=${result.appraiserChange.to}`, 303);
  return c.redirect(`/hr/people?saved=${person.id}`, 303);
});

function deletionGuard(c: Context) {
  const g = editGuard(c);
  if (g instanceof Response) return g;
  if (g.viewer.role !== "hr") return c.text("Dane pracownika usuwają kadry.", 403);
  return g;
}

app.get("/hr/people/:id/delete", (c) => {
  const g = deletionGuard(c);
  if (g instanceof Response) return g;
  const blocked = employeeDeletionBlock(g.person);
  return c.html(
    <Layout title="Potwierdzenie usunięcia danych" person={g.viewer} today={today()}>
      <section class="card">
        <h1>Usunąć dane pracownika {g.person.name}?</h1>
        {blocked ? <p role="alert">{blocked}</p> : <>
          <p>Usuniesz kartotekę, oceny, notatki i pozostałe dane tej osoby. Tego działania nie można cofnąć.</p>
          <form method="post" action={`/hr/people/${g.person.id}/delete`} class="btns">
            <button type="submit" name="confirmed" value="1" class="btn primary">Usuń dane pracownika</button>
            <a class="btn" href={`/hr/people/${g.person.id}/edit`}>Anuluj</a>
          </form>
        </>}
      </section>
    </Layout>,
    blocked ? 409 : 200,
  );
});

app.post("/hr/people/:id/delete", async (c) => {
  const g = deletionGuard(c);
  if (g instanceof Response) return g;
  if ((await c.req.parseBody()).confirmed !== "1") return c.text("Potwierdź usunięcie danych pracownika.", 422);
  const result = deleteEmployee(g.person.id);
  if (result) return c.text(result.reason, result.status);
  return c.redirect("/hr/people?deleted=1", 303);
});

export default app;
