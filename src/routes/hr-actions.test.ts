import { describe, expect, test } from "bun:test";
import { currentGrade } from "../people";
import { visibleEvents, visibleEventsOfType } from "../events";
import { createTestApp } from "../test-helpers";
import { call, html } from "./hr-test-helpers";

const fresh = (today = "2026-11-22") => createTestApp({ today });

describe("odnotowanie przyznania stopnia", () => {
  test("Joanna odnotowuje: 303, jedno zdarzenie przy cyklu drugiej oceny, karta znika, historia i arkusz się otwierają", async () => {
    const { app } = fresh();
    expect(await html(app, "joanna", "/hr")).toContain("Odnotuj przyznanie stopnia");
    const r = await call(app, "joanna", "/hr/grades/tomasz", {});
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("/hr");
    const ev = visibleEventsOfType("mandatory_grade_awarded");
    expect(ev).toHaveLength(1);
    expect(ev[0].cycleId).toBe("cycle-tomasz");
    expect(ev[0].payload).toEqual({ personId: "tomasz", fromGrade: 5, toGrade: 6, basis: "art. 89 ust. 2 ustawy" });
    expect(currentGrade("tomasz").grade).toBe(6);
    expect(await html(app, "joanna", "/hr")).not.toContain("Obowiązek urzędu");
    expect((await call(app, "joanna", "/people/tomasz/history")).status).toBe(200);
    expect((await call(app, "joanna", "/cycles/cycle-tomasz/sheet")).status).toBe(200);
  });

  test("drugie kliknięcie 409 bez nowego zdarzenia; Piotr 403; nieznana osoba 404; osoba bez obowiązku 409", async () => {
    const { app } = fresh();
    await call(app, "joanna", "/hr/grades/tomasz", {});
    expect((await call(app, "joanna", "/hr/grades/tomasz", {})).status).toBe(409);
    expect(visibleEventsOfType("mandatory_grade_awarded")).toHaveLength(1);
    expect((await call(app, "piotr", "/hr/grades/tomasz", {})).status).toBe(403);
    expect((await call(app, "joanna", "/hr/grades/nikt", {})).status).toBe(404);
    expect((await call(app, "joanna", "/hr/grades/piotr", {})).status).toBe(409);
  });
});

describe("rozstrzygnięcie sprzeciwu", () => {
  test("nieznana wartość 422, rejected 303 i stan, powtórzenie 409", async () => {
    const { app } = fresh();
    const url = "/cycles/cycle-katarzyna/objection-outcome";
    expect((await call(app, "joanna", url, { outcome: "xyz" })).status).toBe(422);
    expect(visibleEvents("cycle-katarzyna").filter((e) => e.type === "objection_resolved")).toHaveLength(0);
    const r = await call(app, "joanna", url, { outcome: "rejected" });
    expect(r.status).toBe(303);
    expect(await html(app, "joanna", "/hr")).toContain("sprzeciw nieuwzględniony");
    expect((await call(app, "joanna", url, { outcome: "rejected" })).status).toBe(409);
    expect(visibleEvents("cycle-katarzyna").filter((e) => e.type === "objection_resolved")).toHaveLength(1);
  });

  test("cykl bez sprzeciwu 409 bez zapisu; Piotr 403; nieznany cykl 404", async () => {
    const { app } = fresh();
    expect((await call(app, "joanna", "/cycles/cycle-tomasz/objection-outcome", { outcome: "changed" })).status).toBe(409);
    expect(visibleEvents("cycle-tomasz").filter((e) => e.type === "objection_resolved")).toHaveLength(0);
    expect((await call(app, "piotr", "/cycles/cycle-katarzyna/objection-outcome", { outcome: "changed" })).status).toBe(403);
    expect((await call(app, "joanna", "/cycles/nie-ma/objection-outcome", { outcome: "changed" })).status).toBe(404);
  });
});

describe("statystyki, część III, poprzednie oceny", () => {
  test("blok statystyk bez nazwisk, z terminowością z migawek", async () => {
    const { app } = fresh();
    const h = await html(app, "joanna", "/hr");
    const block = h.slice(h.indexOf('id="statystyki"'));
    for (const name of ["Tomasz", "Kamiński", "Katarzyna", "Anna", "Piotr", "Ewa", "Maria"]) expect(block).not.toContain(name);
    expect(block).toContain("Oceny zatwierdzone w terminie: 5");
    expect(block).toContain("Oceny zatwierdzone po terminie: 0");
    expect(block).toContain("Cykle otwarte po terminie, bez oceny: 1");
  });

  test("poprzednie oceny Piotra i Ewy są widoczne od startu pokazu", async () => {
    const { app } = fresh("2024-12-09");
    const piotr = await html(app, "joanna", "/people/piotr/history");
    expect(piotr).toContain("Ocena z 27.11.2024");
    expect(piotr).toContain("na poziomie oczekiwań");
    expect(await html(app, "joanna", "/people/ewa/history")).toContain("Ocena z 20.11.2024");
  });

  test("część III tylko przy dołączonym wniosku, stopień ze stanu z dnia zatwierdzenia", async () => {
    const { app, db } = fresh();
    expect(await html(app, "joanna", "/cycles/cycle-tomasz/sheet")).not.toContain("Część III");
    db.query(
      "UPDATE events SET payload = json_set(payload, '$.gradeRequest.attached', json('true'), '$.gradeRequest.motivation', 'Wzorowa praca zespołu.') WHERE type = 'assessment_approved' AND cycle_id = 'cycle-tomasz'",
    ).run();
    await call(app, "joanna", "/hr/grades/tomasz", {});
    const h = await html(app, "tomasz", "/cycles/cycle-tomasz/sheet");
    expect(h).toContain("Część III");
    expect(h).toContain("Rok mianowania");
    expect(h).toContain("2016");
    expect(h).toContain("V, przyznany 01.12.2022");
    expect(h).toContain("Wzorowa praca zespołu.");
    expect(h).toContain("art. 89 ust. 1");
    expect(await html(app, "tomasz", "/cycles/cycle-tomasz/sheet?part=1")).not.toContain("Część III");
  });
});
