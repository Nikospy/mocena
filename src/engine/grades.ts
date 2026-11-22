// Art. 89 ust. 2 ustawy: stopień służbowy z mocy prawa po dwóch kolejnych ocenach pozytywnych
// na jednym z dwóch najwyższych poziomów (każda z dwóch na którymkolwiek z nich).
import { mandatoryGradeDeadline } from "./deadlines";
import { rules } from "./rules";

export type GradeAssessment = {
  cycleId: string;
  approvedOn: string;
  outcome: "positive" | "negative";
  overallLevel: string;
  acknowledgedOn: string | null;
};

export type MandatoryGradeInput = {
  isAppointed: boolean;
  currentGrade: number | null;
  currentGradeOn: string | null;
  assessments: GradeAssessment[];
};

export type MandatoryGrade = {
  dueOn: string;
  basis: string;
  fromGrade: number;
  toGrade: number | null;
  assessmentDates: [string, string];
  acknowledgedOn: string;
  cycleId: string;
  overdue: boolean;
  atMaxGrade: boolean;
};

const TOP_LEVELS = rules.overallLevels.slice(-2).map((l) => l.name);
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

export function romanGrade(n: number): string {
  return ROMAN[n] ?? String(n);
}

const qualifies = (a: GradeAssessment) => a.outcome === "positive" && TOP_LEVELS.includes(a.overallLevel);

export function mandatoryGrade(input: MandatoryGradeInput, today: string): MandatoryGrade | null {
  if (!input.isAppointed || input.currentGrade === null) return null;
  const since = input.currentGradeOn;
  const list = input.assessments.filter((a) => !since || a.approvedOn > since).sort((a, b) => a.approvedOn.localeCompare(b.approvedOn));
  for (let i = 0; i + 1 < list.length; i++) {
    const [first, second] = [list[i], list[i + 1]];
    if (!qualifies(first) || !qualifies(second) || !second.acknowledgedOn) continue;
    const dueOn = mandatoryGradeDeadline(second.acknowledgedOn);
    const atMaxGrade = input.currentGrade >= rules.approval.gradeRequest.maxGrade;
    return {
      dueOn,
      basis: rules.deadlines.mandatoryGradeDays.basis,
      fromGrade: input.currentGrade,
      toGrade: atMaxGrade ? null : input.currentGrade + 1,
      assessmentDates: [first.approvedOn, second.approvedOn],
      acknowledgedOn: second.acknowledgedOn,
      cycleId: second.cycleId,
      overdue: today > dueOn,
      atMaxGrade,
    };
  }
  return null;
}
