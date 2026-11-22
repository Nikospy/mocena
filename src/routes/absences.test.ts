import { describe, expect, test } from "bun:test";
import { buildAssessmentSnapshot } from "../assessment/snapshot";
import type { AssessmentDraft } from "../assessment/state";
import { cycleById, effectiveDeadline } from "../cycles";
import { cycleLinks } from "../cycle-links";
import { seedEvent } from "../events";
import { personById } from "../people";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

const PIOTR = "cycle-piotr";
const FIRST = { from: "2026-10-05", to: "2026-10-16", excused: "1" };
const SECOND = { from: "2026-10-19", to: "2026-11-06", excused: "1" };
const rows = (db: ReturnType<typeof createTestApp>["db"]) => db.query("SELECT * FROM absences WHERE person_id = 'piotr'").all() as Record<string, unknown>[];

describe("ścieżka kadr: /hr → Wpisz nieobecność → oś → drugi wpis", () => {
  test("dwa wpisy dają ten sam termin 30.12.2026 w effectiveDeadline, na /hr i na osi", async () => {
    const { app, db } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    expect(effectiveDeadline(PIOTR).date).toBe("2026-11-27");

    const hr = await html(app, "joanna", "/hr");
    expect(hr).toContain(`href="/cycles/${PIOTR}/absences"`);
    expect(hr).toContain("Wpisz nieobecność");
    expect((await call(app, "joanna", `/cycles/${PIOTR}/absences`)).status).toBe(200);

    const r1 = await call(app, "joanna", `/cycles/${PIOTR}/absences`, FIRST);
    expect(r1.status).toBe(303);
    expect(r1.headers.get("location")).toStartWith(`/cycles/${PIOTR}/timeline`);
    const mid = await html(app, "joanna", `/cycles/${PIOTR}/timeline`);
    expect(mid).toContain("Nie dłużej niż miesiąc: termin bez zmian");
    expect(mid).toContain("Wpisz nieobecność");

    expect((await call(app, "joanna", `/cycles/${PIOTR}/absences`, SECOND)).status).toBe(303);
    expect(rows(db)).toHaveLength(2);

    expect(effectiveDeadline(PIOTR).date).toBe("2026-12-30");
    expect(await html(app, "joanna", "/hr")).toContain("30.12.2026");
    const tl = await html(app, "joanna", `/cycles/${PIOTR}/timeline`);
    expect(tl).toContain("30.12.2026");
    expect(tl).toContain("05.10.2026–06.11.2026");
    expect(tl).toContain("(33 dni)");
    expect(tl).toContain("dłużej niż miesiąc");
    expect(tl).toContain("art. 81 ust. 7");
    expect(tl.replace(/<[^>]+>/g, "")).toContain("Zasady z rozporządzenia z 2016 r., wersja 1, obowiązują od 23.04.2016");

    const sheet = await html(app, "joanna", `/cycles/${PIOTR}/sheet`);
    expect(sheet).toContain("30.12.2026");
  });

  test("oceniany widzi nowy termin i podstawę, bez dat nieobecności i liczby dni; oceniający widzi daty", async () => {
    const { app } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    await call(app, "joanna", `/cycles/${PIOTR}/absences`, FIRST);
    await call(app, "joanna", `/cycles/${PIOTR}/absences`, SECOND);
    const mine = await html(app, "piotr", `/cycles/${PIOTR}/timeline`);
    expect(mine).toContain("30.12.2026");
    expect(mine).toContain("art. 81 ust. 7");
    expect(mine).not.toContain("05.10.2026");
    expect(mine).not.toContain("33 dni");
    expect(mine).not.toContain("Wpisz nieobecność");
    const boss = await html(app, "marek", `/cycles/${PIOTR}/timeline`);
    expect(boss).toContain("05.10.2026–06.11.2026");
    expect(boss).not.toContain("Wpisz nieobecność");
  });

  test("żadne rozpatrywane żądanie nie wymaga /part1, a odnośniki zależą od roli", () => {
    createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    const cycle = cycleById(PIOTR)!;
    const joanna = cycleLinks(cycle, personById("joanna")!).map((l) => l.href);
    expect(joanna).toContain(`/cycles/${PIOTR}/timeline`);
    expect(joanna).toContain(`/cycles/${PIOTR}/absences`);
    const piotr = cycleLinks(cycle, personById("piotr")!).map((l) => l.href);
    expect(piotr).toContain(`/cycles/${PIOTR}/timeline`);
    expect(piotr.some((h) => h.includes("/absences") || h.includes("/appraiser"))).toBe(false);
  });
});

describe("kody odpowiedzi i zasady", () => {
  test("403 bez roli kadr, nic nie zapisane", async () => {
    const { app, db } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    for (const who of ["marek", "piotr", "tomasz"]) {
      expect((await call(app, who, `/cycles/${PIOTR}/absences`, FIRST)).status).toBe(403);
    }
    expect(rows(db)).toHaveLength(0);
  });

  test("422 z formularzem i komunikatem przy polu; zły zakres nie zapisuje", async () => {
    const { app, db } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    const r = await call(app, "joanna", `/cycles/${PIOTR}/absences`, { from: "2026-10-20", to: "2026-10-19", excused: "1" });
    expect(r.status).toBe(422);
    expect(await r.text()).toContain("Data końca nie może być wcześniejsza niż data początku");
    expect((await call(app, "joanna", `/cycles/${PIOTR}/absences`, { from: "", to: "2026-10-19" })).status).toBe(422);
    expect(rows(db)).toHaveLength(0);
  });

  test("409 dla zamkniętego cyklu (po zapoznaniu), nic nie zapisane", async () => {
    const { app, db } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    expect((await call(app, "joanna", `/cycles/${PIOTR}/absences`, FIRST)).status).toBe(409);
    expect(rows(db)).toHaveLength(0);
    const links = cycleLinks(cycleById(PIOTR)!, personById("joanna")!).map((l) => l.href);
    expect(links).toContain(`/cycles/${PIOTR}/timeline`);
    expect(links).not.toContain(`/cycles/${PIOTR}/absences`);
  });

  test("decyzja 10m i zasada 7: brak rodzaju w tabeli, formularzu i zapisie; brak liczb i etykiet przy nazwisku", async () => {
    const { app, db } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    const cols = (db.query("PRAGMA table_info(absences)").all() as { name: string }[]).map((c) => c.name);
    expect(cols).toEqual(["id", "person_id", "date_from", "date_to", "excused", "recorded_on", "recorded_by"]);
    const form = await html(app, "joanna", `/cycles/${PIOTR}/absences`);
    expect(form).not.toMatch(/name="(type|kind|rodzaj)"/);
    expect(form).toContain("Rodzaju nieobecności nie podajesz");
    expect(form).toMatch(/<h1>Wpisz nieobecność: Piotr Wójcik<\/h1>/);

    const r = await call(app, "joanna", `/cycles/${PIOTR}/absences`, { ...FIRST, type: "urlop" });
    expect(r.status).toBe(303);
    expect(JSON.stringify(rows(db))).not.toContain("urlop");
    expect(JSON.stringify(db.query("SELECT payload FROM events WHERE type = 'absence_recorded'").all())).not.toContain("urlop");
    const tl = await html(app, "joanna", `/cycles/${PIOTR}/timeline`);
    expect(tl).toMatch(/<h1>Oś czasu: Piotr Wójcik<\/h1>/);
  });
});

describe("termin po zatwierdzeniu oceny", () => {
  const draft: AssessmentDraft = {
    scores: { "wykorzystywanie-wiedzy": 7, rzetelnosc: 7, "organizacja-pracy": 7, wspolpraca: 7, komunikacja: 7, "orientacja-na-klienta": 7, "myslenie-analityczne": 7 },
    justification: "",
    developmentConclusions: "Kurs.",
    interviewDate: null,
    gradeRequest: { attached: false, motivation: "" },
  };

  test("wpis po zatwierdzeniu zapisuje się (303), a termin zostaje z migawki", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    seedEvent("assessment_approved", PIOTR, "marek", buildAssessmentSnapshot(PIOTR, draft, { asOf: "2026-11-20" }), "2026-11-20");
    const r1 = await call(app, "joanna", `/cycles/${PIOTR}/absences`, FIRST);
    expect(r1.status).toBe(303);
    expect(r1.headers.get("location")).toContain("saved=approved");
    expect((await call(app, "joanna", `/cycles/${PIOTR}/absences`, SECOND)).status).toBe(303);
    expect(rows(db)).toHaveLength(2);

    const tl = await html(app, "joanna", `/cycles/${PIOTR}/timeline`);
    expect(tl).toContain("27.11.2026");
    expect(tl).not.toContain("30.12.2026");
    expect(tl).toContain("05.10.2026–06.11.2026");
    expect(tl).toContain("Ocena jest już zatwierdzona, jej termin się nie zmienia");
    expect(await html(app, "piotr", `/cycles/${PIOTR}/timeline`)).toContain("27.11.2026");
  });
});
