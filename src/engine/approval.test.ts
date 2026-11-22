import { describe, expect, test } from "bun:test";
import type { AssessmentDraft } from "../assessment/state";
import { approvalBlockers, gradeRequestOptions } from "./approval";

const criteria = ["rzetelnosc", "komunikacja", "wspolpraca"];
const draft = (over: Partial<AssessmentDraft> = {}): AssessmentDraft => ({
  scores: { rzetelnosc: 7, komunikacja: 7, wspolpraca: 7 },
  justification: "",
  developmentConclusions: "Szkolenie z pism urzędowych.",
  interviewDate: null,
  gradeRequest: { attached: false, motivation: "" },
  ...over,
});
const run = (d: AssessmentDraft, extra: { appointed?: boolean; grade?: number | null } = {}) =>
  approvalBlockers({ criteria, draft: d, appointed: extra.appointed ?? false, grade: extra.grade ?? null });
const fields = (b: { field: string }[]) => b.map((x) => x.field);

describe("approvalBlockers", () => {
  test("komplet bez uzasadnienia przy wyniku pozytywnym nie ma blokad", () => {
    expect(run(draft())).toEqual([]);
  });

  test("brak oceny i ocena spoza cyklu albo skali", () => {
    const missing = run(draft({ scores: { rzetelnosc: 7, komunikacja: 7 } }));
    expect(missing[0].message).toBe("Brakuje ocen cząstkowych: 1");
    expect(missing[0].items).toEqual(["Współpraca"]);
    expect(missing[0].basis).toBe("§ 11 ust. 1");
    expect(fields(run(draft({ scores: { rzetelnosc: 7, komunikacja: 7, wspolpraca: 4 } })))).toEqual(["score[wspolpraca]"]);
    expect(fields(run(draft({ scores: { rzetelnosc: 7, komunikacja: 7, wspolpraca: 7, negocjowanie: 5 } })))).toEqual(["score[negocjowanie]"]);
  });

  test("wnioski do IPRZ blokują zawsze, także gdy składają się z samych spacji", () => {
    const b = run(draft({ developmentConclusions: "   " }));
    expect(b).toEqual([{ field: "developmentConclusions", message: expect.any(String), basis: "art. 81 ust. 5 ustawy" }]);
  });

  test("uzasadnienie: wymagane przy „1” mimo wysokiej średniej, nie przy pozytywnej", () => {
    const one = draft({ scores: { rzetelnosc: 1, komunikacja: 7, wspolpraca: 7 } });
    expect(run(one)).toEqual([{ field: "justification", message: expect.any(String), basis: "§ 11 ust. 3" }]);
    expect(run({ ...one, justification: "  " })).toHaveLength(1);
    expect(run({ ...one, justification: "Powód." })).toEqual([]);
  });

  test("średnia dokładnie 4 jest negatywna i wymaga uzasadnienia", () => {
    expect(fields(run(draft({ scores: { rzetelnosc: 3, komunikacja: 3, wspolpraca: 5 } })))).toEqual(["justification"]);
    const five = draft({ scores: { rzetelnosc: 3, komunikacja: 5, wspolpraca: 7 } });
    expect(run(five)).toEqual([]);
  });

  test("wniosek o stopień: pracownik, ocena negatywna, najwyższy stopień, brak umotywowania", () => {
    const gr = (motivation: string) => draft({ gradeRequest: { attached: true, motivation } });
    expect(fields(run(gr("Dobrze."), { appointed: false }))).toEqual(["gradeRequest"]);
    expect(run(gr("Dobrze."), { appointed: true, grade: 5 })).toEqual([]);
    expect(fields(run(gr("Dobrze."), { appointed: true, grade: 9 }))).toEqual(["gradeRequest"]);
    expect(fields(run(gr(" "), { appointed: true, grade: 5 }))).toEqual(["gradeMotivation"]);
    const neg = draft({ scores: { rzetelnosc: 1, komunikacja: 7, wspolpraca: 7 }, justification: "x", gradeRequest: { attached: true, motivation: "m" } });
    expect(fields(run(neg, { appointed: true, grade: 5 }))).toEqual(["gradeRequest"]);
  });
});

describe("gradeRequestOptions", () => {
  test("trzy warianty", () => {
    expect(gradeRequestOptions({ appointed: false, grade: null, outcome: "positive" })).toBe("not_applicable");
    expect(gradeRequestOptions({ appointed: true, grade: 5, outcome: "negative" })).toBe("no_only");
    expect(gradeRequestOptions({ appointed: true, grade: 9, outcome: "positive" })).toBe("no_only");
    expect(gradeRequestOptions({ appointed: true, grade: 5, outcome: "positive" })).toBe("yes_or_no");
    expect(gradeRequestOptions({ appointed: true, grade: 5, outcome: null })).toBe("yes_or_no");
  });
});
