import { Hono, type NotFoundHandler } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { getDb } from "./db";
import { runSeed } from "./seed";
import { homeTasks } from "./home-tasks";
import { PERSON_COOKIE, currentPerson, personById, roleLabel, type Person } from "./people";
import { today } from "./settings";
import cycleStart from "./routes/cycle-start";
import assessment from "./routes/assessment";
import hr from "./routes/hr";
import sheet from "./routes/sheet";
import history from "./routes/history";
import notes from "./routes/notes";
import absences from "./routes/absences";
import timeline from "./routes/timeline";
import appraiser from "./routes/appraiser";
import hrPeople from "./routes/hr-people";
import substitutions from "./routes/substitutions";
import hrExport from "./routes/hr-export";
import "./reminders";
import hrPartner from "./routes/hr-partner";
import admin from "./routes/admin";
import tour from "./routes/tour";
import deadlineChange from "./routes/deadline-change";
import invitations from "./routes/invitations";
import { tourContext } from "./tour/context";
import { TourEntry } from "./views/tour-entry";
import { Layout, formatDate } from "./views/layout";
import { NotFoundPage, ServerErrorPage } from "./views/error-page";
import { LegalBasis } from "./views/components";

const app = new Hono();

function accounts() {
  return getDb().query("SELECT id, name, role, position_title, gender FROM people WHERE has_account = 1 ORDER BY name").all() as
    Pick<Person, "id" | "name" | "role" | "position_title" | "gender">[];
}

function AccountScreen(props: { error?: string }) {
  return (
    <Layout title="Wybór konta" person={null} today={today()}>
      <section class="account-list">
        <div class="list-h">
          <h1>Wybierz konto pokazowe</h1>
          <p class="cap">Każde konto pokazuje ekrany jednej osoby w cyklu oceny.</p>
        </div>
        {props.error ? <p class="st bad" role="alert">{props.error}</p> : null}
        <form method="post" action="/account">
          <ul class="acc-grid">
            {accounts().map((a) => (
              <li>
                <button class="card acc" type="submit" name="person_id" value={a.id}>
                  <b>{a.name}</b>
                  <span class="cap">{a.position_title ?? roleLabel(a)}</span>
                  <span class="acc-role">{roleLabel(a)}</span>
                </button>
              </li>
            ))}
          </ul>
        </form>
        <form method="post" action="/demo/restart" class="again">
          <button class="btn text" type="submit">Zacznij pokaz od nowa</button>
        </form>
      </section>
    </Layout>
  );
}

app.use("*", tourContext);

app.get("/", (c) => {
  const person = currentPerson(c);
  if (!person) return c.html(<TourEntry />);
  const tasks = homeTasks(person);
  return c.html(
    <Layout title="Start" person={person} today={today()}>
      <section>
        <div class="list-h">
          <h1>Sprawy do załatwienia</h1>
        </div>
        {tasks.length === 0 ? (
          <p class="card">Brak spraw do załatwienia.</p>
        ) : (
          <ul class="tasks">
            {tasks.map((t) => (
              <li class="card task">
                <div class="task-main">
                  <h2>{t.heading ?? t.title}</h2>
                  {t.person ? <p>{t.person}</p> : null}
                  {t.detail ? <p class="cap">{t.detail}</p> : null}
                  {t.due ? (
                    <p class="task-due">
                      {t.due < today() ? "po terminie od" : "do"} <b>{formatDate(t.due)}</b> {t.basis ? <LegalBasis basis={t.basis} /> : null}
                    </p>
                  ) : null}
                </div>
                {t.post || t.secondary ? (
                  <div class="btns">
                    <a class="btn primary" href={t.href}>{t.action ?? "Otwórz"}</a>
                    {t.post ? (
                      <form method="post" action={t.post.action}>
                        <button class="btn" type="submit">{t.post.label}</button>
                      </form>
                    ) : null}
                    {t.secondary ? <a class="btn" href={t.secondary.href}>{t.secondary.label}</a> : null}
                  </div>
                ) : (
                  <a class="btn primary" href={t.href}>{t.action ?? "Otwórz"}</a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>,
  );
});

app.get("/account", (c) => c.html(<AccountScreen />));

app.post("/account", async (c) => {
  const body = await c.req.parseBody();
  const id = typeof body.person_id === "string" ? body.person_id : "";
  const p = personById(id);
  if (!p || !p.has_account) return c.html(<AccountScreen error="Nie ma takiego konta." />, 422);
  setCookie(c, PERSON_COOKIE, p.id, { path: "/", httpOnly: true, sameSite: "Lax" });
  return c.redirect("/", 303);
});

app.post("/demo/restart", (c) => {
  const db = getDb();
  db.transaction(() => {
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_cf\\_%' ESCAPE '\\'")
      .all() as { name: string }[];
    for (const t of tables) db.exec(`DELETE FROM "${t.name}"`);
    db.exec("DELETE FROM sqlite_sequence");
    runSeed(db, { liveStep2: true });
  })();
  deleteCookie(c, PERSON_COOKIE, { path: "/" });
  return c.redirect("/account", 303);
});

app.post("/demo/date", async (c) => {
  const body = await c.req.parseBody();
  const date = typeof body.date === "string" ? body.date : "";
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  if (!valid || date <= today()) {
    const person = currentPerson(c);
    return c.html(
      <Layout title="Data systemowa" person={person} today={today()}>
        <section class="card">
          <h1>Nie zmieniono daty</h1>
          <p class="req" role="alert">Data systemowa może tylko przesuwać się do przodu: podaj datę późniejszą niż bieżąca.</p>
          <a class="btn text" href="/">Wróć na stronę główną</a>
        </section>
      </Layout>,
      422,
    );
  }
  getDb().query("INSERT INTO settings (key, value) VALUES ('demo_date', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(date);
  return c.redirect("/", 303);
});

app.route("/", cycleStart);
app.route("/", assessment);
app.route("/", hr);
app.route("/", sheet);
app.route("/", history);
app.route("/", notes);
app.route("/", absences);
app.route("/", timeline);
app.route("/", appraiser);
app.route("/", hrPeople);
app.route("/", substitutions);
app.route("/", hrExport);
app.route("/", hrPartner);
app.route("/", admin);
app.route("/", tour);
app.route("/", deadlineChange);
app.route("/", invitations);

export const notFoundHandler: NotFoundHandler = (c) => c.html(<NotFoundPage />, 404);
app.notFound(notFoundHandler);

app.onError((err, c) => {
  console.error(err);
  return c.html(<ServerErrorPage />, 500);
});

export default app;
