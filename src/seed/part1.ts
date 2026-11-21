import { getDb } from "../db";
import { seedEvent } from "../events";
import { savePart1 } from "../cycles/part1";

const KIND: Record<string, "manager" | "staff"> = {
  piotr: "staff", ewa: "staff", maria: "staff", joanna: "staff", admin: "staff", katarzyna: "staff",
  marek: "manager", anna: "manager", tomasz: "manager", "poprzedni-naczelnik": "manager", "dyrektor-urzedu": "manager",
};

const DUTIES: Record<string, string[]> = {
  piotr: ["client-service", "analyses-and-reports", "inter-office-agreements", "official-correspondence"],
  ewa: ["client-service"],
};

function confirm(cycleId: string, personId: string, date: string): void {
  const db = getDb();
  const place = (db.query("SELECT value FROM settings WHERE key = 'office_city'").get() as { value: string }).value;
  const p = db.query("SELECT name FROM people WHERE id = ?").get(personId) as { name: string };
  seedEvent("part1_confirmed", cycleId, personId, { place, appraiseeName: p.name }, date);
}

export function seedPart1(opts: { afterStep1: boolean }): void {
  const db = getDb();
  const upd = db.prepare("UPDATE people SET position_kind = ?, duty_types = ? WHERE id = ?");
  for (const { id } of db.query("SELECT id FROM people").all() as { id: string }[]) {
    const kind = KIND[id];
    if (!kind) throw new Error(`Brak rodzaju stanowiska dla osoby ${id}`);
    upd.run(kind, JSON.stringify(DUTIES[id] ?? []), id);
  }

  savePart1("cycle-ewa", "poprzedni-naczelnik", { additional: ["orientacja-na-klienta"], expectations: {} }, "2024-12-02");
  confirm("cycle-ewa", "ewa", "2024-12-03");

  savePart1("cycle-tomasz", "anna", { additional: [], expectations: {} }, "2024-12-02");
  confirm("cycle-tomasz", "tomasz", "2024-12-03");

  if (opts.afterStep1) {
    savePart1(
      "cycle-piotr",
      "marek",
      {
        additional: ["orientacja-na-klienta", "myslenie-analityczne"],
        expectations: { "orientacja-na-klienta": "Odpowiedź na pismo interesanta w ciągu 3 dni roboczych." },
      },
      "2024-12-09",
    );
    confirm("cycle-piotr", "piotr", "2024-12-09");
  }
}
