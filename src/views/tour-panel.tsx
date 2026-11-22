import { personGenitive, personLabel, stopById, type StopContent } from "../tour/stops";

const ARROW = <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const BACK = <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;

export type TourPanelProps = {
  stop: StopContent;
  screenPath: string;
  onScreen: boolean;
  /** „21 listopada 2026”. */
  dateLabel: string;
  dateOf: (iso: string) => string;
};

function nextHint(p: TourPanelProps): string {
  if (p.stop.next === "done") return "Następny krok: podsumowanie pokazu";
  const n = stopById(p.stop.next);
  if (!n) return "";
  return `Następny krok: konto ${personGenitive(n.personId)}, ${p.dateOf(n.date)}`;
}

function Head(props: TourPanelProps) {
  const { stop } = props;
  return (
    <div class="gp-h">
      <div class="row">
        <b>Krok {stop.step} z 5</b>
        <form method="post" action="/tour/end">
          <button class="btn text gp-end" type="submit">Zakończ pokaz</button>
        </form>
      </div>
      <ol class="g-dots" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <li class={n < stop.step ? "done" : n === stop.step ? "cur" : ""} />
        ))}
      </ol>
      <div class="acct">
        <span>{personLabel(stop.personId)}</span>
        <span>{props.dateLabel}</span>
      </div>
    </div>
  );
}

function Body(props: TourPanelProps & { withSelectors: boolean }) {
  const { stop } = props;
  return (
    <div class="gp-b">
      <h2>{stop.title}</h2>
      <p>{stop.lead}</p>
      <p class="lbl">Na co patrzeć</p>
      <ol class="g-look">
        {stop.look.map((l, i) => (
          <li data-look-selector={props.withSelectors ? l.selector : undefined} data-look-n={props.withSelectors ? String(i + 1) : undefined}>
            <span class="g-num" aria-hidden="true">{i + 1}</span>
            <span>{l.text}</span>
          </li>
        ))}
      </ol>
      {stop.tryIt ? (
        <>
          <p class="lbl">Spróbuj</p>
          <p class="g-try">{stop.tryIt}</p>
        </>
      ) : null}
      {stop.note ? <p class="cap">{stop.note}</p> : null}
      {stop.basis ? (
        <span class="basis">
          <span class="pg" aria-hidden="true">§</span>
          <span class="art">{stop.basis.art}</span>
          <span class="ver">{stop.basis.ver}</span>
        </span>
      ) : null}
      {!props.onScreen ? (
        <a class="btn text" href={props.screenPath}>Wróć do ekranu kroku</a>
      ) : null}
      {props.withSelectors ? null : (
        <form method="post" action="/tour/end">
          <button class="btn text" type="submit">Zakończ pokaz</button>
        </form>
      )}
    </div>
  );
}

function NextForm(props: { stop: StopContent; compact?: boolean }) {
  const { stop } = props;
  const label = stop.short;
  const inner = (
    <>
      <span>Dalej<span class="long">: {label}</span></span>
      {ARROW}
    </>
  );
  return stop.next === "done" ? (
    <form method="get" action="/tour/done" data-tour-next>
      <button class="btn primary" type="submit">{inner}</button>
    </form>
  ) : (
    <form method="post" action={`/tour/${stop.next}`} data-tour-next>
      <button class="btn primary" type="submit">{inner}</button>
    </form>
  );
}

function PrevForm(props: { stop: StopContent }) {
  const { stop } = props;
  if (!stop.prev) return <span />;
  return (
    <form method="post" action={`/tour/${stop.prev}`} data-tour-prev>
      <button class="btn text" type="submit">{BACK}Wstecz</button>
    </form>
  );
}

export function TourPanel(props: TourPanelProps) {
  const hint = nextHint(props);
  return (
    <>
      <aside class="gpanel" id="tour-guide" tabindex={-1} aria-label="Przewodnik pokazu">
        <Head {...props} />
        <Body {...props} withSelectors />
        <div class="gp-f">
          <PrevForm stop={props.stop} />
          <NextForm stop={props.stop} />
          <small>{hint}</small>
        </div>
      </aside>
      <aside class="gmob" id="tour-guide-m" tabindex={-1} aria-label="Przewodnik pokazu (telefon)">
        <details data-gmob>
          <summary>
            <span class="gm-t">{props.stop.title}</span>
            <span class="gm-s">Krok {props.stop.step} z 5 · {personLabel(props.stop.personId)} · {props.dateLabel}</span>
          </summary>
          <Body {...props} withSelectors={false} />
        </details>
        <div class="gm-bar">
          <PrevForm stop={props.stop} />
          <NextForm stop={props.stop} />
        </div>
      </aside>
    </>
  );
}

