import { describe, expect, test } from "bun:test";
import { createTestApp } from "./test-helpers";

describe("strona /about „Wdrożenie i dane”", () => {
  test("wersja reguł i data obowiązywania, ciasteczka, braki integracji, repo, prawa do kodu i licencja biblioteki", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    const res = await app.request("/about");
    expect(res.status).toBe(200);
    const html = await res.text();
    for (const t of [
      "Wdrożenie i dane",
      "bun install",
      "2016-470/1",
      "23.04.2016",
      "Nie ma w prototypie",
      "person_id",
      "mocena_demo",
      "mocena_tour",
      "github.com/Nikospy/mocena",
      "Open Sans",
      "Prawa autorskie do kodu ma autor.",
      "pisemną umową",
      "Hono, na licencji MIT",
    ]) {
      expect(html).toContain(t);
    }
    // każde zdanie prawdą o kodzie: eksport jednej oceny, plik kalendarza, notatki widzi tylko autor
    expect(html).toContain("JSON");
    expect(html).toContain(".ics");
    expect(html).toContain("Notatkę widzi tylko jej autor.");
    expect(html).not.toContain("bez treści notatek");
    expect(html).not.toContain("wstawia skrypt");
    expect(html).not.toContain("do ustalenia");
    // Repo jest publiczne: bez prywatnych ścieżek i adresów e-mail.
    expect(html).not.toMatch(/\/Users\//);
    expect(html).not.toMatch(/[\w.]+@[\w.]+/);
  });

  test("jawnie wyklucza pierwszą ocenę z art. 37–38", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    const html = await (await app.request("/about")).text();
    expect(html).toContain("Poza zakresem prototypu");
    expect(html).toContain("art. 37–38");
    expect(html).toContain("urząd prowadzi ją poza systemem");
  });

  test("linkuje zestawienie licencji", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    const html = await (await app.request("/about")).text();
    expect(html).toContain("docs/licenses.md");
  });

  test("działa niezależnie od konta i bez konta", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    for (const cookie of ["", "person_id=joanna", "person_id=piotr"]) {
      const res = await app.request("/about", { headers: cookie ? { cookie } : {} });
      expect(res.status).toBe(200);
    }
  });
});
