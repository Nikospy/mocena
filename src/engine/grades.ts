// Art. 89 ust. 2 ustawy: stopień służbowy z mocy prawa po dwóch kolejnych ocenach pozytywnych
// na jednym z dwóch najwyższych poziomów (każda z dwóch na którymkolwiek z nich).
import { mandatoryGradeDeadline } from "./deadlines";
import { activeRules, rulesFor, withRulePack } from "./rules";

export type GradeAssessment = {
  cycleId: string;
  approvedOn: string;
  outcome: "positive" | "negative";
  overallLevel: string;
  acknowledgedOn: string | null;
  /** Wersja reguł, w której powstała ocena: nazwy dwóch najwyższych poziomów bierze się z niej. */
  rulesVersion?: string;
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
  /** Liczba dni na przyznanie stopnia w wersji reguł drugiej oceny. */
  days: number;
  cycleId: string;
  overdue: boolean;
  atMaxGrade: boolean;
};

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

export function romanGrade(n: number): string {
  return ROMAN[n] ?? String(n);
}

export function mandatoryGrade(input: MandatoryGradeInput, today: string): MandatoryGrade | null {
  if (!input.isAppointed || input.currentGrade === null) return null;
  const r = activeRules();
  const topLevelsOf = (a: GradeAssessment) => (a.rulesVersion ? rulesFor(a.rulesVersion) : r).overallLevels.slice(-2).map((l) => l.name);
  const qualifies = (a: GradeAssessment) => a.outcome === "positive" && topLevelsOf(a).includes(a.overallLevel);
  const since = input.currentGradeOn;
  const list = input.assessments.filter((a) => !since || a.approvedOn > since).sort((a, b) => a.approvedOn.localeCompare(b.approvedOn));
  for (let i = 0; i + 1 < list.length; i++) {
    const [first, second] = [list[i], list[i + 1]];
    if (!qualifies(first) || !qualifies(second) || !second.acknowledgedOn) continue;
    // Termin, podstawa i najwyższy stopień według wersji reguł, w której powstała druga ocena.
    const pack = second.rulesVersion ? rulesFor(second.rulesVersion) : r;
    const dueOn = withRulePack(pack, () => mandatoryGradeDeadline(second.acknowledgedOn!));
    const atMaxGrade = input.currentGrade >= pack.approval.gradeRequest.maxGrade;
    return {
      dueOn,
      basis: pack.deadlines.mandatoryGradeDays.basis,
      days: pack.deadlines.mandatoryGradeDays.value,
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
