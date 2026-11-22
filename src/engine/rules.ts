// Jedyny moduł czytający plik reguł (rozporządzenie PRM z 4 kwietnia 2016 r., Dz.U. 2016 poz. 470).
import data from "../../rules/regulation-2016-470.json";

export const rules = data;

export function rulesVersion(): { version: string; effectiveFrom: string; act: string } {
  return { version: data.version, effectiveFrom: data.effectiveFrom, act: data.source.act };
}

/** „Wersja reguł 1”: opis wersji dla człowieka; identyfikator „2016-470/1” zostaje w `title`, data obowiązywania dokleja się w widoku. */
export function rulesVersionLabel(version: string): string {
  const n = version.split("-")[1]?.split("/")[1] ?? "";
  return `Wersja reguł ${n}`;
}
