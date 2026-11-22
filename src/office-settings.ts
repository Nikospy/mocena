import data from "../rules/office-settings.json";
import { CRITERIA } from "./engine/scoring";

export type DutyType = { id: string; name: string };
export type DevelopmentForm = { id: string; name: string; description: string; criteria: string[]; default?: boolean };
export type OfficeSettings = {
  label: string;
  note: string;
  sheetAObjectionRecipient: { value: string; label: string };
  dutyTypes: DutyType[];
  dutyToCriterion: Record<string, string>;
  taskChangeWords: string[];
  afterHoursWords: string[];
  recentFactsWindowMonths: number;
  assessmentReminderDays?: { value: number; label: string };
  appreciationReminderDays: number;
  teamSilenceMonths: number;
  developmentForms: DevelopmentForm[];
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

/** Na ile dni przed terminem oceny pojawia się sprawa „Wystaw ocenę” i przypomnienie o terminie (założenie produktu: ustawienie urzędu). */
const DEFAULT_ASSESSMENT_WINDOW_DAYS = 30;

export function assessmentWindowDays(): { value: number; label: string } {
  const d = officeSettings().assessmentReminderDays;
  return { value: d?.value ?? DEFAULT_ASSESSMENT_WINDOW_DAYS, label: d?.label ?? "ustawienie urzędu" };
}
