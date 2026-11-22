import { describe, expect, test } from "bun:test";
import { silenceAbout } from "./notes-list";

describe("zdanie o ciszy w zespole na liście notatek", () => {
  test("bez notatek, po progu miesięcy i przy świeżej notatce", () => {
    expect(silenceAbout("Maria Dąbrowska", null, "2026-11-21")).toBe("O Marii nie masz jeszcze żadnej notatki.");
    expect(silenceAbout("Piotr Wójcik", "2026-04-21", "2026-11-21")).toBe("O Piotrze nie masz żadnej notatki od 7 miesięcy.");
    expect(silenceAbout("Piotr Wójcik", "2026-10-12", "2026-11-21")).toBeNull();
    expect(silenceAbout("Zenon Nieznany", null, "2026-11-21")).toBe("Nie masz żadnej notatki o osobie: Zenon Nieznany.");
  });
});
