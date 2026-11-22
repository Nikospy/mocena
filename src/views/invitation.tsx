import { INVITATION_KINDS, daysBetween, invitationHeadline, invitationStatus, type Invitation, type InvitationErrors, type InvitationInput, type InvitationKind } from "../invitations";
import type { Cycle } from "../cycles";
import type { Person } from "../people";
import { LegalBasis } from "./components";
import { Layout, formatDate, formatDateLong } from "./layout";

/** Blok na karcie rozmowy: stan zaproszenia i przycisk dla oceniającego. */
export function InvitationBlock(props: { cycle: Cycle; kind: InvitationKind; active: Invitation | null }) {
  const { cycle, kind, active } = props;
  return (
    <section class="card" aria-labelledby={`h-inv-${kind}`}>
      <h2 id={`h-inv-${kind}`}>{INVITATION_KINDS[kind].invitationTitle}</h2>
      {active ? (
        <p class={`st ${active.confirmedOn ? "ok" : "info"}`} role="status">
          <span>
            <b>{invitationStatus(active, cycle)}</b>
            <small>{formatDate(active.date)}, {active.time}, {active.place}</small>
          </span>
        </p>
      ) : (
        <p class="cap">Oceniany jeszcze nie dostał zaproszenia.</p>
      )}
      <div class="btns">
        <a class="btn primary" href={`/cycles/${cycle.id}/invitations/new?kind=${kind}`}>{active ? "Zmień termin" : "Zaproś na rozmowę"}</a>
      </div>
    </section>
  );
}

export function InvitationFormView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  personName: string;
  values: InvitationInput;
  errors?: InvitationErrors;
  limit: string | null;
  limitBasis: string;
}) {
  const v = props.values;
  const e = props.errors ?? {};
  const k = INVITATION_KINDS[v.kind];
  const left = props.limit ? daysBetween(props.today, props.limit) : null;
  const late = props.limit && /^\d{4}-\d{2}-\d{2}$/.test(v.date) && v.date > props.limit;
  return (
    <Layout title={`${k.invitationTitle}: ${props.personName}`} person={props.viewer} today={props.today}>
      <section class="card hdr slim">
        <div class="hdr-id">
          <p class="cap">{k.title}</p>
          <h1>Zaproś na rozmowę: {props.personName}</h1>
        </div>
      </section>
      {props.limit ? (
        <p class="st info" role="status">
          <span>
            <b>{left !== null && left < 0
              ? `Termin rozmowy o kryteriach minął ${formatDate(props.limit)}.`
              : `Do granicy z § 7: ${left} dni (do ${formatDate(props.limit)})`}</b>
            <small>Rozmowa o kryteriach ma się odbyć w terminie z <LegalBasis basis={props.limitBasis} />.</small>
          </span>
        </p>
      ) : null}
      {late ? (
        <p class="st warn" role="alert">
          <span>
            <b>Ta data jest po granicy z § 7 ({formatDate(props.limit!)})</b>
            <small>Zaproszenie zapisze się mimo to. Termin rozmowy wynika z przepisu, nie z zaproszenia.</small>
          </span>
        </p>
      ) : null}
      <section class="card form-card">
        <form method="post" action={`/cycles/${props.cycleId}/invitations`} class="abs-form">
          <input type="hidden" name="kind" value={v.kind} />
          <div class="dates">
            <div>
              <label class="lbl" for="date">Data rozmowy</label>
              <input class="area" type="date" id="date" name="date" value={v.date} aria-invalid={e.date ? "true" : undefined} aria-describedby="date-words" />
              <p class="date-words" id="date-words" data-date-words-for="date">{v.date && !e.date ? formatDateLong(v.date) : ""}</p>
              {e.date ? <p class="st bad" role="alert">{e.date}</p> : null}
            </div>
            <div>
              <label class="lbl" for="time">Godzina</label>
              <input class="area" type="time" id="time" name="time" value={v.time} aria-invalid={e.time ? "true" : undefined} />
              {e.time ? <p class="st bad" role="alert">{e.time}</p> : null}
            </div>
          </div>
          <div>
            <label class="lbl" for="place">Miejsce</label>
            <input class="area" type="text" id="place" name="place" value={v.place} maxlength={120} placeholder="pokój 214 albo wideo" aria-invalid={e.place ? "true" : undefined} />
            {e.place ? <p class="st bad" role="alert">{e.place}</p> : null}
          </div>
          <div>
            <label class="lbl" for="note">Notatka dla ocenianego (nieobowiązkowa)</label>
            <textarea class="area" id="note" name="note" rows={3} maxlength={500} aria-invalid={e.note ? "true" : undefined}>{v.note}</textarea>
            {e.note ? <p class="st bad" role="alert">{e.note}</p> : null}
          </div>
          <button class="btn primary full" type="submit">Wyślij zaproszenie</button>
        </form>
      </section>
      <section class="rule">
        <p class="voice rule-v"><span class="pg" aria-hidden="true">§</span><span><b>Tematy rozmowy</b> · z przepisu</span></p>
        <ol class="b-ol">{k.topics.map((t) => <li>{t}</li>)}</ol>
        <p><LegalBasis basis={k.basis} /></p>
      </section>
      <section class="hint">
        <p class="voice hint-v">Podpowiedź</p>
        <p>Zaproszenie nie jest wymogiem przepisu. To wygoda dla obu stron: termin, miejsce i tematy są w jednym miejscu.</p>
      </section>
    </Layout>
  );
}

/** Strona zaproszenia dla stron cyklu: tematy, potwierdzenie terminu, plik kalendarza. */
export function InvitationView(props: { viewer: Person; today: string; cycle: Cycle; invitation: Invitation; personName: string }) {
  const i = props.invitation;
  const k = INVITATION_KINDS[i.kind];
  const isEmployee = props.viewer.id === props.cycle.person_id;
  return (
    <Layout title={k.invitationTitle} person={props.viewer} today={props.today}>
      <section class="card hdr">
        <p class="cap">{props.personName}</p>
        <h1>{invitationHeadline(i)}</h1>
        <p class="cap">{formatDateLong(i.date)}</p>
        {i.note ? <p>{i.note}</p> : null}
        <p class={`st ${i.confirmedOn ? "ok" : "info"}`} role="status">
          <b>{invitationStatus(i, props.cycle)}</b>
        </p>
      </section>
      <section class="rule">
        <p class="voice rule-v"><span class="pg" aria-hidden="true">§</span><span><b>Tematy rozmowy</b> · z przepisu</span></p>
        <ol class="b-ol">{k.topics.map((t) => <li>{t}</li>)}</ol>
        <p><LegalBasis basis={k.basis} /></p>
      </section>
      <div class="btns">
        {isEmployee && !i.confirmedOn ? (
          <form method="post" action={`/cycles/${props.cycle.id}/invitations/${i.id}/confirm`}>
            <button class="btn primary" type="submit">Potwierdzam termin</button>
          </form>
        ) : null}
        <a class="btn" href={`/cycles/${props.cycle.id}/invitations/${i.id}.ics`}>Pobierz do kalendarza</a>
      </div>
    </Layout>
  );
}
