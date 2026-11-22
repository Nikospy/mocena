import type { Child } from "hono/jsx";
import type { Person } from "../people";

const ROLES: Record<Person["role"], string> = {
  appraiser: "oceniający",
  employee: "pracownik",
  hr: "kadry",
  admin: "administrator",
};

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function Layout(props: { title: string; person: Person | null; today: string | null; children?: Child }) {
  const { person } = props;
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
      <body>
        <header class="top">
          <div class="top-in">
            <a class="brand" href="/">
              <b>m</b>Ocena
            </a>
            <nav class="nav" aria-label="Główna">
              <a href="/">Strona główna</a>
              <a href="/account">Zmień konto</a>
            </nav>
            <div class="who">
              {person ? (
                <p>
                  <b>{person.name}</b> · {ROLES[person.role]}
                </p>
              ) : null}
              {props.today ? (
                <form method="post" action="/demo/date" class="date-switch">
                  <label>
                    <span>Data systemowa: {formatDate(props.today)}</span>
                    <input type="date" name="date" min={props.today} required aria-label="Nowa data systemowa" />
                  </label>
                  <button class="btn text" type="submit">
                    Przesuń datę
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </header>
        <main class="wrap">{props.children}</main>
      </body>
    </html>
  );
}
