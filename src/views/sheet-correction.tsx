import { CORRECTABLE_FIELDS, type CorrectableField, type CorrectionErrors, type SheetCorrection } from "../assessment/corrections";
import type { Person } from "../people";
import { ErrorSummary, FieldError, PageHeader, invalid } from "./components";
import { Layout, formatDate } from "./layout";

const show = (field: CorrectableField, v: string) => (v ? (CORRECTABLE_FIELDS[field].kind === "date" ? formatDate(v) : v) : "—");

export function CorrectionListView(props: { viewer: Person; today: string; cycles: { id: string; personName: string; approvedOn: string }[] }) {
  return (
    <Layout title="Korekta błędów w arkuszach" person={props.viewer} today={props.today}>
      <PageHeader
        title="Korekta błędów w zatwierdzonych arkuszach"
        lead="Zatwierdzonego arkusza nie zmienia nikt poza administratorem. Każda korekta wymaga powodu i zostaje na arkuszu w historii (kto, kiedy, co, dlaczego)."
      />
      <p class="ct-lead-2">Ocen cząstkowych i wyniku nie poprawia się w tym trybie: służy do tego sprzeciw (art. 83 ust. 1 ustawy).</p>
      {props.cycles.length === 0 ? (
        <p>Nie ma zatwierdzonych arkuszy.</p>
      ) : (
        <ul class="ct-rows">
          {props.cycles.map((c) => (
            <li>
              <a href={`/cycles/${c.id}/sheet/correction`}>{c.personName}</a>
              <span class="cap">ocena zatwierdzona {formatDate(c.approvedOn)}</span>
            </li>
          ))}
        </ul>
      )}
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
  return (
    <Layout title={`Korekta arkusza: ${props.personName}`} person={props.viewer} today={props.today}>
      <PageHeader
        title={<>Korekta arkusza: {props.personName}</>}
        lead={<>Ocena zatwierdzona {formatDate(props.approvedOn)}. Popraw tylko oczywisty błąd i wpisz, na czym polegał. Korektę zobaczą na arkuszu oceniany, oceniający i kadry.</>}
        links={<><a href={`/cycles/${props.cycleId}/sheet`}>Arkusz</a><a href="/admin/corrections">Wszystkie zatwierdzone arkusze</a></>}
      />
      {props.saved ? (
        <p class="st ok" role="status">Zapisano korektę. Jest na arkuszu w części „Korekty błędów po zatwierdzeniu”.</p>
      ) : null}
      <div class="o-grid">
        <section class="card form-card ct-form" aria-labelledby="h-corr-form">
          <h2 id="h-corr-form">Popraw pole</h2>
          <form method="post" action={`/cycles/${props.cycleId}/sheet/correction`} class="abs-form">
            <ErrorSummary errors={{ field: e.field, value: e.value, reason: e.reason }} />
            <div class="field">
              <label class="lbl" for="field">Pole do poprawienia</label>
              <FieldError id="field" errors={e} />
              <select class="area" id="field" name="field" {...invalid("field", e)}>
                <option value="">Wybierz pole</option>
                {fields.map((f) => (
                  <option value={f} selected={v.field === f}>{CORRECTABLE_FIELDS[f].label}</option>
                ))}
              </select>
            </div>
            <div class="field">
              <label class="lbl" for="value">Poprawna wartość (data w postaci DD.MM.RRRR)</label>
              <FieldError id="value" errors={e} />
              <textarea class="area" id="value" name="value" rows={4} {...invalid("value", e)}>{v.value}</textarea>
            </div>
            <div class="field">
              <label class="lbl" for="reason">Powód korekty</label>
              <FieldError id="reason" errors={e} />
              <textarea class="area" id="reason" name="reason" rows={2} {...invalid("reason", e)}>{v.reason}</textarea>
            </div>
            <p class="ct-actions">
              <button class="btn primary" type="submit">Zapisz korektę</button>
            </p>
          </form>
        </section>
        <aside class="side ct-side">
          <h2 class="ct-side-h">Obecne wartości</h2>
          <dl class="ct-dl">
            {fields.map((f) => (
              <div>
                <dt>{CORRECTABLE_FIELDS[f].label}</dt>
                <dd>{show(f, props.current[f])}</dd>
              </div>
            ))}
          </dl>
          <h2 class="ct-side-h" id="h-history">Historia korekt</h2>
          {props.corrections.length === 0 ? (
            <p>Arkusza jeszcze nie poprawiano.</p>
          ) : (
            <ul class="ct-hist">
              {props.corrections.map((c) => (
                <li>
                  <b>{formatDate(c.date)}, {c.actorName}: {c.label}</b>
                  <p>Było: {show(c.field, c.from)}. Jest: {show(c.field, c.to)}. Powód: {c.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </Layout>
  );
}
