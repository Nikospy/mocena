import type { Child } from "hono/jsx";
import { roleLabel, type Person } from "../people";
import { currentTour } from "../tour/context";
import { stopById, stopScreenPath } from "../tour/stops";
import { TourPanel } from "./tour-panel";

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

const MONTHS = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

/** „2024-12-09” → „9 grudnia 2024”. */
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

export function Layout(props: { title: string; person: Person | null; today: string | null; children?: Child }) {
  const { person } = props;
  const tour = currentTour();
  const tourStop = tour.stop && !tour.path.startsWith("/tour") ? stopById(tour.stop) : null;
  return (
    <html lang="pl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title} · mOcena</title>
        <link rel="stylesheet" href="/rodzina.css" />
        <link rel="stylesheet" href="/style.css" />
        <link rel="stylesheet" href="/print.css" media="print" />
      </head>
      <body class={tourStop ? "tour-on" : undefined}>
        <header class="top">
          <div class="top-in">
            <a class="brand" href="/">
              <b>m</b>Ocena
            </a>
            <nav class="nav" aria-label="Główna">
              <a href="/">Strona główna</a>
              <a href="/account">Zmień konto</a>
              {person ? <a href="/tour">Pokaz dla jury</a> : null}
            </nav>
            <p class="who">
              {person ? (
                <>
                  <b>{person.name}</b> · {roleLabel(person)}
                  <br />
                </>
              ) : null}
              {props.today ? formatDateLong(props.today) : null}
            </p>
          </div>
        </header>
        {props.today && !tourStop ? (
          <form method="post" action="/demo/date" class="demo-bar">
            <b>Pokaz</b>
            <label>
              <span>Przesuń datę systemową</span>
              <input type="date" name="date" value={props.today} min={props.today} required aria-label="Nowa data systemowa" />
            </label>
            <button class="btn text" type="submit">
              Przesuń datę
            </button>
          </form>
        ) : null}
        <main class="wrap">{props.children}</main>
        {tourStop ? (
          <>
            <TourPanel stop={tourStop} screenPath={stopScreenPath(tourStop)} onScreen={tour.path === stopScreenPath(tourStop)} dateLabel={formatDateLong(tourStop.date)} dateOf={formatDateLong} />
            <script src="/tour.js" defer />
          </>
        ) : null}
      </body>
    </html>
  );
}
