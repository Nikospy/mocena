import { cycleDeadlineDetails } from "./cycles";
import { formatDate } from "./views/layout";

/** „Termin przesunięty z X na Y …”: daty z silnika; `null`, gdy nic nie przesunęło terminu (nieobecność albo zmiana oceniającego z art. 81 ust. 8). */
export function shiftedDeadlineSentence(cycleId: string): { text: string; basis: string[] } | null {
  const d = cycleDeadlineDetails(cycleId);
  if (d.change && d.deadline !== d.change.from) {
    const why = d.extensionDays > 0 ? "zmianę terminu przez oceniającego i nieobecność" : "zmianę terminu przez oceniającego";
    return { text: `Termin przesunięty z ${formatDate(d.change.from)} na ${formatDate(d.deadline)} przez ${why}`, basis: d.basis };
  }
  if (d.extensionDays <= 0 || d.deadline === d.base) return null;
  return { text: `Termin przesunięty z ${formatDate(d.base)} na ${formatDate(d.deadline)} przez nieobecność`, basis: d.basis };
}
