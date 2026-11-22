import { cycleDeadlineDetails, openCycle, previousCycleOf } from "../cycles";
import { registerCycleLinks } from "../cycle-links";
import { getDb } from "../db";
import { rules } from "../engine/rules";
import { registerHomeTasks, type HomeTask } from "../home-tasks";
import { visibleCyclesOf } from "../hr/history";
import { personById } from "../people";
import { formatDate } from "../views/layout";
import { today } from "../settings";
import { assessmentPhaseOpen } from "./phase";
import { assessmentState } from "./state";
import { verdictText } from "./verdict";

registerHomeTasks((person) => {
  const tasks: HomeTask[] = [];
  const subordinates = getDb().query("SELECT DISTINCT person_id FROM cycles WHERE appraiser_id = ?").all(person.id) as { person_id: string }[];
  for (const { person_id } of subordinates) {
    const cycle = openCycle(person_id);
    if (!cycle || cycle.appraiser_id !== person.id) continue;
    const stage = assessmentState(cycle.id).stage;
    const name = personById(person_id)?.name;
    if (stage === "draft" && assessmentPhaseOpen(cycle)) {
      const d = cycleDeadlineDetails(cycle.id);
      tasks.push({
        title: `Wystaw ocenę: ${name}`,
        href: `/cycles/${cycle.id}/assessment`,
        heading: "Wystaw ocenę",
        person: name,
        due: d.deadline,
        basis: d.basis.join(", "),
        action: "Wystaw ocenę",
      });
    }
    if (stage === "approved") {
      tasks.push({ title: `Czeka na potwierdzenie zapoznania: ${name}`, href: `/cycles/${cycle.id}/assessment` });
      tasks.push({
        title: `Oceniany nie potwierdza zapoznania: ${name}`,
        heading: "Oceniany nie potwierdza zapoznania?",
        person: name,
        detail: "Fikcję zapoznania stwierdza oceniający: wpis zapisuje powód i sposób doręczenia kopii arkusza. Kadry zobaczą ten wpis.",
        action: "Stwierdź fikcję zapoznania",
        href: `/cycles/${cycle.id}/assessment/fiction`,
      });
    }
  }
  const own = openCycle(person.id);
  if (own && assessmentState(own.id).stage === "approved") {
    tasks.push({ title: "Zapoznaj się z oceną", href: `/cycles/${own.id}/assessment` });
  }

  // Własny, najnowszy cykl: wynik po zapoznaniu albo najbliższy termin, żeby strona nie była pusta.
  const mine = visibleCyclesOf(person.id)[0];
  if (mine) {
    const latest = assessmentState(mine.id);
    const previous = !latest.snapshot ? previousCycleOf(mine.id) : null;
    const st = previous ? assessmentState(previous.id) : latest;
    const href = `/cycles/${previous?.id ?? mine.id}/assessment`;
    if ((st.stage === "acknowledged" || st.stage === "fiction") && st.snapshot && st.objectionDeadline) {
      const { verdict, level } = verdictText(st.snapshot.result);
      const to = st.snapshot.sheet === "A" ? "kierownika urzędu" : "dyrektora generalnego urzędu";
      const open = st.objectionDeadline >= today();
      tasks.push({
        title: "Twoja ocena",
        person: level ? `${verdict}, ${level}` : verdict,
        detail: open ? `Sprzeciw do ${to} możesz złożyć w ustawowym terminie.` : `Termin sprzeciwu minął ${formatDate(st.objectionDeadline)}.`,
        due: open ? st.objectionDeadline : undefined,
        basis: open ? rules.deadlines.objectionDays.basis : undefined,
        action: "Zobacz ocenę",
        href,
      });
    } else if (mine.id === openCycle(person.id)?.id && st.stage !== "approved") {
      const d = cycleDeadlineDetails(mine.id);
      tasks.push({
        title: "Nic na Ciebie nie czeka",
        detail: "Twój termin oceny:",
        due: d.deadline,
        basis: d.basis.join(", "),
        action: st.stage === "no_part1" ? "Zobacz część I" : "Zobacz ocenę",
        href: st.stage === "no_part1" ? `/cycles/${mine.id}/part1` : href,
        quiet: true,
      });
    }
  }
  return tasks;
});

registerCycleLinks((cycle, person) => {
  const href = `/cycles/${cycle.id}/assessment`;
  if (cycle.appraiser_id === person.id) return assessmentPhaseOpen(cycle) ? [{ label: "Ocena", href }] : [];
  if (cycle.person_id === person.id && assessmentState(cycle.id).stage !== "draft" && assessmentState(cycle.id).stage !== "no_part1") {
    return [{ label: "Ocena", href }];
  }
  if (person.role === "hr" && ["approved", "acknowledged", "fiction"].includes(assessmentState(cycle.id).stage)) {
    return [{ label: "Ocena", href }];
  }
  return [];
});
