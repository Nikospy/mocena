// Terminy procesu oceny okresowej. Daty jako "RRRR-MM-DD", liczone w UTC, żeby strefa czasowa nic nie przesuwała.
// Sposób liczenia: art. 110–115 Kodeksu cywilnego (tak wskazuje Departament Służby Cywilnej w FAQ, pyt. 11).
import dane from "../../reguly/rozporzadzenie-2016-470.json";

const T = dane.terminy;

function naDate(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`Data musi mieć format RRRR-MM-DD (jest „${iso}”)`);
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) throw new Error(`Nie ma takiej daty: ${iso}`);
  return d;
}

function naIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Termin w dniach: dnia zdarzenia się nie wlicza (art. 111 § 2 KC), więc koniec to data + n dni. */
export function dodajDni(iso: string, dni: number): string {
  const d = naDate(iso);
  d.setUTCDate(d.getUTCDate() + dni);
  return naIso(d);
}

/** Termin w miesiącach: kończy się w dniu o tej samej dacie, a gdy go nie ma, w ostatnim dniu miesiąca (art. 112 KC). */
export function dodajMiesiace(iso: string, miesiace: number): string {
  const d = naDate(iso);
  const dzien = d.getUTCDate();
  const cel = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + miesiace, 1));
  const ostatni = new Date(Date.UTC(cel.getUTCFullYear(), cel.getUTCMonth() + 1, 0)).getUTCDate();
  cel.setUTCDate(Math.min(dzien, ostatni));
  return naIso(cel);
}

/** Niedziela wielkanocna (algorytm Meeusa dla kalendarza gregoriańskiego). */
export function wielkanoc(rok: number): string {
  const a = rok % 19;
  const b = Math.floor(rok / 100);
  const c = rok % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const miesiac = Math.floor((h + l - 7 * m + 114) / 31);
  const dzien = ((h + l - 7 * m + 114) % 31) + 1;
  return naIso(new Date(Date.UTC(rok, miesiac - 1, dzien)));
}

/** Dni ustawowo wolne od pracy w Polsce. Wigilia jest wolna od 2025 r. */
export function swieta(rok: number): string[] {
  const w = wielkanoc(rok);
  const stale = ["01-01", "01-06", "05-01", "05-03", "08-15", "11-01", "11-11", "12-25", "12-26"];
  if (rok >= 2025) stale.push("12-24");
  return [
    ...stale.map((x) => `${rok}-${x}`),
    w,
    dodajDni(w, 1), // poniedziałek wielkanocny
    dodajDni(w, 49), // Zielone Świątki
    dodajDni(w, 60), // Boże Ciało
  ].sort();
}

export function dzienWolny(iso: string): boolean {
  const d = naDate(iso);
  const dt = d.getUTCDay();
  return dt === 0 || dt === 6 || swieta(d.getUTCFullYear()).includes(iso);
}

/** Koniec terminu w sobotę albo dzień ustawowo wolny przesuwa się na najbliższy dzień roboczy (art. 115 KC). */
export function naDzienRoboczy(iso: string): string {
  let d = iso;
  while (dzienWolny(d)) d = dodajDni(d, 1);
  return d;
}

/** Art. 81 ust. 4 i 7 ustawy: kolejna ocena po 24 miesiącach; nieobecność dłuższa niż miesiąc wydłuża termin o swój czas. Koniec w sobotę albo dzień wolny przechodzi na następny dzień roboczy (zasady liczenia terminów KPRM, pkt 3). */
export function terminKolejnejOceny(poprzedniaOcenaAlboZatrudnienie: string, dniDlugiejNieobecnosci = 0): string {
  return naDzienRoboczy(dodajDni(dodajMiesiace(poprzedniaOcenaAlboZatrudnienie, T.ocenaCoMiesiecy.wartosc), dniDlugiejNieobecnosci));
}

/** § 7: rozmowa o kryteriach w 30 dni od poprzedniej oceny albo zatrudnienia, a po ocenie negatywnej w 7 dni. */
export function terminRozmowyOKryteriach(odDnia: string, poOcenieNegatywnej = false): string {
  const dni = poOcenieNegatywnej ? T.rozmowaOKryteriachPoNegatywnejDni.wartosc : T.rozmowaOKryteriachDni.wartosc;
  return naDzienRoboczy(dodajDni(odDnia, dni));
}

/** Art. 81 ust. 9 ustawy: ponowna ocena po upływie 6 miesięcy od zapoznania się z oceną negatywną. Zwraca dzień, w którym mija 6 miesięcy. */
export function koniecOkresuPoOcenieNegatywnej(zapoznanieZOcena: string): string {
  return dodajMiesiace(zapoznanieZOcena, T.ponownaOcenaPoNegatywnejMiesiecy.wartosc);
}

/** Art. 83 ust. 1 ustawy: sprzeciw do dyrektora generalnego w 7 dni od zapoznania się z oceną. */
export function terminSprzeciwu(zapoznanieZOcena: string): string {
  return naDzienRoboczy(dodajDni(zapoznanieZOcena, T.sprzeciwDni.wartosc));
}

/** Art. 83 ust. 3 ustawy: sprzeciw rozpatruje się w 14 dni od wniesienia. */
export function terminRozpatrzeniaSprzeciwu(wniesienie: string): string {
  return naDzienRoboczy(dodajDni(wniesienie, T.rozpatrzenieSprzeciwuDni.wartosc));
}

/** Art. 83 ust. 5 ustawy: odwołanie do sądu pracy w 14 dni od doręczenia decyzji albo upływu terminu na rozpatrzenie. */
export function terminOdwolaniaDoSadu(doreczenieAlboUplywTerminu: string): string {
  return naDzienRoboczy(dodajDni(doreczenieAlboUplywTerminu, T.odwolanieDoSaduPracyDni.wartosc));
}
