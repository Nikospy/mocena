// Jedyny moduł czytający plik reguł (rozporządzenie PRM z 4 kwietnia 2016 r., Dz.U. 2016 poz. 470).
import data from "../../rules/regulation-2016-470.json";

export const rules = data;

export function rulesVersion(): { version: string; effectiveFrom: string; act: string } {
  return { version: data.version, effectiveFrom: data.effectiveFrom, act: data.source.act };
}

/** „Zasady z rozporządzenia z 2016 r., wersja 1”: opis wersji dla człowieka; identyfikator „2016-470/1” zostaje w `title`. */
export function rulesVersionLabel(version: string): string {
  const [year, rest = ""] = version.split("-");
  const n = rest.split("/")[1] ?? "";
  return `Zasady z rozporządzenia z ${year} r., wersja ${n}`;
}
