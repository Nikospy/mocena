import { assessmentState } from "./assessment/state";
import { cycleDeadlineDetails, openCycle, type Cycle } from "./cycles";
import { getDb } from "./db";
import { addDays } from "./engine/deadlines";
import { registerHomeTasks } from "./home-tasks";
import { officeSettings } from "./office-settings";
import { personById } from "./people";
import { today } from "./settings";
import { formatDate } from "./views/layout";

const DEFAULT_DAYS = 30;

registerHomeTasks((person) => {
  const days = officeSettings().assessmentReminderDays;
  const window = days?.value ?? DEFAULT_DAYS;
  const label = days?.label ?? "ustawienie urzędu";
  const rows = getDb().query("SELECT DISTINCT person_id FROM cycles WHERE appraiser_id = ?").all(person.id) as { person_id: string }[];
  const cycles: Cycle[] = [];
  for (const id of new Set([...rows.map((r) => r.person_id), person.id])) {
    const c = openCycle(id);
    if (c && (c.appraiser_id === person.id || c.person_id === person.id)) cycles.push(c);
  }
  const now = today();
  const tasks: { title: string; href: string; detail?: string }[] = [];
  for (const c of cycles) {
    const stage = assessmentState(c.id).stage;
    if (stage !== "no_part1" && stage !== "draft") continue; // po zatwierdzeniu termin jest zamrożony
    const d = cycleDeadlineDetails(c.id);
    if (now < addDays(d.deadline, -window) || now > d.deadline) continue;
    const name = personById(c.person_id)?.name;
    const basis = d.basis.join("; ");
    tasks.push({
      title: `Termin oceny ${name}: ${formatDate(d.deadline)}`,
      href: `/cycles/${c.id}/timeline`,
      detail: `${basis}. Przypomnienie na ${window} dni przed terminem: ${label}.`,
    });
    if (d.extensionDays > 0) {
      tasks.push({
        title: `Termin oceny przesunięty z ${formatDate(d.base)} na ${formatDate(d.deadline)} z powodu nieobecności dłuższej niż miesiąc (art. 81 ust. 7 ustawy)`,
        href: `/cycles/${c.id}/timeline`,
      });
    }
  }
  return tasks;
});
