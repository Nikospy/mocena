import type { CycleLink } from "../cycle-links";
import { addDays } from "../engine/deadlines";
import { rules } from "../engine/rules";
import { romanGrade, type MandatoryGrade } from "../engine/grades";
import type { CycleState, CycleStep } from "../hr/cycle-state";
import type { OfficeStats } from "../hr/stats";
import type { Person } from "../people";
import { LegalBasis } from "./components";
import { Layout, formatDate } from "./layout";

const DOW_ACC = ["niedzielę", "poniedziałek", "wtorek", "środę", "czwartek", "piątek", "sobotę"];
const DOW = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
const dow = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay();

export type ReminderProps = { personId: string; personName: string; grade: MandatoryGrade };

/** Karta obowiązku urzędu: nazwisko tylko jako wartość pola, treść mówi o obowiązku urzędu. */
export function ReminderCard(props: ReminderProps) {
  const g = props.grade;
  const raw = addDays(g.acknowledgedOn, rules.deadlines.mandatoryGradeDays.value);
  const shifted = raw !== g.dueOn;
  const rawDay = [0, 6].includes(dow(raw)) ? DOW_ACC[dow(raw)] : "dzień wolny od pracy";
  return (
    <section class="card rule" aria-labelledby={`obowiazek-${props.personId}`}>
      <h2 id={`obowiazek-${props.personId}`}>Obowiązek urzędu: stopień służbowy z mocy prawa</h2>
      <div class="sheet-field">
        <span class="lbl">Urzędnik</span>
        <p>{props.personName}</p>
      </div>
      {g.atMaxGrade ? (
        <p>Ma najwyższy stopień, kolejnego nie można przyznać.</p>
      ) : (
        <>
          <p>
            Urząd ma obowiązek przyznać kolejny stopień służbowy, bo od ostatniego stopnia są dwie kolejne oceny pozytywne na jednym z dwóch najwyższych poziomów: {formatDate(g.assessmentDates[0])} i {formatDate(g.assessmentDates[1])}.
          </p>
          <p>
            <b>Przyznać do {formatDate(g.dueOn)}</b>: 30 dni od zapoznania z oceną {formatDate(g.acknowledgedOn)}
            {shifted ? `, koniec w ${rawDay} ${formatDate(raw)}, więc ${DOW[dow(g.dueOn)]}` : ""} (<LegalBasis basis={g.basis} />).
            {g.overdue ? ` Termin minął ${formatDate(g.dueOn)}.` : ""}
          </p>
          <p>
            <b>Stopień {romanGrade(g.fromGrade)} → {romanGrade(g.toGrade!)}</b>
          </p>
          <p class="cap">To obowiązek, nie wniosek.</p>
          <form method="post" action={`/hr/grades/${props.personId}`}>
            <button class="btn primary" type="submit">
              Odnotuj przyznanie stopnia
            </button>
          </form>
        </>
      )}
    </section>
  );
}

const STEP_LABEL: Record<CycleStep, string> = {
  criteria_due: "Kryteria do wyznaczenia",
  part1_waiting: "Część I czeka na potwierdzenie",
  in_period: "Okres oceny",
  awaiting_acknowledgement: "Ocena czeka na potwierdzenie zapoznania",
  acknowledged: "Zapoznanie potwierdzone",
  fiction: "Fikcja zapoznania",
  objection_filed: "Sprzeciw wniesiony",
  objection_resolved: "Sprzeciw rozpatrzony",
  due_change_requested: "Wniosek o zmianę terminu",
};

/** Liczby dla całego urzędu, bez nazwisk i bez podziału na komórki. */
export function StatsBlock(props: { stats: OfficeStats }) {
  const s = props.stats;
  return (
    <section class="card" id="statystyki">
      <h2>Statystyki terminowości (widok dyrektora generalnego, bez nazwisk)</h2>
      <ul class="hr-stats plain-list">
        {(Object.keys(STEP_LABEL) as CycleStep[]).map((k) => (
          <li class="stat">
            <span class="stat-label">{STEP_LABEL[k]}<span class="vh">:</span></span> <b class="stat-n tnum">{s.byStep[k] ?? 0}</b>
          </li>
        ))}
        <li class="stat">
          <span class="stat-label">Oceny zatwierdzone w terminie<span class="vh">:</span></span> <b class="stat-n tnum">{s.onTime}</b>
        </li>
        <li class="stat">
          <span class="stat-label">Oceny zatwierdzone po terminie<span class="vh">:</span></span> <b class="stat-n tnum">{s.late}</b>
        </li>
        <li class="stat">
          <span class="stat-label">Cykle otwarte po terminie, bez oceny<span class="vh">:</span></span> <b class="stat-n tnum">{s.overdueOpen}</b>
        </li>
      </ul>
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

export function CycleStateTable(props: { rows: StateRow[] }) {
  return (
    <div class="hr-scroll">
      <table class="hr-table">
        <thead>
          <tr>
            <th scope="col">Osoba</th>
            <th scope="col">Oceniający</th>
            <th scope="col">Arkusz</th>
            <th scope="col">Stan procesu</th>
            <th scope="col">Termin</th>
            <th scope="col">Odnośniki</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr>
              <th scope="row">{r.personName}</th>
              <td>{r.appraiserName}</td>
              <td>{r.sheet ?? "—"}</td>
              <td>{r.state.text}</td>
              <td>
                {r.state.deadline ? (
                  <>
                    <span>
                      {r.state.deadlineLabel}: {formatDate(r.state.deadline.date)}
                    </span>{" "}
                    <LegalBasis basis={r.state.deadline.basis} />
                    {r.state.overdue ? <small class="cap"> · termin minął {formatDate(r.state.deadline.date)}</small> : null}
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <span class="hr-links">
                  {r.links.map((l) => (
                    <a class="btn link-chip" href={l.href}>
                      {l.label}
                    </a>
                  ))}
                </span>
                {r.state.step === "objection_filed" ? (
                  <form method="post" action={`/cycles/${r.cycleId}/objection-outcome`} class="hr-actions">
                    <span class="lbl">Rozstrzygnięcie sprzeciwu:</span>
                    <button class="btn" type="submit" name="outcome" value="changed">
                      Uwzględniony: zmiana oceny
                    </button>
                    <button class="btn" type="submit" name="outcome" value="redone">
                      Uwzględniony: ponowne sporządzenie oceny
                    </button>
                    <button class="btn" type="submit" name="outcome" value="rejected">
                      Nieuwzględniony
                    </button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HrOverviewView(props: { viewer: Person; today: string; cards: ReminderProps[]; rows: StateRow[]; stats: OfficeStats }) {
  return (
    <Layout title="Stan cykli" person={props.viewer} today={props.today}>
      <section class="card hdr slim">
        <h1>Stan cykli</h1>
        <p class="cap">Najnowszy cykl każdej osoby, od najbliższego terminu.</p>
      </section>
      {props.cards.map((c) => (
        <ReminderCard {...c} />
      ))}
      <section class="card">
        <h2>Cykle oceny</h2>
        <CycleStateTable rows={props.rows} />
      </section>
      <StatsBlock stats={props.stats} />
    </Layout>
  );
}
