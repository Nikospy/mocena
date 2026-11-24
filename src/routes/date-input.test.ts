import { describe, expect, test } from "bun:test";
import { dateInputValue, isoFromInput } from "../date-input";
import { today } from "../settings";
import { createTestApp } from "../test-helpers";
import { call, html } from "./hr-test-helpers";

const PIOTR = "cycle-piotr";

describe("pola dat DD.MM.RRRR: zamiana wpisu", () => {
  test("DD.MM.RRRR, D.M.RRRR, inne separatory i osiem cyfr dają RRRR-MM-DD", () => {
    expect(isoFromInput("11.03.2026")).toBe("2026-03-11");
    expect(isoFromInput(" 5.10.2026 ")).toBe("2026-10-05");
    expect(isoFromInput("05,10,2026")).toBe("2026-10-05");
    expect(isoFromInput("05/10/2026")).toBe("2026-10-05");
    expect(isoFromInput("05-10-2026")).toBe("2026-10-05");
    expect(isoFromInput("05102026")).toBe("2026-10-05");
  });

  test("RRRR-MM-DD przechodzi bez zmian, nierozpoznany wpis też (trasa go odrzuci)", () => {
    expect(isoFromInput("2026-03-11")).toBe("2026-03-11");
    expect(isoFromInput("marzec")).toBe("marzec");
    expect(isoFromInput("")).toBe("");
    expect(isoFromInput("11.03.26")).toBe("11.03.26");
  });

  test("wartość pola: RRRR-MM-DD → DD.MM.RRRR, błędny wpis wraca bez zmian", () => {
    expect(dateInputValue("2026-03-11")).toBe("11.03.2026");
    expect(dateInputValue("31.02.2026")).toBe("31.02.2026");
    expect(dateInputValue(null)).toBe("");
  });
});

describe("pola dat DD.MM.RRRR: trasy", () => {
  test("formularz notatki: pole tekstowe z formatem DD.MM.RRRR zamiast type=date", async () => {
    const { app } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const h = await html(app, "marek", "/people/piotr/notes/new");
    expect(h).not.toContain('type="date"');
    expect(h).toMatch(/<input[^>]*type="text"[^>]*placeholder="DD\.MM\.RRRR"[^>]*id="date"|<input[^>]*id="date"[^>]*placeholder="DD\.MM\.RRRR"/);
    expect(h).toMatch(/<label class="lbl" for="date">Kiedy/);
    expect(h).toContain("(dzień, miesiąc, rok)");
  });

  test("notatka z datą 10.03.2026 zapisuje się z datą 2026-03-10; 31.02.2026 daje 422 z formatem w komunikacie", async () => {
    const { app, db } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const text = "Przejął kolejkę wniosków po odejściu koleżanki i spisał, co jest otwarte.";
    const bad = await call(app, "marek", "/people/piotr/notes", { criterion_id: "wspolpraca", text, rating: "good", date: "31.02.2026" });
    expect(bad.status).toBe(422);
    const bh = await bad.text();
    expect(bh).toContain("Wpisz datę w postaci DD.MM.RRRR");
    expect(bh).toContain('value="31.02.2026"');

    const ok = await call(app, "marek", "/people/piotr/notes", { criterion_id: "wspolpraca", text, rating: "good", date: "10.03.2026" });
    expect(ok.status).toBe(303);
    const row = db.query("SELECT date FROM notes WHERE subject_id = 'piotr' AND text = ?").get(text) as { date: string } | null;
    expect(row?.date).toBe("2026-03-10");
  });

  test("nieobecność wpisana jako DD.MM.RRRR trafia do bazy jako RRRR-MM-DD", async () => {
    const { app, db } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    const form = await html(app, "joanna", `/cycles/${PIOTR}/absences`);
    expect(form).not.toContain('type="date"');
    const r = await call(app, "joanna", `/cycles/${PIOTR}/absences`, { from: "05.10.2026", to: "16.10.2026", excused: "1" });
    expect(r.status).toBe(303);
    expect(db.query("SELECT date_from, date_to FROM absences WHERE person_id = 'piotr'").get()).toEqual({ date_from: "2026-10-05", date_to: "2026-10-16" });
  });

  test("nieobecność: zły wpis wraca do pola z komunikatem o formacie", async () => {
    const { app } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    const r = await call(app, "joanna", `/cycles/${PIOTR}/absences`, { from: "5 października", to: "16.10.2026", excused: "1" });
    expect(r.status).toBe(422);
    const h = await r.text();
    expect(h).toContain("Wpisz datę początku nieobecności w postaci DD.MM.RRRR");
    expect(h).toContain('value="5 października"');
    expect(h).toContain('value="16.10.2026"');
    expect(h).toMatch(/data-date-words-for="to"[^>]*>16 października 2026</);
  });

  test("data pokazu: pole pokazuje DD.MM.RRRR, POST 11.03.2026 przesuwa datę", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    const start = await html(app, "marek", "/");
    expect(start).toMatch(/id="demo-date"[^>]*value="09\.12\.2024"|value="09\.12\.2024"[^>]*id="demo-date"/);
    const r = await app.request("/demo/date", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "date=11.03.2026",
    });
    expect(r.status).toBe(303);
    expect(today()).toBe("2026-03-11");
  });
});
