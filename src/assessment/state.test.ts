import { describe, expect, test } from "bun:test";
import { seedEvent } from "../events";
import { createTestApp } from "../test-helpers";
import { assessmentState, type AssessmentDraft } from "./state";

const draft = (j: string): AssessmentDraft => ({
  scores: { rzetelnosc: 5 },
  justification: j,
  developmentConclusions: "",
  interviewDate: null,
  gradeRequest: { attached: false, motivation: "" },
});

describe("assessmentState", () => {
  test("etapy po kolei, ostatni szkic wygrywa, termin z payloadu", () => {
    createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    const c = "cycle-piotr";
    expect(assessmentState(c).stage).toBe("draft");
    expect(assessmentState(c).draft).toBeNull();
    seedEvent("assessment_draft_saved", c, "marek", draft("pierwszy"), "2026-11-20");
    seedEvent("assessment_draft_saved", c, "marek", draft("drugi"), "2026-11-20");
    expect(assessmentState(c).draft?.justification).toBe("drugi");
    seedEvent("assessment_approved", c, "marek", { scores: {} }, "2026-11-21");
    expect(assessmentState(c).stage).toBe("approved");
    expect(assessmentState(c).objectionDeadline).toBeNull();
    seedEvent("assessment_acknowledged", c, "piotr", { place: "R", date: "2026-11-22", name: "P", objectionDeadline: "2030-01-01" }, "2026-11-22");
    const s = assessmentState(c);
    expect(s.stage).toBe("acknowledged");
    expect(s.objectionDeadline).toBe("2030-01-01");
  });

  test("bez potwierdzonej części I etap no_part1; zdarzenie z przyszłości jest niewidoczne", () => {
    createTestApp({ today: "2026-11-22" });
    expect(assessmentState("cycle-piotr").stage).toBe("no_part1");
    createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    seedEvent("assessment_approved", "cycle-piotr", "marek", {}, "2026-11-23");
    expect(assessmentState("cycle-piotr").stage).toBe("draft");
  });

  test("fikcja zamyka etap tak samo jak potwierdzenie; pierwsze zdarzenie wygrywa", () => {
    createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    const c = "cycle-piotr";
    seedEvent("assessment_approved", c, "marek", {}, "2026-11-21");
    seedEvent("acknowledgement_fiction", c, "marek", { reason: "would_not", deliveryMethod: "post", deliveredOn: "2026-11-21", objectionDeadline: "2026-11-30" }, "2026-11-22");
    seedEvent("assessment_acknowledged", c, "piotr", { objectionDeadline: "2031-01-01" }, "2026-11-22");
    expect(assessmentState(c).stage).toBe("fiction");
    expect(assessmentState(c).objectionDeadline).toBe("2026-11-30");
  });
});
