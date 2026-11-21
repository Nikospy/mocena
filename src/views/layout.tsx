import type { Child } from "hono/jsx";
import type { Person } from "../people";

const ROLES: Record<Person["role"], string> = {
  appraiser: "oceniający",
  employee: "pracownik",
  hr: "kadry",
  admin: "administrator",
};

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
  return (
    <html lang="pl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title} · mOcena</title>
        <link rel="stylesheet" href="/rodzina.css" />
        <link rel="stylesheet" href="/style.css" />
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
            <p class="who">
              {person ? (
                <>
                  <b>{person.name}</b> · {ROLES[person.role]}
                  <br />
                </>
              ) : null}
              {props.today ? formatDateLong(props.today) : null}
            </p>
          </div>
        </header>
        {props.today ? (
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
      </body>
    </html>
  );
}
