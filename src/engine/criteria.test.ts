import { describe, expect, test } from "bun:test";
import { officeSettings } from "../office-settings";
import { suggestCriteria } from "../suggestions";
import { CRITERIA } from "./scoring";
import { sheetForPosition, suggestAdditionalCriteria } from "./criteria";

describe("sheetForPosition", () => {
  test("rodzaj stanowiska → arkusz z podstawą", () => {
    expect(sheetForPosition("staff")).toEqual({ sheet: "C", basis: "§ 3 ust. 4" });
    expect(sheetForPosition("manager")).toEqual({ sheet: "B", basis: "§ 3 ust. 3" });
    expect(sheetForPosition("head_of_office")).toEqual({ sheet: "A", basis: "§ 3 ust. 2" });
  });
});

describe("suggestAdditionalCriteria", () => {
  const piotr = ["client-service", "analyses-and-reports", "inter-office-agreements", "official-correspondence"];

  test("obowiązki Piotra: trzy podpowiedzi, bez obowiązkowej komunikacji", () => {
    const items = suggestAdditionalCriteria("C", piotr);
    expect(items.map((i) => i.criterionId)).toEqual(["orientacja-na-klienta", "myslenie-analityczne", "negocjowanie"]);
    for (const i of items) expect(i.because.startsWith("bo w opisie stanowiska jest obowiązek: ")).toBe(true);
    expect(items[0].because).toBe("bo w opisie stanowiska jest obowiązek: obsługa interesantów");
  });

  test("dwa obowiązki do tego samego kryterium dają jedną podpowiedź ze złączonym zdaniem", () => {
    const s = officeSettings();
    const saved = { ...s.dutyToCriterion };
    s.dutyToCriterion["analyses-and-reports"] = "orientacja-na-klienta";
    try {
      const items = suggestAdditionalCriteria("C", ["client-service", "analyses-and-reports"]);
      expect(items).toHaveLength(1);
      expect(items[0].because).toBe("bo w opisie stanowiska jest obowiązek: obsługa interesantów, przygotowywanie analiz i zestawień");
    } finally {
      Object.assign(s.dutyToCriterion, saved);
    }
  });

  test("suggestCriteria oznacza źródło reguł", () => {
    const r = suggestCriteria("C", ["client-service"]);
    expect(r.source).toBe("rules");
    expect(r.items).toHaveLength(1);
  });

  test("tabela urzędu wskazuje tylko istniejące kryteria", () => {
    const ids = new Set(CRITERIA.map((c) => c.id));
    for (const id of Object.values(officeSettings().dutyToCriterion)) expect(ids.has(id)).toBe(true);
  });
});
