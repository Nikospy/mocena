// Cykl z zatwierdzoną oceną żyje według reguł wersji zapisanej w ocenie. Gdy trwa ponowne sporządzenie oceny
// po sprzeciwie, obowiązuje pierwsza ocena, więc jej wersja.
import { hasPublishedRules, withRulesVersion } from "../engine/rules";
import { assessmentInForce } from "./state";

/** Wersja reguł obowiązującej oceny cyklu albo `undefined`, gdy cykl nie ma zatwierdzonej oceny. */
export function cycleRulesVersion(cycleId: string): string | undefined {
  return assessmentInForce(cycleId).snapshot?.rulesVersion.version;
}

/** Wykonuje `fn` z regułami wersji obowiązującej oceny cyklu; bez zatwierdzonej oceny z regułami obowiązującymi dziś. */
export function withCycleRules<R>(cycleId: string, fn: () => R): R {
  if (!hasPublishedRules()) return fn();
  const version = cycleRulesVersion(cycleId);
  return version ? withRulesVersion(version, fn) : fn();
}
