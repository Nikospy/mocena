// Nowelizacja reguł z interfejsu: walidacja tego, co silnik umie, podgląd skutków i publikacja niezmiennej wersji.
import { assessmentInForce } from "../assessment/state";
import { effectiveDeadline } from "../cycles";
import { getDb, hasDb } from "../db";
import { recordEvent, visibleEvents } from "../events";
import { today } from "../settings";
import { courtAppealDeadline, criteriaTalkDeadline, mandatoryGradeDeadline, nextAssessmentDeadline, objectionDeadline, objectionReviewDeadline, periodEndAfterNegative } from "./deadlines";
import { activeRules, defaultRules, knownVersions, resetRulesCache, versionInForce, withRulePack, type RulePack } from "./rules";
import { computeAssessment } from "./scoring";

/** Największy dopuszczony rozmiar wgrywanego pakietu (bajty). */
export const MAX_PACK_BYTES = 256 * 1024;

export const STRUCTURE_MESSAGE = "zmiana struktury wymaga zmiany programu";

export type RuleChange = { path: string; label: string; from: string; to: string };

export type RulePackDiff = {
  changes: RuleChange[];
  /** Cykle bez zatwierdzonej oceny: liczą się od nowej wersji, od jej daty wejścia w życie. */
  openCyclesCount: number;
  /** Cykle z zatwierdzoną oceną: zostają przy wersji zapisanej w ocenie. */
  closedCyclesCount: number;
  /** Otwarte cykle, w których termin sporządzenia oceny wypada inaczej według nowej wersji. */
  shiftedDeadlinesCount: number;
  /** Nowa wersja zaczyna obowiązywać dopiero w przyszłości (wg zegara aplikacji). */
  scheduled: boolean;
};

export type RuleVersionEntry = {
  version: string;
  effectiveFrom: string;
  publishedOn: string | null;
  actorId: string | null;
  status: "active" | "scheduled" | "superseded";
};

export type RulePackValidation = { ok: true; pack: RulePack } | { ok: false; errors: string[] };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
}

const MONTH_KEYS = ["assessmentEveryMonths", "reassessmentAfterNegativeMonths", "positionChangeMinMonths", "longAbsenceOverMonths"] as const;
const DAY_KEYS = ["criteriaTalkDays", "criteriaTalkAfterNegativeDays", "objectionDays", "objectionReviewDays", "courtAppealDays", "mandatoryGradeDays"] as const;

const DEADLINE_LABELS: Record<string, string> = {
  assessmentEveryMonths: "Okres między ocenami (miesiące)",
  criteriaTalkDays: "Termin rozmowy o kryteriach (dni)",
  criteriaTalkAfterNegativeDays: "Termin rozmowy o kryteriach po ocenie negatywnej (dni)",
  reassessmentAfterNegativeMonths: "Ponowna ocena po ocenie negatywnej (miesiące)",
  objectionDays: "Termin wniesienia sprzeciwu (dni)",
  objectionReviewDays: "Termin rozpatrzenia sprzeciwu (dni)",
  courtAppealDays: "Termin odwołania do sądu pracy (dni)",
  positionChangeMinMonths: "Minimalny okres przy zmianie stanowiska (miesiące)",
  mandatoryGradeDays: "Termin przyznania stopnia z mocy prawa (dni)",
  longAbsenceOverMonths: "Próg długiej nieobecności (miesiące)",
};

const SECTION_LABELS: Record<string, string> = {
  version: "Identyfikator wersji",
  effectiveFrom: "Data obowiązywania",
  source: "Akt prawny",
  sheets: "Arkusze",
  maxAdditionalCriteria: "Maks. liczba kryteriów dodatkowych",
  partialScale: "Skala ocen cząstkowych",
  overallLevels: "Poziomy ogólne",
  deadlines: "Terminy",
  appraiserChange: "Zmiana oceniającego",
  deadlineChange: "Zmiana terminu oceny",
  criteria: "Kryteria",
  criteriaConversation: "Rozmowa o kryteriach",
  assessmentConversation: "Rozmowa o ocenie",
  objectionRedo: "Sprzeciw i ponowna ocena",
  approval: "Zatwierdzenie oceny",
};

function label(path: string): string {
  const parts = path.split(".");
  if (parts[0] === "deadlines" && DEADLINE_LABELS[parts[1]]) {
    const rest = parts.slice(2).join(".");
    return rest === "value" ? DEADLINE_LABELS[parts[1]] : `${DEADLINE_LABELS[parts[1]]}: ${rest === "basis" ? "podstawa prawna" : rest}`;
  }
  if (parts[0] === "criteria") return `Kryterium ${parts[1]}: ${parts.slice(2).join(".")}`;
  const head = SECTION_LABELS[parts[0]] ?? parts[0];
  return parts.length > 1 ? `${head}: ${parts.slice(1).join(".")}` : head;
}

/** Struktura pakietu musi być zgodna z bieżącym: porównanie kluczy i typów, bez cichego uzupełniania. */
function shape(cur: unknown, nxt: unknown, path: string, errors: string[]): void {
  if (Array.isArray(cur)) {
    if (!Array.isArray(nxt)) return void errors.push(`Pole „${path}” musi być listą.`);
    if (cur.length > 0 && nxt.length === 0) return void errors.push(`Lista „${path}” nie może być pusta.`);
    if (cur.length > 0 && typeof cur[0] === "object") nxt.forEach((item, i) => shape(cur[0], item, `${path}[${i + 1}]`, errors));
    else if (cur.length > 0) nxt.forEach((item, i) => typeof item !== typeof cur[0] || (typeof item === "string" && !item.trim()) ? errors.push(`Pozycja ${i + 1} w „${path}” ma zły typ albo jest pusta.`) : undefined);
    return;
  }
  if (isObject(cur)) {
    if (!isObject(nxt)) return void errors.push(`Brak sekcji „${path}” albo ma zły typ. Brakującej sekcji system nie uzupełnia.`);
    for (const k of Object.keys(cur)) {
      if (!Object.hasOwn(nxt, k)) errors.push(`Brak pola „${path ? `${path}.` : ""}${k}”.`);
      else shape(cur[k], nxt[k], path ? `${path}.${k}` : k, errors);
    }
    for (const k of Object.keys(nxt)) if (!Object.hasOwn(cur, k)) errors.push(`Nieznane pole „${path ? `${path}.` : ""}${k}”: ${STRUCTURE_MESSAGE}.`);
    return;
  }
  if (typeof cur === "string") {
    if (typeof nxt !== "string" || !nxt.trim()) errors.push(`Pole „${path}” musi być niepustym tekstem.`);
  } else if (typeof cur === "number") {
    if (typeof nxt !== "number" || !Number.isFinite(nxt)) errors.push(`Pole „${path}” musi być liczbą.`);
  } else if (typeof cur !== typeof nxt) errors.push(`Pole „${path}” ma zły typ.`);
}

function hasDuplicateNames(list: unknown[]): boolean {
  const names = list.map((x) => (isObject(x) && typeof x.name === "string" ? x.name.trim().toLowerCase() : "")).filter(Boolean);
  return new Set(names).size !== names.length;
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function checkRange(errors: string[], path: string, v: unknown, min: number, max: number): void {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) errors.push(`Pole „${path}” musi być liczbą całkowitą od ${min} do ${max}.`);
}

/** Próba działania: silnik liczy na nowym pakiecie ocenę i terminy, zanim cokolwiek trafi do bazy. */
function dryRun(pack: RulePack): string | null {
  try {
    withRulePack(pack, () => {
      const ids = pack.sheets.C.mandatoryCriteria;
      const scores = Object.fromEntries(ids.map((id, i) => [id, [1, 3, 5, 7, 9][i % 5]]));
      const r = computeAssessment(scores);
      if (!r.overallLevel) throw new Error("brak nazwy poziomu ogólnego");
      computeAssessment(Object.fromEntries(ids.map((id) => [id, 9])));
      for (const f of [nextAssessmentDeadline("2026-01-15"), criteriaTalkDeadline("2026-01-15"), criteriaTalkDeadline("2026-01-15", true), objectionDeadline("2026-01-15"), objectionReviewDeadline("2026-01-15"), mandatoryGradeDeadline("2026-01-15"), courtAppealDeadline("2026-01-15"), periodEndAfterNegative("2026-01-15")]) {
        if (!isIsoDate(f)) throw new Error("termin nie jest datą");
      }
    });
    return null;
  } catch (e) {
    return `Próba działania pakietu nie powiodła się (${e instanceof Error ? e.message : "błąd"}).`;
  }
}

/**
 * Walidacja pakietu reguł w czystym TypeScript. Sprawdza tylko to, co silnik umie:
 * wartości liczbowe w granicach, zgodność struktury z bieżącym pakietem, nowa wersja i data, próba działania.
 */
export function validateRulePack(raw: unknown, current: RulePack = defaultRules): RulePackValidation {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    if (new TextEncoder().encode(raw).length > MAX_PACK_BYTES) {
      return { ok: false, errors: [`Pakiet reguł jest za duży: najwyżej ${MAX_PACK_BYTES / 1024} KB.`] };
    }
    const trimmed = raw.trim();
    if (!trimmed) return { ok: false, errors: ["Wgraj plik JSON albo wklej treść pakietu reguł."] };
    try {
      obj = JSON.parse(trimmed);
    } catch {
      return { ok: false, errors: ["Plik nie jest poprawnym formatem JSON. Sprawdź nawiasy, przecinki i cudzysłowy."] };
    }
  }
  if (!isObject(obj)) return { ok: false, errors: ["Pakiet reguł musi być obiektem JSON."] };

  const errors: string[] = [];
  const structural: string[] = [];

  // Kształt: te same sekcje i pola co w bieżącym pakiecie. Listy kryteriów, arkuszy, skali i poziomów sprawdzamy osobno.
  // Kształt zawsze według pakietu z pliku (nie bieżącego), z elementami list kryteriów, skali i poziomów włącznie.
  shape(defaultRules, obj, "", errors);

  if (typeof obj.version === "string" && !/^[A-Za-z0-9](?:[A-Za-z0-9._/-]{0,38}[A-Za-z0-9])?$/.test(obj.version)) errors.push("Pole „version” zaczyna się i kończy literą lub cyfrą, może zawierać znaki . _ / - (do 40 znaków).");
  if (isObject(obj.source) && typeof obj.source.url === "string") {
    let okUrl = false;
    try {
      okUrl = ["http:", "https:"].includes(new URL(obj.source.url).protocol);
    } catch {
      okUrl = false;
    }
    if (!okUrl) errors.push("Pole „source.url” musi być adresem http lub https.");
  }
  if (!isIsoDate(obj.effectiveFrom)) errors.push("Pole „effectiveFrom” musi zawierać poprawną datę w formacie RRRR-MM-DD.");

  // Struktura, którą silnik ma w kodzie.
  if (Array.isArray(obj.criteria)) {
    const ids = obj.criteria.map((c) => (isObject(c) ? c.id : undefined));
    const curIds = current.criteria.map((c) => c.id);
    if (!sameJson([...ids].sort(), [...curIds].sort())) structural.push("Lista kryteriów (identyfikatory „id”) różni się od obowiązującej.");
    obj.criteria.forEach((c, i) => {
      if (!isObject(c)) return void errors.push(`Kryterium nr ${i + 1} musi być obiektem.`);
      if (typeof c.name !== "string" || !c.name.trim()) errors.push(`Kryterium „${String(c.id)}” nie ma nazwy.`);
      if (!Array.isArray(c.description) || c.description.length === 0 || c.description.some((d) => typeof d !== "string" || !d.trim())) errors.push(`Kryterium „${String(c.id)}” wymaga listy niepustych opisów.`);
      if (typeof c.number !== "number" || !Number.isInteger(c.number) || c.number < 1) errors.push(`Kryterium „${String(c.id)}” wymaga dodatniej liczby „number”.`);
    });
  } else errors.push("Sekcja „criteria” musi być listą.");

  if (isObject(obj.sheets)) {
    for (const s of ["A", "B", "C"] as const) {
      const sh = obj.sheets[s];
      if (!isObject(sh)) {
        errors.push(`Brak definicji arkusza „sheets.${s}”.`);
        continue;
      }
      if (typeof sh.forWhom !== "string" || !sh.forWhom.trim()) errors.push(`Brak opisu „sheets.${s}.forWhom”.`);
      if (!sameJson(sh.mandatoryCriteria, current.sheets[s].mandatoryCriteria)) structural.push(`Kryteria obowiązkowe arkusza ${s} różnią się od obowiązujących.`);
    }
    if (Object.keys(obj.sheets).some((k) => !["A", "B", "C"].includes(k))) structural.push("Pakiet definiuje inne arkusze niż A, B i C.");
  } else errors.push("Sekcja „sheets” musi być obiektem.");

  if (Array.isArray(obj.partialScale)) {
    if (!sameJson(obj.partialScale.map((p) => (isObject(p) ? p.points : null)), current.partialScale.map((p) => p.points))) structural.push("Skala ocen cząstkowych ma inne punkty niż 1, 3, 5, 7, 9.");
    obj.partialScale.forEach((p, i) => {
      if (!isObject(p) || typeof p.name !== "string" || !p.name.trim()) errors.push(`Pozycja nr ${i + 1} w „partialScale” wymaga niepustej nazwy.`);
    });
    if (hasDuplicateNames(obj.partialScale)) errors.push("Nazwy w „partialScale” muszą być różne.");
  } else errors.push("Sekcja „partialScale” musi być listą.");

  if (Array.isArray(obj.overallLevels)) {
    const bounds = (l: unknown) => (isObject(l) ? [l.from, l.to, l.fromInclusive] : null);
    if (!sameJson(obj.overallLevels.map(bounds), current.overallLevels.map(bounds))) structural.push("Poziomy ogólne mają inne granice niż w programie (pięć poziomów, progi z § 11 ust. 1).");
    obj.overallLevels.forEach((l, i) => {
      if (!isObject(l) || typeof l.name !== "string" || !l.name.trim()) errors.push(`Poziom nr ${i + 1} w „overallLevels” wymaga niepustej nazwy.`);
    });
    if (hasDuplicateNames(obj.overallLevels)) errors.push("Nazwy w „overallLevels” muszą być różne: arkusz zaznacza poziom po nazwie.");
  } else errors.push("Sekcja „overallLevels” musi być listą.");

  if (isObject(obj.deadlines) && isObject(current.deadlines)) {
    const d = obj.deadlines;
    for (const k of MONTH_KEYS) checkRange(errors, `deadlines.${k}.value`, isObject(d[k]) ? d[k].value : undefined, 1, 60);
    for (const k of DAY_KEYS) checkRange(errors, `deadlines.${k}.value`, isObject(d[k]) ? d[k].value : undefined, 1, 90);
    if (isObject(d.assessmentPeriodFrom) && d.assessmentPeriodFrom.value !== current.deadlines.assessmentPeriodFrom.value) structural.push("Początek okresu oceny („deadlines.assessmentPeriodFrom.value”) jest ustalony w programie.");
  }
  checkRange(errors, "maxAdditionalCriteria", obj.maxAdditionalCriteria, 0, 5);
  if (isObject(obj.deadlineChange)) {
    checkRange(errors, "deadlineChange.minMonths", obj.deadlineChange.minMonths, 1, 60);
    const ns = (c: unknown) => (Array.isArray(c) ? c.map((x) => (isObject(x) ? x.n : null)) : null);
    if (!sameJson(ns(obj.deadlineChange.cases), ns(current.deadlineChange.cases))) structural.push("Przypadki zmiany terminu („deadlineChange.cases”) mają inne numery niż w programie.");
  }
  if (isObject(obj.approval) && isObject(obj.approval.gradeRequest)) checkRange(errors, "approval.gradeRequest.maxGrade", obj.approval.gradeRequest.maxGrade, 1, 9);

  if (structural.length > 0) errors.push(...structural.map((m) => `${m[0].toUpperCase()}${m.slice(1)}: ${STRUCTURE_MESSAGE}.`));
  if (errors.length > 0) return { ok: false, errors };

  const pack = obj as unknown as RulePack;

  // Wersja jest niezmienna: ten sam identyfikator nie może wrócić z inną treścią.
  const known = knownVersions();
  if (known.some((v) => v.version === pack.version)) {
    return { ok: false, errors: [`Wersja „${pack.version}” jest już opublikowana i nie można jej zmienić. Nadaj nowy identyfikator w polu „version”.`] };
  }
  // Data wejścia w życie musi być późniejsza niż obowiązującej teraz wersji, inaczej nowa wersja nigdy nie zacznie obowiązywać.
  const now = hasDb() ? today() : new Date().toISOString().slice(0, 10);
  const inForce = known.find((v) => v.version === versionInForce(now, known))!;
  // Ta sama data co obowiązującej wersji jest dozwolona (poprawka tego samego dnia): remis rozstrzyga nowsza publikacja.
  if (pack.effectiveFrom < inForce.effectiveFrom) {
    return { ok: false, errors: [`Pole „effectiveFrom” (${pack.effectiveFrom}) nie może być wcześniejsze niż data obowiązującej wersji (${inForce.effectiveFrom}).`] };
  }
  const failure = dryRun(pack);
  if (failure) return { ok: false, errors: [failure] };
  return { ok: true, pack };
}

function leaves(v: unknown, path: string, out: Map<string, string>): void {
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x !== "object" || x === null)) out.set(path, v.join(" | "));
    else v.forEach((x, i) => leaves(x, `${path}.${isObject(x) && typeof x.id === "string" ? x.id : i + 1}`, out));
  } else if (isObject(v)) for (const [k, x] of Object.entries(v)) leaves(x, path ? `${path}.${k}` : k, out);
  else out.set(path, String(v));
}

function listCycles(): { id: string; closed: boolean }[] {
  if (!hasDb()) return [];
  const out: { id: string; closed: boolean }[] = [];
  for (const { id } of getDb().query("SELECT id FROM cycles").all() as { id: string }[]) {
    if (!visibleEvents(id).some((e) => e.type === "cycle_started")) continue;
    out.push({ id, closed: assessmentInForce(id).snapshot !== null });
  }
  return out;
}

/** Lista zmienionych wartości ze wszystkich sekcji i skutek dla cykli: tyle, ile kod faktycznie zrobi po publikacji. */
export function diffRulePacks(current: RulePack, next: RulePack): RulePackDiff {
  const a = new Map<string, string>();
  const b = new Map<string, string>();
  leaves(current, "", a);
  leaves(next, "", b);
  const changes: RuleChange[] = [];
  for (const path of new Set([...a.keys(), ...b.keys()])) {
    const from = a.get(path);
    const to = b.get(path);
    if (from !== to) changes.push({ path, label: label(path), from: from ?? "—", to: to ?? "—" });
  }

  let openCyclesCount = 0;
  let closedCyclesCount = 0;
  let shiftedDeadlinesCount = 0;
  for (const c of listCycles()) {
    if (c.closed) {
      closedCyclesCount++;
      continue;
    }
    openCyclesCount++;
    try {
      const before = effectiveDeadline(c.id).date;
      const after = withRulePack(next, () => effectiveDeadline(c.id).date);
      if (before !== after) shiftedDeadlinesCount++;
    } catch {
      /* cykl bez części I nie ma terminu */
    }
  }
  return { changes, openCyclesCount, closedCyclesCount, shiftedDeadlinesCount, scheduled: next.effectiveFrom > today() };
}

/** Wersja o tym identyfikatorze już istnieje (np. równoległa publikacja): wersji nie da się nadpisać. */
export class RuleVersionConflict extends Error {}

/** Zapisuje zwalidowany pakiet pod jego wersją (nie da się nadpisać) i dopisuje zdarzenie `rules_published`, w jednej transakcji. */
export function publishRulePack(pack: RulePack, actorId: string): RulePackDiff {
  const prev = activeRules();
  const diff = diffRulePacks(prev, pack);
  const db = getDb();
  db.transaction(() => {
    if (db.query("SELECT 1 AS x FROM rule_versions WHERE version = ?").get(pack.version) || pack.version === defaultRules.version) {
      throw new RuleVersionConflict(`Wersja „${pack.version}” jest już opublikowana i nie można jej zmienić.`);
    }
    const seq = (db.query("SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM rule_versions").get() as { n: number }).n;
    db.query("INSERT INTO rule_versions (version, seq, effective_from, pack_json, published_on, actor_id) VALUES (?, ?, ?, ?, ?, ?)").run(
      pack.version,
      seq,
      pack.effectiveFrom,
      JSON.stringify(pack),
      today(),
      actorId,
    );
    recordEvent("rules_published", null, actorId, {
      fromVersion: prev.version,
      toVersion: pack.version,
      effectiveFrom: pack.effectiveFrom,
      changesCount: diff.changes.length,
    });
  })();
  resetRulesCache();
  return diff;
}

/** Historia wersji reguł: pakiet z pliku i każda opublikowana nowelizacja, od najnowszej. */
export function ruleVersionsList(): RuleVersionEntry[] {
  const known = knownVersions();
  const inForce = versionInForce(today(), known);
  const meta = new Map<string, { published_on: string; actor_id: string | null }>();
  if (hasDb()) {
    for (const r of getDb().query("SELECT version, published_on, actor_id FROM rule_versions").all() as { version: string; published_on: string; actor_id: string | null }[]) meta.set(r.version, r);
  }
  return known
    .map((v) => ({
      version: v.version,
      effectiveFrom: v.effectiveFrom,
      publishedOn: meta.get(v.version)?.published_on ?? null,
      actorId: meta.get(v.version)?.actor_id ?? null,
      status: (v.version === inForce ? "active" : v.effectiveFrom > today() ? "scheduled" : "superseded") as RuleVersionEntry["status"],
      seq: v.seq,
    }))
    .sort((x, y) => y.seq - x.seq)
    .map(({ seq: _s, ...rest }) => rest);
}

export { defaultRules };
