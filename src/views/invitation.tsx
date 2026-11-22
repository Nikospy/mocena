import { INVITATION_KINDS, daysBetween, invitationMailto, invitationStatus, type Invitation, type InvitationErrors, type InvitationInput, type InvitationKind } from "../invitations";
import type { Cycle } from "../cycles";
import type { Person } from "../people";
import { LegalBasis, PageHeader } from "./components";
import { Layout, formatDate, formatDateLong } from "./layout";

/** „Na rozmowę o kryteriach zostało 18 dni – do 27.12.2024.” z odmianą przez liczby. */
function limitSentence(left: number, limit: string): string {
  const d = formatDate(limit);
  if (left < 0) return `Termin rozmowy o kryteriach minął ${d}.`;
  if (left === 0) return `Termin rozmowy o kryteriach mija dziś, ${d}.`;
  if (left === 1) return `Na rozmowę o kryteriach został 1 dzień – do ${d}.`;
  const verb = new Intl.PluralRules("pl-PL").select(left) === "few" ? "zostały" : "zostało";
  return `Na rozmowę o kryteriach ${verb} ${left} dni – do ${d}.`;
}

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
        <a class="btn primary" href={`/cycles/${cycle.id}/invitations/new?kind=${kind}`}>{active ? "Zmień datę rozmowy" : "Zaproś na rozmowę"}</a>
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
      <PageHeader context={k.title} title={<>Zaproś na rozmowę: {props.personName}</>} />
      {late ? (
        <p class="st warn" role="alert">
          <span>
            <b>Ta data jest po terminie rozmowy o kryteriach ({formatDate(props.limit!)})</b>
            <small>Zaproszenie i tak zostanie wysłane. Termin rozmowy wynika z § 7 rozporządzenia, nie z zaproszenia.</small>
          </span>
        </p>
      ) : null}
      <div class="o-grid">
      <section class="card form-card ct-form">
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
            <label class="lbl" for="note">Wiadomość dla ocenianego (nieobowiązkowa)</label>
            <textarea class="area" id="note" name="note" rows={3} maxlength={500} aria-invalid={e.note ? "true" : undefined}>{v.note}</textarea>
            {e.note ? <p class="st bad" role="alert">{e.note}</p> : null}
          </div>
          <p class="ct-actions">
            <button class="btn primary" type="submit">Wyślij zaproszenie</button>
          </p>
        </form>
      </section>
      <aside class="side">
      {props.limit ? (
        <p class="st info" role="status">
          <span>
            <b>{limitSentence(left!, props.limit)}</b>
            <small>Rozmowa o kryteriach ma się odbyć w terminie z <LegalBasis basis={props.limitBasis} /> rozporządzenia.</small>
          </span>
        </p>
      ) : null}
      <section class="rule">
        <p class="voice rule-v"><span class="pg" aria-hidden="true">§</span><span><b>Tematy rozmowy</b> · z przepisu</span></p>
        <ol class="b-ol">{k.topics.map((t) => <li>{t}</li>)}</ol>
        <p><LegalBasis basis={k.basis} /></p>
      </section>
      <section class="hint">
        <p class="voice hint-v">Podpowiedź</p>
        <p>Zaproszenie nie jest wymogiem przepisu. To wygoda dla obu stron: data, miejsce i tematy rozmowy są zebrane razem.</p>
      </section>
      </aside>
      </div>
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
      <PageHeader context={props.personName} title={k.invitationTitle} lead={<>{formatDateLong(i.date)}, {i.time}, {i.place}</>} />
      <div class="o-grid">
      <div class="o-main ct-inv">
      <p class={`st ${i.confirmedOn ? "ok" : "info"}`} role="status">
        <b>{invitationStatus(i, props.cycle)}</b>
      </p>
      {i.note ? (
        <section aria-labelledby="h-inv-note">
          <h2 id="h-inv-note" class="ct-side-h">Wiadomość od oceniającego</h2>
          <p>{i.note}</p>
        </section>
      ) : null}
      <div class="btns">
        {isEmployee && !i.confirmedOn ? (
          <form method="post" action={`/cycles/${props.cycle.id}/invitations/${i.id}/confirm`}>
            <button class="btn primary" type="submit">Potwierdzam termin</button>
          </form>
        ) : null}
        <a class="btn" href={`/cycles/${props.cycle.id}/invitations/${i.id}.ics`}>Pobierz do kalendarza</a>
        {isEmployee ? null : <a class="btn" href={invitationMailto(i, props.personName, props.viewer.name)}>Wyślij e-mailem</a>}
      </div>
      </div>
      <aside class="side">
      <section class="rule">
        <p class="voice rule-v"><span class="pg" aria-hidden="true">§</span><span><b>Tematy rozmowy</b> · z przepisu</span></p>
        <ol class="b-ol">{k.topics.map((t) => <li>{t}</li>)}</ol>
        <p><LegalBasis basis={k.basis} /></p>
      </section>
      </aside>
      </div>
    </Layout>
  );
}
