import type { CycleLink } from "../cycle-links";
import { addDays } from "../engine/deadlines";
import { rules } from "../engine/rules";
import { romanGrade, type MandatoryGrade } from "../engine/grades";
import type { CycleState, CycleStep } from "../hr/cycle-state";
import type { OfficeStats, ProtectedOfficeStats } from "../hr/stats";
import { TOO_FEW_LABEL } from "../hr/stats-privacy";
import type { Person } from "../people";
import { ErrorSummary, FieldError, LegalBasis, PageHeader, errorId, invalid, type FormErrors } from "./components";
import { Layout, formatDate } from "./layout";

const DOW_ACC = ["niedzielę", "poniedziałek", "wtorek", "środę", "czwartek", "piątek", "sobotę"];
const DOW = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
const dow = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay();

export type ReminderProps = { personId: string; personName: string; grade: MandatoryGrade };

/** Karta obowiązku urzędu: nazwisko tylko jako wartość pola, treść mówi o obowiązku urzędu. */
export function ReminderCard(props: ReminderProps) {
  const g = props.grade;
  const raw = addDays(g.acknowledgedOn, g.days);
  const shifted = raw !== g.dueOn;
  const rawDay = [0, 6].includes(dow(raw)) ? DOW_ACC[dow(raw)] : "dzień wolny od pracy";
  return (
    <section class="card rule hr-duty" aria-labelledby={`obowiazek-${props.personId}`}>
      <div class="hr-duty-main">
        <h2 id={`obowiazek-${props.personId}`}>Obowiązek urzędu: stopień służbowy z mocy prawa</h2>
        {g.atMaxGrade ? (
          <p>Ma najwyższy stopień, kolejnego nie można przyznać.</p>
        ) : (
          <>
            <p>
              Urząd ma obowiązek przyznać kolejny stopień służbowy, bo od ostatniego stopnia są dwie kolejne oceny pozytywne na jednym z dwóch najwyższych poziomów: {formatDate(g.assessmentDates[0])} i {formatDate(g.assessmentDates[1])}. To obowiązek, nie wniosek.
            </p>
            <p>
              <b>Przyznać do {formatDate(g.dueOn)}</b>: {g.days} dni od zapoznania z oceną {formatDate(g.acknowledgedOn)}
              {shifted ? `; ${g.days}. dzień wypada w ${rawDay} ${formatDate(raw)}, więc termin przechodzi na ${DOW_ACC[dow(g.dueOn)]}` : ""}.
              {g.overdue ? ` Termin minął ${formatDate(g.dueOn)}.` : ""} <LegalBasis basis={g.basis} />
            </p>
          </>
        )}
      </div>
      <div class="hr-duty-side">
        <dl class="hr-facts">
          <div><dt>Urzędnik mianowany</dt><dd>{props.personName}</dd></div>
          {g.atMaxGrade ? null : (
            <>
              <div><dt>Stopień</dt><dd class="tnum">{romanGrade(g.fromGrade)} → {romanGrade(g.toGrade!)}</dd></div>
              <div><dt>Przyznać do</dt><dd class="tnum">{formatDate(g.dueOn)}</dd></div>
            </>
          )}
        </dl>
        {g.atMaxGrade ? null : (
          <form method="post" action={`/hr/grades/${props.personId}`}>
            <button class="btn primary" type="submit">
              Odnotuj przyznanie stopnia
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

const STEP_LABEL: Record<CycleStep, string> = {
  criteria_due: "Kryteria do wyznaczenia",
  part1_waiting: "Część I czeka na potwierdzenie",
  in_period: "Okres oceny trwa",
  awaiting_acknowledgement: "Ocena czeka na potwierdzenie zapoznania",
  acknowledged: "Zapoznanie potwierdzone",
  fiction: "Fikcja zapoznania",
  objection_filed: "Sprzeciw wniesiony",
  objection_resolved: "Sprzeciw rozpatrzony",
  due_change_requested: "Wniosek ocenianego o zmianę terminu",
};

function Chevron() {
  return <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6" /></svg>;
}

function StatRow(props: { label: string; n: number | null; minGroup?: number }) {
  return (
    <li class="stat">
      <span class="stat-label">{props.label}<span class="vh">:</span></span>{" "}
      {props.n === null ? (
        <span class="stat-n cap">{TOO_FEW_LABEL}{props.minGroup ? ` (poniżej progu ${props.minGroup} osób)` : ""}</span>
      ) : (
        <b class="stat-n tnum">{props.n}</b>
      )}
    </li>
  );
}

/** Liczby dla całego urzędu, bez nazwisk. W trybie `protectedStats` ukrywa grupy poniżej progu minimalnej grupy. */
export function StatsBlock(props: { stats?: OfficeStats; protectedStats?: ProtectedOfficeStats; title?: string }) {
  const title = props.title ?? "Terminowość w urzędzie (bez nazwisk)";
  if (props.protectedStats) {
    const p = props.protectedStats;
    if (!p.hasData) {
      return (
        <section class="card" id="statystyki">
          <h2>{title}</h2>
          <p>Nie ma jeszcze cykli ani ocen do policzenia.</p>
        </section>
      );
    }
    return (
      <section class="card hr-statcard" id="statystyki" aria-labelledby="h-stat">
        <h2 id="h-stat">{title}</h2>
        <p class="cap">
          Grupy mniejsze niż {p.minGroup} różnych osób są ukrywane jako „{TOO_FEW_LABEL}”, aby nie dało się odczytać wyniku pojedynczej osoby. Gdy ukryta byłaby dokładnie jedna grupa w podziale, ukrywana jest też najmniejsza z pozostałych. Próg {p.minGroup} osób — {p.settingLabel}.
        </p>
        <div class="hr-statcols">
          <div>
            <h3>Oceny i cykle po terminie</h3>
            <ul class="hr-stats plain-list">
              <StatRow label="Oceny zatwierdzone w terminie" n={p.onTime} minGroup={p.minGroup} />
              <StatRow label="Oceny zatwierdzone po terminie" n={p.late} minGroup={p.minGroup} />
              <StatRow label="Cykle otwarte po terminie, bez oceny" n={p.overdueOpen} minGroup={p.minGroup} />
            </ul>
            {p.byUnit.length > 0 ? (
              <>
                <h3>Cykle według komórki organizacyjnej</h3>
                <ul class="hr-stats plain-list">
                  {p.byUnit.map((u) => (
                    <StatRow label={u.label} n={u.value} minGroup={p.minGroup} />
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <div>
            <h3>Cykle według etapu</h3>
            <ul class="hr-stats plain-list">
              {p.pendingReassessments !== null && p.pendingReassessments > 0 ? (
                <StatRow label="Ponowne sporządzenie oceny lub zapoznanie z nią" n={p.pendingReassessments} minGroup={p.minGroup} />
              ) : null}
              {(Object.keys(STEP_LABEL) as CycleStep[]).map((k) => (
                <StatRow label={STEP_LABEL[k]} n={p.byStep[k] ?? 0} minGroup={p.minGroup} />
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  const s = props.stats!;
  const total = Object.values(s.byStep).reduce((a, n) => a + (n ?? 0), 0) + s.onTime + s.late + s.overdueOpen;
  if (total === 0) {
    return (
      <section class="card" id="statystyki">
        <h2>{title}</h2>
        <p>Nie ma jeszcze cykli ani ocen do policzenia.</p>
      </section>
    );
  }
  return (
    <section class="card hr-statcard" id="statystyki" aria-labelledby="h-stat">
      <h2 id="h-stat">{title}</h2>
      <div class="hr-statcols">
        <div>
          <h3>Oceny i cykle po terminie</h3>
          <ul class="hr-stats plain-list">
            <StatRow label="Oceny zatwierdzone w terminie" n={s.onTime} />
            <StatRow label="Oceny zatwierdzone po terminie" n={s.late} />
            <StatRow label="Cykle otwarte po terminie, bez oceny" n={s.overdueOpen} />
          </ul>
        </div>
        <div>
          <h3>Cykle według etapu</h3>
          <ul class="hr-stats plain-list">
            {s.pendingReassessments > 0 ? (
              <StatRow label="Ponowne sporządzenie oceny lub zapoznanie z nią" n={s.pendingReassessments} />
            ) : null}
            {(Object.keys(STEP_LABEL) as CycleStep[]).map((k) => (
              <StatRow label={STEP_LABEL[k]} n={s.byStep[k] ?? 0} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export type StateRow = {
  cycleId: string;
  personName: string;
  appraiserName: string;
  sheet: string | null;
  state: CycleState;
  today: string;
  links: CycleLink[];
};

function Deadline(props: { r: StateRow }) {
  const r = props.r;
  if (!r.state.deadline) return <span class="hr-none">brak terminu</span>;
  const passedObjection = (r.state.step === "acknowledged" || r.state.step === "fiction") && r.state.deadline.date < r.today;
  return (
    <>
      {passedObjection ? (
        <span>Termin sprzeciwu minął {formatDate(r.state.deadline.date)}</span>
      ) : (
        <span>
          {r.state.deadlineLabel}: <b class="tnum">{formatDate(r.state.deadline.date)}</b>
        </span>
      )}{" "}
      <LegalBasis basis={r.state.deadline.basis} />
      {r.state.overdue ? <span class="hr-late"> Termin minął {formatDate(r.state.deadline.date)}.</span> : null}
      {r.state.second ? (
        <>
          <br />
          <span>
            {r.state.second.label}: <b class="tnum">{formatDate(r.state.second.date)}</b>
          </span>{" "}
          <LegalBasis basis={r.state.second.basis} />
        </>
      ) : null}
    </>
  );
}

/** Tabela stanu cykli: w wierszu jeden odnośnik do cyklu (nazwisko prowadzi do części I, gdzie są wszystkie odnośniki cyklu); w kolumnie arkusza tylko pliki do pobrania. */
export function CycleStateTable(props: { rows: StateRow[] }) {
  return (
    <div class="hr-scroll">
      <table class="hr-table hr-cycles" aria-labelledby="h-cycles">
        <thead>
          <tr>
            <th scope="col">Oceniany</th>
            <th scope="col">Oceniający</th>
            <th scope="col">Stan cyklu</th>
            <th scope="col">Termin</th>
            <th scope="col">Arkusz</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr class="hr-card" data-tour={r.state.reassessment ? "reassessment-cycle" : undefined}>
              <th scope="row">
                <a href={`/cycles/${r.cycleId}/part1`}>{r.personName}</a>
              </th>
              <td data-label="Oceniający">{r.appraiserName}</td>
              <td data-label="Stan cyklu" class="hr-state">
                {r.state.text}
                {r.state.more ? (
                  <details class="disc">
                    <summary>Szczegóły <Chevron /></summary>
                    <p class="cap">{r.state.more}</p>
                  </details>
                ) : null}
              </td>
              <td data-label="Termin" class="hr-due">
                <Deadline r={r} />
              </td>
              <td data-label="Arkusz">
                {r.sheet ? (
                  <div class="hr-sheet">
                    <span>Arkusz {r.sheet}</span>
                    <a href={`/cycles/${r.cycleId}/sheet?print=1`}>Drukuj / pobierz PDF</a>
                    {r.links.filter((l) => l.href.endsWith("/assessment/export.json")).map((l) => (
                      <a href={l.href} download>{l.label}</a>
                    ))}
                  </div>
                ) : (
                  <span class="hr-none">arkusz jeszcze nie przypisany</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Sprzeciwy czekające na wynik rozpatrzenia: nad tabelą, jeden formularz na sprzeciw (trasa POST /cycles/:id/objection-outcome). */
/** Klucz błędu wyboru wyniku w formularzu jednego sprzeciwu (pole i komunikat przy nim). */
export const objectionField = (cycleId: string) => `outcome-${cycleId}`;

export function ObjectionsBlock(props: { rows: StateRow[]; errors?: FormErrors }) {
  const open = props.rows.filter((r) => r.state.step === "objection_filed");
  if (open.length === 0) return null;
  return (
    <section class="card hr-obj" aria-labelledby="h-obj">
      <h2 id="h-obj">Sprzeciw do rozpatrzenia</h2>
      {open.map((r) => (
        <form method="post" action={`/cycles/${r.cycleId}/objection-outcome`} class="hr-obj-item">
          <div class="hr-obj-what">
            <h3>
              <a href={`/cycles/${r.cycleId}/part1`}>{r.personName}</a>
            </h3>
            <p>{r.state.text}</p>
            <p class="hr-obj-due">
              <Deadline r={r} />
            </p>
          </div>
          <fieldset class="hr-obj-pick" aria-describedby={props.errors?.[objectionField(r.cycleId)] ? errorId(objectionField(r.cycleId)) : undefined}>
            <legend class="lbl">Wynik rozpatrzenia sprzeciwu</legend>
            <FieldError id={objectionField(r.cycleId)} errors={props.errors} />
            {[
              ["changed", "Uwzględniony: zmiana oceny"],
              ["redone", "Uwzględniony: ponowne sporządzenie oceny"],
              ["rejected", "Nieuwzględniony"],
            ].map(([value, label], i) => (
              <label class="cb">
                <input type="radio" name="outcome" value={value} required={i === 0} id={i === 0 ? objectionField(r.cycleId) : undefined} aria-invalid={invalid(objectionField(r.cycleId), props.errors)["aria-invalid"]} />
                <span class="box" aria-hidden="true"></span>
                <span class="cbt">{label}</span>
              </label>
            ))}
            <button class="btn" type="submit">Odnotuj wynik rozpatrzenia</button>
          </fieldset>
        </form>
      ))}
    </section>
  );
}

export function HrOverviewView(props: { viewer: Person; today: string; cards: ReminderProps[]; rows: StateRow[]; stats: OfficeStats; awarded?: { dative: string; date: string }; errors?: FormErrors }) {
  return (
    <Layout title="Stan cykli" person={props.viewer} today={props.today}>
      <PageHeader
        title="Stan cykli"
        lead="Najpierw cykle, które wymagają działania, na końcu zamknięte. W każdej grupie od najbliższego terminu."
        linksLabel="Dane i zestawienia"
        links={
          <a href="/hr/export.csv" download>
            Pobierz zestawienie (CSV)
          </a>
        }
      />
      <ErrorSummary errors={props.errors} title="Nie odnotowano wyniku rozpatrzenia" />
      {props.awarded ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div><b>Odnotowano przyznanie stopnia {props.awarded.dative}, {formatDate(props.awarded.date)}.</b></div>
        </div>
      ) : null}
      {props.cards.map((c) => (
        <ReminderCard {...c} />
      ))}
      <ObjectionsBlock rows={props.rows} errors={props.errors} />
      <section class="card hr-cyclecard" aria-labelledby="h-cycles">
        <h2 id="h-cycles">Cykle oceny</h2>
        <CycleStateTable rows={props.rows} />
      </section>
      <StatsBlock stats={props.stats} />
    </Layout>
  );
}
