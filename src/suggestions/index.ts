// Jedyne wymienne miejsce podpowiedzi (AGENTS.md, zasada 5). Dziś reguły; urząd może podłączyć własny model.
import { suggestAdditionalCriteria } from "../engine/criteria";
import type { Sheet } from "../engine/scoring";

export function suggestCriteria(
  sheet: Sheet,
  dutyTypeIds: string[],
): { source: "rules"; items: { criterionId: string; because: string }[] } {
  return { source: "rules", items: suggestAdditionalCriteria(sheet, dutyTypeIds) };
}
