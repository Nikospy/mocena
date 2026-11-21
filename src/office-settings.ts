import data from "../rules/office-settings.json";
import { CRITERIA } from "./engine/scoring";

export type DutyType = { id: string; name: string };
export type OfficeSettings = {
  label: string;
  note: string;
  dutyTypes: DutyType[];
  dutyToCriterion: Record<string, string>;
  taskChangeWords: string[];
  recentFactsWindowMonths: number;
};

let checked = false;

export function officeSettings(): OfficeSettings {
  if (!checked) {
    for (const [duty, criterionId] of Object.entries(data.dutyToCriterion)) {
      if (!CRITERIA.some((c) => c.id === criterionId)) {
        throw new Error(`Ustawienia urzędu: obowiązek „${duty}” wskazuje nieistniejące kryterium „${criterionId}”`);
      }
    }
    checked = true;
  }
  return data as OfficeSettings;
}
