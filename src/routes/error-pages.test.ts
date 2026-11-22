import { describe, expect, test } from "bun:test";
import { call } from "./hr-test-helpers";
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

  test("plik .ics i podgląd dla fetch zostają tekstem", async () => {
    const ics = await call(app, "marek", "/cycles/cycle-piotr/invitations/999999.ics");
    expect(ics.status).toBe(404);
    expect(ics.headers.get("content-type")).toContain("text/plain");
    const preview = await call(app, "piotr", "/cycles/cycle-piotr/assessment/preview", {});
    expect(preview.status).toBe(403);
    expect(preview.headers.get("content-type")).toContain("text/plain");
  });
});
