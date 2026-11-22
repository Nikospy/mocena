import type { CycleLink } from "../cycle-links";
import { addDays } from "../engine/deadlines";
import { rules } from "../engine/rules";
import { romanGrade, type MandatoryGrade } from "../engine/grades";
import type { CycleState } from "../hr/cycle-state";
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
        </>
      )}
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
                    <a href={l.href}>{l.label}</a>
                  ))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HrOverviewView(props: { viewer: Person; today: string; cards: ReminderProps[]; rows: StateRow[] }) {
  return (
    <Layout title="Stan cykli" person={props.viewer} today={props.today}>
      <section class="hdr slim">
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
      <section class="card">
        <p class="cap">Statystyki: poza prototypem</p>
      </section>
    </Layout>
  );
}
