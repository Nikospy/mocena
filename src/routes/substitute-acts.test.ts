import { describe, expect, test } from "bun:test";
import { visibleEvents } from "../events";
import { createTestApp } from "../test-helpers";

type App = ReturnType<typeof createTestApp>["app"];
const piotr = "cycle-piotr";

async function call(app: App, as: string, path: string, params?: Record<string, string>) {
  const headers: Record<string, string> = { cookie: `person_id=${as}` };
  let body: string | undefined;
  if (params) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(params).toString();
  }
  return app.request(path, { method: params ? "POST" : "GET", headers, body, redirect: "manual" });
}

const PIOTR_IDS = ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja", "orientacja-na-klienta", "myslenie-analityczne"];

function withSubstitution() {
  const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
  db.query("INSERT INTO substitutions (absent_id, substitute_id, date_from, date_to, recorded_on, recorded_by) VALUES ('marek', 'anna', '2026-11-01', '2026-12-31', '2026-11-01', 'joanna')").run();
  return { app, db };
}

describe("zastępca prowadzi czynności oceniającego (ustalenie 6 audytu)", () => {
  test("Anna w zastępstwie Marka otwiera zmianę terminu, zaproszenie, kartę rozmowy oceniającej i „przed rozmową”", async () => {
    const { app } = withSubstitution();
    for (const path of [`/cycles/${piotr}/deadline-change`, `/cycles/${piotr}/invitations/new?kind=opening`, `/cycles/${piotr}/cards/assessment-conversation`, `/cycles/${piotr}/before-meeting`]) {
      expect([path, (await call(app, "anna", path)).status]).toEqual([path, 200]);
    }
    const home = await (await call(app, "anna", "/")).text();
    expect(home).toContain("Wystaw ocenę");
  });

  test("Anna zatwierdza ocenę jako zastępca; zdarzenie ma on_behalf_of", async () => {
    const { app } = withSubstitution();
    const form: Record<string, string> = { justification: "Powód oceny.", developmentConclusions: "Kurs pism urzędowych.", interviewDate: "" };
    for (const id of PIOTR_IDS) form[`score[${id}]`] = "7";
    const r = await call(app, "anna", `/cycles/${piotr}/assessment/approve`, form);
    expect(r.status).toBe(303);
    const ev = visibleEvents(piotr).find((e) => e.type === "assessment_approved");
    expect(ev?.actorId).toBe("anna");
    expect(ev?.payload.on_behalf_of).toBe("marek");
  });

  test("zastępca nie dostaje wglądu w notatki nieobecnego przełożonego", async () => {
    const { app, db } = withSubstitution();
    const note = db.query("SELECT id FROM notes WHERE author_id = 'marek' ORDER BY id LIMIT 1").get() as { id: number } | null;
    expect(note).not.toBeNull();
    expect((await call(app, "anna", `/notes/${note!.id}/feedback`)).status).toBe(403);
    expect(await (await call(app, "anna", "/notes")).text()).not.toContain(`/notes/${note!.id}/`);
  });

  test("po zastępstwie Anna znowu dostaje 403", async () => {
    const { app, db } = withSubstitution();
    db.query("UPDATE substitutions SET date_to = '2026-11-10'").run();
    expect((await call(app, "anna", `/cycles/${piotr}/deadline-change`)).status).toBe(403);
    expect((await call(app, "anna", `/cycles/${piotr}/cards/assessment-conversation`)).status).toBe(403);
  });
});
