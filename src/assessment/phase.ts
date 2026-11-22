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
  const stage = assessmentState(cycle.id).stage;
  if (stage === "no_part1") return false;
  if (stage !== "draft") return true;
  return today() >= addDays(effectiveDeadline(cycle.id).date, -assessmentWindowDays().value);
}
