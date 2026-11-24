import { describe, expect, test } from "bun:test";
import { openCycle } from "../cycles";
import { seedEvent } from "../events";
import { lastFeedbackDate } from "../notes/repo";
import { createTestApp } from "../test-helpers";

type App = ReturnType<typeof createTestApp>["app"];

async function call(app: App, as: string, path: string, params?: Record<string, string>) {
  const headers: Record<string, string> = { cookie: `person_id=${as}` };
  let body: string | undefined;
  if (params) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(params).toString();
  }
  return app.request(path, { method: params ? "POST" : "GET", headers, body, redirect: "manual" });
}

const STEP2 = "Po odejściu koleżanki 9 marca przejął jej kolejkę wniosków i spisał, co jest otwarte.";
const count = (db: ReturnType<typeof createTestApp>["db"]) => (db.query("SELECT COUNT(*) AS n FROM notes").get() as { n: number }).n;

describe("zapis notatki", () => {
  test("zapisuje wybór człowieka, a wynik adaptera obok; walidacja 422; podpowiedź nie zapisuje", async () => {
    const { app, db } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const before = count(db);
    const sug = await call(app, "marek", "/suggestions/note", { text: STEP2 });
    expect(sug.status).toBe(200);
    const j = (await sug.json()) as { source: string; taskChange: boolean; matched: string[] };
    expect(j.source).toBe("rules");
    expect(j.taskChange).toBe(true);
    expect(j.matched.length).toBeGreaterThan(0);
    expect(count(db)).toBe(before);

    const bad = await call(app, "marek", "/people/piotr/notes", { criterion_id: "wspolpraca", text: "  " });
    expect(bad.status).toBe(422);
    expect(await bad.text()).toContain("Wpisz, co się stało.");
    expect(count(db)).toBe(before);

    // Błędy: podsumowanie z odnośnikami do pól, komunikat przy polu, pola zachowują wartości.
    const both = await (await call(app, "marek", "/people/piotr/notes", { text: "", rating: "good", date: "2026-03-10" })).text();
    expect(both).toContain("Popraw 2 pola");
    expect(both).toContain('href="#text"');
    expect(both).toContain('href="#criterion_id"');
    expect(both).toContain('id="criterion_id"');
    expect(both).toContain('id="text-error"');
    expect(both).toMatch(/<textarea id="text" name="text" rows="5"[^>]*aria-invalid="true" aria-describedby="text-error text-privacy">/);
    expect(both).toContain('value="2026-03-10"');
    expect(both).toMatch(/value="good" checked/);

    const ok = await call(app, "marek", "/people/piotr/notes", { criterion_id: "wspolpraca", text: STEP2, rating: "good" });
    expect(ok.status).toBe(303);
    expect(ok.headers.get("location")).toMatch(/^\/notes\?saved=\d+$/);
    const row = db.query("SELECT * FROM notes ORDER BY id DESC LIMIT 1").get() as Record<string, unknown>;
    expect(row).toMatchObject({ task_change: 0, suggested_task_change: 1, suggestion_source: "rules", cycle_id: "cycle-piotr", created_at: "2026-03-11" });
  });
});

describe("dostęp", () => {
  test("zapis według openCycle: oceniający cyklu, a bez cyklu przełożony", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const form = { criterion_id: "rzetelnosc", text: "Fakt." };
    expect((await call(app, "anna", "/people/piotr/notes", form)).status).toBe(403);
    expect((await call(app, "anna", "/people/piotr/notes/new")).status).toBe(403);
    db.query("UPDATE cycles SET appraiser_id = 'anna' WHERE id = 'cycle-piotr'").run();
    expect((await call(app, "anna", "/people/piotr/notes", form)).status).toBe(303);
    expect((await call(app, "marek", "/people/piotr/notes", form)).status).toBe(403);
    const mine = await (await call(app, "marek", "/notes")).text();
    expect(mine).toContain("Pismo do gminy poszło 11 lutego");
    const hers = await (await call(app, "anna", "/notes")).text();
    expect(hers).not.toContain("Pismo do gminy poszło 11 lutego");

    // Maria: bez cyklu, przełożony Marek.
    expect((await call(app, "anna", "/people/maria/notes", form)).status).toBe(403);
    expect((await call(app, "marek", "/people/maria/notes", form)).status).toBe(303);
    const m = db.query("SELECT cycle_id FROM notes WHERE subject_id = 'maria'").get() as { cycle_id: string | null };
    expect(m.cycle_id).toBeNull();
  });

  test("osoba z zamkniętym cyklem i bez otwartego: zapis przez przełożonego, nie przez dawnego oceniającego", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    db.query("INSERT INTO cycles (id, person_id, appraiser_id, period_start, sheet) VALUES ('cycle-maria', 'maria', 'anna', '2022-01-01', 'C')").run();
    seedEvent("cycle_started", "cycle-maria", "anna", {}, "2022-01-01");
    seedEvent("assessment_acknowledged", "cycle-maria", "maria", {}, "2024-01-10");
    expect(openCycle("maria")).toBeNull();
    expect((await call(app, "marek", "/people/maria/notes", { criterion_id: "rzetelnosc", text: "Fakt." })).status).toBe(303);
    expect((await call(app, "anna", "/people/maria/notes", { criterion_id: "rzetelnosc", text: "Fakt." })).status).toBe(403);
    expect((db.query("SELECT cycle_id FROM notes WHERE subject_id = 'maria'").get() as { cycle_id: string | null }).cycle_id).toBeNull();
  });

  test("Piotr nie widzi notatki Marka na swoim koncie", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const html = await (await call(app, "piotr", "/notes")).text();
    expect(html).not.toContain("Pismo do gminy poszło 11 lutego");
  });
});

describe("zasada 7: przy nazwisku nic poza nazwiskiem", () => {
  test("lista notatek i formularz notatki", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const list = await (await call(app, "marek", "/notes")).text();
    // Osoby z notatkami mają nagłówek karty, osoby bez notatek stoją w zwartej liście (nazwisko w <b>).
    const headings = [...list.matchAll(/<h2>([^<]*)<\/h2>|<div class="pn-who"><b>([^<]*)<\/b>/g)].map((m) => m[1] ?? m[2]);
    expect(headings).toContain("Piotr Wójcik");
    expect(headings).toContain("Maria Dąbrowska");
    for (const h of headings) expect(h).toMatch(/^[^\d:()]+$/);
    for (const [id, name] of [["piotr", "Piotr Wójcik"], ["maria", "Maria Dąbrowska"]]) {
      const html = await (await call(app, "marek", `/people/${id}/notes/new`)).text();
      expect(html).toContain(`<h1>Nowa notatka: ${name}</h1>`);
    }
  });
});

describe("faza 3", () => {
  test("informacja zwrotna: wysyłka, ekran pracownika, uprawnienia", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const id = (db.query("SELECT id FROM notes WHERE date = '2025-02-11'").get() as { id: number }).id;
    const form = await (await call(app, "marek", `/notes/${id}/feedback`)).text();
    expect(form).toContain("Pracownik nie widzi notatki na swoim koncie");
    expect(form.toLowerCase()).not.toContain("prywatn");
    expect((await call(app, "piotr", `/notes/${id}/feedback`)).status).toBe(403);
    expect((await call(app, "anna", `/notes/${id}/feedback`, { text: "x" })).status).toBe(403);
    expect((await call(app, "marek", "/notes/99999/feedback")).status).toBe(404);
    expect((await call(app, "marek", `/notes/${id}/feedback`, { text: " " })).status).toBe(422);
    expect((await call(app, "piotr", "/feedback")).status).toBe(200);
    const ok = await call(app, "marek", `/notes/${id}/feedback`, { text: "Przy terminach uprzedzaj mnie z wyprzedzeniem." });
    expect(ok.status).toBe(303);
    const fb = await (await call(app, "piotr", "/feedback")).text();
    expect(fb).toContain("Przy terminach uprzedzaj mnie z wyprzedzeniem.");
    expect(fb).toContain("21.11.2026");
    expect(fb).not.toContain("Pismo do gminy poszło 11 lutego");
    expect(lastFeedbackDate("marek", "piotr")).toBe("2026-11-21");
    expect(await (await call(app, "piotr", "/")).text()).toContain("Informacja zwrotna");
  });

  test("data notatki: wcześniejsza zapisuje się, późniejsza niż dziś daje 422; created_at to dziś", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const base = { criterion_id: "rzetelnosc", text: "Fakt." };
    const late = await call(app, "marek", "/people/piotr/notes", { ...base, date: "2026-11-22" });
    expect(late.status).toBe(422);
    expect(await late.text()).toContain("Wybierz dzisiejszą albo wcześniejszą datę.");
    expect((await call(app, "marek", "/people/piotr/notes", { ...base, date: "2026-11-10" })).status).toBe(303);
    expect(db.query("SELECT date, created_at FROM notes ORDER BY id DESC LIMIT 1").get()).toEqual({ date: "2026-11-10", created_at: "2026-11-21" });
  });
});

describe("informacja zwrotna: limit jak w notatce (ustalenie 10 audytu)", () => {
  test("tekst dłuższy niż 2000 znaków: 422, formularz z komunikatem i wpisanym tekstem; nic się nie zapisuje", async () => {
    const { app, db } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const note = db.query("SELECT id FROM notes WHERE author_id = 'marek' AND date <= '2026-11-21' ORDER BY id LIMIT 1").get() as { id: number };
    const before = (db.query("SELECT COUNT(*) AS n FROM feedback_messages").get() as { n: number }).n;
    const long = "a".repeat(2001);
    const r = await call(app, "marek", `/notes/${note.id}/feedback`, { text: long });
    expect(r.status).toBe(422);
    const body = await r.text();
    expect(body).toContain("najwyżej 2000 znaków");
    expect(body).toContain('class="field-err"');
    expect(body).toContain(long);
    expect((db.query("SELECT COUNT(*) AS n FROM feedback_messages").get() as { n: number }).n).toBe(before);
    expect((await call(app, "marek", `/notes/${note.id}/feedback`, { text: "a".repeat(2000) })).status).toBe(303);
  });
});

describe("strażnik danych wrażliwych (art. 9 RODO)", () => {
  test("notatka o zdrowiu, rodzinie lub wyznaniu zwraca 422 z ostrzeżeniem i nie tworzy wpisu; potwierdzenie związane z treścią zapisuje 303", async () => {
    const { app, db } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const before = count(db);

    // Pole potwierdzenia jest obecne w HTML formularza od razu (ukryte `hidden`), gotowe na ostrzeżenie na żywo.
    const emptyForm = await (await call(app, "marek", "/people/piotr/notes/new")).text();
    expect(emptyForm).toContain('id="confirm-sensitive-wrap" hidden');
    expect(emptyForm).toContain('name="confirm_sensitive_token"');

    const samples = [
      "Pracownik wrócił ze zwolnienia lekarskiego po chorobie.",
      "Z powodu rozwodu prosił o zmianę terminu zadania.",
      "Rozmawialiśmy o wyznaniu i modlitwie przed pracą.",
    ];
    for (const text of samples) {
      const sug = await call(app, "marek", "/suggestions/note", { text });
      expect(sug.status).toBe(200);
      const j = (await sug.json()) as { sensitiveCategories?: { category: string }[]; sensitiveToken?: string };
      expect((j.sensitiveCategories ?? []).length).toBeGreaterThan(0);
      expect(j.sensitiveToken).toBeTruthy();

      const res = await call(app, "marek", "/people/piotr/notes", { criterion_id: "rzetelnosc", text });
      expect(res.status).toBe(422);
      const body = await res.text();
      expect(body).toContain("art. 9 RODO");
      expect(body).toContain('class="st warn"');
      expect(body).toContain('name="confirm_no_sensitive"');
      expect(body).toContain(`value="${j.sensitiveToken}"`);
      // Tekst autora nie jest kasowany ani zmieniany automatycznie.
      expect(body).toContain(text);
      expect(count(db)).toBe(before);
    }

    // Zmiana tekstu po zaznaczeniu potwierdzenia (stary token) nadal zatrzymuje zapis kodem 422.
    const text1 = "Wspomniał o depresji w zespole projektowym.";
    const r422 = await call(app, "marek", "/people/piotr/notes", { criterion_id: "rzetelnosc", text: text1 });
    expect(r422.status).toBe(422);
    const token1 = (await r422.text()).match(/name="confirm_sensitive_token" value="([a-f0-9]+)"/)?.[1] ?? "";
    expect(token1.length).toBeGreaterThan(0);

    const changedAfterConfirm = await call(app, "marek", "/people/piotr/notes", {
      criterion_id: "rzetelnosc",
      text: `${text1} Dodatkowo rozwód i kościół.`,
      confirm_no_sensitive: "1",
      confirm_sensitive_token: token1,
    });
    expect(changedAfterConfirm.status).toBe(422);
    expect(await changedAfterConfirm.text()).toContain("Treść notatki zmieniła się po potwierdzeniu");
    expect(count(db)).toBe(before);

    // Świadome potwierdzenie z pasującym tokenem tej samej treści zapisuje notatkę bez automatycznego usuwania tekstu.
    const confirmed = await call(app, "marek", "/people/piotr/notes", {
      criterion_id: "rzetelnosc",
      text: text1,
      confirm_no_sensitive: "1",
      confirm_sensitive_token: token1,
    });
    expect(confirmed.status).toBe(303);
    expect(count(db)).toBe(before + 1);

    // Zwykła notatka urzędowa (dawny fałszywy alarm: zwolnienie z opłaty skarbowej) zapisuje się bez potwierdzenia.
    const normal = await call(app, "marek", "/people/piotr/notes", {
      criterion_id: "rzetelnosc",
      text: "Rozpatrzył wniosek o zwolnienie z opłaty skarbowej i wypełnił obowiązek ciążący na wydziale.",
    });
    expect(normal.status).toBe(303);
    expect(count(db)).toBe(before + 2);

    // Po 422 z odznaczonym polem „Zmiana zadań” nie zostaje tekst „Zaznaczone na podstawie listy słów”.
    const uncheckedHint = await call(app, "marek", "/people/piotr/notes", {
      criterion_id: "",
      text: STEP2,
    });
    expect(uncheckedHint.status).toBe(422);
    expect(await uncheckedHint.text()).not.toContain("Zaznaczone na podstawie listy słów");
  });

  test("błąd strażnika (brak słownika) blokuje zapis 422 zamiast przepuszczać po cichu (fail-closed)", async () => {
    const { officeSettings } = await import("../office-settings");
    const { app, db } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const before = count(db);
    const orig = officeSettings().sensitiveDataWords;
    try {
      (officeSettings() as any).sensitiveDataWords = undefined;
      const res = await call(app, "marek", "/people/piotr/notes", {
        criterion_id: "rzetelnosc",
        text: "Był na zwolnieniu lekarskim.",
      });
      expect(res.status).toBe(422);
      expect(await res.text()).toContain("Zapis został wstrzymany");
      expect(count(db)).toBe(before);
    } finally {
      (officeSettings() as any).sensitiveDataWords = orig;
    }
  });
});
