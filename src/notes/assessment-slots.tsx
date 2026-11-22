import { actsAsAppraiser } from "../substitutions";
import { assessmentState } from "../assessment/state";
import { cycleById } from "../cycles";
import { cycleCriteria } from "../cycles/part1";
import { officeSettings } from "../office-settings";
import type { Person } from "../people";
import { today } from "../settings";
import { CriterionNotes } from "../views/components/criterion-notes";
import { NoteItem } from "../views/components/note-item";
import type { Slots } from "../views/assessment";
import { formatNoteForInsert } from "./insert";
import { notesForCycle, type Note } from "./repo";
import { criterionWarnings } from "./warnings";

/** Sloty formularza oceny (S-02): notatki zalogowanego oceniającego przy kryteriach. Puste dla kogokolwiek innego. */
export function assessmentSlots(p: { cycleId: string; viewer: Person }): Slots {
  const cycle = cycleById(p.cycleId);
  if (!cycle || !actsAsAppraiser(cycle.appraiser_id, p.viewer.id)) return {};
  const notes = notesForCycle(p.cycleId, p.viewer.id);
  const inCycle = new Set(cycleCriteria(p.cycleId).map((c) => c.id));
  const byCriterion = (id: string): Note[] => notes.filter((n) => n.criterion_id === id);
  const others = notes.filter((n) => !inCycle.has(n.criterion_id));
  const scores = assessmentState(p.cycleId).draft?.scores ?? {};
  const now = today();
  const windowMonths = officeSettings().recentFactsWindowMonths;

  return {
    beforeForm: (
      <p>
        <a class="btn text" href={`/cycles/${p.cycleId}/cards/assessment-conversation`}>Karta rozmowy oceniającej</a>
      </p>
    ),
    criterionAside: (criterionId) => {
      const own = byCriterion(criterionId);
      return <CriterionNotes criterionId={criterionId} notes={own} warnings={criterionWarnings({ notes: own, score: scores[criterionId], today: now, windowMonths })} />;
    },
    conclusionsTools: (
      <div class="insert-tools">
        <button type="button" class="btn" data-target="developmentConclusions">Wstaw do wniosków rozwojowych</button>
        <script src="/insert-notes.js" defer></script>
      </div>
    ),
    justificationTools: (
      <div class="insert-tools">
        {others.length > 0 ? (
          <div class="crit-notes">
            <h3>Notatki przy innych kryteriach</h3>
            <ul class="note-list">
              {others.map((n) => (
                <NoteItem note={n} insert={formatNoteForInsert(n)} />
              ))}
            </ul>
          </div>
        ) : null}
        <button type="button" class="btn" data-target="justification">Wstaw do uzasadnienia</button>
        <script src="/insert-notes.js" defer></script>
        <p class="cap">Wstawia zaznaczone notatki z datami na końcu pola. Tekst możesz dalej poprawiać; nic się nie zapisuje, dopóki nie klikniesz „Zapisz”.</p>
      </div>
    ),
  };
}
