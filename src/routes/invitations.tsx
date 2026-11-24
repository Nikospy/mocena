import { errorPage } from "../views/error-page";
import { isoFromInput } from "../date-input";
import { Hono, type Context } from "hono";
import { visibleCycleById, openCycle, type Cycle } from "../cycles";
import { part1Status } from "../cycles/part1";
import { registerCycleLinks } from "../cycle-links";
import { getDb } from "../db";
import { recordEvent, visibleEvents } from "../events";
import { registerHomeTasks, type HomeTask } from "../home-tasks";
import { buildIcs } from "../ics";
import {
  INVITATION_KINDS,
  activeInvitations,
  canInvite,
  criteriaTalkLimit,
  invitationById,
  invitationHeadline,
  invitationStatus,
  isParty,
  parseKind,
  validateInvitation,
  type InvitationErrors,
  type InvitationInput,
} from "../invitations";
import { rules } from "../engine/rules";
import { currentPerson, personById, type Person } from "../people";
import { today } from "../settings";
import { InvitationFormView, InvitationView } from "../views/invitation";


registerHomeTasks((person) => {
  const tasks: HomeTask[] = [];
  const now = today();
  // Oceniany: aktywne, niepotwierdzone zaproszenia do własnego otwartego cyklu.
  const mine = openCycle(person.id);
  if (mine) {
    for (const i of activeInvitations(mine.id)) {
      if (i.confirmedOn || i.date < now) continue;
      tasks.push({
        title: invitationHeadline(i),
        href: `/cycles/${mine.id}/invitations/${i.id}`,
        detail: `${INVITATION_KINDS[i.kind].topics.length} tematy z przepisu (${INVITATION_KINDS[i.kind].basis}). Pełna lista w zaproszeniu.`,
        action: "Otwórz zaproszenie",
        post: { label: "Potwierdzam termin", action: `/cycles/${mine.id}/invitations/${i.id}/confirm` },
        secondary: { label: "Pobierz do kalendarza", href: `/cycles/${mine.id}/invitations/${i.id}.ics` },
      });
    }
  }
  // Oceniający: stan zaproszeń, które jeszcze nic nie zamknęło.
  if (person.role === "appraiser") {
    const ids = getDb().query("SELECT DISTINCT person_id FROM cycles WHERE appraiser_id = ?").all(person.id) as { person_id: string }[];
    for (const { person_id } of ids) {
      const cycle = openCycle(person_id);
      if (!cycle || !canInvite(person, cycle)) continue;
      for (const i of activeInvitations(cycle.id)) {
        if (i.date < now) continue;
        tasks.push({
          title: `${INVITATION_KINDS[i.kind].invitationTitle}: ${personById(person_id)?.name}`,
          person: personById(person_id)?.name,
          detail: invitationStatus(i, cycle),
          href: `/cycles/${cycle.id}/invitations/${i.id}`,
          action: "Otwórz zaproszenie",
          quiet: !!i.confirmedOn,
        });
      }
    }
  }
  return tasks;
});

registerCycleLinks((cycle, person) => {
  if (!canInvite(person, cycle)) return [];
  const links = [{ label: "Zaproś na rozmowę o kryteriach", href: `/cycles/${cycle.id}/invitations/new?kind=opening` }];
  if (part1Status(cycle.id, { currentRound: true }).state === "confirmed") {
    links.push({ label: "Zaproś na rozmowę oceniającą", href: `/cycles/${cycle.id}/invitations/new?kind=assessment` });
  }
  return links;
});

const app = new Hono();

type Ctx = { viewer: Person; cycle: Cycle };

function guard(c: Context, access: "send" | "party"): Response | Ctx {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  const cycle = visibleCycleById(c.req.param("id") ?? "");
  if (!cycle) return errorPage(c, "Nie ma takiego cyklu oceny. Wybierz sprawę z listy.", 404);
  if (access === "send") {
    if (!canInvite(viewer, cycle)) return errorPage(c, "Zaproszenie wysyła oceniający otwartego cyklu.", 403);
  } else if (!isParty(cycle, viewer)) return errorPage(c, "Zaproszenie widzą oceniany i jego oceniający, a w czasie zastępstwa także zastępca oceniającego.", 403);
  return { viewer, cycle };
}

function renderForm(c: Context, cx: Ctx, values: InvitationInput, errors: InvitationErrors = {}, status: 200 | 422 = 200) {
  const limit = values.kind === "opening" ? criteriaTalkLimit(cx.cycle) : null;
  const started = visibleEvents(cx.cycle.id).findLast((event) => event.type === "cycle_started");
  const limitRule = started?.payload.previousOutcome === "negative"
    ? rules.deadlines.criteriaTalkAfterNegativeDays
    : rules.deadlines.criteriaTalkDays;
  return c.html(
    <InvitationFormView
      viewer={cx.viewer}
      today={today()}
      cycleId={cx.cycle.id}
      personName={personById(cx.cycle.person_id)?.name ?? cx.cycle.person_id}
      values={values}
      errors={errors}
      limit={limit}
      limitBasis={limitRule.basis}
    />,
    status,
  );
}

app.get("/cycles/:id/invitations/new", (c) => {
  const g = guard(c, "send");
  if (g instanceof Response) return g;
  const kind = parseKind(c.req.query("kind"));
  if (!kind) return errorPage(c, "Nie ma takiej rozmowy. Wybierz rozmowę o kryteriach albo rozmowę oceniającą.", 404);
  const prev = activeInvitations(g.cycle.id).find((i) => i.kind === kind);
  return renderForm(c, g, { kind, date: prev?.date ?? "", time: prev?.time ?? "", place: prev?.place ?? "", note: prev?.note ?? "" });
});

app.post("/cycles/:id/invitations", async (c) => {
  const g = guard(c, "send");
  if (g instanceof Response) return g;
  const body = await c.req.parseBody();
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const kind = parseKind(str("kind"));
  if (!kind) return errorPage(c, "Nie ma takiej rozmowy. Wybierz rozmowę o kryteriach albo rozmowę oceniającą.", 422);
  const values: InvitationInput = { kind, date: isoFromInput(str("date")), time: str("time"), place: str("place"), note: str("note") };
  const errors = validateInvitation(values);
  if (Object.keys(errors).length) return renderForm(c, g, values, errors, 422);
  const id = recordEvent("invitation_sent", g.cycle.id, g.viewer.id, values);
  return c.redirect(`/cycles/${g.cycle.id}/invitations/${id}`, 303);
});

app.get("/cycles/:id/invitations/:eventId{[0-9]+}", (c) => {
  const g = guard(c, "party");
  if (g instanceof Response) return g;
  const found = invitationById(g.cycle.id, Number(c.req.param("eventId")));
  if (!found?.active) return errorPage(c, "Nie ma takiego zaproszenia albo zostało zastąpione nowszym.", 404);
  const invitation = found.invitation;
  return c.html(<InvitationView viewer={g.viewer} today={today()} cycle={g.cycle} invitation={invitation} personName={personById(g.cycle.person_id)?.name ?? ""} />);
});

app.post("/cycles/:id/invitations/:eventId{[0-9]+}/confirm", (c) => {
  const g = guard(c, "party");
  if (g instanceof Response) return g;
  if (g.viewer.id !== g.cycle.person_id) return errorPage(c, "Termin potwierdza oceniany.", 403);
  const id = Number(c.req.param("eventId"));
  const found = invitationById(g.cycle.id, id);
  if (!found?.active) return errorPage(c, "Nie ma takiego zaproszenia albo zostało zastąpione nowszym.", 404);
  const invitation = found.invitation;
  if (!invitation.confirmedOn) recordEvent("invitation_confirmed", g.cycle.id, g.viewer.id, { invitation_id: id, kind: invitation.kind });
  return c.redirect(`/cycles/${g.cycle.id}/invitations/${id}`, 303);
});

app.get("/cycles/:id/invitations/:eventId{[0-9]+\\.ics}", (c) => {
  const g = guard(c, "party");
  if (g instanceof Response) return g;
  const id = Number(c.req.param("eventId").replace(/\.ics$/, ""));
  const found = invitationById(g.cycle.id, id);
  // Odnośnik do pliku otwiera człowiek w przeglądarce: brak zaproszenia to strona 404, nie goły tekst.
  if (!found) return errorPage(c, "Nie ma takiego zaproszenia. Pobierz plik z aktualnego zaproszenia.", 404);
  // Zastąpione zaproszenie też da się pobrać: dane są w zdarzeniu.
  const sent = found.invitation;
  const k = INVITATION_KINDS[sent.kind];
  const name = personById(g.cycle.person_id)?.name ?? "";
  const ics = buildIcs({
    uid: `invitation-${id}@mocena.local`,
    summary: `${k.title}: ${name}`,
    description: `Tematy rozmowy (${k.basis}): ${k.topics.join("; ")}${sent.note ? `\n${sent.note}` : ""}`,
    location: sent.place,
    date: sent.date,
    time: sent.time,
    stampDate: sent.sentOn,
  });
  return c.body(ics, 200, { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="rozmowa-${id}.ics"` });
});

export default app;
