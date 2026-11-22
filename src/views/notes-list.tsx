import { card } from "../content";
import { criterion } from "../engine/scoring";
import { PageHeader } from "./components";
import { fillTemplate, fullMonthsBetween, nameForm } from "../hr-partner/partner";
import type { Note } from "../notes/repo";
import type { Person } from "../people";
import { officeSettings } from "../office-settings";
import { Layout, formatDate } from "./layout";
import { RATING_LABEL } from "./components/note-item";

export type NoteGroup = { person: Person; notes: Note[]; canWrite: boolean; cycleHref?: string; cycleAction?: string };

const OK_ICON = <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

/** Zdanie partnera o braku notatek: żadnej od tej osoby albo żadnej od `teamSilenceMonths` pełnych miesięcy. Bez liczb przy nazwisku. */
export function silenceAbout(name: string, latestNoteDate: string | null, today: string): string | null {
  const texts = card("beforeMeeting").texts ?? {};
  const months = latestNoteDate === null ? 0 : fullMonthsBetween(latestNoteDate, today);
  if (latestNoteDate !== null && months < officeSettings().teamSilenceMonths) return null;
  const loc = nameForm(name, "loc");
  const tpl = loc ? (latestNoteDate === null ? texts.teamNone : texts.teamOld) : texts.teamFallback;
  if (!tpl) return null;
  return loc ? fillTemplate(tpl, latestNoteDate === null ? { loc } : { loc, n: months }) : fillTemplate(tpl, { name });
}

/** Notatka jako mała karta: data, kryterium, ocena przełożonego, zmiana zadań. */
function NoteCard(props: { note: Note }) {
  const n = props.note;
  return (
    <li class="note-item">
      <p class="note-meta-c">
        <b>{formatDate(n.date)}</b>
        <span>{criterion(n.criterion_id).name}</span>
        {n.rating ? <span class={`r-chip ${n.rating === "good" ? "good" : ""}`}>{RATING_LABEL[n.rating]}</span> : null}
        {n.task_change ? <span class="r-chip">zmiana zadań</span> : null}
      </p>
      <p class="note-text">{n.text}</p>
      <div class="btns">
        <a class="btn text" href={`/notes/${n.id}/feedback`}>Przekaż pracownikowi</a>
      </div>
    </li>
  );
}

/** „Notatki o zespole”: grupy po osobie. Przy nazwisku nie ma liczb ani etykiet. */
export function NotesListView(props: { viewer: Person; today: string; groups: NoteGroup[]; saved?: boolean; sent?: boolean }) {
  return (
    <Layout title="Notatki o zespole" person={props.viewer} today={props.today}>
      <section class="n-state notes-team">
        <PageHeader title="Notatki o zespole" />
        {props.saved ? <div class="st ok" role="status">{OK_ICON}<div><b>Zapisano notatkę</b></div></div> : null}
        {props.sent ? <div class="st ok" role="status">{OK_ICON}<div><b>Wysłano pracownikowi</b></div></div> : null}
        {props.groups.length === 0 ? <p class="cap">Nie masz jeszcze notatek.</p> : null}
        {props.groups.map((g) => {
          const silence = silenceAbout(g.person.name, g.notes[0]?.date ?? null, props.today);
          return (
            <section class="card person-notes" aria-label={g.person.name}>
              <div class="pn-head">
                <h2>{g.person.name}</h2>
                {g.canWrite ? (
                  <a class="btn primary" href={`/people/${g.person.id}/notes/new`}>
                    <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
                    Dopisz notatkę
                  </a>
                ) : null}
                {g.cycleHref ? <a class="btn text" href={g.cycleHref}>{g.cycleAction ?? "Cykl oceny"}</a> : null}
              </div>
              {g.notes.length > 0 ? (
                <>
                  {silence ? <p class="cap">{silence}</p> : null}
                  <ul class="note-list">
                    {g.notes.map((n) => <NoteCard note={n} />)}
                  </ul>
                </>
              ) : (
                <p class="cap">{silence ?? "Nie masz jeszcze notatek o tej osobie."}</p>
              )}
            </section>
          );
        })}
      </section>
    </Layout>
  );
}
