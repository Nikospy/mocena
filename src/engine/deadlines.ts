// Terminy procesu oceny okresowej. Daty jako "RRRR-MM-DD", liczone w UTC, żeby strefa czasowa nic nie przesuwała.
// Sposób liczenia: art. 110–115 Kodeksu cywilnego (tak wskazuje Departament Służby Cywilnej w FAQ, pyt. 11).
import { rules } from "./rules";

const D = rules.deadlines;

function toDate(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`Data musi mieć format RRRR-MM-DD (jest „${iso}”)`);
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) throw new Error(`Nie ma takiej daty: ${iso}`);
  return d;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Termin w dniach: dnia zdarzenia się nie wlicza (art. 111 § 2 KC), więc koniec to data + n dni. */
export function addDays(iso: string, days: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** Termin w miesiącach: kończy się w dniu o tej samej dacie, a gdy go nie ma, w ostatnim dniu miesiąca (art. 112 KC). */
export function addMonths(iso: string, months: number): string {
  const d = toDate(iso);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return toIso(target);
}

/** Niedziela wielkanocna (algorytm Meeusa dla kalendarza gregoriańskiego). */
export function easter(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toIso(new Date(Date.UTC(year, month - 1, day)));
}

/** Dni ustawowo wolne od pracy w Polsce. Wigilia jest wolna od 2025 r. */
export function holidays(year: number): string[] {
  const e = easter(year);
  const fixed = ["01-01", "01-06", "05-01", "05-03", "08-15", "11-01", "11-11", "12-25", "12-26"];
  if (year >= 2025) fixed.push("12-24");
  return [
    ...fixed.map((x) => `${year}-${x}`),
    e,
    addDays(e, 1), // poniedziałek wielkanocny
    addDays(e, 49), // Zielone Świątki
    addDays(e, 60), // Boże Ciało
  ].sort();
}

export function isDayOff(iso: string): boolean {
  const d = toDate(iso);
  const dow = d.getUTCDay();
  return dow === 0 || dow === 6 || holidays(d.getUTCFullYear()).includes(iso);
}

/** Koniec terminu w sobotę albo dzień ustawowo wolny przesuwa się na najbliższy dzień roboczy (art. 115 KC). */
export function toWorkingDay(iso: string): string {
  let d = iso;
  while (isDayOff(d)) d = addDays(d, 1);
  return d;
}

/** Art. 81 ust. 4 i 7 ustawy: kolejna ocena po 24 miesiącach; nieobecność dłuższa niż miesiąc wydłuża termin o swój czas. Koniec w sobotę albo dzień wolny przechodzi na następny dzień roboczy (zasady liczenia terminów KPRM, pkt 3). */
export function nextAssessmentDeadline(start: string, longAbsenceDays = 0): string {
  return toWorkingDay(addDays(addMonths(start, D.assessmentEveryMonths.value), longAbsenceDays));
}

/** § 7: rozmowa o kryteriach w 30 dni od poprzedniej oceny albo zatrudnienia, a po ocenie negatywnej w 7 dni. */
export function criteriaTalkDeadline(from: string, afterNegative = false): string {
  const days = afterNegative ? D.criteriaTalkAfterNegativeDays.value : D.criteriaTalkDays.value;
  return toWorkingDay(addDays(from, days));
}

/** Art. 81 ust. 9 ustawy: poradnik KPRM (s. 13–14) wskazuje pierwszy dzień po upływie 6 miesięcy. */
export function periodEndAfterNegative(acknowledgedOn: string): string {
  return addDays(addMonths(acknowledgedOn, D.reassessmentAfterNegativeMonths.value), 1);
}

/** Art. 89 ust. 2 ustawy: stopień służbowy z mocy prawa w 30 dni od zapoznania się z drugą oceną. */
export function mandatoryGradeDeadline(ackOn: string): string {
  return toWorkingDay(addDays(ackOn, D.mandatoryGradeDays.value));
}

/** Art. 83 ust. 1 ustawy: sprzeciw do dyrektora generalnego w 7 dni od zapoznania się z oceną. */
export function objectionDeadline(acknowledgedOn: string): string {
  return toWorkingDay(addDays(acknowledgedOn, D.objectionDays.value));
}

/** Art. 83 ust. 3 ustawy: sprzeciw rozpatruje się w 14 dni od wniesienia. */
export function objectionReviewDeadline(filedOn: string): string {
  return toWorkingDay(addDays(filedOn, D.objectionReviewDays.value));
}

/** Art. 83 ust. 5 ustawy: odwołanie do sądu pracy w 14 dni od doręczenia decyzji albo upływu terminu na rozpatrzenie. */
export function courtAppealDeadline(deliveredOrExpiredOn: string): string {
  return toWorkingDay(addDays(deliveredOrExpiredOn, D.courtAppealDays.value));
}
