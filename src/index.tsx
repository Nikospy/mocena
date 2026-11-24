import { Hono, type MiddlewareHandler, type NotFoundHandler } from "hono";
import { isoFromInput } from "./date-input";
import { deleteCookie, setCookie } from "hono/cookie";
import { assessmentState } from "./assessment/state";
import { cycleRulesVersion } from "./assessment/rules-scope";
import { hasPublishedRules, resetRulesCache, rulesVersion, withRulesVersion } from "./engine/rules";
import { getDb } from "./db";
import { runSeed } from "./seed";
import { homeOptions, homeTasks } from "./home-tasks";
import { PERSON_COOKIE, currentPerson, personById, roleLabel, type Person } from "./people";
import { isDemoMode, OFFICE_INIT_COMMAND, today } from "./settings";
import cycleStart from "./routes/cycle-start";
import assessment from "./routes/assessment";
import hr from "./routes/hr";
import objection from "./routes/objection";
import objectionChange from "./routes/objection-change";
import selfPrep from "./routes/self-prep";
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
import { AboutPage } from "./views/about";
import { ErrorSummary, FieldError, LegalBasis, PageHeader, invalid } from "./views/components";
import { errorPage } from "./views/error-page";

const app = new Hono();

function accounts() {
  return getDb().query("SELECT id, name, role, position_title, gender FROM people WHERE has_account = 1 ORDER BY name").all() as
    Pick<Person, "id" | "name" | "role" | "position_title" | "gender">[];
}

/** Konta z pokazu dla jury idą pierwsze, w kolejności kroków; reszta alfabetycznie. */
const TOUR_ACCOUNTS = ["marek", "piotr", "joanna"];

const CHEVRON_R = (
  <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

function AccountRow(props: { a: ReturnType<typeof accounts>[number]; first?: boolean; error?: string }) {
  const { a } = props;
  const role = roleLabel(a);
  const title = a.position_title && a.position_title !== role ? a.position_title : null;
  return (
    <li>
      <button class="acc" type="submit" name="person_id" value={a.id} id={props.first ? "acc-first" : undefined} {...(props.error ? invalid("person_id", { person_id: props.error }) : {})}>
        <span class="acc-main"><b>{a.name}</b><span class="cap">{title ? `${title} · ${role}` : role}</span></span>
        {CHEVRON_R}
      </button>
    </li>
  );
}

function AccountScreen(props: { error?: string }) {
  const demo = isDemoMode();
  const all = accounts();
  if (!demo && all.length === 0) {
    return (
      <Layout title="Pierwsze uruchomienie" person={null} today={today()}>
        <PageHeader title="Pierwsze uruchomienie" />
        <section class="card">
          <p>Załóż pierwsze konto kadr w terminalu na komputerze, na którym działa mOcena.</p>
          <p><code>{OFFICE_INIT_COMMAND}</code></p>
          <p>Po wykonaniu polecenia odśwież stronę i wybierz konto.</p>
        </section>
      </Layout>
    );
  }
  const tourAccounts = demo ? TOUR_ACCOUNTS.map((id) => all.find((a) => a.id === id)).filter((a) => !!a) : [];
  const others = demo ? all.filter((a) => !TOUR_ACCOUNTS.includes(a.id)) : all;
  return (
    <Layout title={demo ? "Wybierz konto pokazowe" : "Wybierz konto"} person={null} today={today()}>
      <section class="account-list">
        <PageHeader
          context={demo ? "Pokaz dla jury" : undefined}
          title={demo ? "Wybierz konto pokazowe" : "Wybierz konto"}
          lead={demo ? "Każde konto pokazuje ekrany jednej osoby w cyklu oceny. Konto zmienisz w każdej chwili w menu przy nazwisku." : undefined}
        />
        <ErrorSummary errors={props.error ? { person_id: props.error } : undefined} fields={{ person_id: "acc-first" }} title="Nie wybrano konta" />
        <form method="post" action="/account" class="acc-form">
          <FieldError id="person_id" message={props.error} />
          {demo ? <h2 class="acc-h" id="acc-tour">Osoby z pokazu</h2> : null}
          {demo ? (
            <ul class="acc-grid" aria-labelledby="acc-tour">
              {tourAccounts.map((a, i) => <AccountRow a={a} first={i === 0} error={props.error} />)}
            </ul>
          ) : null}
          {demo ? <h2 class="acc-h" id="acc-other">Pozostałe konta</h2> : null}
          <ul class="acc-grid" aria-labelledby={demo ? "acc-other" : undefined}>
            {others.map((a, i) => <AccountRow a={a} first={!tourAccounts.length && i === 0} error={props.error} />)}
          </ul>
        </form>
        {demo ? (
          <form method="post" action="/demo/restart" class="acc-again">
            <button class="btn text" type="submit">Wgraj dane pokazowe od nowa</button>
            <p class="cap">Usuwa zmiany wprowadzone w pokazie i wraca do tej listy.</p>
          </form>
        ) : null}
      </section>
    </Layout>
  );
}

/** Pusty stan strony głównej: jedno zdanie i jedna akcja właściwa dla roli. */
function emptyAction(person: Person): { href: string; label: string } | null {
  if (person.role === "hr") return { href: "/hr", label: "Otwórz stan cykli" };
  if (person.role === "admin") return { href: "/admin/suggestion-sources", label: "Otwórz źródła podpowiedzi" };
  if (person.role === "appraiser") return { href: "/notes", label: "Otwórz notatki o zespole" };
  return { href: `/people/${person.id}/history`, label: "Otwórz historię ocen" };
}

/** Sprawy z terminem na górze (od najbliższego), potem pozostałe w kolejności dostawców. */
function sortTasks<T extends { due?: string }>(tasks: T[]): T[] {
  return tasks
    .map((t, i) => ({ t, i }))
    .sort((a, b) => (a.t.due && b.t.due ? a.t.due.localeCompare(b.t.due) : a.t.due ? -1 : b.t.due ? 1 : a.i - b.i))
    .map((x) => x.t);
}

/** Termin słowami: „za 6 dni”, „jutro”, „dziś”, „po terminie od 3 dni”. */
function dueWords(due: string, now: string): { text: string; late: boolean } {
  const days = Math.round((Date.parse(due) - Date.parse(now)) / 86_400_000);
  const n = (k: number) => (k === 1 ? "1 dzień" : `${k} dni`);
  if (days < 0) return { text: `po terminie od ${-days === 1 ? "1 dnia" : `${-days} dni`}`, late: true };
  if (days === 0) return { text: "termin dziś", late: false };
  if (days === 1) return { text: "termin jutro", late: false };
  return { text: `za ${n(days)}`, late: false };
}

app.use("*", tourContext);

/** Cykl z zatwierdzoną oceną żyje według reguł wersji zapisanej w ocenie: nazwy, skala, poziomy i terminy z tej wersji. */
const cycleRulesScope: MiddlewareHandler = async (c, next) => {
  if (!hasPublishedRules()) return next();
  const version = cycleRulesVersion(c.req.param("id") ?? "");
  if (!version) return next();
  return withRulesVersion(version, () => next());
};
app.use("/cycles/:id", cycleRulesScope);
app.use("/cycles/:id/*", cycleRulesScope);

/** Liveness and database check for monitoring: no session, no personal data. */
app.get("/healthz", (c) => {
  c.header("Cache-Control", "no-store");
  try {
    getDb().query("SELECT 1 FROM sqlite_master LIMIT 1").get();
    return c.json({ status: "ok", rulesVersion: rulesVersion().version, db: "ok" });
  } catch {
    return c.json({ status: "error", rulesVersion: rulesVersion().version, db: "error" }, 503);
  }
});

app.get("/", (c) => {
  const person = currentPerson(c);
  if (!person) return isDemoMode() ? c.html(<TourEntry />) : c.redirect("/account");
  const tasks = homeTasks(person);
  const options = homeOptions(person);
  const now = today();
  return c.html(
    <Layout title="Sprawy do załatwienia" person={person} today={today()}>
      <section class="home">
        <PageHeader context={person.position_title ?? roleLabel(person)} title="Sprawy do załatwienia" />
        {tasks.length === 0 ? (
          <div class="home-empty">
            <p>Nie masz teraz spraw do załatwienia.</p>
            {(() => {
              const a = emptyAction(person);
              return a ? <a href={a.href}>{a.label}{CHEVRON_R}</a> : null;
            })()}
          </div>
        ) : (
          <ul class="tasks">
            {sortTasks(tasks).map((t) => {
              const when = t.due ? dueWords(t.due, now) : null;
              return (
                <li class={when?.late ? "task late" : "task"}>
                  <div class="task-main">
                    <h2>
                      <a class="task-link" href={t.href}>
                        {t.heading ?? t.title}
                      </a>
                    </h2>
                    {t.person ? <p class="task-person">{t.person}</p> : null}
                    {t.detail ? <p class="task-detail">{t.detail}</p> : null}
                    {t.post || t.secondary ? (
                      <div class="task-more">
                        {t.post ? (
                          <form method="post" action={t.post.action}>
                            <button class="btn outline" type="submit">{t.post.label}</button>
                          </form>
                        ) : null}
                        {t.secondary ? <a class="btn text" href={t.secondary.href}>{t.secondary.label}</a> : null}
                      </div>
                    ) : null}
                  </div>
                  <div class="task-side">
                    {t.due && when ? (
                      <p class="task-due">
                        <b>{when.text}</b>
                        <span>
                          {when.late ? "termin minął" : "do"} {formatDate(t.due)} {t.basis ? <LegalBasis basis={t.basis} /> : null}
                        </span>
                      </p>
                    ) : null}
                    <span class={t.action ? "task-go" : "task-go bare"} aria-hidden="true">
                      {t.action ?? null}
                      {CHEVRON_R}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {options.length ? (
        <section class="home-options" aria-labelledby="h-options">
          <h2 id="h-options">Możliwości w cyklu</h2>
          <ul class="tasks quiet">
            {options.map((t) => (
              <li class="task">
                <div class="task-main">
                  <h3>
                    <a class="task-link" href={t.href}>
                      {t.heading ?? t.title}
                    </a>
                  </h3>
                  {t.detail ? <p class="task-detail">{t.detail}</p> : null}
                </div>
                <div class="task-side">
                  <span class="task-go bare" aria-hidden="true">{CHEVRON_R}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Layout>,
  );
});

app.get("/account", (c) => c.html(<AccountScreen />));

app.get("/about", (c) => c.html(<AboutPage person={currentPerson(c)} today={today()} />));

app.post("/account", async (c) => {
  const body = await c.req.parseBody();
  const id = typeof body.person_id === "string" ? body.person_id : "";
  const p = personById(id);
  if (!p || !p.has_account) return c.html(<AccountScreen error="Nie ma takiego konta. Wybierz osobę z listy." />, 422);
  setCookie(c, PERSON_COOKIE, p.id, { path: "/", httpOnly: true, sameSite: "Lax" });
  return c.redirect("/", 303);
});

app.post("/demo/restart", (c) => {
  if (!isDemoMode()) return errorPage(c, "Ta funkcja działa tylko w trybie pokazu.", 403);
  const db = getDb();
  db.transaction(() => {
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_cf\\_%' ESCAPE '\\'")
      .all() as { name: string }[];
    for (const t of tables) db.exec(`DELETE FROM "${t.name}"`);
    db.exec("DELETE FROM sqlite_sequence");
    resetRulesCache();
    runSeed(db, { liveStep2: true });
  })();
  deleteCookie(c, PERSON_COOKIE, { path: "/" });
  return c.redirect("/account", 303);
});

app.post("/demo/date", async (c) => {
  if (!isDemoMode()) return errorPage(c, "Ta funkcja działa tylko w trybie pokazu.", 403);
  const body = await c.req.parseBody();
  const date = isoFromInput(typeof body.date === "string" ? body.date : "");
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  if (!valid || date <= today()) {
    // Pasek pokazu wraca rozwinięty, z komunikatem przy polu daty; podsumowanie nad treścią prowadzi do pola.
    const person = currentPerson(c);
    const message = "Podaj datę późniejszą niż dzisiejsza: data pokazu przesuwa się tylko do przodu.";
    return c.html(
      <Layout title="Nie zmieniono daty" person={person} today={today()} demoDateError={message}>
        <PageHeader title="Nie zmieniono daty" />
        <ErrorSummary errors={{ date: message }} fields={{ date: "demo-date" }} title="Nie zmieniono daty pokazu" />
        <p class="err-back">
          <a href="/">Wróć do spraw</a>
        </p>
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
app.route("/", objection);
app.route("/", objectionChange);
app.route("/", selfPrep);
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
