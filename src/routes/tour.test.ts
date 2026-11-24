import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { openCycle } from "../cycles";
import { visibleEvents } from "../events";
import { Window } from "happy-dom";
import { createTestApp } from "../test-helpers";
import { stopById } from "../tour/stops";
import { TOUR_STOP_IDS } from "../tour/state";

function cookies(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function html(app: ReturnType<typeof createTestApp>["app"], path: string, cookie = "") {
  const res = await app.request(path, { headers: { cookie } });
  return { res, text: await res.text() };
}

const post = (app: ReturnType<typeof createTestApp>["app"], path: string, cookie = "", body?: Record<string, string>) =>
  app.request(path, {
    method: "POST",
    headers: { cookie, ...(body ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });

describe("przewodnik pokazu", () => {
  test("wejście na / bez konta, z 5 formularzami przystanków", async () => {
    const { app } = createTestApp();
    const { res, text } = await html(app, "/");
    expect(res.status).toBe(200);
    expect(text).toContain("Ten asystent prowadzi ocenę od pierwszej notatki do arkusza.");
    expect(text).toContain('<p class="e-ctx">5 kroków · 3 min · bez modelu językowego</p>');
    expect(text).toContain("Rozpocznij pokaz");
    for (const n of [1, 2, 3, 4, 5]) expect(text).toContain(`action="/tour/${n}"`);
    expect(text.match(/<form[^>]*action="\/tour\/\d"/g)?.length).toBe(6); // 5 kart + „Rozpocznij pokaz”
  });

  test("oś na telefonie pokazuje odstępy „15/8 miesięcy notatek” między właściwymi krokami", async () => {
    const { app } = createTestApp();
    const { text } = await html(app, "/");
    const mob = text.slice(text.indexOf('<ol class="e-mob">'));
    const s1 = mob.indexOf("Kryteria na początku cyklu");
    const g15 = mob.indexOf("15 miesięcy notatek");
    const s2 = mob.indexOf("Notatka w dniu, w którym coś się stało");
    const g8 = mob.indexOf("8 miesięcy notatek");
    const s3 = mob.indexOf("Nieobecność przesuwa termin");
    expect(s1).toBeGreaterThan(-1);
    expect(g15).toBeGreaterThan(s1);
    expect(s2).toBeGreaterThan(g15);
    expect(g8).toBeGreaterThan(s2);
    expect(s3).toBeGreaterThan(g8);
  });

  test("POST /tour/4: 303 na ocenę Piotra, ciasteczka konta i przewodnika", async () => {
    const { app } = createTestApp();
    const res = await post(app, "/tour/4");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/cycles/cycle-piotr/assessment");
    const c = cookies(res);
    expect(c).toContain("person_id=marek");
    expect(c).toContain("mocena_tour=4");
  });

  test("ekran z ciasteczkiem przewodnika ma kartę kroku i /tour.js", async () => {
    const { app } = createTestApp();
    const c = cookies(await post(app, "/tour/4"));
    const { res, text } = await html(app, "/cycles/cycle-piotr/assessment", c);
    expect(res.status).toBe(200);
    expect(text).toContain("Jedna „1” przesądza o wyniku");
    expect(text).toContain("Krok 4 z 5");
    expect(text).toContain('id="assessment-result-bar"');
    expect(text).toContain('action="/tour/5"');
    expect(text).toContain('src="/tour.js"');
    expect(text).not.toContain('action="/demo/date"');
  });

  test("przystanki wskazują termin, wspólny odnośnik do karty i rozwijane notatki", async () => {
    const { app } = createTestApp();
    const window = new Window();
    for (const [id, expected] of [["1", "Termin oceny"], ["4", "Notatki:"]]) {
      const res = await post(app, `/tour/${id}`);
      const page = await html(app, res.headers.get("location")!, cookies(res));
      window.document.body.innerHTML = page.text;
      const look = stopById(id)!.look.find((l) => l.selector === (id === "1" ? ".rule" : ".crit-notes-d > summary"))!;
      const element = window.document.querySelector(`main ${look.selector}`)!;
      if (id === "1") {
        expect(element.textContent).toContain(expected);
        const selector = '[data-tour="opening-card"]';
        expect(page.text).toContain('data-tour="opening-card"');
        expect(stopById(id)!.look.some((item) => item.selector === selector)).toBe(true);
        const links = window.document.querySelectorAll(`main header .page-links ${selector}`);
        expect(links).toHaveLength(1);
        expect(links[0].getAttribute("href")).toBe("/cycles/cycle-piotr/cards/opening");
        expect(links[0].textContent).toBe("Karta rozmowy o kryteriach");
        expect(links[0].closest(".pl-wide, .pl-narrow")).toBeNull();
      } else {
        expect(element.tagName).toBe("SUMMARY");
        const notes = element.parentElement!.querySelector(".note-list")!;
        expect(notes.getAttribute("aria-label")).toContain(expected);
        expect(notes.querySelector("input[data-insert]")).not.toBeNull();
      }
    }
    const note = await post(app, "/tour/2");
    const page = await html(app, note.headers.get("location")!, cookies(note));
    expect(page.text).not.toContain("§ 9 ust. 1");
    await window.close();
  });

  test("każdy przystanek ze „Spróbuj” wskazuje miejsce działania, które jest na jego ekranie", async () => {
    const { app } = createTestApp();
    const window = new Window();
    for (const id of TOUR_STOP_IDS) {
      const stop = stopById(id)!;
      if (!stop.tryIt) continue;
      expect(stop.tryTarget).toBeTruthy();
      const res = await post(app, `/tour/${id}`);
      const page = await html(app, res.headers.get("location")!, cookies(res));
      window.document.body.innerHTML = page.text;
      expect(window.document.querySelector(`main ${stop.tryTarget}`), `przystanek ${id}: ${stop.tryTarget}`).not.toBeNull();
      expect(window.document.querySelector("#tour-guide [data-try-selector]")?.getAttribute("data-try-selector")).toBe(stop.tryTarget!);
    }
    await window.close();
  });

  test("szuflada na telefonie: otwarta przy wejściu, z podpowiedzią zwijania i „Spróbuj” przed listą", async () => {
    const { app } = createTestApp();
    const window = new Window();
    const res = await post(app, "/tour/2");
    const page = await html(app, res.headers.get("location")!, cookies(res));
    window.document.body.innerHTML = page.text;
    const details = window.document.querySelector("#tour-guide-m details")!;
    expect(details.hasAttribute("open")).toBe(true);
    expect(details.getAttribute("data-gmob")).toBe("2");
    expect(details.querySelector("summary")!.textContent).toContain("Zwiń");
    for (const panel of ["#tour-guide", "#tour-guide-m"]) {
      const labels = [...window.document.querySelectorAll(`${panel} .gp-b .lbl`)].map((l) => l.textContent);
      expect(labels).toEqual(["Spróbuj", "Na co patrzeć"]);
    }
    await window.close();
  });

  test("licznik idzie naprzód także między częściami kroku 1 i 5", async () => {
    const { app } = createTestApp();
    const expected: Record<string, string> = {
      "1": "Krok 1 z 5 · część 1 z 2",
      "1b": "Krok 1 z 5 · część 2 z 2",
      "2": "Krok 2 z 5",
      "5": "Krok 5 z 5 · część 1 z 2",
      "5b": "Krok 5 z 5 · część 2 z 2",
    };
    for (const [id, label] of Object.entries(expected)) {
      const res = await post(app, `/tour/${id}`);
      const { text } = await html(app, res.headers.get("location")!, cookies(res));
      expect(text).toContain(`<b>${label}</b>`);
      expect(text).toContain(`Opis kroku · ${label} · `);
    }
  });

  test("ramki kroków 1b i 5b trafiają w opisane elementy", async () => {
    const { app } = createTestApp();
    const window = new Window();
    const facts: Record<string, string[]> = {
      "1b": ["Potwierdzenie części I", "Potwierdzam rozmowę, kryteria i termin oceny"],
      "5b": ["Tomasz", "Sprzeciw do rozpatrzenia", "Piotr Wójcik", "Drukuj / pobierz PDF"],
    };
    for (const [id, texts] of Object.entries(facts)) {
      const stop = stopById(id)!;
      const res = await post(app, `/tour/${id}`);
      const page = await html(app, res.headers.get("location")!, cookies(res));
      window.document.body.innerHTML = page.text;
      expect(stop.look.map((l, i) => {
        const found = window.document.querySelectorAll(`main ${l.selector}`);
        return found.length === 1 ? found[0].textContent!.includes(texts[i]) : `${l.selector}: ${found.length}`;
      })).toEqual(texts.map(() => true));
    }
    // Wiersz z ramką 3 to cykl ponownej oceny Piotra (stabilny atrybut z widoku kadr, nie konwencja identyfikatorów).
    const row = window.document.querySelector('main [data-tour="reassessment-cycle"]')!;
    expect(row.textContent).toContain("23.05.2027");
    expect(window.document.querySelectorAll('main [data-tour="reassessment-cycle"]')).toHaveLength(1);
    await window.close();
  });

  test("zwykły ekran bez ciasteczka nie ma karty ani skryptu", async () => {
    const { app } = createTestApp();
    const { text } = await html(app, "/account");
    expect(text).not.toContain("/tour.js");
    expect(text).toContain('action="/demo/date"');
  });

  test("przystanki są niezależne: 5 po 4, 1 po 5b, data z przystanku", async () => {
    const { app, db } = createTestApp();
    await post(app, "/tour/4");
    expect((await post(app, "/tour/5")).status).toBe(303);
    expect((db.query("SELECT value FROM settings WHERE key = 'demo_date'").get() as any).value).toBe("2026-11-22");
    expect((await post(app, "/tour/5b")).headers.get("location")).toBe("/hr");
    expect((await post(app, "/tour/1")).status).toBe(303);
    expect((db.query("SELECT value FROM settings WHERE key = 'demo_date'").get() as any).value).toBe("2024-12-09");
  });

  test("krok 5b otwiera nowy cykl Piotra i restart usuwa go z danych pokazu", async () => {
    const { app } = createTestApp();
    const stop = await post(app, "/tour/5b");
    const cycle = openCycle("piotr")!;
    expect(cycle.id).not.toBe("cycle-piotr");
    expect(visibleEvents(cycle.id).find((e) => e.type === "cycle_started")?.date).toBe("2026-11-22");
    const hr = await html(app, "/hr", cookies(stop));
    expect(hr.text).toContain("Kryteria do wyznaczenia (ponowna ocena)");
    expect(hr.text).toMatch(/Rozmowa o kryteriach do:\s*(<[^>]+>)*30\.11\.2026/);
    expect(hr.text).toContain("§ 7 pkt 2");
    // Krok 5b panelu: data ponownej oceny także na ekranie kadr, z przepisem.
    expect(hr.text).toMatch(/Ponowna ocena:\s*(<[^>]+>)*23\.05\.2027/);
    expect(hr.text).toContain("art. 81 ust. 9 ustawy");
    const home = await html(app, "/", "person_id=marek");
    expect(home.text).toContain("Wyznacz kryteria");
    expect(home.text).toContain(`href="/cycles/${cycle.id}/part1"`);
    expect((await post(app, "/demo/restart", cookies(stop))).status).toBe(303);
    expect(openCycle("piotr")?.id).toBe("cycle-piotr");
    expect(visibleEvents(cycle.id)).toEqual([]);
  });

  test("POST /tour/end zdejmuje ciasteczko przewodnika", async () => {
    const { app } = createTestApp();
    const c = cookies(await post(app, "/tour/2"));
    const res = await post(app, "/tour/end", c, { to: "/account" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/account");
    expect(res.headers.get("set-cookie")).toMatch(/mocena_tour=;/);
  });

  test("nieznany przystanek daje 404", async () => {
    const { app } = createTestApp();
    expect((await post(app, "/tour/9")).status).toBe(404);
  });

  test("w HTML wejścia, każdego przystanku i końca nie ma słowa „podpis”", async () => {
    const { app } = createTestApp();
    const pages: string[] = [(await html(app, "/tour")).text, (await html(app, "/tour/done")).text];
    for (const id of TOUR_STOP_IDS) {
      const res = await post(app, `/tour/${id}`);
      pages.push((await html(app, res.headers.get("location")!, cookies(res))).text);
    }
    for (const p of pages) expect(p.toLowerCase()).not.toContain("podpis");
  });

  test("po ekranie końcowym karta kroku nie zasłania podsumowania", async () => {
    const { app } = createTestApp();
    const c = cookies(await post(app, "/tour/5b"));
    const { text } = await html(app, "/tour/done", c);
    expect(text).toContain("Koniec pokazu");
    const coverageRows = [...readFileSync("docs/coverage.md", "utf8").matchAll(/^\|\s*([1-9]|[12]\d|30)\s*\|[^|]+\|\s*(działa|uproszczone)\s*\|/gm)];
    const working = coverageRows.filter((m) => m[2] === "działa").length;
    const simplified = coverageRows.filter((m) => m[2] === "uproszczone").length;
    expect(coverageRows).toHaveLength(30);
    expect(text).toContain(`${working} z ${coverageRows.length} czynności organizatora działa (${simplified} uproszczone)`);
    expect(text).toContain("pełny zestaw testów (<code>bun test</code>)");
    expect(text).not.toMatch(/\b\d+\s+test(y|ów)\b/i);
    expect(text).toContain('href="https://github.com/Nikospy/mocena/blob/main/docs/coverage.md"');
    expect(text).not.toContain("gpanel");
  });

  test("dodatek fikcji otwiera właściwą ocenę po zapoznaniu i utworzeniu następnego cyklu", async () => {
    const { app, db } = createTestApp();
    const stop = await post(app, "/tour/5");
    const acknowledged = await post(app, "/cycles/cycle-piotr/assessment/acknowledge", cookies(stop));
    expect(acknowledged.status).toBe(303);
    expect(db.query("SELECT COUNT(*) AS n FROM cycles WHERE person_id = 'piotr'").get()).toEqual({ n: 3 });
    const extra = await post(app, "/tour/extra/fiction", cookies(stop));
    const location = extra.headers.get("location")!;
    expect(location).toBe("/cycles/cycle-piotr/assessment/fiction");
    expect((await html(app, location, cookies(extra))).res.status).toBe(200);
  });

  test("dodatki z ekranu końcowego ustawiają konto i otwierają ekran bez przewodnika", async () => {
    const { app } = createTestApp();
    const cases: [string, string, RegExp][] = [
      ["ewa-timeline", "person_id=joanna", /\/cycles\/[^/]+\/timeline$/],
      ["fiction", "person_id=marek", /\/assessment\/fiction$/],
      ["sources", "person_id=admin", /^\/admin\/suggestion-sources$/],
    ];
    for (const [id, who, path] of cases) {
      const res = await post(app, `/tour/extra/${id}`, "mocena_tour=5b");
      expect(res.status).toBe(303);
      expect(res.headers.get("location") ?? "").toMatch(path);
      const set = res.headers.getSetCookie().join(" ");
      expect(set).toContain(who);
      expect(set).toMatch(/mocena_tour=;/);
      const page = await html(app, res.headers.get("location")!, cookies(res));
      expect(page.res.status).toBe(200);
    }
    expect((await post(app, "/tour/extra/nic")).status).toBe(404);
  });

  test("przycisk Dalej nazywa następny przystanek", async () => {
    const { app } = createTestApp();
    const res = await post(app, "/tour/4");
    const { text } = await html(app, res.headers.get("location")!, cookies(res));
    expect(text).toContain("Dalej<span class=\"long\">: zapoznanie</span>");
    expect(text).not.toContain("pracownik\"");
  });
});

describe("przewodnik: układ i dostępność", () => {
  test("link do przewodnika stoi zaraz po „Przejdź do treści”, a pasek pokazu ma datę słownie", async () => {
    const { app } = createTestApp();
    const cookie = cookies(await post(app, "/tour/2"));
    const { text } = await html(app, "/people/piotr/notes/new", cookie);
    const a = text.indexOf("Przejdź do treści");
    const b = text.indexOf("Przejdź do przewodnika");
    expect(a).toBeGreaterThan(-1);
    expect(b).toBeGreaterThan(a);
    expect(text.indexOf("<header", a)).toBeGreaterThan(b);
    expect(text).toContain("Słowo „przejął” zaznacza pole zmiany zadań. Można je odznaczyć.");
    // Treść panelu przewija się z klawiatury (axe: scrollable-region-focusable).
    expect(text.match(/<div class="gp-b" tabindex="0" role="region" aria-label="Opis kroku[^"]*"/g)?.length).toBe(2);

    const plain = await html(app, "/account");
    expect(plain.text).toMatch(/<aside[^>]*aria-label="Pokaz"/);
    expect(plain.text).toMatch(/dziś \d{1,2} \p{L}+ \d{4}/u);
  });
});

describe("panel przewodnika: cytowane nazwy istnieją na ekranie przystanku", () => {
  // Krok 2 cytuje tekst, który wpisuje użytkownik, i pytanie z następnego ekranu; krok 3 pokazuje podsumowanie dopiero po wpisaniu.
  const quoted = (s = "") => [...s.matchAll(/„([^”]+)”/g)].map((m) => m[1]);
  for (const id of ["1", "1b", "3", "4", "5", "5b"]) {
    test(`krok ${id}`, async () => {
      const { app } = createTestApp();
      const stop = stopById(id)!;
      const res = await post(app, `/tour/${id}`);
      const page = await html(app, res.headers.get("location")!, `${cookies(res)}; person_id=${stop.personId}`);
      const screen = page.text.replace(/<aside[^>]*id="tour-guide[\s\S]*?<\/aside>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      expect(screen).not.toContain(stop.title);
      // Nazwy przycisków panel cytuje dosłownie.
      if (id === "5") expect(quoted(stop.tryIt)).toContain("Potwierdzam zapoznanie z oceną");
      if (id === "1") expect(stop.look.flatMap((l) => quoted(l.text))).toContain("Karta rozmowy o kryteriach");
      for (const q of [...stop.look.flatMap((l) => quoted(l.text)), ...quoted(stop.tryIt)]) expect(screen).toContain(q);
    });
  }
});
