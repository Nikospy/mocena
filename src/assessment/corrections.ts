// Tryb korekty błędów: administrator poprawia pole zatwierdzonego arkusza z podaniem powodu.
// Migawka zatwierdzenia zostaje bez zmian; korekta to osobne zdarzenie `sheet_corrected`, widoczne w historii arkusza.
// Oceny cząstkowe i wynik nie podlegają korekcie: ich zmianę przewiduje tylko tryb sprzeciwu (art. 83 ustawy).
import { getDb } from "../db";
import { visibleEvents, type AppEvent } from "../events";
import { personById } from "../people";
import { assessmentState } from "./state";

export const CORRECTABLE_FIELDS = {
  interviewDate: { label: "Data rozmowy oceniającej", kind: "date" },
  justification: { label: "Uzasadnienie przyznanej oceny", kind: "text" },
  developmentConclusions: { label: "Wnioski do indywidualnego programu rozwoju zawodowego", kind: "text" },
} as const;

export type CorrectableField = keyof typeof CORRECTABLE_FIELDS;
export type SheetCorrection = { id: number; date: string; actorName: string; field: CorrectableField; label: string; from: string; to: string; reason: string };

export const isCorrectableField = (f: string): f is CorrectableField => Object.hasOwn(CORRECTABLE_FIELDS, f);

/** Korekty w kolejności zapisu. */
export function sheetCorrections(cycleId: string, events: AppEvent[] = visibleEvents(cycleId)): SheetCorrection[] {
  return events
    .filter((e) => e.type === "sheet_corrected" && isCorrectableField(e.payload.field))
    .map((e) => ({
      id: e.id,
      date: e.date,
      actorName: personById(e.actorId ?? "")?.name ?? e.actorId ?? "",
      field: e.payload.field,
      label: CORRECTABLE_FIELDS[e.payload.field as CorrectableField].label,
      from: e.payload.from,
      to: e.payload.to,
      reason: e.payload.reason,
    }));
}

/** Bieżące wartości pól po korektach (ostatnia korekta pola wygrywa); `null`, gdy ocena nie jest zatwierdzona. */
export function correctedValues(cycleId: string): Record<CorrectableField, string> | null {
  const snap = assessmentState(cycleId).snapshot;
  if (!snap) return null;
  const v: Record<CorrectableField, string> = {
    interviewDate: snap.interviewDate ?? "",
    justification: snap.justification ?? "",
    developmentConclusions: snap.developmentConclusions ?? "",
  };
  for (const c of sheetCorrections(cycleId)) v[c.field] = c.to;
  return v;
}

/** Cykle z zatwierdzoną oceną (do listy administratora). */
export function approvedCycles(): { id: string; personName: string; approvedOn: string }[] {
  const rows = getDb().query("SELECT id, person_id FROM cycles ORDER BY period_start DESC, id").all() as { id: string; person_id: string }[];
  return rows.flatMap((r) => {
    const st = assessmentState(r.id);
    return st.snapshot && st.approvedOn ? [{ id: r.id, personName: personById(r.person_id)?.name ?? r.person_id, approvedOn: st.approvedOn }] : [];
  });
}

export type CorrectionInput = { field: string; value: string; reason: string };
export type CorrectionErrors = Partial<Record<"field" | "value" | "reason", string>>;

/** Wartość po normalizacji (data DD.MM.RRRR → RRRR-MM-DD) albo błędy. */
export function validateCorrection(input: CorrectionInput, current: Record<CorrectableField, string>): { ok: true; field: CorrectableField; value: string } | { ok: false; errors: CorrectionErrors } {
  const errors: CorrectionErrors = {};
  let value = input.value.trim();
  if (!isCorrectableField(input.field)) errors.field = "Wybierz pole do poprawienia";
  else {
    if (CORRECTABLE_FIELDS[input.field].kind === "date") {
      const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (m) value = `${m[3]}-${m[2]}-${m[1]}`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) errors.value = "Podaj datę w postaci DD.MM.RRRR";
    } else if (!value) errors.value = "Wpisz poprawną treść pola";
    if (!errors.value && value === current[input.field]) errors.value = "Nowa wartość jest taka sama jak obecna";
  }
  if (input.reason.trim().length < 5) errors.reason = "Podaj powód korekty (co było błędem)";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, field: input.field as CorrectableField, value };
}
