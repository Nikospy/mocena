// Sprawa oceniającego po rozstrzygnięciu sprzeciwu „ponowne sporządzenie oceny” (art. 83 ust. 3 ustawy).
import { getDb } from "../db";
import { registerHomeTasks } from "../home-tasks";
import { personById } from "../people";
import { formatDate } from "../views/layout";
import { reassessmentDeadline } from "./cycle-state";

registerHomeTasks((person) => {
  const rows = getDb().query("SELECT id, person_id FROM cycles WHERE appraiser_id = ?").all(person.id) as { id: string; person_id: string }[];
  return rows.flatMap((r) => {
    const d = reassessmentDeadline(r.id);
    if (!d) return [];
    const name = personById(r.person_id)?.name ?? r.person_id;
    return [
      {
        title: `Ponowne sporządzenie oceny: ${name}`,
        heading: "Ponowne sporządzenie oceny",
        person: name,
        detail: `Sprzeciw uwzględniono z nakazem ponownego sporządzenia oceny. Termin ${formatDate(d.date)} obejmuje sporządzenie oceny po raz drugi. Ponowna ocena nie może być niższa niż pierwsza ani w żadnym elemencie. Prototyp nie ma jeszcze formularza drugiej oceny: sporządzasz ją poza systemem, tu widać pierwszą.`,
        due: d.date,
        basis: d.basis.join(", "),
        action: "Zobacz arkusz pierwszej oceny",
        href: `/cycles/${r.id}/sheet`,
      },
    ];
  });
});
