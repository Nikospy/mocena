// Dane pokazowe S-06: oceny historyczne (Tomasz, Piotr, Ewa), zamknięty cykl ze sprzeciwem (Katarzyna Lewandowska)
// i cykl z wnioskiem o zmianę terminu (Anna). Każda migawka powstaje w buildAssessmentSnapshot.
import { buildAssessmentSnapshot } from "../assessment/snapshot";
import type { AssessmentDraft } from "../assessment/state";
import { savePart1 } from "../cycles/part1";
import { getDb } from "../db";
import { objectionDeadline } from "../engine/deadlines";
import { seedEvent, visibleEvents } from "../events";
import { personById } from "../people";
import { setting } from "../settings";

type Chain = {
  cycleId: string;
  personId: string;
  appraiserId: string;
  periodStart: string;
  part1On: string;
  confirmedOn: string;
};

function startCycle(c: Chain): void {
  getDb().query("INSERT INTO cycles (id, person_id, appraiser_id, period_start) VALUES (?, ?, ?, ?)").run(c.cycleId, c.personId, c.appraiserId, c.periodStart);
  seedEvent(
    "cycle_started",
    c.cycleId,
    c.appraiserId,
    {
      reason: "previous_assessment",
      periodStart: c.periodStart,
      previousAssessmentOn: c.periodStart,
      previousAcknowledgedOn: c.periodStart,
      previousOutcome: "positive",
    },
    c.periodStart,
  );
}

function part1(c: Chain): void {
  savePart1(c.cycleId, c.appraiserId, { additional: [], expectations: {} }, c.part1On);
  const p = personById(c.personId)!;
  seedEvent("part1_confirmed", c.cycleId, c.personId, { place: setting("office_city") ?? "", appraiseeName: p.name }, c.confirmedOn);
}

/** Zatwierdzenie z migawką z buildAssessmentSnapshot i zapoznanie ocenianego tego samego dnia albo w `ackOn`. */
function approve(c: Chain, scores: number[], approvedOn: string, ackOn: string | null, text: Partial<AssessmentDraft> = {}): void {
  if (!visibleEvents(c.cycleId, { asOf: approvedOn }).some((e) => e.type === "part1_confirmed")) {
    throw new Error(`Cykl ${c.cycleId}: ocena zatwierdzona bez potwierdzonej części I`);
  }
  const ids = (getDb().query("SELECT criterion_id AS id FROM cycle_criteria WHERE cycle_id = ? ORDER BY rowid").all(c.cycleId) as { id: string }[]).map((r) => r.id);
  const draft: AssessmentDraft = {
    scores: Object.fromEntries(ids.map((id, i) => [id, scores[i]])),
    justification: text.justification ?? "",
    developmentConclusions: text.developmentConclusions ?? "Szkolenie z zarządzania zespołem w ciągu roku.",
    interviewDate: approvedOn,
    gradeRequest: text.gradeRequest ?? { attached: false, motivation: "" },
  };
  const snapshot = buildAssessmentSnapshot(c.cycleId, draft, { asOf: approvedOn });
  seedEvent("assessment_approved", c.cycleId, c.appraiserId, snapshot, approvedOn);
  if (ackOn) {
    const p = personById(c.personId)!;
    seedEvent("assessment_acknowledged", c.cycleId, c.personId, { place: setting("office_city") ?? "", date: ackOn, name: p.name, objectionDeadline: objectionDeadline(ackOn) }, ackOn);
  }
}

const MEETS = [5, 5, 5, 5, 5];

export function seedAssessments(): void {
  const db = getDb();
  db.query("UPDATE people SET appointed_year = 2016 WHERE id = 'tomasz'").run();

  // Tomasz: poprzedni cykl, ocena 12.11.2024.
  const tPrev: Chain = { cycleId: "cycle-tomasz-2022", personId: "tomasz", appraiserId: "anna", periodStart: "2022-11-14", part1On: "2022-12-05", confirmedOn: "2022-12-06" };
  startCycle(tPrev);
  part1(tPrev);
  approve(tPrev, [7, 7, 9, 7, 7], "2024-11-12", "2024-11-12", { justification: "Wyniki zespołu stabilne, plan pracy wydziału zrealizowany w terminie." });

  // Tomasz: bieżący cykl (łańcuch z base.ts i part1.ts), ocena 12.11.2026.
  const tNow: Chain = { cycleId: "cycle-tomasz", personId: "tomasz", appraiserId: "anna", periodStart: "2024-11-12", part1On: "2024-12-02", confirmedOn: "2024-12-03" };
  approve(tNow, [7, 9, 7, 7, 7], "2026-11-12", "2026-11-12", { justification: "Samodzielne decyzje w trudnych sprawach kadrowych wydziału, dobra współpraca z innymi komórkami." });

  // Piotr i Ewa: poprzednie oceny na poziomie oczekiwań.
  const pPrev: Chain = { cycleId: "cycle-piotr-2022", personId: "piotr", appraiserId: "marek", periodStart: "2022-11-27", part1On: "2022-12-12", confirmedOn: "2022-12-13" };
  startCycle(pPrev);
  part1(pPrev);
  approve(pPrev, MEETS, "2024-11-27", "2024-11-27");
  const ePrev: Chain = { cycleId: "cycle-ewa-2022", personId: "ewa", appraiserId: "marek", periodStart: "2022-11-20", part1On: "2022-12-05", confirmedOn: "2022-12-06" };
  startCycle(ePrev);
  part1(ePrev);
  approve(ePrev, MEETS, "2024-11-20", "2024-11-20");

  // Katarzyna Lewandowska: zamknięty cykl ze sprzeciwem.
  const k: Chain = { cycleId: "cycle-katarzyna", personId: "katarzyna", appraiserId: "anna", periodStart: "2024-11-18", part1On: "2024-11-25", confirmedOn: "2024-11-26" };
  startCycle(k);
  part1(k);
  approve(k, MEETS, "2026-11-16", "2026-11-17");
  seedEvent("objection_filed", k.cycleId, "katarzyna", { to: "dyrektor generalny urzędu" }, "2026-11-20");

  // Anna: wniosek o zmianę terminu (jeden z powodów z art. 81 ust. 8 ustawy, bez danych o zdrowiu).
  const a: Chain = { cycleId: "cycle-anna", personId: "anna", appraiserId: "dyrektor-urzedu", periodStart: "2024-12-16", part1On: "2025-01-14", confirmedOn: "2025-01-15" };
  startCycle(a);
  part1(a);
  seedEvent("due_change_requested", a.cycleId, "anna", { requestedDate: "2027-03-15", reason: "zmiana stanowiska pracy" }, "2026-10-05");
}
