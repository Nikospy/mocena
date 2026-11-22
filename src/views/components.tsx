import type { Child } from "hono/jsx";
import { rulesVersionLabel } from "../engine/rules";
import { formatDate } from "./layout";

/** Wersja zasad po ludzku („Zasady z rozporządzenia z 2016 r., wersja 1”); identyfikator zostaje w `title`. */
export function RulesVersion(props: { version: string; effectiveFrom?: string; href?: string }) {
  const title = `Identyfikator wersji: ${props.version}`;
  const label = rulesVersionLabel(props.version);
  return (
    <>
      {props.href ? <a href={props.href} title={title}>{label}</a> : <span title={title}>{label}</span>}
      {props.effectiveFrom ? `, obowiązują od ${formatDate(props.effectiveFrom)}` : null}
    </>
  );
}

/** Dopisek z przepisem przy dacie albo wartości. */
export function LegalBasis(props: { basis: string | string[] }) {
  const list = (Array.isArray(props.basis) ? props.basis : [props.basis]).filter((b) => b.trim());
  if (!list.length) return null;
  const text = list.join(", ");
  return (
    <span class="basis">
      <span class="art">{text}</span>
    </span>
  );
}
export type ConfirmationBlockProps =
  | { kind: "confirmation"; name?: string; place?: string; date?: string }
  | { kind: "fiction"; name: string; reason: string; deliveryMethod: string; deliveredOn: string; date: string };

/** Czysty komponent widoku: linia potwierdzenia w systemie albo wpis o fikcji zapoznania. */
export function ConfirmationBlock(props: ConfirmationBlockProps) {
  if (props.kind === "fiction") {
    return (
      <div class="st info">
        <div>
          <b>Zapoznanie uznane za dokonane: {props.name}</b>
          <small>Przyczyna: {props.reason}</small>
          <small>Sposób doręczenia: {props.deliveryMethod}</small>
          <small>Dzień doręczenia: {formatDate(props.deliveredOn)}</small>
          <small>Data wpisu: {formatDate(props.date)}</small>
        </div>
      </div>
    );
  }
  if (!props.name || !props.place || !props.date) return <p class="sign">Jeszcze niepotwierdzone</p>;
  return <p class="sign">Potwierdzenie w systemie: {props.place}, {formatDate(props.date)}, {props.name}</p>;
}

/**
 * Nagłówek strony: jeden wzór na wszystkich ekranach.
 * Linia kontekstu (czyja sprawa, jaki dokument), h1 z czynnością, jedno zdanie objaśnienia, jeden rząd odnośników tekstowych.
 * `aside` to miejsce na krótki stan po prawej (np. termin) – tylko gdy ekran go potrzebuje.
 */
export function PageHeader(props: { context?: Child; title: Child; lead?: Child; links?: Child; linksLabel?: string; aside?: Child; extra?: Child }) {
  return (
    <header class="page-h">
      <div class="page-h-main">
        {props.context ? <p class="page-ctx">{props.context}</p> : null}
        <h1>{props.title}</h1>
        {props.lead ? <p class="page-lead">{props.lead}</p> : null}
        {props.extra}
        {props.links ? (
          <nav class="page-links" aria-label={props.linksLabel ?? "Powiązane"}>
            {props.links}
          </nav>
        ) : null}
      </div>
      {props.aside ? <div class="page-h-aside">{props.aside}</div> : null}
    </header>
  );
}

/**
 * Błędy formularza (wzór: GOV.UK error summary i error message).
 * `FormErrors` to mapa: identyfikator pola → komunikat. Klucz bez pola na ekranie (np. „_”) daje wiersz bez odnośnika.
 * Użycie: <ErrorSummary errors={e} /> jako pierwszy element formularza, przy polu <FieldError id="text" errors={e} />
 * między etykietą a polem, a na polu {...invalid("text", e)} (aria-invalid i aria-describedby).
 */
export type FormErrors = Partial<Record<string, string | undefined>>;

const FIELD_FORMS = { one: "pole", few: "pola", many: "pól", other: "pola" } as const;
const pluralPl = new Intl.PluralRules("pl-PL");

function errorList(errors: FormErrors): [string, string][] {
  return Object.entries(errors).filter((e): e is [string, string] => typeof e[1] === "string" && e[1].trim() !== "");
}

/** Identyfikator komunikatu przy polu. */
export const errorId = (field: string) => `${field}-error`;

/** Atrybuty pola z błędem: aria-invalid i aria-describedby (komunikat błędu przed innymi opisami pola). */
export function invalid(field: string, errors: FormErrors | undefined, describedBy?: string): { "aria-invalid"?: "true"; "aria-describedby"?: string } {
  const has = !!errors?.[field]?.trim();
  const ids = [has ? errorId(field) : null, describedBy ?? null].filter(Boolean).join(" ");
  return { "aria-invalid": has ? "true" : undefined, "aria-describedby": ids || undefined };
}

/** Podsumowanie nad formularzem: tytuł z liczbą pól i odnośniki do pól. Dostaje fokus po załadowaniu strony. */
export function ErrorSummary(props: { errors: FormErrors | undefined; title?: string; lead?: Child; fields?: Record<string, string> }) {
  const list = errorList(props.errors ?? {});
  if (!list.length) return null;
  const n = list.length;
  const title = props.title ?? `Popraw ${n} ${FIELD_FORMS[pluralPl.select(n) as keyof typeof FIELD_FORMS] ?? "pola"}`;
  return (
    <div class="err-sum" role="alert" aria-labelledby="err-sum-title" tabindex={-1} autofocus data-error-summary>
      <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></svg>
      <div>
        <h2 id="err-sum-title">{title}</h2>
        {props.lead ? <p>{props.lead}</p> : null}
        <ul>
          {list.map(([field, message]) => {
            const target = props.fields?.[field] ?? field;
            return <li>{field.startsWith("_") ? message : <a href={`#${target}`}>{message}</a>}</li>;
          })}
        </ul>
      </div>
      <script src="/error-summary.js" defer></script>
    </div>
  );
}

/** Komunikat przy polu: stoi między etykietą a polem; czytnik słyszy go razem z polem (aria-describedby). */
export function FieldError(props: { id: string; errors?: FormErrors; message?: string }) {
  const message = props.message ?? props.errors?.[props.id];
  if (!message?.trim()) return null;
  return (
    <p class="field-err" id={errorId(props.id)}>
      <span class="vh">Błąd: </span>
      {message}
    </p>
  );
}
