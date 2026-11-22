import { Layout } from "./layout";

export function NotFoundPage() {
  return (
    <Layout title="Nie ma takiej strony" person={null} today={null}>
      <section class="card">
        <h1>Nie ma takiej strony</h1>
        <p>Adres jest nieprawidłowy albo strona została przeniesiona.</p>
        <div class="btns">
          <a class="btn primary" href="/">Strona główna</a>
          <a class="btn" href="/tour">Pokaz dla jury</a>
        </div>
      </section>
    </Layout>
  );
}

export function ServerErrorPage() {
  return (
    <Layout title="Coś poszło nie tak" person={null} today={null}>
      <section class="card">
        <h1>Coś poszło nie tak</h1>
        <p>Dane są bezpieczne. Spróbuj jeszcze raz albo zacznij pokaz od początku.</p>
        <div class="btns">
          <a class="btn primary" href="/">Spróbuj jeszcze raz</a>
          <form method="post" action="/tour/1">
            <button class="btn" type="submit">Zacznij pokaz od nowa</button>
          </form>
        </div>
      </section>
    </Layout>
  );
}
