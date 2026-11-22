import { describe, expect, test } from "bun:test";
import { cycleLinks } from "../cycle-links";
import { cycleById } from "../cycles";
import { homeTasks } from "../home-tasks";
import { personById } from "../people";
import { createTestApp } from "../test-helpers";
import { approveAndAcknowledgePiotr, call, html } from "./hr-test-helpers";

const PIOTR = "cycle-piotr";
const IDS = ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja", "orientacja-na-klienta", "myslenie-analityczne"];

/** Tekst strony bez znaczników (atrybuty, w tym `title`, znikają razem ze znacznikami). */
const text = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
const panel = (h: string) => /<section class="rule res[^"]*" id="assessment-result"[\s\S]*?<\/section>/.exec(h)![0];

function scores(overrides: Record<string, string> = {}): Record<string, string> {
  const f: Record<string, string> = { justification: "Powód oceny.", developmentConclusions: "Kurs pism urzędowych.", interviewDate: "" };
  for (const id of IDS) f[`score[${id}]`] = overrides[id] ?? "7";
  return f;
}

const approvePiotr = async (app: ReturnType<typeof createTestApp>["app"]) => {
  const r = await call(app, "marek", `/cycles/${PIOTR}/assessment/approve`, scores());
  expect(r.status).toBe(303);
};

describe("1.1 strona główna ocenianego bez pustki", () => {
  test("Piotr po zapoznaniu: karta „Twoja ocena” z wynikiem, terminem sprzeciwu, przepisem i przyciskiem", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    const h = await html(app, "piotr", "/");
    expect(h).not.toContain("Brak spraw do załatwienia");
    const t = text(h);
    expect(t).toContain("Twoja ocena");
    expect(t).toContain("Ocena pozytywna, powyżej oczekiwań");
    expect(t).toContain("do 30.11.2026");
    expect(t).toContain("art. 83 ust. 1");
    expect(h).toContain(`href="/cycles/${PIOTR}/assessment"`);
  });

  test("Ewa bez spraw (grudzień 2024): najbliższy termin zamiast pustki", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    const h = await html(app, "ewa", "/");
    expect(h).not.toContain("Brak spraw do załatwienia");
    expect(text(h)).toContain("Nic na Ciebie nie czeka");
    expect(text(h)).toContain("Twój termin oceny:");
    expect(text(h)).toContain("do 20.11.2026");
  });
});

describe("1.2 „Wystaw ocenę” dopiero 30 dni przed terminem", () => {
  test("27.10 brak sprawy i odnośnika do oceny, zwykły odnośnik w zespole; 28.10 sprawa jest (termin 27.11.2026)", async () => {
    const { app } = createTestApp({ today: "2026-10-27", seedOptions: { afterStep1: true } });
    const marek = personById("marek")!;
    expect(homeTasks(marek).map((t) => t.title)).not.toContain("Wystaw ocenę: Piotr Wójcik");
    expect(cycleLinks(cycleById(PIOTR)!, marek).map((l) => l.label)).not.toContain("Ocena");
    expect(await html(app, "marek", "/notes")).toContain(`href="/cycles/${PIOTR}"`);

    createTestApp({ today: "2026-10-28", seedOptions: { afterStep1: true } });
    const task = homeTasks(marek).find((t) => t.title === "Wystaw ocenę: Piotr Wójcik")!;
    expect(task.due).toBe("2026-11-27");
    expect(task.detail ?? "").not.toMatch(/art\.|§/);
    expect(cycleLinks(cycleById(PIOTR)!, marek).map((l) => l.label)).toContain("Ocena");
  });
});

describe("1.3 panel wyniku", () => {
  test("„1” przy Rzetelności: przyczyna z przepisem, jedna linia o średniej, poziom nie przeczy wynikowi", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    await call(app, "marek", `/cycles/${PIOTR}/assessment`, scores({ rzetelnosc: "1" }));
    const p = panel(await html(app, "marek", `/cycles/${PIOTR}/assessment`));
    const t = text(p);
    expect(t).toContain("Ocena negatywna");
    expect(t).toContain("Rzetelność: 1, znacznie poniżej oczekiwań");
    expect(t).toContain("§ 11 ust. 1 pkt 4");
    expect(t).toContain("Średnia 6,14 — nie zmienia wyniku");
    expect(t.match(/średnia/gi)).toHaveLength(1);
    expect(t).not.toContain("powyżej oczekiwań");
  });

  test("ocena pozytywna: wynik z poziomem i sama średnia", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    await call(app, "marek", `/cycles/${PIOTR}/assessment`, scores());
    const t = text(panel(await html(app, "marek", `/cycles/${PIOTR}/assessment`)));
    expect(t).toContain("Ocena pozytywna");
    expect(t).toContain("powyżej oczekiwań");
    expect(t).toContain("Średnia 7,00");
    expect(t).not.toContain("nie zmienia wyniku");
    expect(t.match(/średnia/gi)).toHaveLength(1);
  });
});

describe("1.6 termin przesunięty przez nieobecność", () => {
  test("ekran oceny i strona główna mówią „z … na …” z odnośnikiem do osi czasu", async () => {
    const { app } = createTestApp({ today: "2026-11-10", seedOptions: { afterStep1: true } });
    expect(text(await html(app, "marek", `/cycles/${PIOTR}/assessment`))).not.toContain("Termin przesunięty");
    await call(app, "joanna", `/cycles/${PIOTR}/absences`, { from: "2026-10-05", to: "2026-10-16", excused: "1" });
    await call(app, "joanna", `/cycles/${PIOTR}/absences`, { from: "2026-10-19", to: "2026-11-06", excused: "1" });
    const sentence = "Termin przesunięty z 27.11.2026 na 30.12.2026 przez nieobecność";
    const screen = await html(app, "marek", `/cycles/${PIOTR}/assessment`);
    expect(text(screen)).toContain(sentence);
    expect(screen).toContain(`href="/cycles/${PIOTR}/timeline"`);
    const home = await html(app, "marek", "/");
    expect(text(home)).toContain(sentence);
    expect(home).toContain(`href="/cycles/${PIOTR}/timeline"`);
  });
});

describe("1.8 odnośniki do faz, które jeszcze nie nastąpiły", () => {
  test("w grudniu 2024 nie ma odnośników do oceny; w listopadzie 2026 są", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    const early = await html(app, "marek", `/cycles/${PIOTR}/part1`);
    expect(early).toContain(`/cycles/${PIOTR}/cards/opening`);
    expect(early).not.toContain(`/cycles/${PIOTR}/assessment`);
    expect(early).not.toContain("cards/assessment-conversation");
    const { app: late } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const h = await html(late, "marek", `/cycles/${PIOTR}/part1`);
    expect(h).toContain(`/cycles/${PIOTR}/assessment`);
    expect(h).toContain("cards/assessment-conversation");
  });
});

describe("1.9 ekran „To stała zmiana zadań?”", () => {
  test("cytat z datą, skutki „Tak” i „Nie”, trzy wyjścia; „Zamknij” zostawia odpowiedź „tak”", async () => {
    const { app } = createTestApp({ today: "2026-03-11", seedOptions: { afterStep1: true, liveStep2: true } });
    const r = await call(app, "marek", "/people/piotr/notes", { criterion_id: "wspolpraca", text: "Przejął kolejkę wniosków po koleżance.", rating: "good", task_change: "1" });
    const loc = r.headers.get("location")!;
    const t = text(await html(app, "marek", loc));
    expect(t).toContain("Notatka z 11.03.2026");
    expect(t).toContain("Przejął kolejkę wniosków po koleżance.");
    expect(t).toContain("Po „Tak”");
    expect(t).toContain("Po „Nie”");
    for (const label of ["Tak, stała zmiana", "Nie, chwilowe zastępstwo", "Zdecyduję później"]) expect(t).toContain(label);
    expect((await call(app, "marek", loc, { answer: "yes" })).status).toBe(303);
    const card = await html(app, "marek", loc);
    expect(card).toContain(">Zamknij</a>");
    expect(card).not.toContain("Nie, chwilowe zastępstwo");
    expect(text(await html(app, "marek", loc))).toContain("Rozmowa po zmianie zadań");
  });
});

describe("1.10 wersja reguł po ludzku", () => {
  test("ekran oceny: opis wersji w tekście, identyfikator tylko w title", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    await call(app, "marek", `/cycles/${PIOTR}/assessment`, scores());
    const h = await html(app, "marek", `/cycles/${PIOTR}/assessment`);
    expect(text(h)).toContain("Wersja reguł 1");
    expect(h).toContain('title="Identyfikator wersji: 2016-470/1"');
    expect(text(h)).not.toContain("2016-470/1");
  });

  test("żaden ekran pokazu nie ma „2016-470/1” poza atrybutem title i arkuszem", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    const walk: [string, string][] = [
      ["marek", "/"], ["marek", `/cycles/${PIOTR}/part1`], ["marek", `/cycles/${PIOTR}/assessment`], ["marek", `/cycles/${PIOTR}/timeline`],
      ["marek", `/cycles/${PIOTR}/before-meeting`], ["marek", `/cycles/${PIOTR}/appreciation`], ["marek", "/notes"],
      ["piotr", "/"], ["piotr", `/cycles/${PIOTR}/assessment`], ["piotr", `/cycles/${PIOTR}/timeline`], ["piotr", "/people/piotr/history"],
      ["tomasz", "/people/tomasz/history"], ["tomasz", "/cycles/cycle-tomasz/timeline"], ["anna", "/"],
      ["joanna", "/"], ["joanna", "/hr"], ["joanna", "/people/tomasz/history"], ["joanna", "/cycles/cycle-ewa/timeline"], ["joanna", `/cycles/${PIOTR}/absences`],
    ];
    for (const [who, path] of walk) {
      const res = await call(app, who, path);
      expect(res.status, `${who} ${path}`).toBe(200);
      expect(text(await res.text()), `${who} ${path}`).not.toContain("2016-470/1");
    }
    // arkusz zostaje miejscem, gdzie identyfikator jest widoczny
    expect(text(await html(app, "piotr", `/cycles/${PIOTR}/sheet`))).toContain("2016-470/1");
  });
});

describe("1.11 /hr", () => {
  test("druk przy wierszu z arkuszem, termin sprzeciwu po terminie, dopełniacz, Anna w jednej linii", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    await approveAndAcknowledgePiotr(app);
    const h = await html(app, "joanna", "/hr");
    for (const c of ["cycle-tomasz", "cycle-katarzyna", "cycle-anna", PIOTR]) expect(h).toContain(`href="/cycles/${c}/sheet?print=1"`);
    expect(h).toContain("Drukuj / pobierz PDF");
    const t = text(h);
    expect(t).toContain("Termin sprzeciwu minął 19.11.2026");
    expect(t).not.toContain("Sprzeciw do: 19.11.2026");
    expect(t).toContain("Sprzeciw wniesiony 20.11.2026 do dyrektora generalnego urzędu");
    expect(t).not.toContain("do dyrektor generalny");
    const anna = h.indexOf("Wniosek ocenianego");
    expect(text(h.slice(anna, h.indexOf("<details", anna)))).toBe("Wniosek ocenianego o zmianę terminu czeka na rozpatrzenie przez oceniającego");
    expect(h.slice(anna, anna + 600)).toContain("zawiadamia pracownika pisemnie");
    expect(await html(app, "joanna", `/cycles/${PIOTR}/sheet?print=1`)).toContain('src="/auto-print.js"');
    expect(await html(app, "joanna", `/cycles/${PIOTR}/sheet`)).not.toContain("auto-print.js");
  });
});

describe("1.12 odnotowanie przyznania stopnia", () => {
  test("komunikat sukcesu na /hr i wpis na osi Tomasza", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const r = await call(app, "joanna", "/hr/grades/tomasz", {});
    expect(r.status).toBe(303);
    const h = await html(app, "joanna", r.headers.get("location")!);
    expect(text(h)).toContain("Odnotowano przyznanie stopnia Tomaszowi Kamińskiemu, 22.11.2026.");
    expect(text(await html(app, "tomasz", "/cycles/cycle-tomasz/timeline"))).toContain("Przyznano stopień służbowy VI");
    // komunikat nie pojawia się bez takiego wpisu
    expect(text(await html(app, "joanna", "/hr?awarded=piotr"))).not.toContain("Odnotowano przyznanie");
  });
});

describe("1.13 fikcja zapoznania do znalezienia", () => {
  test("po zatwierdzeniu oceniający ma sprawę z przyciskiem „Stwierdź fikcję zapoznania”; wcześniej i dla kadr nie", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const fiction = `href="/cycles/${PIOTR}/assessment/fiction"`;
    expect(await html(app, "marek", "/")).not.toContain(fiction);
    await approvePiotr(app);
    const home = await html(app, "marek", "/");
    expect(home).toContain(fiction);
    expect(text(home)).toContain("Stwierdź fikcję zapoznania");
    expect((await call(app, "marek", `/cycles/${PIOTR}/assessment/fiction`)).status).toBe(200);
    // kadry tylko widzą wpis: nie ma dla nich przycisku, którego zapis by się nie udał
    expect(await html(app, "joanna", "/hr")).not.toContain("assessment/fiction");
    expect((await call(app, "joanna", `/cycles/${PIOTR}/assessment/fiction`)).status).toBe(403);
  });
});

describe("1.14 formy ról według osoby", () => {
  test("nagłówek: rola w procesie w formie osoby", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    const who = async (id: string) => /<span class="user-id"><b>[^<]*<\/b><span>([^<]*)</.exec(await html(app, id, "/"))![1];
    expect(await who("anna")).toBe("oceniająca");
    expect(await who("marek")).toBe("oceniający");
    expect(await who("ewa")).toBe("oceniana");
    expect(await who("piotr")).toBe("oceniany");
    expect(await who("joanna")).toBe("kadry");
  });

  test("nawigacja usługi: tylko miejsca roli, bieżąca strona z aria-current, zmiana konta w panelu konta", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    const navOf = (h: string) => /<nav class="nav" aria-label="Usługa">([\s\S]*?)<\/nav>/.exec(h)![1]!;
    const labels = (h: string) => [...navOf(h).matchAll(/<span>([^<]+)<\/span>/g)].map((m) => m[1]);
    const marek = await html(app, "marek", "/notes");
    expect(labels(marek)).toEqual(["Sprawy", "Notatki"]);
    expect(navOf(marek)).toMatch(/href="\/notes" aria-current="page"/);
    expect(navOf(marek)).not.toContain("/account");
    expect(marek).toMatch(/<details class="user">[\s\S]*href="\/account"[\s\S]*Zmień konto/);
    const joanna = await html(app, "joanna", "/hr");
    expect(labels(joanna)).toEqual(["Stan cykli", "Pracownicy", "Zastępstwa"]);
    expect(navOf(joanna)).toMatch(/href="\/hr" aria-current="page"/);
    expect(labels(await html(app, "piotr", "/"))).toEqual(["Sprawy", "Historia ocen", "Informacja zwrotna"]);
    for (const path of ["/hr/people", "/hr/substitutions"]) expect((await call(app, "joanna", path)).status).toBe(200);
    for (const path of ["/notes"]) expect((await call(app, "marek", path)).status).toBe(200);
    for (const path of ["/people/piotr/history", "/feedback"]) expect((await call(app, "piotr", path)).status).toBe(200);
  });

  test("Anna nie widzi własnego terminu oceny jako terminu osoby ocenianej przez nią", async () => {
    const { app } = createTestApp({ today: "2026-11-22", seedOptions: { afterStep1: true } });
    const t = text(await html(app, "anna", "/"));
    expect(t).not.toContain("Termin oceny Anna Kwiatkowska");
    expect(t).toContain("Twój termin oceny: 16.12.2026");
  });
});

describe("1.15 teksty", () => {
  test("część I: „Do oceny trafią tylko zaznaczone” i „Przekazano <data>. Czeka na potwierdzenie <osoby>.”", async () => {
    const { app } = createTestApp({ today: "2024-12-09" });
    const edit = text(await html(app, "marek", `/cycles/${PIOTR}/part1`));
    expect(edit).toContain("Do oceny trafią tylko zaznaczone.");
    expect(edit).not.toContain("Nie zaznaczysz");
    await call(app, "marek", `/cycles/${PIOTR}/part1/submit`, { additional: "orientacja-na-klienta" });
    expect(text(await html(app, "marek", `/cycles/${PIOTR}/part1`))).toContain("Przekazano 09.12.2024. Czeka na potwierdzenie Piotra.");
    expect(text(await html(app, "marek", "/"))).not.toContain("od dziś");
  });

  test("pytanie o zmianę zadań i ekran „Przed rozmową”: formy bezosobowe", async () => {
    const { app } = createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } });
    const raw = await html(app, "marek", `/cycles/${PIOTR}/before-meeting`);
    const before = text(raw);
    expect(before).toContain("Brak zapisanej informacji zwrotnej dla Piotra.");
    for (const old of ["Zaznaczyłeś", "Nie przekazałeś", "nie odpowiedziałeś", "Zastanów się"]) expect(before).not.toContain(old);
    const noteId = raw.match(/\/notes\/(\d+)\/task-change/)![1];
    const q = text(await html(app, "marek", `/notes/${noteId}/task-change`));
    expect(q).toContain("Notatka z 11.03.2026");
    expect(q).toContain("W tej notatce zaznaczono zmianę zadań Piotra.");
    expect(q).toContain("Zdecyduję później");
    expect(q).not.toContain("Pytanie o notatkę");
    expect(q).not.toContain("Odpowiem później");
  });

  test("kadry: „Terminowość w urzędzie (bez nazwisk)”; opisy form rozwoju bez „ogarnąć”", async () => {
    const { app } = createTestApp({ today: "2026-11-22" });
    const h = text(await html(app, "joanna", "/hr"));
    expect(h).toContain("Terminowość w urzędzie (bez nazwisk)");
    expect(h).not.toContain("widok dyrektora generalnego");
    const forms = (await import("../../rules/office-settings.json")).default.developmentForms.map((f: { description: string }) => f.description).join(" ");
    expect(forms).toContain("jak sobie z nim poradzić");
    expect(forms).not.toContain("ogarnąć");
  });
});
