import { assessmentState } from "../assessment/state";
import { registerCycleLinks } from "../cycle-links";
import { cycleDeadlineDetails, openCycle } from "../cycles";
import { addDays } from "../engine/deadlines";
import { registerHomeTasks } from "../home-tasks";
import { assessmentWindowDays } from "../office-settings";
import { personById } from "../people";
import { today } from "../settings";
import { canViewHistory } from "./history";
import { latestCycles } from "./latest-cycles";
import { canViewSheet } from "./sheet-data";

registerCycleLinks((cycle, viewer) => {
  const links: { label: string; href: string }[] = [];
  if (canViewSheet(viewer, cycle)) links.push({ label: "Arkusz", href: `/cycles/${cycle.id}/sheet` });
  if (canViewHistory(viewer, cycle.person_id)) links.push({ label: "Historia ocen", href: `/people/${cycle.person_id}/history` });
  return links;
});

registerHomeTasks((person) => (person.role === "hr" ? [{ title: "Stan cykli", href: "/hr", detail: "Stan wszystkich cykli oceny i obowiązki urzędu." }] : []));

/** Kadry: nieobecności wpisuje się przed terminem oceny, bo od nich zależy termin. Sprawa od okna przed terminem (to samo co „Wystaw ocenę”). */
registerHomeTasks((person) => {
  if (person.role !== "hr") return [];
  const now = today();
  const window = assessmentWindowDays().value;
  return latestCycles().flatMap((c) => {
    if (openCycle(c.person_id)?.id !== c.id) return [];
    const stage = assessmentState(c.id).stage;
    if (stage !== "no_part1" && stage !== "draft") return [];
    const d = cycleDeadlineDetails(c.id);
    if (now < addDays(d.deadline, -window)) return [];
    const name = personById(c.person_id)?.name;
    return [
      {
        title: `Wpisz nieobecność: ${name}`,
        heading: "Wpisz nieobecność",
        person: name,
        detail: "Termin oceny się zbliża. Nieobecność dłuższa niż miesiąc przesuwa termin, więc wpisz ją przed terminem.",
        due: d.deadline,
        basis: d.basis.join(", "),
        action: "Wpisz nieobecność",
        href: `/cycles/${c.id}/absences`,
      },
    ];
  });
});
