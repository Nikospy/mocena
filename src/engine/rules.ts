// Jedyny moduł czytający plik reguł (rozporządzenie PRM z 4 kwietnia 2016 r., Dz.U. 2016 poz. 470).
import data from "../../rules/regulation-2016-470.json";

export const rules = data;

export function rulesVersion(): { version: string; effectiveFrom: string; act: string } {
  return { version: data.version, effectiveFrom: data.effectiveFrom, act: data.source.act };
}
