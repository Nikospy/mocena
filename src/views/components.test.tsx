import { describe, expect, test } from "bun:test";
import { ConfirmationBlock } from "./components";

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
