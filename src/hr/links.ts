import { registerCycleLinks } from "../cycle-links";
import { registerHomeTasks } from "../home-tasks";
import { canViewHistory } from "./history";
import { canViewSheet } from "./sheet-data";

registerCycleLinks((cycle, viewer) => {
  const links: { label: string; href: string }[] = [];
  if (canViewSheet(viewer, cycle)) links.push({ label: "Arkusz", href: `/cycles/${cycle.id}/sheet` });
  if (canViewHistory(viewer, cycle.person_id)) links.push({ label: "Historia ocen", href: `/people/${cycle.person_id}/history` });
  return links;
});

registerHomeTasks((person) => (person.role === "hr" ? [{ title: "Stan cykli", href: "/hr", detail: "Stan wszystkich cykli oceny i obowiązki urzędu" }] : []));
