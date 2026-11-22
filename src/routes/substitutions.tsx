import { Hono, type Context } from "hono";
import { getDb } from "../db";
import { recordEvent } from "../events";
import { personById, type Person } from "../people";
import { today } from "../settings";
import { currentAndFutureSubstitutions } from "../substitutions";
import { SubstitutionsView, type SubstitutionValues } from "../views/substitutions";
import { hrGuard } from "./hr-people";

const app = new Hono();

const appraisers = () => getDb().query("SELECT * FROM people WHERE role = 'appraiser' ORDER BY name").all() as Person[];
const nameOf = (id: string) => personById(id)?.name ?? id;

function isIsoDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
}

function render(c: Context, viewer: Person, o: { values?: SubstitutionValues; errors?: Partial<Record<keyof SubstitutionValues, string>>; saved?: boolean; status?: 200 | 422 }) {
  return c.html(
    <SubstitutionsView
      viewer={viewer}
      today={today()}
      appraisers={appraisers()}
      values={o.values ?? { absent_id: "", substitute_id: "", date_from: "", date_to: "" }}
      errors={o.errors}
      list={currentAndFutureSubstitutions()}
      nameOf={nameOf}
      saved={o.saved}
    />,
    o.status ?? 200,
  );
}

app.get("/hr/substitutions", (c) => {
  const viewer = hrGuard(c);
  if (viewer instanceof Response) return viewer;
  return render(c, viewer, { saved: c.req.query("saved") === "1" });
});

app.post("/hr/substitutions", async (c) => {
  const viewer = hrGuard(c);
  if (viewer instanceof Response) return viewer;
  const body = await c.req.parseBody();
  const s = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const values: SubstitutionValues = { absent_id: s("absent_id"), substitute_id: s("substitute_id"), date_from: s("date_from"), date_to: s("date_to") };
  const errors: Partial<Record<keyof SubstitutionValues, string>> = {};
  const ids = appraisers().map((p) => p.id);
  if (!ids.includes(values.absent_id)) errors.absent_id = "Wybierz nieobecnego oceniającego z listy.";
  if (!appraisers().some((p) => p.id === values.substitute_id && p.has_account === 1)) errors.substitute_id = "Wybierz osobę zastępującą z listy (musi mieć konto).";
  else if (values.substitute_id === values.absent_id) errors.substitute_id = "Osoba zastępująca musi być kimś innym niż nieobecny oceniający.";
  if (!isIsoDate(values.date_from)) errors.date_from = "Wpisz datę w polu „Od”.";
  if (!isIsoDate(values.date_to)) errors.date_to = "Wpisz datę w polu „Do”.";
  else if (isIsoDate(values.date_from) && values.date_to < values.date_from) errors.date_to = "Data „Do” musi być taka sama jak „Od” albo późniejsza.";
  else if (values.date_to < today()) errors.date_to = "Zastępstwo musi kończyć się dziś albo później.";
  if (Object.keys(errors).length > 0) return render(c, viewer, { values, errors, status: 422 });
  getDb().transaction(() => {
    const r = getDb()
      .query("INSERT INTO substitutions (absent_id, substitute_id, date_from, date_to, recorded_on, recorded_by) VALUES (?, ?, ?, ?, ?, ?)")
      .run(values.absent_id, values.substitute_id, values.date_from, values.date_to, today(), viewer.id);
    recordEvent("substitution_set", null, viewer.id, { substitution_id: Number(r.lastInsertRowid), absent_id: values.absent_id, substitute_id: values.substitute_id, from: values.date_from, to: values.date_to });
  })();
  return c.redirect("/hr/substitutions?saved=1", 303);
});

export default app;
