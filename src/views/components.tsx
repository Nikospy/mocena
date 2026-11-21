import { formatDate } from "./layout";

/** Dopisek z przepisem przy dacie albo wartości. */
export function LegalBasis(props: { basis: string | string[] }) {
  const text = Array.isArray(props.basis) ? props.basis.join(", ") : props.basis;
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
