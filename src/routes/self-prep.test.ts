import { describe, expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

describe("wkład ocenianego przed rozmową (/cycles/:id/self-prep, Z17)", () => {
  test("oceniany zapisuje osiągnięcia i tematy; oceniający widzi je na /before-meeting bez kopiowania do arkusza", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });

    // Piotr widzi możliwość przygotowania do rozmowy na swoim ekranie głównym.
    const piotrHome = await html(app, "piotr", "/");
    expect(piotrHome).toContain('href="/cycles/cycle-piotr/self-prep"');

    // Inne role nie mają dostępu do formularza ocenianego (403).
    expect((await call(app, "marek", "/cycles/cycle-piotr/self-prep")).status).toBe(403);
    expect((await call(app, "joanna", "/cycles/cycle-piotr/self-prep", { achievements: "x" })).status).toBe(403);

    // Puste pola: 422.
    const empty = await call(app, "piotr", "/cycles/cycle-piotr/self-prep", { achievements: "  ", topics: "" });
    expect(empty.status).toBe(422);
    expect(await empty.text()).toContain("Wpisz co najmniej jedno pole");

    // Zapis osiągnięć i tematów: 303.
    const achievements = "Uporządkowałem rejestr wniosków i skróciłem czas kompletowania braków przy okienku.";
    const topics = "Chcę omówić podział kolejki spraw oraz szkolenie z nowego rejestru.";
    const saved = await call(app, "piotr", "/cycles/cycle-piotr/self-prep", { achievements, topics });
    expect(saved.status).toBe(303);
    expect(saved.headers.get("location")).toBe("/cycles/cycle-piotr/self-prep?saved=1");

    const ownView = await html(app, "piotr", "/cycles/cycle-piotr/self-prep?saved=1");
    expect(ownView).toContain("Zapisano twój wkład przed rozmową.");
    expect(ownView).toContain("Zapiski zobaczy Marek Zieliński");
    expect(ownView).toContain(achievements);
    expect(ownView).toContain(topics);

    // Marek (oceniający) widzi wkład Piotra na ekranie „Przed rozmową z pracownikiem”.
    const beforeMeeting = await html(app, "marek", "/cycles/cycle-piotr/before-meeting");
    expect(beforeMeeting).toContain("Wkład ocenianego przed rozmową");
    expect(beforeMeeting).toContain(achievements);
    expect(beforeMeeting).toContain(topics);

    // Wkład ocenianego nie kopiuje się automatycznie do formularza oceny ani uzasadnienia.
    const assessmentForm = await html(app, "marek", "/cycles/cycle-piotr/assessment");
    expect(assessmentForm).not.toContain(achievements);
    expect(assessmentForm).not.toContain(topics);
  });

  test("po zatwierdzeniu oceny wpis jest zablokowany (409 na POST, tylko odczyt na GET)", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await call(app, "piotr", "/cycles/cycle-piotr/self-prep", { achievements: "Zrealizowane zadania z kolejki." });
    await approveAndAcknowledgePiotr(app);

    expect((await call(app, "piotr", "/cycles/cycle-piotr/self-prep", { achievements: "Próba edycji po ocenie" })).status).toBe(409);
    const readOnly = await html(app, "piotr", "/cycles/cycle-piotr/self-prep");
    expect(readOnly).toContain("tylko do odczytu");
    expect(readOnly).toContain("Zrealizowane zadania z kolejki.");
  });
});
