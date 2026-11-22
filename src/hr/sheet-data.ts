import { actsAsAppraiser } from "../substitutions";
import { assessmentState, type AssessmentSnapshot } from "../assessment/state";
import { cycleById, effectiveDeadline, type Cycle } from "../cycles";
import { rulesVersion } from "../engine/rules";
import { visibleEvents } from "../events";
import { personById, type Person } from "../people";
import { setting, today } from "../settings";
import { assessmentHistory } from "./history";

type Confirmation = { place: string; date: string; name: string };
type Deadline = { date: string; basis: string[] };

export type SheetData = {
  cycleId: string;
  sheet: string | null;
  partOnly: 1 | null;
  officeName: string;
  asOf: string;
  rulesVersion: { version: string; effectiveFrom: string; act: string };
  part1: {
    appraisee: { name: string; positionTitle: string | null; unit: string | null };
    appraiser: { name: string; positionTitle: string | null; unit: string | null };
    mandatory: { id: string }[];
    additional: { id: string; expectation: string | null }[];
    dueDate: Deadline | null;
    /** Gdy termin inny niż przekazany w części I: „Termin bieżący” (cykl otwarty) albo „Termin w dniu zatwierdzenia”. */
    deadlineNote: { label: string; deadline: Deadline } | null;
    appraiserConfirmation: Confirmation | null;
    appraiseeConfirmation: Confirmation | null;
  };
  part2: {
    interviewDate: string | null;
    periodFrom: string;
    periodTo: string | null;
    rows: { id: string; kind: "mandatory" | "additional"; score: number | null }[];
    mean: number | null;
    overallLevel: string | null;
    outcome: "positive" | "negative" | null;
    justification: string | null;
    developmentConclusions: string | null;
    previous: { approvedOn: string; outcome: "positive" | "negative"; overallLevel: string } | "none" | null;
    gradeRequest: "yes" | "no" | "not_applicable" | null;
    appraiserConfirmation: Confirmation | null;
    appraiseeConfirmation: (Confirmation & { objectionDeadline: string }) | null;
    fiction: { reason: "could_not" | "would_not"; deliveryMethod: "in_person" | "post" | "email"; deliveredOn: string; date: string; appraiserName: string } | null;
    objectionTo: string;
  };
  /** Tylko urzędnik mianowany z dołączonym wnioskiem o kolejny stopień. */
  part3: {
    name: string;
    appointedYear: number | null;
    grade: number | null;
    gradeAwardedOn: string | null;
    motivation: string;
    appraiserConfirmation: Confirmation;
  } | null;
};

/** Widzą: oceniany, oceniający cyklu, kadry. */
export function canViewSheet(viewer: Person, cycle: Cycle): boolean {
  return viewer.id === cycle.person_id || actsAsAppraiser(cycle.appraiser_id, viewer.id) || viewer.role === "hr";
}

export function sheetData(cycleId: string, options: { part?: 1 } = {}): SheetData {
  const cycle = cycleById(cycleId);
  if (!cycle) throw new Error(`Brak cyklu ${cycleId}`);
  const appraisee = personById(cycle.person_id)!;
  const appraiser = personById(cycle.appraiser_id)!;
  const ev = visibleEvents(cycleId);
  const submitted = ev.find((e) => e.type === "part1_submitted");
  const confirmed = ev.find((e) => e.type === "part1_confirmed");
  const st = assessmentState(cycleId);
  const snap: AssessmentSnapshot | null = st.snapshot;

  const sheet: string | null = snap?.sheet ?? submitted?.payload.sheet ?? cycle.sheet ?? null;
  const version = snap?.rulesVersion ?? submitted?.payload.rulesVersion ?? rulesVersion();
  const criteria: { id: string; kind: "mandatory" | "additional"; expectation: string | null }[] = submitted?.payload.criteria ?? [];

  const passed: Deadline | null = submitted ? { date: submitted.payload.dueDate, basis: submitted.payload.dueDateBasis } : null;
  let note: SheetData["part1"]["deadlineNote"] = null;
  if (snap) {
    if (!passed || passed.date !== snap.deadline.date) note = { label: "Termin w dniu zatwierdzenia", deadline: snap.deadline };
  } else if (passed) {
    const cur = effectiveDeadline(cycleId);
    if (cur.date !== passed.date) note = { label: "Termin bieżący", deadline: cur };
  }

  const pastBefore = snap
    ? assessmentHistory(cycle.person_id).find((h) => h.cycleId !== cycleId && h.approvedOn < (st.approvedOn ?? today()))
    : assessmentHistory(cycle.person_id).find((h) => h.cycleId !== cycleId);
  const previous: SheetData["part2"]["previous"] =
    appraisee.appointed !== 1 ? null : pastBefore ? { approvedOn: pastBefore.approvedOn, outcome: pastBefore.outcome, overallLevel: pastBefore.overallLevel } : "none";

  const rows: SheetData["part2"]["rows"] = snap
    ? snap.criteria.map((c) => ({ id: c.id, kind: c.kind, score: c.score }))
    : criteria.map((c) => ({ id: c.id, kind: c.kind, score: null }));

  return {
    cycleId,
    sheet,
    partOnly: options.part === 1 ? 1 : null,
    officeName: setting("office_name") ?? "",
    asOf: today(),
    rulesVersion: version,
    part1: {
      appraisee: { name: appraisee.name, positionTitle: appraisee.position_title, unit: appraisee.unit },
      appraiser: { name: submitted?.payload.appraiserName ?? appraiser.name, positionTitle: appraiser.position_title, unit: appraiser.unit },
      mandatory: criteria.filter((c) => c.kind === "mandatory").map((c) => ({ id: c.id })),
      additional: criteria.filter((c) => c.kind === "additional").map((c) => ({ id: c.id, expectation: c.expectation })),
      dueDate: passed,
      deadlineNote: note,
      appraiserConfirmation: submitted ? { place: submitted.payload.place, date: submitted.date, name: submitted.payload.appraiserName } : null,
      appraiseeConfirmation: confirmed ? { place: confirmed.payload.place, date: confirmed.date, name: confirmed.payload.appraiseeName } : null,
    },
    part2: {
      interviewDate: snap?.interviewDate ?? null,
      periodFrom: snap?.periodFrom ?? cycle.period_start,
      periodTo: snap?.periodTo ?? null,
      rows,
      mean: snap?.result.mean ?? null,
      overallLevel: snap?.result.overallLevel ?? null,
      outcome: snap?.result.outcome ?? null,
      justification: snap?.justification ?? null,
      developmentConclusions: snap?.developmentConclusions ?? null,
      previous,
      gradeRequest: appraisee.appointed !== 1 ? "not_applicable" : snap ? (snap.gradeRequest.attached ? "yes" : "no") : null,
      appraiserConfirmation: snap?.confirmation ?? null,
      appraiseeConfirmation: st.acknowledgement
        ? { place: st.acknowledgement.place, date: st.acknowledgement.date, name: st.acknowledgement.name, objectionDeadline: st.acknowledgement.objectionDeadline }
        : null,
      fiction: st.fiction
        ? {
            reason: st.fiction.reason,
            deliveryMethod: st.fiction.deliveryMethod,
            deliveredOn: st.fiction.deliveredOn,
            date: st.fiction.eventDate,
            appraiserName: appraiser.name,
          }
        : null,
      objectionTo: sheet === "A" ? "kierownika urzędu" : "dyrektora generalnego urzędu",
    },
    part3:
      appraisee.appointed === 1 && snap?.gradeRequest.attached
        ? {
            name: appraisee.name,
            appointedYear: appraisee.appointed_year,
            grade: snap.grade,
            gradeAwardedOn: snap.gradeAwardedOn,
            motivation: snap.gradeRequest.motivation,
            appraiserConfirmation: snap.confirmation,
          }
        : null,
  };
}
