import { cycleDeadlineDetails } from "./cycles";
import { formatDate } from "./views/layout";

/** „Termin przesunięty z X na Y …”: daty z silnika; `null`, gdy nic nie przesunęło terminu (nieobecność albo zmiana oceniającego z art. 81 ust. 8). */
export function shiftedDeadlineSentence(cycleId: string): { text: string; basis: string[]; byAppraiser: boolean } | null {
  const d = cycleDeadlineDetails(cycleId);
  if (d.change && d.deadline !== d.change.from) {
    const tail = d.extensionDays > 0 ? " i przedłużył się przez nieobecność" : "";
    return { text: `Oceniający zmienił termin oceny z ${formatDate(d.change.from)} na ${formatDate(d.deadline)}${tail}`, basis: d.basis, byAppraiser: true };
  }
  if (d.extensionDays <= 0 || d.deadline === d.base) return null;
  return { text: `Termin przesunięty z ${formatDate(d.base)} na ${formatDate(d.deadline)} przez nieobecność`, basis: d.basis, byAppraiser: false };
}
