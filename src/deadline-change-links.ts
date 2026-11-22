import { registerCycleLinks } from "./cycle-links";
import { getDb } from "./db";
import { canChangeDeadline, canRequestChange, deadlineChangeBlocked, pendingRequest, requestState } from "./deadline-change";
import { openCycle } from "./cycles";
import { registerHomeTasks, type HomeTask } from "./home-tasks";
import { personById } from "./people";
import { formatDate } from "./views/layout";

registerCycleLinks((cycle, viewer) => {
  const base = `/cycles/${cycle.id}/deadline-change`;
  if (canChangeDeadline(viewer, cycle)) return [{ label: "Zmień termin oceny", href: base }];
  if (viewer.id === cycle.person_id && canRequestChange(viewer, cycle)) return [{ label: "Wnioskuj o zmianę terminu", href: `${base}/request` }];
  if (viewer.id === cycle.person_id && requestState(cycle.id)) return [{ label: "Wniosek o zmianę terminu", href: `${base}/request` }];
  return [];
});

registerHomeTasks((person) => {
  const tasks: HomeTask[] = [];
  const rows = getDb().query("SELECT DISTINCT person_id FROM cycles WHERE appraiser_id = ?").all(person.id) as { person_id: string }[];
  for (const { person_id } of rows) {
    const cycle = openCycle(person_id);
    if (!cycle || cycle.appraiser_id !== person.id) continue;
    const pending = pendingRequest(cycle.id);
    if (!pending) continue;
    const name = personById(person_id)?.name;
    tasks.push({
      title: `Wniosek o zmianę terminu: ${name}`,
      heading: "Wniosek o zmianę terminu",
      person: name,
      detail: `Wniosek z ${formatDate(pending.date)}: ${pending.payload.reason}. Możesz zmienić termin albo odrzucić wniosek z podaniem powodu.`,
      action: "Rozpatrz wniosek",
      href: `/cycles/${cycle.id}/deadline-change`,
    });
  }

  const own = openCycle(person.id);
  const st = own ? requestState(own.id) : null;
  if (own && st) {
    const href = `/cycles/${own.id}/deadline-change/request`;
    const d = st.decision;
    const detail = !d
      ? `Wniosek z ${formatDate(st.request.date)} czeka na decyzję oceniającego.`
      : d.type === "deadline_change_rejected"
        ? `Wniosek z ${formatDate(st.request.date)} odrzucony. Powód: ${d.payload.reason}`
        : `Wniosek z ${formatDate(st.request.date)} przyjęty. Nowy termin oceny: ${formatDate(d.payload.newDeadline)}.`;
    tasks.push({ title: "Twój wniosek o zmianę terminu", heading: "Twój wniosek o zmianę terminu", detail, action: "Zobacz wniosek", href, standing: true });
  } else if (own && deadlineChangeBlocked(own) === null) {
    tasks.push({ title: "Wnioskuj o zmianę terminu", action: "Wnioskuj o zmianę terminu", href: `/cycles/${own.id}/deadline-change/request`, standing: true, detail: "Możesz wnioskować o zmianę terminu oceny (art. 81 ust. 8 pkt 4 ustawy)." });
  }
  return tasks;
});
