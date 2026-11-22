import { effectiveDeadline, type Cycle } from "../cycles";
import { addDays } from "../engine/deadlines";
import { assessmentWindowDays } from "../office-settings";
import { today } from "../settings";
import { assessmentState } from "./state";

/**
 * Faza oceny jest „na stole”: po zatwierdzeniu zawsze, przed zatwierdzeniem dopiero w oknie przed terminem oceny
 * (termin z silnika, z przesunięciami). Wcześniej nie ma sprawy „Wystaw ocenę” ani odnośników do oceny.
 */
export function assessmentPhaseOpen(cycle: Cycle): boolean {
  const state = assessmentState(cycle.id);
  const stage = state.stage;
  if (stage === "no_part1") return false;
  if (state.redo) return true;
  if (stage !== "draft") return true;
  return assessmentWindowReached(cycle);
}

/** Okno przed terminem oceny (ostatnie dni ustawienia urzędu) albo po terminie; termin z silnika, z przesunięciami. */
export function assessmentWindowReached(cycle: Cycle): boolean {
  return today() >= addDays(effectiveDeadline(cycle.id).date, -assessmentWindowDays().value);
}
