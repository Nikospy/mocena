import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { serveStatic } from "hono/bun";
import { getDb } from "./db";
import { homeTasks } from "./home-tasks";
import { PERSON_COOKIE, currentPerson, personById } from "./people";
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
import "./reminders";
import { Layout } from "./views/layout";

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

function accounts() {
  return getDb().query("SELECT id, name, role, position_title FROM people WHERE has_account = 1 ORDER BY name").all() as {
    id: string;
    name: string;
    role: string;
    position_title: string | null;
  }[];
}

function AccountScreen(props: { error?: string }) {
  return (
    <Layout title="Wybór konta" person={null} today={today()}>
      <section class="card account-list">
        <h1>Wybierz konto pokazowe</h1>
        {props.error ? <p class="req" role="alert">{props.error}</p> : null}
        <form method="post" action="/account">
          <ul class="plain-list">
            {accounts().map((a) => (
              <li>
                <button class="btn" type="submit" name="person_id" value={a.id}>
                  {a.name}
                </button>
                <p class="cap">{a.position_title ?? a.role}</p>
              </li>
            ))}
          </ul>
        </form>
      </section>
    </Layout>
  );
}

app.get("/", (c) => {
  const person = currentPerson(c);
  if (!person) return c.redirect("/account");
  const tasks = homeTasks(person);
  return c.html(
    <Layout title="Start" person={person} today={today()}>
      <section class="card">
        <h1>Sprawy do załatwienia</h1>
        {tasks.length === 0 ? (
          <p>Brak spraw do załatwienia.</p>
        ) : (
          <ul class="plain-list">
            {tasks.map((t) => (
              <li>
                <a href={t.href}>{t.title}</a>
                {t.detail ? <p class="cap">{t.detail}</p> : null}
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

export default app;
