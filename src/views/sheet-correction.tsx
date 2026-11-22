import { CORRECTABLE_FIELDS, type CorrectableField, type CorrectionErrors, type SheetCorrection } from "../assessment/corrections";
import type { Person } from "../people";
import { LegalBasis, PageHeader } from "./components";
import { ErrorSummary } from "./hr-people";
import { Layout, formatDate } from "./layout";

const show = (field: CorrectableField, v: string) => (v ? (CORRECTABLE_FIELDS[field].kind === "date" ? formatDate(v) : v) : "—");

export function CorrectionListView(props: { viewer: Person; today: string; cycles: { id: string; personName: string; approvedOn: string }[] }) {
  return (
    <Layout title="Korekta błędów w arkuszach" person={props.viewer} today={props.today}>
      <PageHeader
        title="Korekta błędów w zatwierdzonych arkuszach"
        lead="Zatwierdzonego arkusza nie zmienia nikt poza administratorem. Każda korekta wymaga powodu i zostaje na arkuszu w historii."
      />
      <p class="hr-note">Ocen cząstkowych i wyniku nie poprawia się w tym trybie: służy do tego sprzeciw <LegalBasis basis={["art. 83 ust. 1 ustawy"]} />.</p>
      <section class="card" aria-labelledby="h-corr-list">
        <h2 id="h-corr-list">Zatwierdzone arkusze ({props.cycles.length})</h2>
        {props.cycles.length === 0 ? (
          <p>Nie ma zatwierdzonych arkuszy.</p>
        ) : (
          <ul class="subs-list corr-list">
            {props.cycles.map((c) => (
              <li>
                <p><a href={`/cycles/${c.id}/sheet/correction`}>{c.personName}</a></p>
                <p class="cap">Ocena zatwierdzona <span class="tnum">{formatDate(c.approvedOn)}</span></p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}

export function CorrectionFormView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  personName: string;
  approvedOn: string;
  current: Record<CorrectableField, string>;
  corrections: SheetCorrection[];
  values?: { field: string; value: string; reason: string };
  errors?: CorrectionErrors;
  saved?: boolean;
}) {
  const e = props.errors ?? {};
  const v = props.values ?? { field: "", value: "", reason: "" };
  const fields = Object.keys(CORRECTABLE_FIELDS) as CorrectableField[];
  const inv = (id: string, text?: string) => (text ? { "aria-invalid": "true", "aria-describedby": `${id}-err` } : {});
  const err = (id: string, text?: string) => (text ? <p class="hr-err" id={`${id}-err`}><span class="vh">Błąd: </span>{text}</p> : null);
  return (
    <Layout title={`Korekta arkusza: ${props.personName}`} person={props.viewer} today={props.today}>
      <PageHeader
        context={<>Ocena zatwierdzona {formatDate(props.approvedOn)}</>}
        title={<>Korekta arkusza: {props.personName}</>}
        lead="Popraw tylko oczywisty błąd i wpisz, na czym polegał. Korektę zobaczą na arkuszu oceniany, oceniający i kadry."
        linksLabel="Korekty"
        links={<a href="/admin/corrections">Wszystkie zatwierdzone arkusze</a>}
      />
      {props.saved ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div><b>Zapisano korektę.</b> Jest na arkuszu w części „Korekty błędów po zatwierdzeniu”.</div>
        </div>
      ) : null}
      <ErrorSummary errors={e as Record<string, string | undefined>} />
      <div class="o-grid">
        <div class="o-main">
          <section class="card subs-form" aria-labelledby="h-corr">
            <h2 id="h-corr">Popraw pole</h2>
            <form method="post" action={`/cycles/${props.cycleId}/sheet/correction`} class="person-form" novalidate>
              <div class="person-field">
                <label class="lbl" for="field">Pole do poprawienia</label>
                <select class="area" id="field" name="field" {...inv("field", e.field)}>
                  <option value="">Wybierz pole</option>
                  {fields.map((f) => (
                    <option value={f} selected={v.field === f}>{CORRECTABLE_FIELDS[f].label}</option>
                  ))}
                </select>
                {err("field", e.field)}
              </div>
              <div class="person-field">
                <label class="lbl" for="value">Poprawna wartość</label>
                <p class="hr-hint" id="value-hint">Datę wpisz w postaci DD.MM.RRRR.</p>
                <textarea class="area" id="value" name="value" rows={4} aria-describedby={e.value ? "value-hint value-err" : "value-hint"} aria-invalid={e.value ? "true" : undefined}>{v.value}</textarea>
                {err("value", e.value)}
              </div>
              <div class="person-field">
                <label class="lbl" for="reason">Powód korekty</label>
                <textarea class="area" id="reason" name="reason" rows={2} {...inv("reason", e.reason)}>{v.reason}</textarea>
                {err("reason", e.reason)}
              </div>
              <div class="person-actions">
                <button class="btn primary" type="submit">Zapisz korektę</button>
              </div>
            </form>
          </section>
        </div>
        <aside class="side subs-side" aria-label="Arkusz">
          <section class="card" aria-labelledby="h-corr-now">
            <h2 id="h-corr-now">Obecne wartości</h2>
            <dl class="hr-facts corr-now">
              {fields.map((f) => (
                <div><dt>{CORRECTABLE_FIELDS[f].label}</dt><dd>{show(f, props.current[f])}</dd></div>
              ))}
            </dl>
          </section>
          <section class="card" aria-labelledby="h-history">
            <h2 id="h-history">Historia korekt</h2>
            {props.corrections.length === 0 ? (
              <p>Arkusza jeszcze nie poprawiano.</p>
            ) : (
              <ul class="subs-list">
                {props.corrections.map((c) => (
                  <li>
                    <p><b>{formatDate(c.date)}, {c.actorName}: {c.label}</b></p>
                    <p>Było: {show(c.field, c.from)}. Jest: {show(c.field, c.to)}. Powód: {c.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </Layout>
  );
}
