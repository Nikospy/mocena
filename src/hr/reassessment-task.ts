// Sprawy oceny sporządzanej po raz drugi po rozstrzygnięciu sprzeciwu „ponowne sporządzenie oceny” (art. 83 ust. 3 i 4 ustawy).
// Cykl tej oceny ma już zapoznanie z pierwszą oceną, więc nie jest „otwarty” (`openCycle`): sprawy liczy się tu, nie w `assessment/home.ts`.
import { assessmentState } from "../assessment/state";
import { getDb } from "../db";
import { registerHomeTasks, type HomeTask } from "../home-tasks";
import { personById } from "../people";
import { actsAsAppraiser } from "../substitutions";
import { formatDate } from "../views/layout";
import { reassessmentDeadline } from "./cycle-state";

registerHomeTasks((person) => {
  const rows = getDb().query("SELECT id, person_id, appraiser_id FROM cycles").all() as { id: string; person_id: string; appraiser_id: string }[];
  return rows.flatMap((r): HomeTask[] => {
    const appraiser = actsAsAppraiser(r.appraiser_id, person.id);
    if (!appraiser && r.person_id !== person.id) return [];
    const s = assessmentState(r.id);
    if (!s.redo) return [];
    const name = personById(r.person_id)?.name ?? r.person_id;
    const href = `/cycles/${r.id}/assessment`;
    if (appraiser && s.stage === "draft") {
      const d = reassessmentDeadline(r.id);
      if (!d) return [];
      return [
        {
          title: `Ponowne sporządzenie oceny: ${name}`,
          heading: "Ponowne sporządzenie oceny",
          person: name,
          detail: `Sprzeciw uwzględniono ${formatDate(s.redo.resolvedOn)} z nakazem ponownego sporządzenia oceny. Formularz otwiera się z pierwszą oceną; ocena sporządzona po raz drugi nie może być niższa.`,
          due: d.date,
          basis: d.basis.join(", "),
          action: "Sporządź ocenę po raz drugi",
          href,
        },
      ];
    }
    if (s.stage !== "approved") return [];
    if (appraiser) {
      return [
        { title: `Ocena sporządzona po raz drugi czeka na zapoznanie: ${name}`, href, action: "Otwórz ocenę" },
        {
          title: `Oceniany nie potwierdza zapoznania: ${name}`,
          heading: "Oceniany nie potwierdza zapoznania?",
          person: name,
          detail: "Fikcję zapoznania wpisuje oceniający: wpis zapisuje powód i sposób doręczenia kopii arkusza. Kadry zobaczą ten wpis.",
          action: "Wpisz fikcję zapoznania",
          href: `${href}/fiction`,
        },
      ];
    }
    return [{ title: "Zapoznaj się z oceną sporządzoną po raz drugi", href, action: "Przeczytaj ocenę" }];
  });
});
