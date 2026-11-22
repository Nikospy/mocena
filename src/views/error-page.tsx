import type { Child } from "hono/jsx";
import type { Context } from "hono";
import { currentPerson, type Person } from "../people";
import { Layout } from "./layout";
import { PageHeader } from "./components";

export type ErrorStatus = 403 | 404 | 409 | 422;

/** Nagłówek strony błędu: mówi, co się stało, bez kodu HTTP. */
export const ERROR_TITLES: Record<ErrorStatus, string> = {
  403: "Nie masz dostępu do tego ekranu",
  404: "Nie ma takiej strony",
  409: "Tego nie da się już zrobić",
  422: "Nie zapisano zmian",
};

const BACK = (
  <svg class="ico s" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

/**
 * Wspólna strona odmowy i błędu (403, 404, 409, 422): nagłówek, jedno zdanie, co się stało, odnośnik powrotu do spraw.
 * Trasy wołają ją zamiast gołego tekstu: `c.html(<ErrorPage status={403} message="Ten ekran widzą kadry." person={viewer} />, 403)`.
 */
export function ErrorPage(props: { status: ErrorStatus; message: string; title?: string; person?: Person | null; extra?: Child }) {
  const title = props.title ?? ERROR_TITLES[props.status];
  return (
    <Layout title={title} person={props.person ?? null} today={null}>
      <section class="err">
        <PageHeader title={title} lead={props.message} />
        <p class="err-back">
          <a href="/">{BACK}Wróć do spraw</a>
          {props.status === 403 ? <a href="/account">Zmień konto</a> : null}
          {props.extra}
        </p>
      </section>
    </Layout>
  );
}

export function NotFoundPage() {
  return (
    <ErrorPage
      status={404}
      message="Adres jest nieprawidłowy albo strona została przeniesiona."
      extra={<a href="/tour">Pokaz dla jury</a>}
    />
  );
}

export function ServerErrorPage() {
  return (
    <Layout title="Coś poszło nie tak" person={null} today={null}>
      <section class="err">
        <PageHeader title="Coś poszło nie tak" lead="Dane są bezpieczne. Spróbuj jeszcze raz albo zacznij pokaz od początku." />
        <div class="err-back">
          <a href="/">{BACK}Wróć do spraw</a>
          <form method="post" action="/tour/1">
            <button class="btn text" type="submit">Zacznij pokaz od początku</button>
          </form>
        </div>
      </section>
    </Layout>
  );
}

/**
 * `errorPage(c, message, status)`: odpowiedź trasy z błędem jako strona dla człowieka: ten sam kod stanu, układ z menu bieżącego konta, jedno zdanie.
 * Pliki (CSV, ICS) i odpowiedzi dla `fetch` z `public/*.js` zostają przy `c.text`.
 */
export function errorPage(c: Context, message: string, status: ErrorStatus, extra?: Child) {
  // String() renderuje widok od razu, więc wynik jest gotową odpowiedzią (strażnicy tras sprawdzają `instanceof Response`).
  return c.html(String(<ErrorPage status={status} message={message} person={currentPerson(c)} extra={extra} />), status);
}
