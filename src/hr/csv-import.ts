// Import pracowników z CSV w tym samym układzie kolumn co eksport zestawienia (`/hr/export.csv`).
// Kolumny wyliczane przez system (stan procesu, terminy) przy imporcie się pomija: termin zawsze liczy silnik.
import { getDb } from "../db";
import { OUTCOME_LABEL, supervisorCandidates, validateForm, emptyForm, type PersonForm } from "./people";

export const EXPORT_HEADER = ["Osoba", "Stanowisko", "Komórka", "Oceniający", "Stan procesu", "Termin oceny", "Termin sprzeciwu", "Data ostatniej oceny", "Wynik ostatniej oceny"];
const REQUIRED = ["Osoba", "Stanowisko", "Komórka", "Oceniający"];

/** CSV z separatorem `;` (albo `,`), cudzysłowami i BOM; zdejmuje apostrof chroniący przed formułą, który dodaje eksport. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = firstLine.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"' && cur === "") quoted = true;
    else if (ch === sep) {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows
    .map((r) => r.map((v) => v.trim().replace(/^'(?=[=+\-@])/, "")))
    .filter((r) => r.some((v) => v !== ""));
}

export type ImportRow = { line: number; name: string; form: PersonForm | null; status: "ok" | "skip" | "error"; messages: string[] };
export type ImportPlan = { error: string | null; rows: ImportRow[] };

function isoFromPl(v: string): string | null {
  const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** Plan importu: każdy wiersz z wynikiem sprawdzenia. Niczego nie zapisuje. */
export function planImport(text: string): ImportPlan {
  const table = parseCsv(text);
  if (table.length === 0) return { error: "Plik jest pusty.", rows: [] };
  const header = table[0];
  const missing = REQUIRED.filter((h) => !header.includes(h));
  if (missing.length) return { error: `W pierwszym wierszu brakuje kolumn: ${missing.join(", ")}. Układ kolumn jest taki sam jak w eksporcie zestawienia.`, rows: [] };
  const col = (r: string[], h: string) => (header.includes(h) ? (r[header.indexOf(h)] ?? "").trim() : "");
  const existing = new Set((getDb().query("SELECT name FROM people").all() as { name: string }[]).map((p) => p.name.toLocaleLowerCase("pl")));
  const appraisers = supervisorCandidates();
  const seen = new Set<string>();
  const rows: ImportRow[] = table.slice(1).map((r, i) => {
    const line = i + 2;
    const name = col(r, "Osoba");
    const key = name.toLocaleLowerCase("pl");
    if (name && existing.has(key)) return { line, name, form: null, status: "skip", messages: ["Osoba jest już w kartotece: pominięta."] };
    if (name && seen.has(key)) return { line, name, form: null, status: "skip", messages: ["Ta sama osoba jest wyżej w pliku: pominięta."] };
    seen.add(key);
    const messages: string[] = [];
    const appraiserName = col(r, "Oceniający");
    const appraiser = appraisers.find((p) => p.name.toLocaleLowerCase("pl") === appraiserName.toLocaleLowerCase("pl"));
    if (appraiserName && !appraiser) messages.push(`Oceniający „${appraiserName}” nie ma w systemie konta oceniającego.`);
    const prevRaw = col(r, "Data ostatniej oceny");
    const prevOn = prevRaw ? isoFromPl(prevRaw) : "";
    if (prevRaw && !prevOn) messages.push(`Data ostatniej oceny „${prevRaw}” nie ma postaci DD.MM.RRRR.`);
    const outcomeRaw = col(r, "Wynik ostatniej oceny").toLocaleLowerCase("pl");
    const outcome = (Object.keys(OUTCOME_LABEL) as (keyof typeof OUTCOME_LABEL)[]).find((k) => OUTCOME_LABEL[k] === outcomeRaw) ?? "";
    const form: PersonForm = {
      ...emptyForm(),
      name,
      position_title: col(r, "Stanowisko"),
      unit: col(r, "Komórka"),
      supervisor_id: appraiser?.id ?? "",
      prev_on: prevOn ?? "",
      prev_outcome: outcome,
    };
    if (!messages.length) {
      const e = validateForm(form, { hasCycle: false, needsSupervisor: true });
      if (e.supervisor_id && !appraiserName) messages.push("Brak oceniającego.");
      for (const [k, v] of Object.entries(e)) if (v && k !== "supervisor_id") messages.push(v);
    }
    return messages.length ? { line, name, form: null, status: "error", messages } : { line, name, form, status: "ok", messages: [] };
  });
  return { error: null, rows };
}
