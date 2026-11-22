import { describe, expect, test } from "bun:test";
import { rulesVersion } from "./rules";
import {
  CRITERIA,
  selectableCriteria,
  mandatoryCriteria,
  validateAdditionalCriteria,
  computeAssessment,
} from "./scoring";
import {
  addMonths,
  isDayOff,
  periodEndAfterNegative,
  nextAssessmentDeadline,
  criteriaTalkDeadline,
  objectionDeadline,
  easter,
} from "./deadlines";

const C = mandatoryCriteria("C");
const scores = (points: number[], ids = C) => Object.fromEntries(points.map((p, i) => [ids[i], p]));

describe("kryteria (załącznik nr 1, § 4)", () => {
  test("załącznik nr 1 ma 14 kryteriów, każde z opisem", () => {
    expect(CRITERIA.length).toBe(14);
    expect(CRITERIA.every((k) => k.description.length >= 2)).toBe(true);
    expect(CRITERIA.map((k) => k.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });
  test("arkusz A ma 6 kryteriów obowiązkowych, B i C po 5", () => {
    expect(mandatoryCriteria("A").length).toBe(6);
    expect(mandatoryCriteria("B").length).toBe(5);
    expect(C).toEqual(["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja"]);
  });
  test("do wyboru zostaje reszta załącznika", () => {
    expect(selectableCriteria("C").length).toBe(9);
    expect(selectableCriteria("A").length).toBe(8);
  });
  test("najwyżej 3 dodatkowe, bez powtórek i bez obowiązkowych", () => {
    expect(validateAdditionalCriteria("C", ["kreatywnosc", "negocjowanie", "myslenie-analityczne"])).toEqual([]);
    expect(validateAdditionalCriteria("C", ["kreatywnosc", "negocjowanie", "myslenie-analityczne", "sytuacje-kryzysowe"]).length).toBe(1);
    expect(validateAdditionalCriteria("C", ["komunikacja"]).length).toBe(1);
    expect(validateAdditionalCriteria("C", ["cos-innego"]).length).toBe(1);
  });
});

describe("wyliczenie oceny (§ 11 ust. 1)", () => {
  test("same piątki: na poziomie oczekiwań, pozytywna", () => {
    const w = computeAssessment(scores([5, 5, 5, 5, 5]));
    expect(w.mean).toBe(5);
    expect(w.overallLevel).toBe("na poziomie oczekiwań");
    expect(w.outcome).toBe("positive");
    expect(w.justificationRequired).toBe(false);
  });
  test("jedna jedynka daje ocenę negatywną mimo średniej 7,4", () => {
    const w = computeAssessment(scores([9, 9, 9, 9, 1]));
    expect(w.mean).toBeCloseTo(7.4);
    expect(w.overallLevel).toBe("powyżej oczekiwań");
    expect(w.outcome).toBe("negative");
    expect(w.justificationRequired).toBe(true);
  });
  test("średnia 4,2 jest pozytywna, 3,8 negatywna", () => {
    expect(computeAssessment(scores([3, 3, 5, 5, 5])).outcome).toBe("positive");
    expect(computeAssessment(scores([3, 3, 3, 5, 5])).outcome).toBe("negative");
  });
  test("średnia równa dokładnie 4 jest negatywna", () => {
    const w = computeAssessment(scores([3, 3, 5, 5, 5, 3], [...C, "kreatywnosc"]));
    expect(w.mean).toBe(4);
    expect(w.overallLevel).toBe("poniżej oczekiwań");
    expect(w.outcome).toBe("negative");
  });
  test("kryterium dodatkowe potrafi odwrócić wynik z pozytywnego na negatywny", () => {
    const without = computeAssessment(scores([3, 3, 5, 5, 5]));
    const withExtra = computeAssessment(scores([3, 3, 5, 5, 5, 3], [...C, "kreatywnosc"]));
    expect([without.outcome, withExtra.outcome]).toEqual(["positive", "negative"]);
  });
  test("granice poziomów: 2, 6, 8", () => {
    expect(computeAssessment(scores([1, 1, 3, 3], C.slice(0, 4))).overallLevel).toBe("znacznie poniżej oczekiwań");
    expect(computeAssessment(scores([5, 7, 5, 7], C.slice(0, 4))).overallLevel).toBe("na poziomie oczekiwań");
    expect(computeAssessment(scores([7, 9, 7, 9], C.slice(0, 4))).overallLevel).toBe("powyżej oczekiwań");
    expect(computeAssessment(scores([9, 9, 9, 9, 9])).overallLevel).toBe("znacznie powyżej oczekiwań");
  });
  test("odrzuca punkty spoza skali i nieznane kryteria", () => {
    expect(() => computeAssessment(scores([4, 5, 5, 5, 5]))).toThrow();
    expect(() => computeAssessment({ wymyslone: 5 })).toThrow();
    expect(() => computeAssessment({})).toThrow();
  });
});

describe("terminy (art. 81 i 83 ustawy, § 7, art. 110–115 KC)", () => {
  test("przykład z FAQ służby cywilnej: ocena 4 kwietnia 2016, kolejna 4 kwietnia 2018", () => {
    expect(nextAssessmentDeadline("2016-04-04", 0)).toBe("2018-04-04");
  });
  test("koniec miesiąca: 31 sierpnia + 6 miesięcy to ostatni dzień lutego", () => {
    expect(addMonths("2026-08-31", 6)).toBe("2027-02-28");
  });
  test("ponowna ocena przypada w pierwszym dniu po upływie 6 miesięcy", () => {
    expect(periodEndAfterNegative("2015-02-15")).toBe("2015-08-16");
    expect(periodEndAfterNegative("2026-11-22")).toBe("2027-05-23");
    expect(periodEndAfterNegative("2026-08-31")).toBe("2027-03-01");
  });
  test("nieobecność dłuższa niż miesiąc wydłuża termin o swój czas", () => {
    expect(nextAssessmentDeadline("2026-01-10", 45)).toBe("2028-02-24");
  });
  test("termin oceny wypadający w sobotę przechodzi na poniedziałek (zasady liczenia terminów KPRM, pkt 3)", () => {
    expect(nextAssessmentDeadline("2024-03-16", 0)).toBe("2026-03-16");
    expect(nextAssessmentDeadline("2024-03-16", 33)).toBe("2026-04-20");
  });
  test("sprzeciw: 7 dni, a koniec w sobotę przechodzi na poniedziałek", () => {
    expect(objectionDeadline("2026-11-13")).toBe("2026-11-20");
    expect(objectionDeadline("2026-11-14")).toBe("2026-11-23");
  });
  test("sprzeciw kończący się w Wigilię 2026 przechodzi na 28 grudnia", () => {
    expect(objectionDeadline("2026-12-17")).toBe("2026-12-28");
  });
  test("rozmowa o kryteriach: 30 dni, po ocenie negatywnej 7 dni", () => {
    expect(criteriaTalkDeadline("2026-11-02", false)).toBe("2026-12-02");
    expect(criteriaTalkDeadline("2026-11-02", true)).toBe("2026-11-09");
  });
  test("Wielkanoc i święta ruchome", () => {
    expect(easter(2026)).toBe("2026-04-05");
    expect(easter(2027)).toBe("2027-03-28");
    expect(isDayOff("2027-03-29")).toBe(true); // poniedziałek wielkanocny
    expect(isDayOff("2027-05-27")).toBe(true); // Boże Ciało
    expect(isDayOff("2026-11-19")).toBe(false);
  });
});

describe("wersja reguł", () => {
  test("rulesVersion: rozporządzenie obowiązuje od 2016-04-23", () => {
    const v = rulesVersion();
    expect(v.effectiveFrom).toBe("2016-04-23");
    expect(v.version).toBe("2016-470/1");
    expect(v.act).toContain("ocen okresowych");
  });
});
