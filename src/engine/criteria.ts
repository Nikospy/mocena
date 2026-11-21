// Dobór arkusza (§ 3) i podpowiedź kryteriów dodatkowych z tabeli urzędu. Czyste funkcje, bez bazy.
import { officeSettings } from "../office-settings";
import { mandatoryCriteria, type Sheet } from "./scoring";

export type PositionKind = "head_of_office" | "manager" | "staff";

const SHEETS: Record<PositionKind, { sheet: Sheet; basis: string }> = {
  head_of_office: { sheet: "A", basis: "§ 3 ust. 2" },
  manager: { sheet: "B", basis: "§ 3 ust. 3" },
  staff: { sheet: "C", basis: "§ 3 ust. 4" },
};

export function sheetForPosition(kind: PositionKind): { sheet: Sheet; basis: string } {
  const s = SHEETS[kind];
  if (!s) throw new Error(`Nieznany rodzaj stanowiska „${kind}”`);
  return s;
}

/** Dla każdego obowiązku kryterium z tabeli urzędu; bez obowiązkowych dla arkusza i bez powtórek. */
export function suggestAdditionalCriteria(sheet: Sheet, dutyTypeIds: string[]): { criterionId: string; because: string }[] {
  const { dutyTypes, dutyToCriterion } = officeSettings();
  const mandatory = new Set(mandatoryCriteria(sheet));
  const byCriterion = new Map<string, string[]>();
  for (const id of dutyTypeIds) {
    const criterionId = dutyToCriterion[id];
    const name = dutyTypes.find((d) => d.id === id)?.name;
    if (!criterionId || !name || mandatory.has(criterionId)) continue;
    byCriterion.set(criterionId, [...(byCriterion.get(criterionId) ?? []), name]);
  }
  return [...byCriterion].map(([criterionId, names]) => ({
    criterionId,
    because: `bo w opisie stanowiska jest obowiązek: ${names.join(", ")}`,
  }));
}
