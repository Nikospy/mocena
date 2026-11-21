import { CRITERIA } from "../engine/scoring";
import type { Person } from "../people";
import type { NoteSuggestion } from "../suggestions";
import { Layout } from "./layout";

export type NoteFormValues = { criterion_id: string; text: string; rating: string; task_change: boolean; date: string };
export type CriteriaGroup = { label: string; ids: string[] };

/** Linia pod polem „Zmiana zadań pracownika”: skąd podpowiedź. Przy braku podpowiedzi jej nie ma. */
export function SuggestionHint(props: { suggestion: NoteSuggestion | null }) {
  const s = props.suggestion;
  let text = "";
  if (s?.taskChange) {
    if (s.source === "rules" && s.matched.length) {
      text = `Zaznaczone na podstawie listy słów (ustawienie urzędu): ${s.matched.map((w) => `„${w}”`).join(", ")}. Możesz odznaczyć.`;
    } else if (s.source === "local-model") {
      text = "Zaznaczone przez model uruchomiony w urzędzie. Możesz odznaczyć.";
    }
  }
  return <small id="task-change-hint" aria-live="polite">{text}</small>;
}

export function NoteFormView(props: {
  viewer: Person;
  subject: Person;
  today: string;
  groups: CriteriaGroup[];
  values: NoteFormValues;
  errors?: Partial<Record<"criterion_id" | "text" | "date", string>>;
  suggestion?: NoteSuggestion | null;
}) {
  const v = props.values;
  const e = props.errors ?? {};
  return (
    <Layout title="Nowa notatka" person={props.viewer} today={props.today}>
      <section class="enter">
        <h1 class="n-title">Nowa notatka: {props.subject.name}</h1>
        <form method="post" action={`/people/${props.subject.id}/notes`} class="n-form" id="note-form">
          <div class="card hero-field">
            <label for="text"><h2>Co się stało</h2></label>
            <textarea id="text" name="text" rows={5} aria-invalid={e.text ? "true" : undefined}>{v.text}</textarea>
            {e.text ? <p class="st bad" role="alert">{e.text}</p> : null}
          </div>

          <div class="n-fields">
            <div>
              <label class="lbl" for="date">Data zdarzenia</label>
              <input class="area" type="date" id="date" name="date" max={props.today} value={v.date} />
              {e.date ? <p class="st bad" role="alert">{e.date}</p> : null}
            </div>
            <div role="radiogroup" aria-labelledby="l-krit">
              <span class="lbl" id="l-krit">Kryterium</span>
              {props.groups.map((g) => (
                <>
                  {props.groups.length > 1 ? <p class="cap">{g.label}</p> : null}
                  <div class="chips">
                    {g.ids.map((id) => (
                      <label class="chip">
                        <input type="radio" name="criterion_id" value={id} checked={v.criterion_id === id} />
                        <span>{CRITERIA.find((c) => c.id === id)?.name ?? id}</span>
                      </label>
                    ))}
                  </div>
                </>
              ))}
              {e.criterion_id ? <p class="st bad" role="alert">{e.criterion_id}</p> : null}
            </div>
            <div role="radiogroup" aria-labelledby="l-tb">
              <span class="lbl" id="l-tb">To było</span>
              <div class="seg">
                <label>
                  <input type="radio" name="rating" value="good" checked={v.rating === "good"} />
                  <span>dobrze</span>
                </label>
                <label>
                  <input type="radio" name="rating" value="needs_improvement" checked={v.rating === "needs_improvement"} />
                  <span>do poprawy</span>
                </label>
              </div>
            </div>
          </div>

          <div class="hint">
            <label class="cb">
              <input type="checkbox" id="task_change" name="task_change" value="1" checked={v.task_change} aria-describedby="task-change-hint" />
              <span class="box">
                <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              <span>
                <span class="cbt">Zmiana zadań pracownika</span>
                <SuggestionHint suggestion={props.suggestion ?? null} />
              </span>
            </label>
          </div>

          <div class="actionbar">
            <button class="btn primary full" type="submit">Zapisz notatkę</button>
          </div>
        </form>
        <a class="btn text" href="/notes">Moje notatki</a>
      </section>
      <script src="/note-form.js" defer></script>
    </Layout>
  );
}
