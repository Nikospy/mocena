import { DC, type Blocked, type RequestState } from "../deadline-change";
import type { AppEvent } from "../events";
import type { Person } from "../people";
import { LegalBasis, PageHeader } from "./components";
import { Layout, formatDate, formatDateLong } from "./layout";
import { PrintButton, SheetField } from "./sheet";

export type ChangeFormValues = { case: string; newDate: string; reason: string };
export type ChangeFormErrors = Partial<Record<"case" | "newDate" | "reason", string>>;

function Check() {
  return (
    <span class="box">
      <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

export function RuleCard(props: { id: string; cases?: boolean }) {
  return (
    <section class="rule" aria-labelledby={props.id}>
      <div class="voice rule-v">
        <span class="pg" aria-hidden="true">§</span>
        <div>
          <h2 id={props.id}>Kiedy można zmienić termin</h2>
        </div>
      </div>
      {props.cases === false ? null : <p>{DC.intro}</p>}
      {props.cases === false ? null : <ul class="plain-list">
        {DC.cases.map((c) => (
          <li>
            <LegalBasis basis={`art. 81 ust. 8 pkt ${c.n}`} /> {c.label}
          </li>
        ))}
      </ul>}
      <p class="cap">{DC.condition}</p>
    </section>
  );
}

export function ChangeFormView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  personName: string;
  currentDeadline: string;
  blocked: Blocked;
  values: ChangeFormValues;
  errors?: ChangeFormErrors;
  request: { id: number; date: string; reason: string; requestedDate: string | null } | null;
}) {
  const v = props.values;
  const e = props.errors ?? {};
  const off = props.blocked !== null;
  return (
    <Layout title={`Zmiana terminu oceny: ${props.personName}`} person={props.viewer} today={props.today}>
      <PageHeader title={<>Zmień termin oceny: {props.personName}</>} />
      <section class="card form-card">
        <p>
          Obecny termin: <b>{formatDateLong(props.currentDeadline)}</b>
        </p>
        {props.blocked ? (
          <p class="st warn" role="status">
            {props.blocked.message} <LegalBasis basis={DC.basis} />
          </p>
        ) : null}
        {props.request ? (
          <div class="st info" role="status">
            <div>
              <b>Wniosek ocenianego z {formatDate(props.request.date)}</b>
              <p>{props.request.reason}</p>
              {props.request.requestedDate ? <small>Proponowany termin: {formatDate(props.request.requestedDate)}</small> : null}
            </div>
          </div>
        ) : null}
      </section>
      {props.blocked ? null : <RuleCard id="h-dc-rule" cases={false} />}
      <section class="card form-card">
        <form method="post" action={`/cycles/${props.cycleId}/deadline-change`} class="abs-form">
          {props.request ? <input type="hidden" name="requestId" value={String(props.request.id)} /> : null}
          <fieldset class="dc-cases" disabled={off}>
            <legend class="lbl">Przypadek z art. 81 ust. 8 ustawy</legend>
            {DC.cases.map((c) => {
              const unavailable = c.n === 4 && !props.request;
              return (
                <label class="cb">
                  <input type="radio" name="case" value={String(c.n)} checked={v.case === String(c.n)} disabled={unavailable} />
                  <Check />
                  <span class="cbt">
                    pkt {c.n}: {c.label}
                    {unavailable ? <small>Wymaga wniosku ocenianego.</small> : null}
                  </span>
                </label>
              );
            })}
            {e.case ? <p class="st bad" role="alert">{e.case}</p> : null}
          </fieldset>
          <div>
            <label class="lbl" for="newDate">Nowy termin sporządzenia oceny</label>
            <input class="area" type="date" id="newDate" name="newDate" value={v.newDate} disabled={off} aria-invalid={e.newDate ? "true" : undefined} aria-describedby="newDate-words" />
            <p class="date-words" id="newDate-words" data-date-words-for="newDate">{v.newDate ? formatDateLong(v.newDate) : ""}</p>
            {e.newDate ? <p class="st bad" role="alert">{e.newDate}</p> : null}
            <p class="cap">Termin w dzień wolny przechodzi na następny dzień roboczy.</p>
          </div>
          <div>
            <label class="lbl" for="reason">Uzasadnienie</label>
            <textarea class="area" id="reason" name="reason" rows={4} disabled={off} aria-invalid={e.reason ? "true" : undefined}>{v.reason}</textarea>
            {e.reason ? <p class="st bad" role="alert">{e.reason}</p> : null}
          </div>
          <button class="btn primary full" type="submit" disabled={off}>
            Zmień termin i przygotuj pismo
          </button>
          <p class="cap">{DC.notice.text} ({DC.notice.basis})</p>
        </form>
      </section>
      {props.request ? (
        <section class="card form-card">
          <h2>Odrzuć wniosek</h2>
          <form method="post" action={`/cycles/${props.cycleId}/deadline-change/reject`} class="abs-form">
            <input type="hidden" name="requestId" value={String(props.request.id)} />
            <label class="lbl" for="reject-reason">Powód odrzucenia</label>
            <textarea class="area" id="reject-reason" name="reason" rows={3}></textarea>
            <button class="btn secondary full" type="submit">Odrzuć wniosek</button>
          </form>
        </section>
      ) : null}
      <script src="/date-words.js" defer></script>
    </Layout>
  );
}

export function RequestFormView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  currentDeadline: string;
  blocked: Blocked;
  state: RequestState | null;
  values: { reason: string; requestedDate: string };
  errors?: Partial<Record<"reason" | "requestedDate", string>>;
}) {
  const e = props.errors ?? {};
  const s = props.state;
  const pending = s && !s.decision ? s.request : null;
  const decision = s?.decision ?? null;
  const off = props.blocked !== null || pending !== null;
  return (
    <Layout title="Wniosek o zmianę terminu oceny" person={props.viewer} today={props.today}>
      <PageHeader title="Wniosek o zmianę terminu oceny" />
      <section class="card form-card">
        <p>
          Obecny termin: <b>{formatDateLong(props.currentDeadline)}</b>
        </p>
        {pending ? (
          <p class="st info" role="status">
            Wniosek z {formatDate(pending.date)} czeka na decyzję oceniającego.
          </p>
        ) : null}
        {decision?.type === "deadline_change_rejected" ? (
          <div class="st bad" role="status">
            <div>
              <b>Wniosek z {formatDate(s!.request.date)} odrzucony {formatDate(decision.date)}</b>
              <p>Powód: {decision.payload.reason}</p>
            </div>
          </div>
        ) : null}
        {decision?.type === "deadline_changed" ? (
          <div class="st ok" role="status">
            <div>
              <b>Wniosek z {formatDate(s!.request.date)} przyjęty {formatDate(decision.date)}</b>
              <p>Nowy termin oceny: {formatDate(decision.payload.newDeadline)}.</p>
              <a class="btn link-chip" href={`/cycles/${props.cycleId}/deadline-change/${decision.id}/letter`}>Pismo o zmianie terminu</a>
            </div>
          </div>
        ) : null}
        {props.blocked && !pending ? (
          <p class="st warn" role="status">
            {props.blocked.message} <LegalBasis basis={DC.basis} />
          </p>
        ) : null}
      </section>
      <RuleCard id="h-dc-rule" />
      <section class="card form-card">
        <p class="cap">Wniosek rozpatruje oceniający: może zmienić termin albo odrzucić wniosek z podaniem powodu.</p>
        <form method="post" action={`/cycles/${props.cycleId}/deadline-change/request`} class="abs-form">
          <div>
            <label class="lbl" for="reason">Uzasadnienie wniosku</label>
            <textarea class="area" id="reason" name="reason" rows={4} disabled={off} aria-invalid={e.reason ? "true" : undefined}>{props.values.reason}</textarea>
            {e.reason ? <p class="st bad" role="alert">{e.reason}</p> : null}
          </div>
          <div>
            <label class="lbl" for="requestedDate">Proponowany termin (nieobowiązkowo)</label>
            <input class="area" type="date" id="requestedDate" name="requestedDate" value={props.values.requestedDate} disabled={off} aria-invalid={e.requestedDate ? "true" : undefined} aria-describedby="requestedDate-words" />
            <p class="date-words" id="requestedDate-words" data-date-words-for="requestedDate">{props.values.requestedDate ? formatDateLong(props.values.requestedDate) : ""}</p>
            {e.requestedDate ? <p class="st bad" role="alert">{e.requestedDate}</p> : null}
          </div>
          <button class="btn primary full" type="submit" disabled={off}>
            Złóż wniosek
          </button>
        </form>
      </section>
      <script src="/date-words.js" defer></script>
    </Layout>
  );
}

export function LetterView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  officeName: string;
  city: string;
  event: AppEvent;
  appraiseeName: string;
  appraiserName: string;
  appraiserTitle: string | null;
}) {
  const x = props.event.payload;
  return (
    <Layout title="Pismo o zmianie terminu oceny" person={props.viewer} today={props.today}>
      <article class="sheet-doc dc-letter">
        <div class="no-print">
          <PageHeader
            title="Pismo o zmianie terminu oceny"
            extra={<PrintButton />}
            links={
              <>
                <a href={`/cycles/${props.cycleId}/timeline`}>Oś czasu</a>
                <a href={`/cycles/${props.cycleId}/sheet`}>Arkusz</a>
              </>
            }
          />
        </div>
        <section class="card sheet-part">
          <SheetField label="Urząd">{props.officeName}</SheetField>
          <p class="dc-place">
            {props.city}, {formatDate(props.event.date)}
          </p>
          <SheetField label="Oceniany">{props.appraiseeName}</SheetField>
          <h2>Zawiadomienie o zmianie terminu oceny okresowej</h2>
          <p>
            Zawiadamiam o zmianie terminu sporządzenia oceny okresowej z <b>{formatDate(x.oldDeadline)}</b> na <b>{formatDate(x.newDeadline)}</b>.
          </p>
          <SheetField label="Podstawa">
            art. 81 ust. 8 pkt {x.case} ustawy o służbie cywilnej ({DC.cases.find((c) => c.n === x.case)?.label}); {DC.notice.basis}
          </SheetField>
          <SheetField label="Uzasadnienie">{x.reason}</SheetField>
          <SheetField label="Oceniający">
            {props.appraiserName}
            {props.appraiserTitle ? `, ${props.appraiserTitle}` : ""}
          </SheetField>
          <div class="sheet-confirms">
            <div>
              <span class="lbl">Potwierdzenie odbioru przez ocenianego</span>
              <p class="dc-line">Data i miejsce: </p>
            </div>
          </div>
          <p class="cap">Kopię pisma dołącza się do arkusza oceny ({DC.notice.basis}).</p>
        </section>
      </article>
    </Layout>
  );
}
