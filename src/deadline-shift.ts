import { cycleDeadlineDetails } from "./cycles";
import { formatDate } from "./views/layout";

/** „Termin przesunięty z X na Y przez nieobecność”: daty z silnika; `null`, gdy nieobecność nie przesunęła terminu. */
export function shiftedDeadlineSentence(cycleId: string): { text: string; basis: string[] } | null {
  const d = cycleDeadlineDetails(cycleId);
  if (d.extensionDays <= 0 || d.deadline === d.base) return null;
  return { text: `Termin przesunięty z ${formatDate(d.base)} na ${formatDate(d.deadline)} przez nieobecność`, basis: d.basis };
}
