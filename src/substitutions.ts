import { getDb } from "./db";
import { registerHomeTasks } from "./home-tasks";
import { fullNameForm } from "./hr-partner/partner";
import { personById } from "./people";
import { today } from "./settings";
import { formatDate } from "./views/layout";

export type Substitution = { id: number; absent_id: string; substitute_id: string; date_from: string; date_to: string; recorded_on: string; recorded_by: string };

/** Zastępstwo, które trwa w dniu `asOf` (domyślnie `today()`): zastępca jest wtedy oceniającym zamiast nieobecnego. */
export function activeSubstitution(absentId: string, substituteId: string, asOf = today()): Substitution | null {
  return (
    (getDb()
      .query("SELECT * FROM substitutions WHERE absent_id = ? AND substitute_id = ? AND date_from <= ? AND date_to >= ? ORDER BY date_to DESC, id DESC")
      .get(absentId, substituteId, asOf, asOf) as Substitution | null) ?? null
  );
}

/** Jedyne miejsce, które ustala, czy osoba działa jako oceniający: sam oceniający albo jego zastępca w czasie zastępstwa. */
export function actsAsAppraiser(appraiserId: string | null | undefined, actorId: string): boolean {
  if (!appraiserId) return false;
  return appraiserId === actorId || activeSubstitution(appraiserId, actorId) !== null;
}

/** Osoby, których cykle prowadzi dziś osoba: własne jako oceniający i nieobecnych, za których ma zastępstwo. Cykl i tak sprawdzasz `actsAsAppraiser`. */
export function personsAppraisedBy(actorId: string): string[] {
  const appraisers = [actorId, ...activeSubstitutionsOf(actorId).map((s) => s.absent_id)];
  const rows = getDb()
    .query(`SELECT DISTINCT person_id FROM cycles WHERE appraiser_id IN (${appraisers.map(() => "?").join(", ")})`)
    .all(...appraisers) as { person_id: string }[];
  return rows.map((r) => r.person_id);
}

/** Zastępstwa, które trwają dziś albo jeszcze się nie zaczęły, od najwcześniejszego. */
export function currentAndFutureSubstitutions(): Substitution[] {
  return getDb().query("SELECT * FROM substitutions WHERE date_to >= ? ORDER BY date_from, id").all(today()) as Substitution[];
}

/** Zastępstwa, w których osoba zastępuje dziś. */
export function activeSubstitutionsOf(substituteId: string): Substitution[] {
  return getDb()
    .query("SELECT * FROM substitutions WHERE substitute_id = ? AND date_from <= ? AND date_to >= ? ORDER BY date_to, id")
    .all(substituteId, today(), today()) as Substitution[];
}

/** „Marka Zielińskiego” albo, gdy słownik nie zna nazwiska, pełne imię i nazwisko. */
export function genitiveName(name: string): string {
  return fullNameForm(name, "gen") ?? name;
}

registerHomeTasks((person) =>
  activeSubstitutionsOf(person.id).flatMap((s) => {
    const absent = personById(s.absent_id);
    if (!absent) return [];
    const team = getDb().query("SELECT id, name FROM people WHERE supervisor_id = ? AND id <> ? ORDER BY name").all(absent.id, person.id) as { id: string; name: string }[];
    return team.map((m) => ({
      title: `Zespół w zastępstwie: ${m.name}`,
      heading: "Zespół w zastępstwie",
      person: m.name,
      detail: `W zastępstwie za ${genitiveName(absent.name)} do ${formatDate(s.date_to)}`,
      href: `/people/${m.id}/notes/new`,
      action: "Napisz notatkę",
    }));
  }),
);
