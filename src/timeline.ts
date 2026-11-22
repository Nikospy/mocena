import { actsAsAppraiser } from "./substitutions";
// Oś czasu cyklu oceny: fakty z widocznych wpisów i terminy wyliczone z przepisów (te widać także w przyszłości).
import { registerCycleLinks } from "./cycle-links";
import { cycleById, cycleDeadlineDetails, openCycle, visibleAbsences, type Cycle } from "./cycles";
import { part1DeadlinesAfterObjection } from "./cycles/part1";
import { romanGrade } from "./engine/grades";
import { OBJECTION_OUTCOME_TEXT } from "./assessment/state";
import { rules, rulesVersion } from "./engine/rules";
import { visibleEvents } from "./events";
import { personById, type Person } from "./people";
import { formatDate } from "./views/layout";
import { invitationHeadline } from "./invitations";

export type TimelineEntry = {
  date: string;
  title: string;
  detail?: string;
  basis: string[];
  kind: "fact" | "deadline";
  /** Termin bazowy pokazywany przekreślony obok nowego terminu. */
  struck?: string;
  /** Odnośnik do dokumentu (pismo o zmianie terminu). */
  href?: string;
};

/** Oceniany, obecny oceniający i kadry; inni nie. */
export function canViewTimeline(viewer: Person, cycle: Cycle): boolean {
  return viewer.id === cycle.person_id || actsAsAppraiser(cycle.appraiser_id, viewer.id) || viewer.role === "hr";
}

/** Zapis nieobecności: tylko kadry i tylko dla cyklu, który jest otwarty. */
export function canRecordAbsence(viewer: Person, cycle: Cycle): boolean {
  return viewer.role === "hr" && openCycle(cycle.person_id)?.id === cycle.id;
}

export function formatRange(from: string, to: string): string {
  return `${formatDate(from)}–${formatDate(to)}`;
}

const EXTENDS = `${rules.deadlines.longAbsenceOverMonths.basis}`;

/** Pierwszy wpis osi: dzień, od którego liczy się termin oceny (art. 81 ust. 4 albo ust. 9 ustawy). */
function startEntry(cycleId: string, periodStart: string, kind: string): TimelineEntry {
  const p = visibleEvents(cycleId).filter((e) => e.type === "cycle_started" || e.type === "previous_assessment_recorded").pop()?.payload ?? {};
  if (kind === "after_negative") {
    return { date: periodStart, title: "Zapoznanie z oceną negatywną: od niego liczy się termin ponownej oceny", basis: [rules.deadlines.reassessmentAfterNegativeMonths.basis], kind: "fact" };
  }
  const basis = [rules.deadlines.assessmentEveryMonths.basis];
  if (p.previousAssessmentOn) return { date: periodStart, title: "Poprzednia ocena: od niej liczy się termin 24 miesięcy", basis, kind: "fact" };
  return { date: periodStart, title: "Początek cyklu: od tego dnia liczy się termin 24 miesięcy", basis, kind: "fact" };
}

export function buildTimeline(cycleId: string, viewer: Person): TimelineEntry[] {
  const cycle = cycleById(cycleId);
  if (!cycle) throw new Error(`Brak cyklu ${cycleId}`);
  const full = actsAsAppraiser(cycle.appraiser_id, viewer.id) || viewer.role === "hr";
  const events = visibleEvents(cycleId);
  const approved = events.find((e) => e.type === "assessment_approved");
  const details = cycleDeadlineDetails(cycleId);
  const entries: TimelineEntry[] = [startEntry(cycleId, cycle.period_start, details.kind)];
  if (full) {
    const rows = visibleAbsences(cycle.person_id);
    const recordedAfterApproval = (id: number, recordedOn: string): boolean => {
      if (!approved) return false;
      const ev = events.find((e) => e.type === "absence_recorded" && e.payload.absence_id === id);
      return ev ? ev.date > approved.date || (ev.date === approved.date && ev.id > approved.id) : recordedOn > approved.date;
    };
    for (const m of details.merged) {
      const late = m.parts.some((p) => rows.some((r) => r.id === p.id && recordedAfterApproval(r.id, r.recorded_on)));
      const sentences: string[] = [];
      if (m.parts.length > 1) sentences.push(`${m.parts.length === 2 ? "Dwa wpisy liczą się" : m.parts.length < 5 ? `${m.parts.length} wpisy liczą się` : `${m.parts.length} wpisów liczy się`} jako jedna nieobecność, bo dzielą je tylko dni wolne.`);
      if (late) sentences.push("Ocena jest już zatwierdzona, jej termin się nie zmienia.");
      else if (details.kind === "after_negative") sentences.push("Nie przedłuża terminu ponownej oceny.");
      else if (m.counted) sentences.push(`Nieobecność dłużej niż miesiąc: termin oceny przedłuża się o ${m.days} dni.`);
      else if (m.longerThanMonth) sentences.push("Dłużej niż miesiąc, ale poza okresem, który zmienia termin: termin bez zmian.");
      else sentences.push("Nie dłużej niż miesiąc: termin bez zmian.");
      entries.push({
        date: m.from,
        title: `Nieobecność ${formatRange(m.from, m.to)} (${m.days === 1 ? "1 dzień" : `${m.days} dni`})`,
        detail: sentences.join(" "),
        basis: [EXTENDS],
        kind: "fact",
      });
    }
    for (const r of rows.filter((x) => x.excused !== 1)) {
      entries.push({
        date: r.date_from,
        title: `Nieobecność nieusprawiedliwiona ${formatRange(r.date_from, r.date_to)}`,
        detail: "Nie przedłuża terminu (art. 81 ust. 7 dotyczy nieobecności usprawiedliwionej).",
        basis: [EXTENDS],
        kind: "fact",
      });
    }
  }

  for (const e of events) {
    const x = e.payload ?? {};
    const before = entries.length;
    if (e.type === "appraiser_changed") {
      if (!full) continue;
      const name = (id: string) => personById(id)?.name ?? id;
      entries.push({
        date: e.date,
        title: `Zmiana oceniającego: ${name(x.from_id)} → ${name(x.to_id)}`,
        detail: `Nowy oceniający ocenia na podstawie wcześniej wybranych kryteriów.`,
        basis: [rules.appraiserChange.basis],
        kind: "fact",
      });
    } else if (e.type === "due_change_requested") {
      entries.push({
        date: e.date,
        title: "Wniosek ocenianego o zmianę terminu oceny",
        detail: x.reason,
        basis: [`${rules.deadlineChange.basis} pkt 4`],
        kind: "fact",
      });
    } else if (e.type === "deadline_changed") {
      if (!full && viewer.id !== cycle.person_id) continue;
      entries.push({
        date: e.date,
        title: `Zmiana terminu oceny z ${formatDate(x.oldDeadline)} na ${formatDate(x.newDeadline)}`,
        detail: x.reason,
        basis: [`art. 81 ust. 8 pkt ${x.case} ustawy`, rules.deadlineChange.notice.basis],
        kind: "fact",
        href: `/cycles/${cycle.id}/deadline-change/${e.id}/letter`,
      });
    } else if (e.type === "deadline_change_rejected") {
      entries.push({ date: e.date, title: "Wniosek o zmianę terminu odrzucony", detail: `Powód: ${x.reason}`, basis: [rules.deadlineChange.basis], kind: "fact" });
    } else if (e.type === "part1_submitted") {
      entries.push({ date: e.date, title: "Część I przekazana ocenianemu", detail: "Kryteria oceny i oczekiwania wobec pracownika.", basis: x.criteriaBasis ?? [], kind: "fact" });
    } else if (e.type === "part1_confirmed") {
      entries.push({ date: e.date, title: "Potwierdzenie części I przez ocenianego", basis: [], kind: "fact" });
    } else if (e.type === "invitation_sent") {
      entries.push({ date: e.date, title: invitationHeadline({ ...x, id: e.id, sentOn: e.date, confirmedOn: null }), basis: [], kind: "fact" });
    } else if (e.type === "invitation_confirmed") {
      entries.push({ date: e.date, title: "Potwierdzenie terminu", detail: "Oceniany potwierdził termin rozmowy.", basis: [], kind: "fact" });
    } else if (e.type === "assessment_approved") {
      entries.push(
        x.redo
          ? { date: e.date, title: "Ocena zatwierdzona po raz drugi po uwzględnieniu sprzeciwu", detail: `Pierwsza ocena z dnia ${formatDate(x.redo.firstApprovedOn)} zostaje w historii.`, basis: [rules.objectionRedo.basis], kind: "fact" }
          : { date: e.date, title: "Ocena zatwierdzona przez oceniającego", basis: [], kind: "fact" },
      );
    } else if (e.type === "assessment_acknowledged" || e.type === "acknowledgement_fiction") {
      const fiction = e.type === "acknowledgement_fiction";
      entries.push({
        date: e.date,
        title: fiction ? "Fikcja zapoznania z oceną" : "Zapoznanie z oceną",
        ...(fiction && x.deliveredOn ? { detail: `Kopię arkusza doręczono ${formatDate(x.deliveredOn)}.` } : {}),
        basis: [rules.deadlines.objectionDays.basis],
        kind: "fact",
      });
      if (x.objectionDeadline) {
        entries.push({ date: x.objectionDeadline, title: "Termin sprzeciwu", basis: [rules.deadlines.objectionDays.basis], kind: "deadline" });
      }
    } else if (e.type === "assessment_changed") {
      entries.push({ date: e.date, title: "Ocena zmieniona po uwzględnieniu sprzeciwu", detail: "Decyzję rozpatrującego sprzeciw zapisały kadry; pierwsza ocena zostaje w historii zdarzeń.", basis: [rules.deadlines.objectionReviewDays.basis], kind: "fact" });
    } else if (e.type === "objection_filed") {
      entries.push({ date: e.date, title: "Sprzeciw wniesiony", basis: [rules.deadlines.objectionDays.basis], kind: "fact" });
    } else if (e.type === "objection_resolved") {
      const text = OBJECTION_OUTCOME_TEXT[x.outcome as keyof typeof OBJECTION_OUTCOME_TEXT];
      entries.push({ date: e.date, title: `Sprzeciw rozpatrzony: ${text ?? x.outcome}`, basis: [rules.deadlines.objectionReviewDays.basis], kind: "fact" });
    } else if (e.type === "mandatory_grade_awarded") {
      entries.push({
        date: e.date,
        title: `Przyznano stopień służbowy ${romanGrade(x.toGrade)}`,
        detail: "Obowiązek urzędu: stopień z mocy prawa, odnotowany przez kadry.",
        basis: [x.basis],
        kind: "fact",
      });
    }
    if (x.on_behalf_of) for (let i = before; i < entries.length; i++) entries[i].title += " (w zastępstwie)";
  }

  const snap = approved?.payload?.deadline as { date: string; basis: string[] } | undefined;
  if (snap?.date) {
    entries.push({ date: snap.date, title: "Termin oceny", detail: "Termin zamrożony w dniu zatwierdzenia oceny.", basis: snap.basis, kind: "deadline" });
  } else {
    const changed = details.change !== null;
    const extended = details.deadline !== details.base;
    const previous = part1DeadlinesAfterObjection(cycleId, details.deadline)?.previous;
    const changeNote = changed
      ? `Termin zmieniony przez oceniającego z ${formatDate(details.change!.from)}${details.extensionDays > 0 ? ", dodatkowo przedłużony z powodu nieobecności dłuższej niż miesiąc" : ""}.`
      : extended ? `Termin bazowy ${formatDate(details.base)} przedłużony z powodu nieobecności dłuższej niż miesiąc.` : "";
    const previousNote = previous ? `Termin przekazany w części I: ${formatDate(previous.date)}.` : "";
    entries.push({
      date: details.deadline,
      title: "Termin oceny",
      detail: [changeNote, previousNote].filter(Boolean).join(" ") || undefined,
      basis: details.basis,
      kind: "deadline",
      struck: changed ? details.change!.from : extended ? details.base : undefined,
    });
  }
  // Okres podlegania ocenie (część II arkusza) biegnie od ustalenia kryteriów; termin oceny liczy się osobno.
  const criteriaSet = events.find((e) => e.type === "part1_confirmed") ?? events.find((e) => e.type === "part1_submitted");
  if (criteriaSet) {
    entries.push({ date: criteriaSet.date, title: "Początek okresu podlegania ocenie", detail: "Od ustalenia kryteriów do sporządzenia oceny. Ten okres obejmuje ocena w części II arkusza.", basis: [rules.deadlines.assessmentPeriodFrom.basis.split(";")[0]], kind: "fact" });
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === b.kind ? 0 : a.kind === "fact" ? -1 : 1));
}

/** Wersja reguł: z części I, gdy jest przekazana, inaczej bieżąca. */
export function timelineRulesVersion(cycleId: string): { version: string; effectiveFrom: string } {
  const sent = visibleEvents(cycleId).find((e) => e.type === "part1_submitted")?.payload?.rulesVersion;
  return sent?.version ? sent : rulesVersion();
}

registerCycleLinks((cycle, viewer) => {
  const links: { label: string; href: string }[] = [];
  if (canViewTimeline(viewer, cycle)) links.push({ label: "Oś czasu", href: `/cycles/${cycle.id}/timeline` });
  if (canRecordAbsence(viewer, cycle)) links.push({ label: "Wpisz nieobecność", href: `/cycles/${cycle.id}/absences` });
  if (canRecordAbsence(viewer, cycle)) links.push({ label: "Zmień oceniającego", href: `/cycles/${cycle.id}/appraiser` });
  return links;
});
