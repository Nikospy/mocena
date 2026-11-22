import { CORRECTABLE_FIELDS, type CorrectableField, type CorrectionErrors, type SheetCorrection } from "../assessment/corrections";
import type { Person } from "../people";
import { Layout, formatDate } from "./layout";

const show = (field: CorrectableField, v: string) => (v ? (CORRECTABLE_FIELDS[field].kind === "date" ? formatDate(v) : v) : "—");

export function CorrectionListView(props: { viewer: Person; today: string; cycles: { id: string; personName: string; approvedOn: string }[] }) {
  return (
    <Layout title="Korekta błędów w arkuszach" person={props.viewer} today={props.today}>
      <section class="card">
        <h1>Korekta błędów w zatwierdzonych arkuszach</h1>
        <p class="cap">Zatwierdzonego arkusza nie zmienia nikt poza administratorem. Każda korekta wymaga powodu i zostaje na arkuszu w historii (kto, kiedy, co, dlaczego). Ocen cząstkowych i wyniku nie poprawia się w tym trybie: służy do tego sprzeciw (art. 83 ust. 1 ustawy).</p>
        {props.cycles.length === 0 ? (
          <p>Nie ma zatwierdzonych arkuszy.</p>
        ) : (
          <ul class="plain-list">
            {props.cycles.map((c) => (
              <li>
                <a href={`/cycles/${c.id}/sheet/correction`}>{c.personName}</a> <span class="cap">ocena zatwierdzona {formatDate(c.approvedOn)}</span>
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
  return (
    <Layout title={`Korekta arkusza: ${props.personName}`} person={props.viewer} today={props.today}>
      <section class="card form-card">
        <h1>Korekta arkusza: {props.personName}</h1>
        <p class="cap">Ocena zatwierdzona {formatDate(props.approvedOn)}. Popraw tylko oczywisty błąd i wpisz, na czym polegał. Korektę zobaczą na arkuszu oceniany, oceniający i kadry.</p>
        {props.saved ? (
          <p class="st ok" role="status">Zapisano korektę. Jest na arkuszu w części „Korekty błędów po zatwierdzeniu”.</p>
        ) : null}
        <h2>Obecne wartości</h2>
        {fields.map((f) => (
          <div class="sheet-field">
            <span class="lbl">{CORRECTABLE_FIELDS[f].label}</span>
            <p>{show(f, props.current[f])}</p>
          </div>
        ))}
        <form method="post" action={`/cycles/${props.cycleId}/sheet/correction`}>
          <label class="lbl" for="field">Pole do poprawienia</label>
          <select class="area" id="field" name="field" aria-invalid={e.field ? "true" : undefined}>
            <option value="">Wybierz pole</option>
            {fields.map((f) => (
              <option value={f} selected={v.field === f}>{CORRECTABLE_FIELDS[f].label}</option>
            ))}
          </select>
          {e.field ? <p class="st bad" role="alert">{e.field}</p> : null}
          <label class="lbl" for="value">Poprawna wartość (data w postaci DD.MM.RRRR)</label>
          <textarea class="area" id="value" name="value" rows={4} aria-invalid={e.value ? "true" : undefined}>{v.value}</textarea>
          {e.value ? <p class="st bad" role="alert">{e.value}</p> : null}
          <label class="lbl" for="reason">Powód korekty</label>
          <textarea class="area" id="reason" name="reason" rows={2} aria-invalid={e.reason ? "true" : undefined}>{v.reason}</textarea>
          {e.reason ? <p class="st bad" role="alert">{e.reason}</p> : null}
          <button class="btn primary full" type="submit">Zapisz korektę</button>
        </form>
      </section>
      <section class="card" aria-labelledby="h-history">
        <h2 id="h-history">Historia korekt</h2>
        {props.corrections.length === 0 ? (
          <p class="cap">Arkusza jeszcze nie poprawiano.</p>
        ) : (
          <ul class="plain-list">
            {props.corrections.map((c) => (
              <li>
                <b>{formatDate(c.date)}, {c.actorName}: {c.label}</b>
                <p class="cap">Było: {show(c.field, c.from)}. Jest: {show(c.field, c.to)}. Powód: {c.reason}</p>
              </li>
            ))}
          </ul>
        )}
        <p>
          <a class="btn text" href="/admin/corrections">Wszystkie zatwierdzone arkusze</a>
        </p>
      </section>
    </Layout>
  );
}
