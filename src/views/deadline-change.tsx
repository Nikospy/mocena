import { DC, type Blocked, type RequestState } from "../deadline-change";
import type { AppEvent } from "../events";
import type { Person } from "../people";
import { ErrorSummary, FieldError, LegalBasis, PageHeader, invalid } from "./components";
import { Layout, formatDate, formatDateLong } from "./layout";
import { PrintButton, SheetField } from "./sheet";

export type ChangeFormValues = { case: string; newDate: string; reason: string };
export type ChangeFormErrors = Partial<Record<"case" | "newDate" | "reason" | "reject-reason", string>>;

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
      <PageHeader
        title={<>Zmień termin oceny: {props.personName}</>}
        lead={<>Obecny termin: <b>{formatDateLong(props.currentDeadline)}</b></>}
      />
      {props.blocked ? (
        <p class="st warn" role="status">
          {props.blocked.message} <LegalBasis basis={DC.basis} />
        </p>
      ) : null}
      <div class="o-grid">
      <div class="o-main">
      <section class="card form-card ct-form">
        <form method="post" action={`/cycles/${props.cycleId}/deadline-change`} class="abs-form">
          {props.request ? <input type="hidden" name="requestId" value={String(props.request.id)} /> : null}
          <ErrorSummary errors={{ case: e.case, newDate: e.newDate, reason: e.reason }} />
          <fieldset class="dc-cases" disabled={off} aria-describedby={e.case ? "case-error" : undefined}>
            <legend class="lbl">Przypadek z art. 81 ust. 8 ustawy</legend>
            <FieldError id="case" errors={e} />
            {DC.cases.map((c) => {
              const unavailable = c.n === 4 && !props.request;
              return (
                <label class="cb">
                  <input type="radio" name="case" id={c.n === DC.cases.find((x) => x.n !== 4 || props.request)?.n ? "case" : undefined} value={String(c.n)} checked={v.case === String(c.n)} disabled={unavailable} />
                  <Check />
                  <span class="cbt">
                    pkt {c.n}: {c.label}
                    {unavailable ? <small>Wymaga wniosku ocenianego.</small> : null}
                  </span>
                </label>
              );
            })}
          </fieldset>
          <div class="field">
            <label class="lbl" for="newDate">Nowy termin oceny</label>
            <FieldError id="newDate" errors={e} />
            <input class="area" type="date" id="newDate" name="newDate" value={v.newDate} disabled={off} {...invalid("newDate", e, "newDate-words")} />
            <p class="date-words" id="newDate-words" data-date-words-for="newDate">{v.newDate ? formatDateLong(v.newDate) : ""}</p>
            <p class="cap">Termin w dzień wolny przechodzi na następny dzień roboczy.</p>
          </div>
          <div class="field">
            <label class="lbl" for="reason">Uzasadnienie</label>
            <FieldError id="reason" errors={e} />
            <textarea class="area" id="reason" name="reason" rows={4} disabled={off} {...invalid("reason", e)}>{v.reason}</textarea>
          </div>
          <div class="ct-actions">
            <button class="btn primary" type="submit" disabled={off}>
              Zmień termin i przygotuj pismo
            </button>
            <p class="cap">{DC.notice.text} <LegalBasis basis={DC.notice.basis} /></p>
          </div>
        </form>
      </section>
      {props.request ? (
        <section class="card form-card ct-form" aria-labelledby="h-reject">
          <h2 id="h-reject">Odrzuć wniosek</h2>
          <form method="post" action={`/cycles/${props.cycleId}/deadline-change/reject`} class="abs-form">
            <input type="hidden" name="requestId" value={String(props.request.id)} />
            <ErrorSummary errors={{ "reject-reason": e["reject-reason"] }} />
            <div class="field">
              <label class="lbl" for="reject-reason">Powód odrzucenia</label>
              <FieldError id="reject-reason" errors={e} />
              <textarea class="area" id="reject-reason" name="reason" rows={3} {...invalid("reject-reason", e)}></textarea>
            </div>
            <p class="ct-actions">
              <button class="btn" type="submit">Odrzuć wniosek</button>
            </p>
          </form>
        </section>
      ) : null}
      </div>
      <aside class={props.request ? "side first" : "side"}>
        {props.request ? (
          <section class="card ct-request" aria-labelledby="h-request">
            <h2 id="h-request">Wniosek ocenianego z {formatDate(props.request.date)}</h2>
            <p>{props.request.reason}</p>
            {props.request.requestedDate ? <p class="cap">Proponowany termin: <b>{formatDate(props.request.requestedDate)}</b></p> : null}
          </section>
        ) : null}
        {props.blocked ? null : <RuleCard id="h-dc-rule" cases={false} />}
      </aside>
      </div>
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
      <PageHeader title="Wniosek o zmianę terminu oceny" lead={<>Obecny termin: <b>{formatDateLong(props.currentDeadline)}</b></>} />
      <div class="ct-states">
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
              <a href={`/cycles/${props.cycleId}/deadline-change/${decision.id}/letter`}>Pismo o zmianie terminu</a>
            </div>
          </div>
        ) : null}
        {props.blocked && !pending ? (
          <p class="st warn" role="status">
            {props.blocked.message} <LegalBasis basis={DC.basis} />
          </p>
        ) : null}
      </div>
      <div class="o-grid">
      <section class="card form-card ct-form" aria-labelledby="h-req-form">
        <h2 id="h-req-form">Złóż wniosek</h2>
        <p>Wniosek rozpatruje oceniający: może zmienić termin albo odrzucić wniosek z podaniem powodu.</p>
        <form method="post" action={`/cycles/${props.cycleId}/deadline-change/request`} class="abs-form">
          <ErrorSummary errors={{ reason: e.reason, requestedDate: e.requestedDate }} />
          <div class="field">
            <label class="lbl" for="reason">Uzasadnienie wniosku</label>
            <FieldError id="reason" errors={e} />
            <textarea class="area" id="reason" name="reason" rows={4} disabled={off} {...invalid("reason", e)}>{props.values.reason}</textarea>
          </div>
          <div class="field">
            <label class="lbl" for="requestedDate">Proponowany termin (nieobowiązkowo)</label>
            <FieldError id="requestedDate" errors={e} />
            <input class="area" type="date" id="requestedDate" name="requestedDate" value={props.values.requestedDate} disabled={off} {...invalid("requestedDate", e, "requestedDate-words")} />
            <p class="date-words" id="requestedDate-words" data-date-words-for="requestedDate">{props.values.requestedDate ? formatDateLong(props.values.requestedDate) : ""}</p>
          </div>
          <p class="ct-actions">
            <button class="btn primary" type="submit" disabled={off}>
              Złóż wniosek
            </button>
          </p>
        </form>
      </section>
      <aside class="side">
        <RuleCard id="h-dc-rule" />
      </aside>
      </div>
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
            aside={<PrintButton />}
            links={
              <>
                <a href={`/cycles/${props.cycleId}/timeline`}>Oś czasu</a>
                <a href={`/cycles/${props.cycleId}/sheet`}>Arkusz</a>
              </>
            }
          />
        </div>
        <div class="ct-paper">
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
        </div>
      </article>
    </Layout>
  );
}
