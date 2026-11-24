import { allCriteria } from "../engine/scoring";
import { DateFormatHint, DateInput, ErrorSummary, FieldError, PageHeader, invalid } from "./components";
import { isIsoDate } from "../date-input";
import type { Person } from "../people";
import type { NoteSuggestion, SensitiveMatch } from "../suggestions";
import { Layout, formatDateLong } from "./layout";

export type NoteFormValues = {
  criterion_id: string;
  text: string;
  rating: string;
  task_change: boolean;
  date: string;
  confirm_no_sensitive?: boolean;
  confirm_sensitive_token?: string;
};
export type CriteriaGroup = { label: string; ids: string[] };

export function formatSensitiveWarning(matches: SensitiveMatch[]): string {
  if (matches.length === 0) return "";
  const parts = matches.map((m) => `${m.label} (${m.matched.map((w) => `„${w}”`).join(", ")})`);
  return `Notatka może zawierać dane szczególne z art. 9 RODO: ${parts.join("; ")} — lista słów (ustawienie urzędu). Usuń je przed zapisem albo potwierdź, że notatka dotyczy wyłącznie faktów z pracy.`;
}

/** Linia pod polem „Zmiana zadań pracownika”: skąd podpowiedź. Pokazywana tylko, gdy pole jest zaznaczone. */
export function SuggestionHint(props: { suggestion: NoteSuggestion | null; checked?: boolean }) {
  const s = props.suggestion;
  let text = "";
  if (props.checked && s?.taskChange) {
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
  errors?: Partial<Record<"criterion_id" | "text" | "date" | "confirm_no_sensitive", string>>;
  suggestion?: NoteSuggestion | null;
}) {
  const v = props.values;
  const e = props.errors ?? {};
  const sensitive = props.suggestion?.sensitiveCategories ?? [];
  return (
    <Layout title="Nowa notatka" person={props.viewer} today={props.today}>
      <section class="enter">
        <PageHeader title={<>Nowa notatka: {props.subject.name}</>} />
        <form method="post" action={`/people/${props.subject.id}/notes`} class="n-form" id="note-form">
          <ErrorSummary errors={{ date: e.date, text: e.text, confirm_no_sensitive: e.confirm_no_sensitive, criterion_id: e.criterion_id }} />

          <div class="field nf-date">
            <label class="lbl" for="date">Kiedy<DateFormatHint /></label>
            <FieldError id="date" errors={e} />
            <DateInput id="date" value={v.date} {...invalid("date", e, "date-words")} />
            <p class="date-words" id="date-words" data-date-words-for="date">{isIsoDate(v.date) ? formatDateLong(v.date) : ""}</p>
          </div>

          <div class="card hero-field">
            <label for="text"><h2>Co się stało</h2></label>
            <FieldError id="text" errors={e} />
            <textarea id="text" name="text" rows={5} placeholder="Np. Piotr przejął kolejkę wniosków po odejściu kolegi" {...invalid("text", e, "text-privacy")}>{v.text}</textarea>
            <div class="hero-foot">
              <p class="cap" id="text-privacy">Pracownik nie widzi notatki na swoim koncie. Na wniosek urząd mu ją wydaje.</p>
              <p class="sign">
                <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
                {props.viewer.name} · {formatDateLong(props.today)}
              </p>
            </div>
          </div>

          <div class="st warn" id="sensitive-warning" role="alert" hidden={sensitive.length === 0}>
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
            <div>
              <b id="sensitive-warning-text">{formatSensitiveWarning(sensitive)}</b>
            </div>
          </div>

          <div class="field" id="confirm-sensitive-wrap" hidden={sensitive.length === 0}>
            <FieldError id="confirm_no_sensitive" errors={e} />
            <input
              type="hidden"
              id="confirm_sensitive_token"
              name="confirm_sensitive_token"
              value={v.confirm_sensitive_token ?? props.suggestion?.sensitiveToken ?? ""}
            />
            <label class="cb">
              <input
                type="checkbox"
                id="confirm_no_sensitive"
                name="confirm_no_sensitive"
                value="1"
                checked={!!v.confirm_no_sensitive}
                {...invalid("confirm_no_sensitive", e)}
              />
              <span class="box">
                <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              <span class="cbt">Potwierdzam, że notatka nie zawiera danych szczególnych z art. 9 RODO (zdrowie, rodzina, wyznanie) i chcę ją zapisać w tej treści</span>
            </label>
          </div>

          <div class="n-fields">
            <div role="radiogroup" aria-labelledby="l-krit" {...invalid("criterion_id", e)}>
              <span class="lbl" id="l-krit">Kryterium</span>
              <FieldError id="criterion_id" errors={e} />
              {props.groups.map((g, gi) => (
                <>
                  {props.groups.length > 1 ? <p class="cap nf-group">{g.label}</p> : null}
                  <div class="chips">
                    {g.ids.map((id, i) => (
                      <label class="chip">
                        <input type="radio" name="criterion_id" value={id} id={gi === 0 && i === 0 ? "criterion_id" : undefined} checked={v.criterion_id === id} />
                        <span><svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{allCriteria().find((c) => c.id === id)?.name ?? id}</span>
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
                <SuggestionHint suggestion={props.suggestion ?? null} checked={v.task_change} />
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
