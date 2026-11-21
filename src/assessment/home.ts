import { openCycle } from "../cycles";
import { registerCycleLinks } from "../cycle-links";
import { getDb } from "../db";
import { registerHomeTasks } from "../home-tasks";
import { personById } from "../people";
import { assessmentState } from "./state";


registerHomeTasks((person) => {
  const tasks: { title: string; href: string }[] = [];
  const subordinates = getDb().query("SELECT DISTINCT person_id FROM cycles WHERE appraiser_id = ?").all(person.id) as { person_id: string }[];
  for (const { person_id } of subordinates) {
    const cycle = openCycle(person_id);
    if (!cycle || cycle.appraiser_id !== person.id) continue;
    const stage = assessmentState(cycle.id).stage;
    const name = personById(person_id)?.name;
    if (stage === "draft") tasks.push({ title: `Wystaw ocenę: ${name}`, href: `/cycles/${cycle.id}/assessment` });
    if (stage === "approved") tasks.push({ title: `Czeka na potwierdzenie zapoznania: ${name}`, href: `/cycles/${cycle.id}/assessment` });
  }
  const own = openCycle(person.id);
  if (own && assessmentState(own.id).stage === "approved") {
    tasks.push({ title: "Zapoznaj się z oceną", href: `/cycles/${own.id}/assessment` });
  }
  return tasks;
});

registerCycleLinks((cycle, person) => {
  const href = `/cycles/${cycle.id}/assessment`;
  if (cycle.appraiser_id === person.id) return [{ label: "Ocena", href }];
  if (cycle.person_id === person.id && assessmentState(cycle.id).stage !== "draft" && assessmentState(cycle.id).stage !== "no_part1") {
    return [{ label: "Ocena", href }];
  }
  return [];
});
