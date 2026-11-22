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
