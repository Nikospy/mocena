import type { CycleLink } from "../cycle-links";
import { METHOD_LABEL, REASON_LABEL } from "./assessment";
import { romanGrade } from "../engine/grades";
import { rules } from "../engine/rules";
import { criterion } from "../engine/scoring";
import type { SheetData } from "../hr/sheet-data";
import type { Person } from "../people";
import { ConfirmationBlock, LegalBasis, PageHeader } from "./components";
import { Layout, formatDate } from "./layout";

const DASH = "—";

export function SheetField(props: { label: string; children?: unknown }) {
  const empty = props.children === null || props.children === undefined || props.children === "";
  return (
    <div class="sheet-field">
      <span class="lbl">{props.label}</span>
      <p>{empty ? DASH : (props.children as any)}</p>
    </div>
  );
}

export function PrintButton() {
  return (
    <div class="no-print sheet-actions">
      <div class="btns">
        <button class="btn primary" type="button" onclick="window.print()">
          Drukuj / pobierz PDF
        </button>
      </div>
      <p class="cap">Zapis do PDF wybierasz w oknie druku.</p>
    </div>
  );
}

export function ScoreMatrix(props: { rows: { id: string; kind: string; score: number | null }[] }) {
  return (
    <table class="sheet-matrix" tabindex={0} aria-label="Oceny cząstkowe">
      <thead>
        <tr>
          <th scope="col">Kryterium</th>
          {rules.partialScale.map((s) => (
            <th scope="col">
              {s.points}
              <small>{s.name}</small>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.rows.length === 0 ? (
          <tr>
            <td colspan={rules.partialScale.length + 1}>{DASH}</td>
          </tr>
        ) : (
          props.rows.map((r) => (
            <tr>
              <th scope="row">
                {criterion(r.id).name}
                <small>{r.kind === "mandatory" ? "obowiązkowe" : "dodatkowe"}</small>
              </th>
              {rules.partialScale.map((s) => (
                <td>{r.score === s.points ? "X" : ""}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function Basis(props: { d: { date: string; basis: string[] } }) {
  return (
    <>
      {formatDate(props.d.date)} <LegalBasis basis={props.d.basis} />
    </>
  );
}

function mean2(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function PartyFields(props: { p: { name: string; positionTitle: string | null; unit: string | null }; sheet: string | null }) {
  return (
    <>
      <SheetField label="Imię i nazwisko">{props.p.name}</SheetField>
      <SheetField label="Stanowisko">{props.p.positionTitle}</SheetField>
      {props.sheet === "A" ? null : <SheetField label="Komórka organizacyjna">{props.p.unit}</SheetField>}
    </>
  );
}

function Confirm(props: { c: { place: string; date: string; name: string } | null }) {
  if (props.c) {
    return <ConfirmationBlock kind="confirmation" name={props.c.name} place={props.c.place} date={props.c.date} />;
  }
  return (
    <div class="sheet-confirm-slot">
      <p class="sign">{DASH}</p>
      <p class="cap sheet-confirm-line">Miejscowość, data i potwierdzenie</p>
    </div>
  );
}

export function SheetFooter(props: { d: SheetData }) {
  const { d } = props;
  return (
    <footer class="print-footer cap">
      Arkusz {d.sheet ?? DASH} · wersja reguł {d.rulesVersion.version} z {formatDate(d.rulesVersion.effectiveFrom)} ({d.rulesVersion.act}) · stan na {formatDate(d.asOf)} · potwierdzenia złożono w systemie mOcena
    </footer>
  );
}

export function SheetView(props: { viewer: Person; today: string; data: SheetData; links: CycleLink[]; autoPrint?: boolean }) {
  const d = props.data;
  const p1 = d.part1;
  const p2 = d.part2;
  const only1 = d.partOnly === 1;
  const sheetHref = `/cycles/${d.cycleId}/sheet`;
  return (
    <Layout title="Arkusz oceny" person={props.viewer} today={props.today}>
      <article class="sheet-doc">
        <PageHeader
          context={d.officeName}
          title={<>Arkusz oceny okresowej {d.sheet ? `(arkusz ${d.sheet})` : ""}</>}
          extra={
            <div class="no-print">
              <PrintButton />
            </div>
          }
          links={
            <>
              <a class="no-print" href={only1 ? sheetHref : `${sheetHref}?part=1`}>
                {only1 ? "Cały arkusz" : "Tylko część I"}
              </a>
              {props.links.map((l) => (
                <a class="no-print" href={l.href}>
                  {l.label}
                </a>
              ))}
            </>
          }
        />

        <section class="card sheet-part">
          <h2>Część I</h2>
          <SheetField label="Urząd">{d.officeName}</SheetField>
          <div class="sheet-confirms sheet-parties">
            <div class="b-facts">
              <h3>Oceniany</h3>
              <PartyFields p={p1.appraisee} sheet={d.sheet} />
            </div>
            <div class="b-facts">
              <h3>Oceniający</h3>
              <PartyFields p={p1.appraiser} sheet={d.sheet} />
            </div>
          </div>
          <h3>Kryteria obowiązkowe</h3>
          {p1.mandatory.length ? (
            <ul>{p1.mandatory.map((c) => <li>{criterion(c.id).name}</li>)}</ul>
          ) : (
            <p>{DASH}</p>
          )}
          <h3>Kryteria dodatkowe</h3>
          {p1.additional.length ? (
            <ul>
              {p1.additional.map((c) => (
                <li>
                  {criterion(c.id).name}
                  {c.expectation ? <small class="cap"> · oczekiwanie: {c.expectation}</small> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>{DASH}</p>
          )}
          <SheetField label="Termin sporządzenia oceny">{p1.dueDate ? <Basis d={p1.dueDate} /> : null}</SheetField>
          {p1.deadlineNote ? (
            <p class="cap">
              {p1.deadlineNote.label}: <Basis d={p1.deadlineNote.deadline} />
            </p>
          ) : null}
          {d.deadlineLetters.length ? (
            <div class="sheet-field">
              <span class="lbl">Załączniki: pisma o zmianie terminu oceny</span>
              <ul>
                {d.deadlineLetters.map((l) => (
                  <li>
                    <a href={`/cycles/${d.cycleId}/deadline-change/${l.id}/letter`}>Pismo z {formatDate(l.date)}</a>: z {formatDate(l.oldDeadline)} na {formatDate(l.newDeadline)} (art. 81 ust. 8 pkt {l.case} ustawy)
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p>Oświadczam, że przeprowadzono rozmowę o kryteriach i terminie oceny (§ 5 ust. 1 rozporządzenia) oraz że oceniany zapoznał się z kryteriami i terminem.</p>
          <div class="sheet-confirms">
            <div>
              <span class="lbl">Potwierdzenie oceniającego</span>
              <Confirm c={p1.appraiserConfirmation} />
            </div>
            <div>
              <span class="lbl">Potwierdzenie ocenianego</span>
              <Confirm c={p1.appraiseeConfirmation} />
            </div>
          </div>
        </section>

        {only1 ? null : (
          <>
            <section class="card sheet-part">
              <h2>Część II</h2>
              <div class="sheet-confirms sheet-meta">
                <SheetField label="Data rozmowy oceniającej">{p2.interviewDate ? formatDate(p2.interviewDate) : null}</SheetField>
                <SheetField label="Okres podlegania ocenie">
                  od {formatDate(p2.periodFrom)} do {p2.periodTo ? formatDate(p2.periodTo) : DASH}
                </SheetField>
              </div>
              <h3>Oceny cząstkowe</h3>
              <ScoreMatrix rows={p2.rows} />
              <SheetField label="Średnia ocen cząstkowych">{p2.mean === null ? null : mean2(p2.mean)}</SheetField>
              <h3>Ogólny poziom spełniania kryteriów</h3>
              <table class="sheet-matrix" tabindex={0} aria-label="Ogólny poziom spełniania kryteriów">
                <tbody>
                  <tr>
                    {rules.overallLevels.map((l) => (
                      <td>
                        {l.name}
                        <small>{l.fromInclusive ? `od ${l.from} do ${l.to}` : `powyżej ${l.from} do ${l.to}`}</small>
                        {p2.overallLevel === l.name ? <b class="sheet-x">X</b> : null}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <h3>Ocena okresowa</h3>
              <table class="sheet-matrix" tabindex={0} aria-label="Ocena okresowa">
                <tbody>
                  <tr>
                    <td>
                      POZYTYWNA{p2.outcome === "positive" ? <b> X</b> : ""}
                    </td>
                    <td>
                      NEGATYWNA{p2.outcome === "negative" ? <b> X</b> : ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="card sheet-part">
              <h2>Część II (ciąg dalszy)</h2>
              <SheetField label="Uzasadnienie przyznanej oceny">{p2.justification}</SheetField>
              <SheetField label="Wnioski do indywidualnego programu rozwoju zawodowego">{p2.developmentConclusions}</SheetField>
              {p2.previous === null ? null : (
                <SheetField label="Dane poprzedniej oceny">
                  {p2.previous === "none"
                    ? "brak w systemie"
                    : `${formatDate(p2.previous.approvedOn)}, ${p2.previous.outcome === "positive" ? "pozytywna" : "negatywna"}, ${p2.previous.overallLevel}`}
                </SheetField>
              )}
              <SheetField label="Czy dołączono wniosek o kolejny stopień służbowy">
                {p2.gradeRequest === "yes" ? "TAK" : p2.gradeRequest === "no" ? "NIE" : p2.gradeRequest === "not_applicable" ? "NIE DOTYCZY" : null}
              </SheetField>
              <SheetField label="Dane oceniającego">
                {[p1.appraiser.name, p1.appraiser.positionTitle, d.sheet === "A" ? null : p1.appraiser.unit].filter(Boolean).join(", ")}
              </SheetField>
              <div class="sheet-confirms">
                <div>
                  <span class="lbl">Potwierdzenie oceniającego</span>
                  <Confirm c={p2.appraiserConfirmation} />
                </div>
                <div>
                  <span class="lbl">Potwierdzenie ocenianego (rozmowa oceniająca, zapoznanie z oceną i wnioskami)</span>
                  {p2.fiction ? (
                    <ConfirmationBlock
                      kind="fiction"
                      name={p2.fiction.appraiserName}
                      reason={REASON_LABEL[p2.fiction.reason]}
                      deliveryMethod={METHOD_LABEL[p2.fiction.deliveryMethod]}
                      deliveredOn={p2.fiction.deliveredOn}
                      date={p2.fiction.date}
                    />
                  ) : (
                    <Confirm c={p2.appraiseeConfirmation} />
                  )}
                </div>
              </div>
              <section class="rule sheet-notice" id="pouczenie">
                <h3>Pouczenie</h3>
                <p>
                  Od oceny przysługuje sprzeciw do {p2.objectionTo} w terminie 7 dni od dnia zapoznania się z oceną (art. 83 ust. 1 ustawy).
                </p>
              </section>
            </section>
          </>
        )}
        {only1 || !d.part3 ? null : (
          <section class="card sheet-part">
            <h2>Część III</h2>
            <h3>Wniosek o przyznanie kolejnego stopnia służbowego</h3>
            <SheetField label="Imię i nazwisko">{d.part3.name}</SheetField>
            <div class="sheet-confirms sheet-meta">
              <SheetField label="Rok mianowania">{d.part3.appointedYear}</SheetField>
              <SheetField label="Posiadany stopień służbowy">
                {d.part3.grade === null ? null : `${romanGrade(d.part3.grade)}${d.part3.gradeAwardedOn ? `, przyznany ${formatDate(d.part3.gradeAwardedOn)}` : ""}`}
              </SheetField>
            </div>
            <p>Wnoszę o przyznanie kolejnego stopnia służbowego (art. 89 ust. 1 ustawy).</p>
            <SheetField label="Umotywowanie wniosku">{d.part3.motivation}</SheetField>
            <div class="sheet-confirms">
              <div>
                <span class="lbl">Potwierdzenie oceniającego</span>
                <Confirm c={d.part3.appraiserConfirmation} />
              </div>
            </div>
          </section>
        )}
        <SheetFooter d={d} />
        {props.autoPrint ? <script src="/auto-print.js" defer></script> : null}
      </article>
    </Layout>
  );
}
