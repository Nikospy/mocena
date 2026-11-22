import { describe, expect, test } from "bun:test";
import { approveAndAcknowledgePiotr, call } from "./hr-test-helpers";
import { createTestApp } from "../test-helpers";

// Odmowy i błędy tras to strony w układzie (errorPage), z tym samym kodem stanu; pliki i odpowiedzi dla fetch zostają tekstem.
describe("strony błędów tras", () => {
  const { app } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });

  const page = async (r: Response, status: number, title: string, sentence: string) => {
    expect(r.status).toBe(status);
    expect(r.headers.get("content-type")).toContain("text/html");
    const h = await r.text();
    expect(h).toContain(title);
    expect(h).toContain(sentence);
    expect(h).toContain("Wróć do spraw");
    return h;
  };

  test("403: nagłówek, zdanie, „Zmień konto” i menu bieżącego konta", async () => {
    const h = await page(await call(app, "ewa", "/cycles/cycle-piotr/sheet"), 403, "Nie masz dostępu do tego ekranu", "Ten arkusz widzą oceniany, jego oceniający i kadry.");
    expect(h.split('class="err-back"')[1]).toContain('href="/account"');
  });

  test("404 bez „Zmień konto”", async () => {
    const h = await page(await call(app, "marek", "/cycles/nie-ma/sheet"), 404, "Nie ma takiej strony", "Nie ma takiego cyklu oceny.");
    expect(h.split('class="err-back"')[1]).not.toContain("/account");
  });

  test("odpowiedź na POST też jest stroną", async () => {
    await page(await call(app, "joanna", "/hr/grades/nie-ma", {}), 404, "Nie ma takiej strony", "Nie ma takiej osoby w danych urzędu.");
  });

  test("brak pliku .ics to strona 404; podgląd dla fetch zostaje tekstem", async () => {
    const ics = await call(app, "marek", "/cycles/cycle-piotr/invitations/999999.ics");
    expect(ics.status).toBe(404);
    expect(ics.headers.get("content-type")).toContain("text/html");
    const preview = await call(app, "piotr", "/cycles/cycle-piotr/assessment/preview", {});
    expect(preview.status).toBe(403);
    expect(preview.headers.get("content-type")).toContain("text/plain");
  });
});

describe("formularze wracają po błędzie (422)", () => {
  test("usunięcie danych pracownika bez kliknięcia przycisku: ten sam formularz, podsumowanie i komunikat przy przycisku", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    const r = await call(app, "joanna", "/hr/people/piotr/delete", {});
    expect(r.status).toBe(422);
    const h = await r.text();
    expect(h).toContain('class="err-sum"');
    expect(h).toContain("Nie usunięto danych");
    expect(h).toContain('href="#confirmed"');
    expect(h).toContain('id="confirmed-error"');
    expect(h).toMatch(/id="confirmed"[^>]*aria-invalid="true"/);
    expect(h).toContain('action="/hr/people/piotr/delete"');
    expect(h).not.toContain("podpis");
  });

  test("rozstrzygnięcie sprzeciwu bez wyniku: ekran kadr z formularzem i komunikatem przy polu wyboru", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const r = await call(app, "joanna", "/cycles/cycle-katarzyna/objection-outcome", { outcome: "xyz" });
    expect(r.status).toBe(422);
    const h = await r.text();
    expect(h).toContain('class="err-sum"');
    expect(h).toContain('href="#outcome-cycle-katarzyna"');
    expect(h).toContain('id="outcome-cycle-katarzyna-error"');
    expect(h).toMatch(/id="outcome-cycle-katarzyna"[^>]*aria-invalid="true"/);
    expect(h).toContain('action="/cycles/cycle-katarzyna/objection-outcome"');
  });
});

test("GET /notes jako oceniany bez zespołu: strona odmowy zamiast pustej listy „Notatki o zespole”", async () => {
  const { app } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
  const r = await call(app, "piotr", "/notes");
  expect(r.status).toBe(403);
  const h = await r.text();
  expect(h).toContain("Notatki o zespole prowadzą oceniający i przełożeni.");
  expect((await call(app, "marek", "/notes")).status).toBe(200);
});
