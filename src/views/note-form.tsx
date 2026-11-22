import { CRITERIA } from "../engine/scoring";
import { ErrorSummary, FieldError, PageHeader, invalid } from "./components";
import type { Person } from "../people";
import type { NoteSuggestion } from "../suggestions";
import { Layout, formatDateLong } from "./layout";

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
        <PageHeader title={<>Nowa notatka: {props.subject.name}</>} />
        <form method="post" action={`/people/${props.subject.id}/notes`} class="n-form" id="note-form">
          <ErrorSummary errors={{ date: e.date, text: e.text, criterion_id: e.criterion_id }} />

          <div class="field nf-date">
            <label class="lbl" for="date">Kiedy</label>
            <FieldError id="date" errors={e} />
            <input class="area" type="date" id="date" name="date" max={props.today} value={v.date} {...invalid("date", e, "date-words")} />
            <p class="date-words" id="date-words" data-date-words-for="date">{v.date ? formatDateLong(v.date) : ""}</p>
          </div>

          <div class="card hero-field">
            <label for="text"><h2>Co się stało</h2></label>
            <FieldError id="text" errors={e} />
            <textarea id="text" name="text" rows={5} {...invalid("text", e, "text-privacy")}>{v.text}</textarea>
            <div class="hero-foot">
              <p class="cap" id="text-privacy">Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje.</p>
              <p class="sign">
                <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
                {props.viewer.name} · {formatDateLong(props.today)}
              </p>
            </div>
          </div>

          <div class="n-fields">
            <div role="radiogroup" aria-labelledby="l-krit" {...(e.criterion_id ? { "aria-describedby": "criterion_id-error" } : {})}>
              <span class="lbl" id="l-krit">Kryterium</span>
              <FieldError id="criterion_id" errors={e} />
              {props.groups.map((g, gi) => (
                <>
                  {props.groups.length > 1 ? <p class="cap nf-group">{g.label}</p> : null}
                  <div class="chips">
                    {g.ids.map((id, i) => (
                      <label class="chip">
                        <input type="radio" name="criterion_id" value={id} id={gi === 0 && i === 0 ? "criterion_id" : undefined} checked={v.criterion_id === id} />
                        <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{CRITERIA.find((c) => c.id === id)?.name ?? id}</span>
                      </label>
                    ))}
                  </div>
                </>
              ))}
            </div>
            <div role="radiogroup" aria-labelledby="l-tb">
              <span class="lbl" id="l-tb">To było</span>
              <div class="seg">
                <label>
                  <input type="radio" name="rating" value="good" checked={v.rating === "good"} />
                  <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>dobrze</span>
                </label>
                <label>
                  <input type="radio" name="rating" value="needs_improvement" checked={v.rating === "needs_improvement"} />
                  <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>do poprawy</span>
                </label>
              </div>
            </div>
          </div>

          <div class="hint">
            <p class="voice hint-v"><span>Podpowiedź (ustawienie urzędu)</span></p>
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

          <div class="actionbar nf-actions">
            <button class="btn primary" type="submit">Zapisz notatkę</button>
          </div>
        </form>
        <p class="nf-back"><a href="/notes">Wróć do notatek o zespole</a></p>
      </section>
      <script src="/note-form.js" defer></script>
      <script src="/date-words.js" defer></script>
    </Layout>
  );
}
