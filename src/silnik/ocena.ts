// Reguły oceny okresowej z rozporządzenia PRM z 4 kwietnia 2016 r. (Dz.U. 2016 poz. 470).
// Zasada produktu: wynik liczy ten kod, nigdy model językowy.
import dane from "../../reguly/rozporzadzenie-2016-470.json";

export type Arkusz = "A" | "B" | "C";
export type Wynik = "pozytywna" | "negatywna";

export const PUNKTY = [1, 3, 5, 7, 9] as const;

export interface Kryterium {
  id: string;
  nr: number;
  nazwa: string;
  opis: string[];
}

export const KRYTERIA: Kryterium[] = dane.kryteria;

export function kryterium(id: string): Kryterium {
  const k = KRYTERIA.find((x) => x.id === id);
  if (!k) throw new Error(`Nie ma kryterium „${id}” w załączniku nr 1`);
  return k;
}

/** § 4: kryteria obowiązkowe zależą od arkusza (A, B, C). */
export function kryteriaObowiazkowe(arkusz: Arkusz): string[] {
  return [...dane.arkusze[arkusz].kryteriaObowiazkowe];
}

/** Kryteria, które oceniający może dobrać do danego arkusza (§ 5 ust. 2). */
export function kryteriaDoWyboru(arkusz: Arkusz): string[] {
  const obowiazkowe = new Set(kryteriaObowiazkowe(arkusz));
  return KRYTERIA.map((k) => k.id).filter((id) => !obowiazkowe.has(id));
}

/** Zwraca listę problemów z zestawem kryteriów dodatkowych. Pusta lista = zestaw zgodny z § 5 ust. 2. */
export function sprawdzKryteriaDodatkowe(arkusz: Arkusz, dodatkowe: string[]): string[] {
  const problemy: string[] = [];
  const obowiazkowe = new Set(kryteriaObowiazkowe(arkusz));
  if (dodatkowe.length > dane.maksKryteriowDodatkowych) {
    problemy.push(`Można wybrać najwyżej ${dane.maksKryteriowDodatkowych} kryteria dodatkowe (§ 5 ust. 2).`);
  }
  if (new Set(dodatkowe).size !== dodatkowe.length) {
    problemy.push("To samo kryterium dodatkowe wybrano dwa razy.");
  }
  for (const id of dodatkowe) {
    if (!KRYTERIA.some((k) => k.id === id)) problemy.push(`Kryterium „${id}” nie ma w załączniku nr 1.`);
    else if (obowiazkowe.has(id)) problemy.push(`Kryterium „${kryterium(id).nazwa}” jest już obowiązkowe w arkuszu ${arkusz}.`);
  }
  return problemy;
}

export interface WynikOceny {
  /** Suma i liczba ocen cząstkowych. Średnią porównujemy na liczbach całkowitych, bez zaokrągleń. */
  suma: number;
  liczba: number;
  srednia: number;
  poziomOgolny: string;
  wynik: Wynik;
  /** Dlaczego wynik jest taki, a nie inny (do pokazania oceniającemu). */
  powody: string[];
  /** § 11 ust. 3: uzasadnienie jest obowiązkowe przy ocenie negatywnej. */
  uzasadnienieObowiazkowe: boolean;
}

/**
 * § 11 ust. 1: średnia arytmetyczna ocen cząstkowych, poziom ogólny, ocena pozytywna albo negatywna.
 * Uwaga na dwie pułapki z przepisu:
 * 1. jedna ocena cząstkowa „1” daje ocenę negatywną nawet przy wysokiej średniej (pkt 3 i 4),
 * 2. średnia równa dokładnie 4 to jeszcze „poniżej oczekiwań”, czyli ocena negatywna (pkt 2 lit. b).
 */
export function wyliczOcene(czastkowe: Record<string, number>): WynikOceny {
  const wpisy = Object.entries(czastkowe);
  if (wpisy.length === 0) throw new Error("Brak ocen cząstkowych");
  for (const [id, p] of wpisy) {
    kryterium(id);
    if (!(PUNKTY as readonly number[]).includes(p)) {
      throw new Error(`Ocena cząstkowa za „${id}” musi wynosić 1, 3, 5, 7 albo 9 (jest ${p})`);
    }
  }
  const liczba = wpisy.length;
  const suma = wpisy.reduce((s, [, p]) => s + p, 0);

  let poziomOgolny: string;
  if (suma <= 2 * liczba) poziomOgolny = "znacznie poniżej oczekiwań";
  else if (suma <= 4 * liczba) poziomOgolny = "poniżej oczekiwań";
  else if (suma <= 6 * liczba) poziomOgolny = "na poziomie oczekiwań";
  else if (suma <= 8 * liczba) poziomOgolny = "powyżej oczekiwań";
  else poziomOgolny = "znacznie powyżej oczekiwań";

  const powody: string[] = [];
  const jedynki = wpisy.filter(([, p]) => p === 1).map(([id]) => kryterium(id).nazwa);
  const sredniaZaNiska = suma <= 4 * liczba;
  if (sredniaZaNiska) {
    powody.push(`Ogólny poziom spełniania kryteriów: ${poziomOgolny} (§ 11 ust. 1 pkt 4).`);
  }
  if (jedynki.length > 0) {
    powody.push(`Ocena cząstkowa „znacznie poniżej oczekiwań” za: ${jedynki.join(", ")} (§ 11 ust. 1 pkt 4).`);
  }
  const wynik: Wynik = sredniaZaNiska || jedynki.length > 0 ? "negatywna" : "pozytywna";
  if (wynik === "pozytywna") {
    powody.push(`Ogólny poziom: ${poziomOgolny}, bez oceny cząstkowej „znacznie poniżej oczekiwań” (§ 11 ust. 1 pkt 3).`);
  }

  return {
    suma,
    liczba,
    srednia: suma / liczba,
    poziomOgolny,
    wynik,
    powody,
    uzasadnienieObowiazkowe: wynik === "negatywna",
  };
}
