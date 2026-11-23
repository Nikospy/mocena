import type { Person } from "../people";
import { ErrorSummary, FieldError, PageHeader, invalid, type FormErrors } from "./components";
import { Layout, formatDate } from "./layout";

export type SelfPrepData = { achievements: string; topics: string; savedOn?: string };

export function SelfPrepView(props: {
  viewer: Person;
  today: string;
  cycleId: string;
  appraiserName: string;
  values: SelfPrepData;
  locked: boolean;
  saved?: boolean;
  errors?: FormErrors;
}) {
  const e = props.errors ?? {};
  return (
    <Layout title="Przygotowanie do rozmowy" person={props.viewer} today={props.today}>
      <PageHeader
        context="Wkład ocenianego przed rozmową"
        title="Przygotuj się do rozmowy z oceniającym"
        lead={`Zapiski zobaczy ${props.appraiserName} na ekranie „Przed rozmową z pracownikiem”. Nic nie trafia automatycznie do arkusza oceny.`}
        links={<a href={`/cycles/${props.cycleId}/part1`}>Wróć do części I</a>}
      />
      <ErrorSummary errors={e} title="Nie zapisano przygotowania do rozmowy" />
      {props.saved ? (
        <div class="st ok" role="status">
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <div>
            <b>Zapisano twój wkład przed rozmową.</b> Możesz go poprawić do czasu zatwierdzenia oceny.
          </div>
        </div>
      ) : null}
      {props.locked ? (
        <section class="card" aria-labelledby="h-prep-locked">
          <h2 id="h-prep-locked">Zapisany wkład przed rozmową</h2>
          <p class="cap">Ocena została już zatwierdzona — przygotowanie do rozmowy jest tylko do odczytu.</p>
          {props.values.achievements || props.values.topics ? (
            <>
              {props.values.achievements ? (
                <>
                  <h3>Najważniejsze osiągnięcia w tym okresie</h3>
                  <p>{props.values.achievements}</p>
                </>
              ) : null}
              {props.values.topics ? (
                <>
                  <h3>Tematy i uwagi do rozmowy</h3>
                  <p>{props.values.topics}</p>
                </>
              ) : null}
            </>
          ) : (
            <p>Nie zapisano wpisu przed rozmową.</p>
          )}
        </section>
      ) : (
        <form method="post" action={`/cycles/${props.cycleId}/self-prep`} class="card" id="self-prep-form">
          {props.values.savedOn ? (
            <p class="cap">Ostatnia wersja zapisana {formatDate(props.values.savedOn)}.</p>
          ) : null}
          <div class="field">
            <label class="lbl" for="achievements">Najważniejsze osiągnięcia w tym okresie</label>
            <p class="cap" id="achievements-hint">Opcjonalne. Wskaż konkretne zadania, projekty lub usprawnienia, o których chcesz porozmawiać.</p>
            <FieldError id="achievements" errors={e} />
            <textarea
              class="area"
              id="achievements"
              name="achievements"
              rows={5}
              maxLength={2000}
              {...invalid("achievements", e, "achievements-hint")}
            >
              {props.values.achievements}
            </textarea>
          </div>
          <div class="field">
            <label class="lbl" for="topics">Tematy i uwagi do rozmowy</label>
            <p class="cap" id="topics-hint">Opcjonalne. Zapisz pytania, potrzeby rozwojowe albo kwestie organizacyjne, które chcesz poruszyć na rozmowie.</p>
            <FieldError id="topics" errors={e} />
            <textarea
              class="area"
              id="topics"
              name="topics"
              rows={5}
              maxLength={2000}
              {...invalid("topics", e, "topics-hint")}
            >
              {props.values.topics}
            </textarea>
          </div>
          <div class="actionbar">
            <button class="btn primary" type="submit">Zapisz dla oceniającego</button>
          </div>
        </form>
      )}
    </Layout>
  );
}
