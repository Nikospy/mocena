import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createSchema, setDb } from "./db";
import "./tour/stops";
import { TOUR_STOPS, applyTourStop } from "./tour/state";
import { runSeed } from "./seed";

// Pomiar „przed” (Bun 1.4.4, linux x64, baza :memory:, mediana z 15 przebiegów po rozgrzewce): 15,8 ms dla 7 przystanków.
// Próg = 15,8 ms + 20% zapasu na wolniejsze maszyny; wykrywa regresję wydajności odbudowy, nie wymaga zysku.
const TOUR_7_STOPS_MAX_MS = 19;

test("public/_headers: fonty z immutable", () => {
  const headers = readFileSync("public/_headers", "utf8");
  expect(headers).toMatch(/^\/fonts\/\*\s*\n\s+Cache-Control:.*\bimmutable\b/m);
});

test("applyTourStop dla 7 przystanków mieści się w progu", () => {
  const db = new Database(":memory:");
  createSchema(db);
  setDb(db);
  runSeed(db, {});
  const all = () => {
    const t = performance.now();
    for (const s of TOUR_STOPS) applyTourStop(db, s);
    return performance.now() - t;
  };
  all();
  all();
  const runs = Array.from({ length: 9 }, all).sort((a, b) => a - b);
  expect(runs[4]).toBeLessThan(TOUR_7_STOPS_MAX_MS);
});
