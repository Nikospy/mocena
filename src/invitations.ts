// Zaproszenia na rozmowy (S-16): zdarzenia `invitation_sent` i `invitation_confirmed`. Zaproszenie to wygoda stron, nie wymóg przepisu.
import { openCycle, type Cycle } from "./cycles";
import { addDays, criteriaTalkDeadline } from "./engine/deadlines";
import { rules } from "./engine/rules";
import { visibleEvents, type AppEvent } from "./events";
import { nameForm } from "./hr-partner/partner";
import type { Person } from "./people";
import { personById } from "./people";

export type InvitationKind = "opening" | "assessment";

export const INVITATION_KINDS: Record<InvitationKind, { title: string; invitationTitle: string; basis: string; topics: string[]; cardPath: string }> = {
  opening: {
    title: "Rozmowa o kryteriach oceny",
    invitationTitle: "Zaproszenie na rozmowę o kryteriach",
    basis: rules.criteriaConversation.basis,
    topics: rules.criteriaConversation.topics,
    cardPath: "cards/opening",
  },
  assessment: {
    title: "Rozmowa oceniająca",
    invitationTitle: "Zaproszenie na rozmowę oceniającą",
    basis: rules.assessmentConversation.basis,
    topics: rules.assessmentConversation.topics,
    cardPath: "cards/assessment-conversation",
  },
};

export const parseKind = (s: unknown): InvitationKind | null => (s === "opening" || s === "assessment" ? s : null);

export type Invitation = {
  id: number;
  kind: InvitationKind;
  date: string;
  time: string;
  place: string;
  note: string;
  sentOn: string;
  confirmedOn: string | null;
};

function toInvitation(sent: AppEvent, events: AppEvent[]): Invitation {
  const conf = events.find((e) => e.type === "invitation_confirmed" && e.payload?.invitation_id === sent.id);
  const p = sent.payload;
  return { id: sent.id, kind: p.kind, date: p.date, time: p.time, place: p.place, note: p.note ?? "", sentOn: sent.date, confirmedOn: conf?.date ?? null };
}

/** Aktywne jest najnowsze `invitation_sent` danego rodzaju; nowsze unieważnia poprzednie. */
export function activeInvitations(cycleId: string): Invitation[] {
  const events = visibleEvents(cycleId);
  const out: Invitation[] = [];
  for (const kind of ["opening", "assessment"] as const) {
    const sent = events.filter((e) => e.type === "invitation_sent" && e.payload?.kind === kind).pop();
    if (sent) out.push(toInvitation(sent, events));
  }
  return out;
}

/** `null`, gdy nie ma takiego zaproszenia; `active: false`, gdy zastąpiło je nowsze. */
export function invitationById(cycleId: string, eventId: number): { invitation: Invitation; active: boolean } | null {
  const events = visibleEvents(cycleId);
  const sent = events.find((x) => x.id === eventId && x.type === "invitation_sent");
  if (!sent) return null;
  const invitation = toInvitation(sent, events);
  return { invitation, active: activeInvitations(cycleId).some((i) => i.id === eventId) };
}

/** Wysłać może tylko bieżący oceniający otwartego cyklu. */
export function canInvite(viewer: Person, cycle: Cycle): boolean {
  return viewer.id === cycle.appraiser_id && openCycle(cycle.person_id)?.id === cycle.id;
}

export const isParty = (cycle: Cycle, p: Person) => p.id === cycle.appraiser_id || p.id === cycle.person_id;

export type InvitationInput = { kind: InvitationKind; date: string; time: string; place: string; note: string };
export type InvitationErrors = Partial<Record<"date" | "time" | "place" | "note", string>>;

function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  try {
    return addDays(s, 0) === s;
  } catch {
    return false;
  }
}

export function validateInvitation(v: InvitationInput): InvitationErrors {
  const e: InvitationErrors = {};
  if (!validDate(v.date)) e.date = "Wybierz datę rozmowy z kalendarza.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time)) e.time = "Podaj godzinę, na przykład 10:00.";
  if (!v.place) e.place = "Podaj miejsce, na przykład „pokój 214” albo „wideo”.";
  else if (v.place.length > 120) e.place = "Miejsce może mieć najwyżej 120 znaków.";
  if (v.note.length > 500) e.note = "Wiadomość może mieć najwyżej 500 znaków.";
  return e;
}

/** Granica z § 7 dla rozmowy o kryteriach; `null` dla rozmowy oceniającej. */
export function criteriaTalkLimit(cycle: Cycle): string | null {
  const started = visibleEvents(cycle.id).filter((e) => e.type === "cycle_started").pop()?.payload;
  return criteriaTalkDeadline(started?.previousAssessmentOn ?? started?.periodStart ?? cycle.period_start, started?.previousOutcome === "negative");
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

export const shortDate = (iso: string): string => `${Number(iso.slice(8, 10))}.${Number(iso.slice(5, 7))}`;

export function invitationHeadline(i: Invitation): string {
  const [y, m, d] = i.date.split("-");
  return `${INVITATION_KINDS[i.kind].invitationTitle}: ${d}.${m}.${y}, ${i.time}, ${i.place}`;
}

/** „Wysłane 9.12, czeka na potwierdzenie” albo „Potwierdzone przez Piotra 9.12”. */
export function invitationStatus(i: Invitation, cycle: Cycle): string {
  if (!i.confirmedOn) return `Wysłane ${shortDate(i.sentOn)}, czeka na potwierdzenie`;
  const name = personById(cycle.person_id)?.name ?? "";
  return `Potwierdzone przez ${nameForm(name, "gen") ?? name} ${shortDate(i.confirmedOn)}`;
}

/**
 * Odnośnik `mailto:` z gotowym tematem i treścią zaproszenia. Bez adresu: system nie przechowuje adresów e-mail,
 * odbiorcę wybiera oceniający w swoim programie pocztowym. Nic się nie wysyła bez jego kliknięcia.
 */
export function invitationMailto(i: Invitation, personName: string, senderName: string): string {
  const k = INVITATION_KINDS[i.kind];
  const [y, m, d] = i.date.split("-");
  const subject = `${k.title}: ${personName}, ${d}.${m}.${y}, godz. ${i.time}`;
  const body = [
    "Dzień dobry,",
    "",
    `zapraszam na rozmowę: ${k.title.toLowerCase()}.`,
    `Termin: ${d}.${m}.${y}, godz. ${i.time}`,
    `Miejsce: ${i.place}`,
    "",
    `Tematy rozmowy (${k.basis}):`,
    ...k.topics.map((t) => `- ${t}`),
    ...(i.note ? ["", i.note] : []),
    "",
    "Proszę o potwierdzenie terminu w mOcenie. Tam jest też plik do kalendarza.",
    "",
    senderName,
  ].join("\r\n");
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
