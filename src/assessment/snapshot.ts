import { cycleById, effectiveDeadline } from "../cycles";
import { assessmentPeriodFrom, cycleCriteria } from "../cycles/part1";
import { rulesVersion } from "../engine/rules";
import { computeAssessment, criterion } from "../engine/scoring";
import { personById } from "../people";
import { setting, today } from "../settings";
import { currentGradeNumber, type AssessmentDraft, type AssessmentSnapshot } from "./state";

/**
 * Jedyne miejsce składania migawki oceny. Niczego nie zapisuje i nie sprawdza blokad (robi to wołający).
 * Data migawki to `asOf`, a bez niego `today()`.
 */
export function buildAssessmentSnapshot(cycleId: string, draft: AssessmentDraft, opts: { asOf?: string } = {}): AssessmentSnapshot {
  const cycle = cycleById(cycleId);
  if (!cycle) throw new Error(`Brak cyklu ${cycleId}`);
  const date = opts.asOf ?? today();
  const result = computeAssessment(draft.scores);
  const { grade, awardedOn } = currentGradeNumber(cycle.person_id, { asOf: date });
  const attached = draft.gradeRequest.attached;
  return {
    scores: draft.scores,
    justification: draft.justification,
    developmentConclusions: draft.developmentConclusions,
    ...(cycle.sheet === "A" && draft.objectionRecipient ? { objectionRecipient: draft.objectionRecipient } : {}),
    interviewDate: draft.interviewDate ?? date,
    gradeRequest: {
      attached,
      motivation: draft.gradeRequest.motivation,
      targetGrade: attached && grade !== null ? grade + 1 : null,
    },
    sheet: cycle.sheet ?? "",
    criteria: cycleCriteria(cycleId).map((c) => ({ id: c.id, name: criterion(c.id).name, kind: c.kind, score: draft.scores[c.id] })),
    result: {
      mean: result.mean,
      overallLevel: result.overallLevel,
      outcome: result.outcome,
      reasons: result.reasons,
      justificationRequired: result.justificationRequired,
    },
    periodFrom: assessmentPeriodFrom(cycleId, cycle.period_start),
    periodTo: date,
    deadline: effectiveDeadline(cycleId, { asOf: date }),
    grade,
    gradeAwardedOn: awardedOn,
    rulesVersion: rulesVersion(),
    confirmation: { place: setting("office_city") ?? "", date, name: personById(cycle.appraiser_id)?.name ?? "" },
  };
}
