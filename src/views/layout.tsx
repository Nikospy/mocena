import type { Child } from "hono/jsx";
import { DEMO_DIRECTOR_GENERAL_ID, roleLabel, type Person } from "../people";
import { isDemoMode } from "../settings";
import { currentTour } from "../tour/context";
import { stopById, stopScreenPath } from "../tour/stops";
import { Head } from "./head";
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

type NavItem = { label: string; href: string; icon: Child; section?: (path: string) => boolean };

const I = (d: Child) => (
  <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
    {d}
  </svg>
);
const ICON = {
  tasks: I(<><path d="M4 13l2.5-7h11L20 13v5.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M4 13h4.5l1 2h5l1-2H20" /></>),
  notes: I(<><path d="M6 3.5h8.5L19 8v12.5H6z" /><path d="M14 3.5V8h5M9 12.5h7M9 16h5" /></>),
  history: I(<><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4.5V9h4.5M12 8v4l3 2" /></>),
  feedback: I(<path d="M4.5 5.5h15v10h-8L7 19v-3.5H4.5z" />),
  cycles: I(<path d="M4 20h16M7 16v-5M12 16V6M17 16V9" />),
  people: I(<><circle cx="9" cy="8.5" r="3.25" /><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 5.5a3 3 0 0 1 0 6M17.5 14.8c1.6.6 2.6 2.1 3 4.7" /></>),
  swap: I(<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />),
  sources: I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.75v.01" /></>),
};
const CHEVRON = (
  <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const SWITCH = (
  <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14M10 8l4 4-4 4M14 12H4.5" />
  </svg>
);

const under = (...prefixes: string[]) => (path: string) => prefixes.some((p) => path.startsWith(p));

/** Miejsca usługi właściwe dla roli: tylko ekrany, które ta rola może otworzyć. */
export function navFor(person: Person): NavItem[] {
  if (person.role === "hr")
    return [
      { label: "Stan cykli", href: "/hr", icon: ICON.cycles, section: under("/cycles/", "/hr/export") },
      { label: "Pracownicy", href: "/hr/people", icon: ICON.people, section: under("/hr/people/", "/people/") },
      { label: "Zastępstwa", href: "/hr/substitutions", icon: ICON.swap },
    ];
  if (person.role === "admin")
    return [
      { label: "Źródła podpowiedzi", href: "/admin/suggestion-sources", icon: ICON.sources },
      { label: "Pracownicy", href: "/hr/people", icon: ICON.people, section: under("/hr/people/") },
    ];
  if (person.role === "appraiser")
    return [
      { label: "Sprawy", href: "/", icon: ICON.tasks, section: (p) => p.startsWith("/cycles/") || (p.startsWith("/people/") && !p.endsWith("/notes/new")) },
      { label: "Notatki", href: "/notes", icon: ICON.notes, section: (p) => p.startsWith("/notes/") || p.endsWith("/notes/new") },
      ...(person.id === DEMO_DIRECTOR_GENERAL_ID ? [{ label: "Statystyki", href: "/office/statistics", icon: ICON.cycles }] : []),
    ];
  return [
    { label: "Sprawy", href: "/", icon: ICON.tasks, section: under("/cycles/") },
    { label: "Historia ocen", href: `/people/${person.id}/history`, icon: ICON.history },
    { label: "Informacja zwrotna", href: "/feedback", icon: ICON.feedback },
  ];
}

function current(item: NavItem, path: string): "page" | "true" | undefined {
  if (path === item.href) return "page";
  return item.section?.(path) ? "true" : undefined;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

function UserMenu(props: { person: Person }) {
  const p = props.person;
  const role = roleLabel(p);
  return (
    <details class="user">
      <summary aria-label={`${p.name}, ${role}: menu konta`}>
        <span class="avatar" aria-hidden="true">{initials(p.name)}</span>
        <span class="user-id">
          <b>{p.name}</b>
          <span>{role}</span>
        </span>
        {CHEVRON}
      </summary>
      <div class="user-menu">
        <p class="user-card">
          <b>{p.name}</b>
          <span>{[role, p.position_title].filter(Boolean).join(" · ")}</span>
          {p.unit ? <span>{p.unit}</span> : null}
        </p>
        <a class="user-act" href="/account">
          {SWITCH}
          Zmień konto
        </a>
      </div>
    </details>
  );
}

/** Pasek pokazu: poza usługą, jedna linia; zmiana daty rozwija się po kliknięciu. */
function DemoBar(props: { today: string; withTour: boolean }) {
  const tourLink = props.withTour ? <a href="/tour">Pokaz dla jury</a> : null;
  return (
    <aside aria-label="Pokaz" class="demo">
      <div class="demo-in">
        <details class="demo-date">
          <summary>
            <span class="demo-line">
              <b>Pokaz</b> <span aria-hidden="true">·</span> dziś {formatDateLong(props.today)} <span aria-hidden="true">·</span>
            </span>
            <span class="demo-change">Zmień datę</span>
          </summary>
          <form method="post" action="/demo/date" class="demo-form">
            <label>
              <span>Przesuń datę systemową na</span>
              <input type="date" name="date" value={props.today} min={props.today} required aria-label="Nowa data systemowa" />
            </label>
            <button class="btn text" type="submit">
              Przesuń datę
            </button>
            {tourLink ? <span class="demo-tour-m">{tourLink}</span> : null}
          </form>
        </details>
        {tourLink ? <span class="demo-tour">{tourLink}</span> : null}
      </div>
    </aside>
  );
}

export function Layout(props: { title: string; person: Person | null; today: string | null; children?: Child }) {
  const { person } = props;
  const tour = currentTour();
  const demo = isDemoMode();
  const tourStop = demo && tour.stop && !tour.path.startsWith("/tour") ? stopById(tour.stop) : null;
  const nav = person ? navFor(person) : [];
  return (
    <html lang="pl">
      <Head title={props.title} printCss />
      <body class={tourStop ? "tour-on" : undefined}>
        <a class="skip-link" href="#main">Przejdź do treści</a>
        {tourStop ? <a class="skip-link" href="#tour-guide" data-skip-guide>Przejdź do przewodnika</a> : null}
        {demo && props.today && !tourStop ? <DemoBar today={props.today} withTour={!!person} /> : null}
        <header class="top">
          <div class="top-in">
            <a class="brand" href="/">
              <span class="brand-mark">
                <b>m</b>Ocena
              </span>
              <span class="brand-desc">Asystent ocen okresowych w służbie cywilnej</span>
            </a>
            {nav.length ? (
              <nav class="nav" aria-label="Usługa">
                {nav.map((item) => (
                  <a href={item.href} aria-current={current(item, tour.path)}>
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            ) : null}
            {person ? <UserMenu person={person} /> : null}
          </div>
        </header>
        <main class={nav.length ? "wrap has-nav" : "wrap"} id="main">{props.children}</main>
        <footer class={nav.length ? "foot has-nav" : "foot"}>
          <div class="foot-in">
            <a href="/about">Wdrożenie i dane</a>
            <a href="https://github.com/Nikospy/mocena">Kod źródłowy</a>
          </div>
        </footer>
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
