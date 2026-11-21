import { describe, expect, test } from "bun:test";
import {
  KRYTERIA,
  kryteriaDoWyboru,
  kryteriaObowiazkowe,
  sprawdzKryteriaDodatkowe,
  wyliczOcene,
} from "./ocena";
import {
  dodajMiesiace,
  dzienWolny,
  koniecOkresuPoOcenieNegatywnej,
  terminKolejnejOceny,
  terminRozmowyOKryteriach,
  terminSprzeciwu,
  wielkanoc,
} from "./terminy";

const C = kryteriaObowiazkowe("C");
const oceny = (punkty: number[], ids = C) => Object.fromEntries(punkty.map((p, i) => [ids[i], p]));

describe("kryteria (załącznik nr 1, § 4)", () => {
  test("załącznik nr 1 ma 14 kryteriów, każde z opisem", () => {
    expect(KRYTERIA.length).toBe(14);
    expect(KRYTERIA.every((k) => k.opis.length >= 2)).toBe(true);
    expect(KRYTERIA.map((k) => k.nr)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });
  test("arkusz A ma 6 kryteriów obowiązkowych, B i C po 5", () => {
    expect(kryteriaObowiazkowe("A").length).toBe(6);
    expect(kryteriaObowiazkowe("B").length).toBe(5);
    expect(C).toEqual(["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja"]);
  });
  test("do wyboru zostaje reszta załącznika", () => {
    expect(kryteriaDoWyboru("C").length).toBe(9);
    expect(kryteriaDoWyboru("A").length).toBe(8);
  });
  test("najwyżej 3 dodatkowe, bez powtórek i bez obowiązkowych", () => {
    expect(sprawdzKryteriaDodatkowe("C", ["kreatywnosc", "negocjowanie", "myslenie-analityczne"])).toEqual([]);
    expect(sprawdzKryteriaDodatkowe("C", ["kreatywnosc", "negocjowanie", "myslenie-analityczne", "sytuacje-kryzysowe"]).length).toBe(1);
    expect(sprawdzKryteriaDodatkowe("C", ["komunikacja"]).length).toBe(1);
    expect(sprawdzKryteriaDodatkowe("C", ["cos-innego"]).length).toBe(1);
  });
});

describe("wyliczenie oceny (§ 11 ust. 1)", () => {
  test("same piątki: na poziomie oczekiwań, pozytywna", () => {
    const w = wyliczOcene(oceny([5, 5, 5, 5, 5]));
    expect(w.srednia).toBe(5);
    expect(w.poziomOgolny).toBe("na poziomie oczekiwań");
    expect(w.wynik).toBe("pozytywna");
    expect(w.uzasadnienieObowiazkowe).toBe(false);
  });
  test("jedna jedynka daje ocenę negatywną mimo średniej 7,4", () => {
    const w = wyliczOcene(oceny([9, 9, 9, 9, 1]));
    expect(w.srednia).toBeCloseTo(7.4);
    expect(w.poziomOgolny).toBe("powyżej oczekiwań");
    expect(w.wynik).toBe("negatywna");
    expect(w.uzasadnienieObowiazkowe).toBe(true);
  });
  test("średnia 4,2 jest pozytywna, 3,8 negatywna", () => {
    expect(wyliczOcene(oceny([3, 3, 5, 5, 5])).wynik).toBe("pozytywna");
    expect(wyliczOcene(oceny([3, 3, 3, 5, 5])).wynik).toBe("negatywna");
  });
  test("średnia równa dokładnie 4 jest negatywna", () => {
    const w = wyliczOcene(oceny([3, 3, 5, 5, 5, 3], [...C, "kreatywnosc"]));
    expect(w.srednia).toBe(4);
    expect(w.poziomOgolny).toBe("poniżej oczekiwań");
    expect(w.wynik).toBe("negatywna");
  });
  test("kryterium dodatkowe potrafi odwrócić wynik z pozytywnego na negatywny", () => {
    const bez = wyliczOcene(oceny([3, 3, 5, 5, 5]));
    const z = wyliczOcene(oceny([3, 3, 5, 5, 5, 3], [...C, "kreatywnosc"]));
    expect([bez.wynik, z.wynik]).toEqual(["pozytywna", "negatywna"]);
  });
  test("granice poziomów: 2, 6, 8", () => {
    expect(wyliczOcene(oceny([1, 1, 3, 3], C.slice(0, 4))).poziomOgolny).toBe("znacznie poniżej oczekiwań");
    expect(wyliczOcene(oceny([5, 7, 5, 7], C.slice(0, 4))).poziomOgolny).toBe("na poziomie oczekiwań");
    expect(wyliczOcene(oceny([7, 9, 7, 9], C.slice(0, 4))).poziomOgolny).toBe("powyżej oczekiwań");
    expect(wyliczOcene(oceny([9, 9, 9, 9, 9])).poziomOgolny).toBe("znacznie powyżej oczekiwań");
  });
  test("odrzuca punkty spoza skali i nieznane kryteria", () => {
    expect(() => wyliczOcene(oceny([4, 5, 5, 5, 5]))).toThrow();
    expect(() => wyliczOcene({ wymyslone: 5 })).toThrow();
    expect(() => wyliczOcene({})).toThrow();
  });
});

describe("terminy (art. 81 i 83 ustawy, § 7, art. 110–115 KC)", () => {
  test("przykład z FAQ służby cywilnej: ocena 4 kwietnia 2016, kolejna 4 kwietnia 2018", () => {
    expect(terminKolejnejOceny("2016-04-04")).toBe("2018-04-04");
  });
  test("koniec miesiąca: 31 sierpnia + 6 miesięcy to ostatni dzień lutego", () => {
    expect(dodajMiesiace("2026-08-31", 6)).toBe("2027-02-28");
    expect(koniecOkresuPoOcenieNegatywnej("2026-08-31")).toBe("2027-02-28");
  });
  test("nieobecność dłuższa niż miesiąc wydłuża termin o swój czas", () => {
    expect(terminKolejnejOceny("2026-01-10", 45)).toBe("2028-02-24");
  });
  test("termin oceny wypadający w sobotę przechodzi na poniedziałek (zasady liczenia terminów KPRM, pkt 3)", () => {
    expect(terminKolejnejOceny("2024-03-16")).toBe("2026-03-16");
    expect(terminKolejnejOceny("2024-03-16", 33)).toBe("2026-04-20");
  });
  test("sprzeciw: 7 dni, a koniec w sobotę przechodzi na poniedziałek", () => {
    expect(terminSprzeciwu("2026-11-13")).toBe("2026-11-20");
    expect(terminSprzeciwu("2026-11-14")).toBe("2026-11-23");
  });
  test("sprzeciw kończący się w Wigilię 2026 przechodzi na 28 grudnia", () => {
    expect(terminSprzeciwu("2026-12-17")).toBe("2026-12-28");
  });
  test("rozmowa o kryteriach: 30 dni, po ocenie negatywnej 7 dni", () => {
    expect(terminRozmowyOKryteriach("2026-11-02")).toBe("2026-12-02");
    expect(terminRozmowyOKryteriach("2026-11-02", true)).toBe("2026-11-09");
  });
  test("Wielkanoc i święta ruchome", () => {
    expect(wielkanoc(2026)).toBe("2026-04-05");
    expect(wielkanoc(2027)).toBe("2027-03-28");
    expect(dzienWolny("2027-03-29")).toBe(true); // poniedziałek wielkanocny
    expect(dzienWolny("2027-05-27")).toBe(true); // Boże Ciało
    expect(dzienWolny("2026-11-19")).toBe(false);
  });
});
