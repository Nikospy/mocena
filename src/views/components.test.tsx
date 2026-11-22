import { describe, expect, test } from "bun:test";
import { ConfirmationBlock, ErrorSummary, FieldError, invalid } from "./components";

const html = (n: unknown) => String(n);

describe("ConfirmationBlock", () => {
  test("potwierdzenie: miejscowość, data i nazwisko; bez danych: jeszcze niepotwierdzone", () => {
    const done = html(<ConfirmationBlock kind="confirmation" name="Piotr Wójcik" place="Rzeszów" date="2024-12-09" />);
    expect(done).toContain("Potwierdzenie w systemie: Rzeszów, 09.12.2024, Piotr Wójcik");
    expect(html(<ConfirmationBlock kind="confirmation" />)).toContain("Jeszcze niepotwierdzone");
  });

  test("fikcja: przyczyna, sposób i dzień doręczenia, data wpisu; bez słowa „podpis”", () => {
    const out = html(
      <ConfirmationBlock kind="fiction" name="Ewa Nowak" reason="odmowa odbioru" deliveryMethod="poczta" deliveredOn="2024-12-02" date="2024-12-16" />,
    );
    for (const t of ["odmowa odbioru", "poczta", "02.12.2024", "16.12.2024"]) expect(out).toContain(t);
    expect(out.toLowerCase()).not.toContain("podpis");
  });
});

describe("błędy formularza", () => {
  test("podsumowanie: liczba pól z odmianą, odnośnik do pola, fokus po załadowaniu; bez błędów nic", () => {
    const one = html(<ErrorSummary errors={{ text: "Wpisz, co się stało." }} />);
    expect(one).toContain("Popraw 1 pole");
    expect(one).toContain('href="#text"');
    expect(one).toContain('role="alert"');
    expect(one).toContain("autofocus");
    expect(html(<ErrorSummary errors={{ a: "A.", b: "B." }} />)).toContain("Popraw 2 pola");
    expect(html(<ErrorSummary errors={{ a: "1", b: "2", c: "3", d: "4", e: "5" }} />)).toContain("Popraw 5 pól");
    expect(html(<ErrorSummary errors={{ criterion_id: "Wybierz kryterium." }} fields={{ criterion_id: "criterion-first" }} />)).toContain('href="#criterion-first"');
    expect(html(<ErrorSummary errors={{ _: "Ogólny błąd." }} />)).not.toContain("href=");
    expect(String(ErrorSummary({ errors: {} }))).toBe("null");
    expect(String(ErrorSummary({ errors: { text: undefined } }))).toBe("null");
  });

  test("komunikat przy polu i atrybuty pola: aria-invalid, aria-describedby z identyfikatorem komunikatu", () => {
    const e = { text: "Wpisz, co się stało." };
    const msg = html(<FieldError id="text" errors={e} />);
    expect(msg).toContain('id="text-error"');
    expect(msg).toContain("Błąd: ");
    expect(invalid("text", e)).toEqual({ "aria-invalid": "true", "aria-describedby": "text-error" });
    expect(invalid("text", e, "hint")).toEqual({ "aria-invalid": "true", "aria-describedby": "text-error hint" });
    expect(invalid("date", e, "date-words")).toEqual({ "aria-invalid": undefined, "aria-describedby": "date-words" });
    expect(String(FieldError({ id: "date", errors: e }))).toBe("null");
  });
});
