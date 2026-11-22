import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { getDb } from "./db";
import { visibleEventsOfType } from "./events";

export const PERSON_COOKIE = "person_id";

export type Person = {
  id: string;
  name: string;
  role: "appraiser" | "employee" | "hr" | "admin";
  position_title: string | null;
  unit: string | null;
  supervisor_id: string | null;
  has_account: number;
  appointed: number;
  civil_service_grade: string | null;
  grade_awarded_on: string | null;
  position_kind: "head_of_office" | "manager" | "staff" | null;
  duty_types: string;
  appointed_year: number | null;
};

export function personById(id: string): Person | null {
  return (getDb().query("SELECT * FROM people WHERE id = ?").get(id) as Person | null) ?? null;
}

export function currentPerson(c: Context): Person | null {
  const id = getCookie(c, PERSON_COOKIE);
  if (!id) return null;
  const p = personById(id);
  return p && p.has_account ? p : null;
}

export function currentGrade(personId: string, opts: { asOf?: string } = {}): { grade: string | null; awardedOn: string | null } {
  const awarded = visibleEventsOfType("mandatory_grade_awarded").filter(
    (e) => e.payload.personId === personId && (!opts.asOf || e.date <= opts.asOf),
  );
  const last = awarded[awarded.length - 1];
  if (last) return { grade: last.payload.toGrade, awardedOn: last.date };
  const p = personById(personId);
  if (!p || !p.civil_service_grade) return { grade: null, awardedOn: null };
  if (opts.asOf && p.grade_awarded_on && p.grade_awarded_on > opts.asOf) return { grade: null, awardedOn: null };
  return { grade: p.civil_service_grade, awardedOn: p.grade_awarded_on };
}
