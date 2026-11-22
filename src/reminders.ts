import { assessmentState } from "./assessment/state";
import { cycleDeadlineDetails, openCycle, type Cycle } from "./cycles";
import { shiftedDeadlineSentence } from "./deadline-shift";
import { getDb } from "./db";
import { dueWords } from "./due-words";
import { addDays } from "./engine/deadlines";
import { registerHomeTasks, type HomeTask } from "./home-tasks";
import { assessmentWindowDays } from "./office-settings";
import { personById } from "./people";
import { today } from "./settings";
import { formatDate } from "./views/layout";


registerHomeTasks((person) => {
  const { value: window, label } = assessmentWindowDays();
  const rows = getDb().query("SELECT DISTINCT person_id FROM cycles WHERE appraiser_id = ?").all(person.id) as { person_id: string }[];
  const cycles: Cycle[] = [];
  for (const id of new Set([...rows.map((r) => r.person_id), person.id])) {
    const c = openCycle(id);
    if (c && (c.appraiser_id === person.id || c.person_id === person.id)) cycles.push(c);
  }
  const now = today();
  const tasks: HomeTask[] = [];
  for (const c of cycles) {
    const stage = assessmentState(c.id).stage;
    if (stage !== "no_part1" && stage !== "draft") continue; // po zatwierdzeniu termin jest zamrożony
    const d = cycleDeadlineDetails(c.id);
    const shifted = shiftedDeadlineSentence(c.id);
    const own = c.person_id === person.id;
    const name = personById(c.person_id)?.name;
    if (shifted) tasks.push({ title: shifted.text, person: own ? undefined : name, detail: shifted.byAppraiser ? `Decyzja oceniającego z pismem do ocenianego (${shifted.basis.join("; ")}). Pismo i daty na osi czasu.` : `Nieobecność dłuższa niż miesiąc zmienia termin oceny (${shifted.basis.join("; ")}). Daty na osi czasu.`, action: "Zobacz oś czasu", href: `/cycles/${c.id}/timeline` });
    if (now < addDays(d.deadline, -window) || now > d.deadline) continue;
    tasks.push({
      title: own ? `Twój termin oceny: ${formatDate(d.deadline)}` : `Termin oceny ${name}: ${formatDate(d.deadline)}`,
      href: `/cycles/${c.id}/timeline`,
      detail: `${dueWords(d.deadline, now) ? `${dueWords(d.deadline, now)} ` : ""}${d.basis.join("; ")}. Przypomnienie na ${window} dni przed terminem: ${label}.`,
    });
  }
  return tasks;
});
