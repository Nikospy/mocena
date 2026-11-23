import { describe, expect, test } from "bun:test";
import { cycleState } from "../hr/cycle-state";
import { mandatoryGradeOf } from "../hr/history";
import { RuleVersionConflict, diffRulePacks, publishRulePack } from "../engine/rule-pack";
import { activeRules, defaultRules, type RulePack } from "../engine/rules";
import { timelineRulesVersion } from "../timeline";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html, type App } from "./hr-test-helpers";

function pack(change: (p: any) => void = () => {}, version = "2026-999/2", effectiveFrom = "2026-11-22"): RulePack {
  const copy = structuredClone(defaultRules) as any;
  copy.version = version;
  copy.effectiveFrom = effectiveFrom;
  change(copy);
  return copy;
}

const publish = (app: App, p: unknown) => call(app, "admin", "/admin/rules/publish", { json: typeof p === "string" ? p : JSON.stringify(p) });
const renamed = (p: any) => {
  p.criteria.find((c: any) => c.id === "komunikacja").name = "ZMIENIONA NAZWA";
  p.overallLevels[2].name = "inny poziom środkowy";
  p.partialScale[2].name = "inna piątka";
};

describe("recenzja W03: wersja obowiązującej oceny", () => {
  test("ponowne sporządzenie oceny: arkusz, eksport i liczenie cykli zostają przy wersji pierwszej oceny", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const before = diffRulePacks(activeRules(), pack()).closedCyclesCount;
    expect((await call(app, "joanna", "/cycles/cycle-katarzyna/objection-outcome", { outcome: "redone" })).status).toBe(303);
    const sheet = await html(app, "joanna", "/cycles/cycle-katarzyna/sheet");
    const exportJson = await html(app, "anna", "/cycles/cycle-katarzyna/assessment/export.json");
    expect(sheet).toContain("sheet-x");
    expect(diffRulePacks(activeRules(), pack()).closedCyclesCount).toBe(before);

    expect((await publish(app, pack((p) => { renamed(p); p.deadlines.objectionReviewDays.value = 30; }))).status).toBe(303);
    expect(await html(app, "joanna", "/cycles/cycle-katarzyna/sheet")).toBe(sheet);
    expect(await html(app, "anna", "/cycles/cycle-katarzyna/assessment/export.json")).toBe(exportJson);
    expect(sheet).not.toContain("ZMIENIONA NAZWA");
  });

  test("terminy i podstawy zatwierdzonych ocen poza /cycles/:id zostają w wersji oceny (kadry, dyrektor, stopień)", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const hrBefore = await html(app, "joanna", "/hr");
    const dgBefore = await html(app, "dyrektor-urzedu", "/");
    const stateBefore = cycleState("cycle-katarzyna");
    const gradeBefore = mandatoryGradeOf("tomasz");
    expect(gradeBefore).not.toBeNull();
    const res = await publish(
      app,
      pack((p) => {
        p.deadlines.objectionReviewDays.value = 30;
        p.deadlines.objectionReviewDays.basis = "nowa podstawa sprzeciwu";
        p.deadlines.objectionDays.basis = "nowa podstawa terminu sprzeciwu";
        p.deadlines.mandatoryGradeDays.value = 60;
        p.deadlines.mandatoryGradeDays.basis = "nowa podstawa stopnia";
        p.approval.gradeRequest.maxGrade = 1;
      }),
    );
    expect(res.status).toBe(303);
    expect(cycleState("cycle-katarzyna")).toEqual(stateBefore);
    expect(await html(app, "dyrektor-urzedu", "/")).toBe(dgBefore);
    expect(mandatoryGradeOf("tomasz")).toEqual(gradeBefore);
    const hrAfter = await html(app, "joanna", "/hr");
    expect(hrAfter).toBe(hrBefore);
    expect(hrAfter).toContain(`${gradeBefore!.days} dni od zapoznania`);
    expect(hrAfter).not.toContain("nowa podstawa");
  });

  test("oś czasu podaje wersję, według której jest liczona", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    expect((await publish(app, pack((p) => (p.deadlines.assessmentEveryMonths.value = 12)))).status).toBe(303);
    expect(timelineRulesVersion("cycle-piotr").version).toBe("2026-999/2");
    const timeline = await html(app, "piotr", "/cycles/cycle-piotr/timeline");
    expect(timeline).toContain("termin 12 miesięcy");
    await approveAndAcknowledgePiotr(app);
    expect((await publish(app, pack((p) => (p.deadlines.assessmentEveryMonths.value = 18), "2026-999/3", "2026-11-22"))).status).toBe(303);
    expect(activeRules().version).toBe("2026-999/3");
    expect(timelineRulesVersion("cycle-piotr").version).toBe("2026-999/2");
    expect(await html(app, "piotr", "/cycles/cycle-piotr/timeline")).toContain("termin 12 miesięcy");
  });

  test("nowy arkusz i oś czytają liczby i podstawy z reguł, nie z tekstu na sztywno", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    expect(
      (await publish(app, pack((p) => { p.deadlines.objectionDays.value = 14; p.deadlines.objectionDays.basis = "NOWA PODSTAWA 83"; }))).status,
    ).toBe(303);
    await approveAndAcknowledgePiotr(app);
    const sheet = await html(app, "joanna", "/cycles/cycle-piotr/sheet");
    expect(sheet).toContain("14 dni od dnia zapoznania się z oceną (NOWA PODSTAWA 83)");
    expect(sheet).not.toContain("7 dni od dnia zapoznania");
  });
});

describe("recenzja W03: walidacja", () => {
  const rejected: [string, (p: any) => void, string][] = [
    ["powtórzone nazwy poziomów ogólnych", (p) => { p.overallLevels[2].name = "X"; p.overallLevels[3].name = "x"; }, "muszą być różne"],
    ["powtórzone nazwy skali", (p) => (p.partialScale[1].name = p.partialScale[0].name), "muszą być różne"],
    ["klucz z prototypu", (p) => (p.toString = "boom"), "Nieznane pole"],
    ["adres javascript:", (p) => (p.source.url = "javascript:alert(1)"), "http lub https"],
    ["puste tematy rozmowy", (p) => (p.criteriaConversation.topics = []), "nie może być pusta"],
    ["puste appliesTo", (p) => (p.objectionRedo.notLower.appliesTo = []), "nie może być pusta"],
    ["obce pole w kryterium", (p) => (p.criteria[0].injected = 1), "Nieznane pole"],
    ["obce pole w arkuszu", (p) => (p.sheets.A.injected = 1), "Nieznane pole"],
    ["obce pole w skali", (p) => (p.partialScale[0].injected = 1), "Nieznane pole"],
    ["obce pole w poziomie", (p) => (p.overallLevels[0].injected = 1), "Nieznane pole"],
    ["wersja z ukośnikiem na końcu", (p) => (p.version = "2026/"), "zaczyna się i kończy"],
  ];
  for (const [name, change, expected] of rejected) {
    test(name, async () => {
      const { app, db } = createTestApp({ today: "2026-11-22" });
      const res = await publish(app, pack(change));
      expect(res.status).toBe(422);
      expect(await res.text()).toContain(expected);
      expect(db.query("SELECT count(*) AS n FROM rule_versions").get()).toEqual({ n: 0 });
    });
  }

  test("po opublikowaniu pakietu z kluczem z prototypu nie powstaje blokada: zły pakiet odpada, dobry przechodzi", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    expect((await publish(app, pack((p) => (p.toString = "boom")))).status).toBe(422);
    expect((await publish(app, pack())).status).toBe(303);
    expect((await publish(app, pack(() => {}, "2026-999/3", "2026-11-23"))).status).toBe(303);
  });

  test("poprawka tego samego dnia: remis dat rozstrzyga nowsza publikacja", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    expect((await publish(app, pack(undefined, "2026-999/2", "2026-11-22"))).status).toBe(303);
    expect((await publish(app, pack((p) => (p.deadlines.objectionDays.value = 20), "2026-999/3", "2026-11-22"))).status).toBe(303);
    expect(activeRules().version).toBe("2026-999/3");
  });

  test("równoległa publikacja tej samej wersji kończy się konfliktem, nie zapisem", () => {
    createTestApp({ today: "2026-11-22" });
    publishRulePack(pack(), "admin");
    expect(() => publishRulePack(pack(), "admin")).toThrow(RuleVersionConflict);
  });
});

describe("recenzja W03: ekran publikacji", () => {
  test("baner po publikacji wersji zaplanowanej podaje nową wersję i jej datę", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const res = await publish(app, pack(undefined, "2026-999/3", "2026-12-01"));
    const loc = res.headers.get("location")!;
    expect(loc).toContain("2026-999%2F3");
    const page = await html(app, "admin", loc);
    expect(page).toContain("2026-999/3");
    expect(page).toContain("zaplanowana na 01.12.2026");
    expect(page).not.toContain("obowiązuje od 23.04.2016.");
    const now = await publish(app, pack(undefined, "2026-999/4", "2026-11-22"));
    expect(await html(app, "admin", now.headers.get("location")!)).toContain("obowiązuje od 22.11.2026");
  });

  test("formularz publikacji jest multipart, a duży pakiet z polskimi znakami przechodzi publikację", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const next = pack((p) => (p.criteria[0].description[0] = "ł".repeat(110_000)));
    const form = new FormData();
    form.set("json", JSON.stringify(next, null, 2));
    const preview = await app.request("/admin/rules/preview", { method: "POST", headers: { cookie: "person_id=admin" }, body: form });
    expect(preview.status).toBe(200);
    expect(await preview.text()).toContain('action="/admin/rules/publish" enctype="multipart/form-data"');
    const pub = await app.request("/admin/rules/publish", { method: "POST", headers: { cookie: "person_id=admin" }, body: form, redirect: "manual" });
    expect(pub.status).toBe(303);
  });
});
