import { describe, expect, test } from "bun:test";
import { assessmentState } from "../assessment/state";
import { cycleState } from "../hr/cycle-state";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

const PIOTR_IDS = ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja", "orientacja-na-klienta", "myslenie-analityczne"];

function piotrApprovalForm(score = "7"): Record<string, string> {
  const form: Record<string, string> = { justification: "", developmentConclusions: "Kurs pism urzędowych.", interviewDate: "" };
  for (const id of PIOTR_IDS) form[`score[${id}]`] = score;
  return form;
}

describe("wniesienie sprzeciwu przez ocenianego i rozpatrzenie przez dyrektora generalnego (Z08 + Z17)", () => {
  test("oceniany wnosi sprzeciw w terminie 7 dni, inna osoba 403, brak uzasadnienia 422, powtórzenie 409; dyrektor rozstrzyga na ponowną ocenę", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);

    // Ekran oceny Piotra ma drugorzędny przycisk .btn (nie .btn primary) do wniesienia sprzeciwu i zachowuje #objection-clock.
    const view = await html(app, "piotr", "/cycles/cycle-piotr/assessment");
    expect(view).toContain('id="objection-clock"');
    expect(view).toContain('class="btn full" href="/cycles/cycle-piotr/objection/new">Wnieś sprzeciw</a>');
    expect(view).not.toMatch(/class="btn primary[^"]*"[^>]*>Wnieś sprzeciw/);

    // Inne role nie mogą wnieść sprzeciwu za Piotra (403).
    expect((await call(app, "marek", "/cycles/cycle-piotr/objection/new")).status).toBe(403);
    expect((await call(app, "joanna", "/cycles/cycle-piotr/objection", { reason: "Cudzy sprzeciw" })).status).toBe(403);

    // Puste uzasadnienie: 422 bez zapisu.
    const empty = await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason: "   " });
    expect(empty.status).toBe(422);
    expect(await empty.text()).toContain("Wpisz uzasadnienie sprzeciwu.");
    expect(assessmentState("cycle-piotr").objection).toBeNull();

    // Poprawne wniesienie sprzeciwu w terminie: 303.
    const reason = "Nie zgadzam się z oceną za rzetelność — dwie sprawy były wstrzymane z winy organu zewnętrznego.";
    const filed = await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason });
    expect(filed.status).toBe(303);
    expect(filed.headers.get("location")).toBe("/cycles/cycle-piotr/assessment");

    // Zdarzenie zasila assessmentState, cycleState i timeline.
    expect(assessmentState("cycle-piotr").objection).toMatchObject({ filedOn: "2026-11-22", resolvedOn: null, reason });
    expect(cycleState("cycle-piotr").step).toBe("objection_filed");
    expect(await html(app, "piotr", "/cycles/cycle-piotr/timeline")).toContain("Sprzeciw wniesiony");

    // Art. 83 ust. 1–3: treść uzasadnienia sprzeciwu widzą oceniany, DG i kadry — nie oceniający.
    expect(await html(app, "piotr", "/cycles/cycle-piotr/assessment")).toContain(reason);
    expect(await html(app, "joanna", "/cycles/cycle-piotr/assessment")).toContain(reason);
    expect(await html(app, "marek", "/cycles/cycle-piotr/assessment")).not.toContain(reason);

    // Powtórne wniesienie w tej samej rundzie: 409.
    expect((await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason: "Drugi raz" })).status).toBe(409);

    // Dyrektor generalny ma wgląd w ocenę na czas rozpatrywania otwartego sprzeciwu (200),
    // ale nie widzi przycisku arkusza ani eksportu JSON (trasy /sheet i /export.json dają mu 403).
    const dirAssessmentRes = await call(app, "dyrektor-urzedu", "/cycles/cycle-piotr/assessment");
    expect(dirAssessmentRes.status).toBe(200);
    const dirAssessment = await dirAssessmentRes.text();
    expect(dirAssessment).not.toContain("/sheet?print=1");
    expect(dirAssessment).not.toContain("/assessment/export.json");
    expect(dirAssessment).not.toContain("Drukuj / pobierz arkusz (PDF)");

    // Dyrektor generalny widzi sprawę sprzeciwu na stronie głównej, czyta uzasadnienie i rozstrzyga na „redone”.
    const dirHome = await html(app, "dyrektor-urzedu", "/");
    expect(dirHome).toContain("Rozpatrz sprzeciw");
    expect(dirHome).toContain('href="/cycles/cycle-piotr/objection"');

    const resolvePage = await html(app, "dyrektor-urzedu", "/cycles/cycle-piotr/objection");
    expect(resolvePage).toContain(reason);
    expect(resolvePage).toContain('action="/cycles/cycle-piotr/objection-outcome"');

    // Nieprawidłowy wynik u dyrektora -> 422.
    expect((await call(app, "dyrektor-urzedu", "/cycles/cycle-piotr/objection-outcome", { outcome: "bad" })).status).toBe(422);

    // Rozstrzygnięcie na ponowne sporządzenie oceny -> 303, otwiera drugą ocenę u Marka.
    const res = await call(app, "dyrektor-urzedu", "/cycles/cycle-piotr/objection-outcome", { outcome: "redone" });
    expect(res.status).toBe(303);
    expect(assessmentState("cycle-piotr").redo).not.toBeNull();
    expect(assessmentState("cycle-piotr").stage).toBe("draft");
    expect(await html(app, "marek", "/")).toContain("Sporządź ocenę po raz drugi");
    expect(db.query("SELECT actor_id FROM events WHERE cycle_id = 'cycle-piotr' AND type = 'objection_resolved'").get()).toEqual({
      actor_id: "dyrektor-urzedu",
    });

    // Po rozstrzygnięciu DG nie ma już wglądu w ekran oceny (403).
    expect((await call(app, "dyrektor-urzedu", "/cycles/cycle-piotr/assessment")).status).toBe(403);
  });

  test("drugi sprzeciw od oceny sporządzonej po raz drugi (po redone) jest zablokowany kodem 409 (art. 83 ust. 5)", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);

    // 1. Pierwszy sprzeciw -> redone -> druga ocena -> potwierdzenie zapoznania.
    expect((await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason: "Pierwszy sprzeciw." })).status).toBe(303);
    expect((await call(app, "dyrektor-urzedu", "/cycles/cycle-piotr/objection-outcome", { outcome: "redone" })).status).toBe(303);
    expect((await call(app, "marek", "/cycles/cycle-piotr/assessment/approve", piotrApprovalForm("7"))).status).toBe(303);
    expect((await call(app, "piotr", "/cycles/cycle-piotr/assessment/acknowledge", {})).status).toBe(303);
    expect(assessmentState("cycle-piotr").redo).not.toBeNull();
    expect(assessmentState("cycle-piotr").stage).toBe("acknowledged");

    // 2. Od drugiej oceny nie ma przycisku „Wnieś sprzeciw”, a GET i POST zwracają 409.
    const view = await html(app, "piotr", "/cycles/cycle-piotr/assessment");
    expect(view).not.toContain("/objection/new");
    expect((await call(app, "piotr", "/cycles/cycle-piotr/objection/new")).status).toBe(409);
    const secondPost = await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason: "Próba drugiego sprzeciwu." });
    expect(secondPost.status).toBe(409);
    expect(await secondPost.text()).toContain("art. 83 ust. 5 ustawy");
  });

  test("granica terminu: ostatni dzień terminu (30.11.2026) daje 303, następny dzień (01.12.2026) daje 409", async () => {
    // Przypadek A: dokładnie w ostatnim dniu terminu (30.11.2026) -> 303.
    {
      const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
      await approveAndAcknowledgePiotr(app);
      expect(assessmentState("cycle-piotr").objectionDeadline).toBe("2026-11-30");
      db.query("UPDATE settings SET value = '2026-11-30' WHERE key = 'demo_date'").run();
      expect((await call(app, "piotr", "/cycles/cycle-piotr/objection/new")).status).toBe(200);
      expect((await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason: "Wniesiony w ostatnim dniu." })).status).toBe(303);
    }

    // Przypadek B: dzień po terminie (01.12.2026) -> 409.
    {
      const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
      await approveAndAcknowledgePiotr(app);
      db.query("UPDATE settings SET value = '2026-12-01' WHERE key = 'demo_date'").run();
      expect((await call(app, "piotr", "/cycles/cycle-piotr/objection/new")).status).toBe(409);
      expect((await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason: "Spóźniony sprzeciw" })).status).toBe(409);
      expect(await html(app, "piotr", "/cycles/cycle-piotr/assessment")).not.toContain("/objection/new");
    }
  });

  test("fikcja zapoznania uruchamia 7-dniowy termin sprzeciwu i pozwala ocenianemu wnieść sprzeciw", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    expect((await call(app, "marek", "/cycles/cycle-piotr/assessment/approve", piotrApprovalForm("7"))).status).toBe(303);
    expect(
      (await call(app, "marek", "/cycles/cycle-piotr/assessment/fiction", {
        reason: "could_not",
        deliveryMethod: "post",
        deliveredOn: "2026-11-22",
      })).status,
    ).toBe(303);
    expect(assessmentState("cycle-piotr").stage).toBe("fiction");
    expect(assessmentState("cycle-piotr").objectionDeadline).toBe("2026-11-30");

    expect(await html(app, "piotr", "/cycles/cycle-piotr/assessment")).toContain("/cycles/cycle-piotr/objection/new");
    expect((await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason: "Sprzeciw po fikcji zapoznania." })).status).toBe(303);
    expect(cycleState("cycle-piotr").step).toBe("objection_filed");
  });

  test("kadry mogą rozstrzygnąć sprzeciw (a oceniający dostaje 403); dyrektor spoza id demo też rozpoznawany po stanowisku i traci dostęp po rozstrzygnięciu", async () => {
    // 1. Rozstrzygnięcie przez kadry (joanna) + odmowa 403 dla oceniającego (marek).
    {
      const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
      await approveAndAcknowledgePiotr(app);
      expect((await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason: "Sprzeciw rozpatrywany przez kadry." })).status).toBe(303);
      expect((await call(app, "marek", "/cycles/cycle-piotr/objection")).status).toBe(403);
      expect((await call(app, "marek", "/cycles/cycle-piotr/objection-outcome", { outcome: "rejected" })).status).toBe(403);
      expect((await call(app, "joanna", "/cycles/cycle-piotr/objection")).status).toBe(200);
      const hrRes = await call(app, "joanna", "/cycles/cycle-piotr/objection-outcome", { outcome: "rejected" });
      expect(hrRes.status).toBe(303);
      expect(hrRes.headers.get("location")).toBe("/hr");
      expect(assessmentState("cycle-piotr").objection?.outcome).toBe("rejected");
    }

    // 2. Dyrektor generalny dodany w urzędzie po `init` (inne id niż DEMO_DIRECTOR_GENERAL_ID) zmienia ocenę i traci wgląd po rozstrzygnięciu.
    {
      const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
      db.query(
        "INSERT INTO people (id, name, role, position_title, unit, has_account, position_kind) VALUES ('dg-urzad', 'Janina Nowak', 'appraiser', 'Dyrektor generalny urzędu', 'Biuro Dyrektora Generalnego', 1, 'manager')",
      ).run();
      await approveAndAcknowledgePiotr(app);
      expect((await call(app, "piotr", "/cycles/cycle-piotr/objection", { reason: "Proszę o zmianę oceny." })).status).toBe(303);

      expect(await html(app, "dg-urzad", "/")).toContain('href="/cycles/cycle-piotr/objection"');
      expect((await call(app, "dg-urzad", "/cycles/cycle-piotr/assessment")).status).toBe(200);

      const outcome = await call(app, "dg-urzad", "/cycles/cycle-piotr/objection-outcome", { outcome: "changed" });
      expect(outcome.status).toBe(303);
      expect(outcome.headers.get("location")).toBe("/cycles/cycle-piotr/objection-change");

      const crits = (db.query("SELECT criterion_id AS id FROM cycle_criteria WHERE cycle_id = 'cycle-piotr' ORDER BY rowid").all() as { id: string }[]).map((r) => r.id);
      const form = Object.fromEntries(crits.map((id, idx) => [`score[${id}]`, idx === 0 ? "9" : "7"]));
      const changed = await call(app, "dg-urzad", "/cycles/cycle-piotr/objection-change", form);
      expect(changed.status).toBe(303);
      expect(changed.headers.get("location")).toBe("/cycles/cycle-piotr/objection?resolved=1");

      // Po rozstrzygnięciu DG nie ma już dostępu do ekranu oceny (403), ale widzi potwierdzenie na ekranie sprzeciwu (200).
      expect((await call(app, "dg-urzad", "/cycles/cycle-piotr/assessment")).status).toBe(403);
      expect((await call(app, "dg-urzad", "/cycles/cycle-piotr/objection?resolved=1")).status).toBe(200);
      expect(assessmentState("cycle-piotr").snapshot?.changedOnObjection).toBeTruthy();

      // Po zmianie oceny w trybie sprzeciwu kolejny sprzeciw nie przysługuje (tylko sąd pracy — art. 83 ust. 5).
      expect((await call(app, "piotr", "/cycles/cycle-piotr/objection/new")).status).toBe(409);
    }
  });
});
