import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";

describe("Skąd biorą się podpowiedzi", () => {
  test("administrator widzi sześć miejsc i listę „Czego model nigdy nie robi”, inni 403", async () => {
    const { app } = createTestApp({ today: "2026-11-21" });
    const res = await app.request("/admin/suggestion-sources", { headers: { cookie: "person_id=admin" } });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.match(/Model w tle:/g)).toHaveLength(6);
    const never = html.split('aria-label="Czego model nigdy nie robi"')[1].split("</ul>")[0];
    expect(never.match(/<li>/g)).toHaveLength(4);
    expect(html).toContain("Teraz działa: reguły");
    for (const who of ["marek", "joanna", "piotr"]) {
      expect((await app.request("/admin/suggestion-sources", { headers: { cookie: `person_id=${who}` } })).status).toBe(403);
    }
  });
});
