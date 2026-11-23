// Jedyny moduł czytający reguły (rozporządzenie PRM z 4 kwietnia 2016 r., Dz.U. 2016 poz. 470).
// Pakiet domyślny leży w pliku repozytorium; nowelizacje publikowane z interfejsu leżą w tabeli `rule_versions`,
// każda pod swoją wersją i niezmienna. Obowiązuje pakiet z najpóźniejszą datą `effectiveFrom` nie późniejszą niż `today()`.
import { AsyncLocalStorage } from "node:async_hooks";
import data from "../../rules/regulation-2016-470.json";
import { currentDb, getDb, hasDb } from "../db";
import { today } from "../settings";

export type RulePack = typeof data;

export const defaultRules: RulePack = data;

type VersionRow = { version: string; effectiveFrom: string; seq: number };

/** Zakres: w nim `activeRules()` zwraca wskazany pakiet (np. wersję zapisaną w zatwierdzonej ocenie). */
const scope = new AsyncLocalStorage<{ pack: RulePack }>();

/** Liczba wykonujących się zakresów: gdy 0, `activeRules()` nie zagląda do AsyncLocalStorage. */
let openScopes = 0;

export function withRulePack<R>(pack: RulePack, fn: () => R): R {
  openScopes++;
  try {
    const out = scope.run({ pack }, fn);
    if (out instanceof Promise) return out.finally(() => void openScopes--) as R;
    openScopes--;
    return out;
  } catch (e) {
    openScopes--;
    throw e;
  }
}

/** Wykonuje `fn` z regułami obowiązującymi dziś, także wewnątrz zakresu wersji (np. ekran zbiorczy kadr). */
export function withActiveRules<R>(fn: () => R): R {
  return scope.run(undefined as unknown as { pack: RulePack }, fn);
}

/** Wykonuje `fn` z regułami wskazanej wersji. Nieznana wersja daje pakiet domyślny. */
export function withRulesVersion<R>(version: string, fn: () => R): R {
  return withRulePack(rulesFor(version), fn);
}

type Loaded = { rows: VersionRow[]; packs: Map<string, RulePack> };

/** Wersje są niezmienne, więc indeks i sparsowane pakiety zapamiętujemy na bazę; publikacja i czyszczenie tabel odrzucają zapamiętany stan. */
const loaded = new WeakMap<object, Loaded>();

export function resetRulesCache(): void {
  if (hasDb()) loaded.delete(getDb());
}

function state(): Loaded | null {
  const db = currentDb();
  if (!db) return null;
  const hit = loaded.get(db);
  if (hit) return hit;
  try {
    const rows = db.query("SELECT version, effective_from AS effectiveFrom, seq FROM rule_versions ORDER BY seq").all() as VersionRow[];
    const fresh = { rows, packs: new Map<string, RulePack>() };
    loaded.set(db, fresh);
    return fresh;
  } catch {
    return null; // baza bez tabeli (jeszcze bez schematu): tylko pakiet z pliku
  }
}

/** Czy opublikowano jakąkolwiek nowelizację (poza pakietem z pliku). */
export function hasPublishedRules(): boolean {
  return (state()?.rows.length ?? 0) > 0;
}

/** Pakiet danej wersji: z bazy albo domyślny z pliku. Nieznana wersja daje pakiet domyślny. */
export function rulesFor(version: string): RulePack {
  const st = state();
  if (version === defaultRules.version || !st) return defaultRules;
  const cached = st.packs.get(version);
  if (cached) return cached;
  try {
    const row = getDb().query("SELECT pack_json FROM rule_versions WHERE version = ?").get(version) as { pack_json: string } | null;
    if (!row) return defaultRules;
    const pack = JSON.parse(row.pack_json) as RulePack;
    st.packs.set(version, pack);
    return pack;
  } catch {
    return defaultRules;
  }
}

/** Wszystkie wersje znane bazie, od najstarszej: pakiet z pliku i opublikowane nowelizacje. */
export function knownVersions(): { version: string; effectiveFrom: string; seq: number }[] {
  return [{ version: defaultRules.version, effectiveFrom: defaultRules.effectiveFrom, seq: 0 }, ...(state()?.rows ?? [])];
}

/** Wersja obowiązująca w dniu `on`: najpóźniejsza data wejścia w życie nie późniejsza niż `on`, przy równych dniach nowsza publikacja. */
export function versionInForce(on: string, versions = knownVersions()): string {
  let best = versions[0];
  for (const v of versions) if (v.effectiveFrom <= on && (v.effectiveFrom > best.effectiveFrom || (v.effectiveFrom === best.effectiveFrom && v.seq >= best.seq))) best = v;
  return best.version;
}

/** Pakiet obowiązujący dziś (zegar aplikacji `today()`), albo ten z bieżącego zakresu `withRulesVersion`. */
export function activeRules(): RulePack {
  if (openScopes > 0) {
    const s = scope.getStore();
    if (s) return s.pack;
  }
  const st = state();
  if (!st || st.rows.length === 0) return defaultRules;
  return rulesFor(versionInForce(today()));
}

/** Proxy delegujący odczyt każdej właściwości do bieżącego pakietu `activeRules()`. */
export const rules: RulePack = new Proxy(defaultRules, {
  get(_target, prop) {
    return (activeRules() as Record<PropertyKey, unknown>)[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(activeRules());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(activeRules(), prop);
  },
});

export function rulesVersion(): { version: string; effectiveFrom: string; act: string } {
  const r = activeRules();
  return { version: r.version, effectiveFrom: r.effectiveFrom, act: r.source.act };
}

/** „Wersja reguł 1”: opis wersji dla człowieka; identyfikator „2016-470/1” zostaje w `title`, data obowiązywania dokleja się w widoku. */
export function rulesVersionLabel(version: string): string {
  const slash = version.lastIndexOf("/");
  const n = slash >= 0 ? version.slice(slash + 1) : version;
  return `Wersja reguł ${n}`;
}
