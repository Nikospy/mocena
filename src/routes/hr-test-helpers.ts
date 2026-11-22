import { createTestApp } from "../test-helpers";

export type App = ReturnType<typeof createTestApp>["app"];

export async function call(app: App, as: string, path: string, params?: Record<string, string>) {
  const headers: Record<string, string> = { cookie: `person_id=${as}` };
  let body: string | undefined;
  if (params) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(params).toString();
  }
  return app.request(path, { method: params ? "POST" : "GET", headers, body, redirect: "manual" });
}

export const html = async (app: App, as: string, path: string) => (await call(app, as, path)).text();

const PIOTR_IDS = ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja", "orientacja-na-klienta", "myslenie-analityczne"];

/** Piotr po kroku 4 i 5 pokazu: ocena zatwierdzona przez Marka i potwierdzone zapoznanie, przez trasy. */
export async function approveAndAcknowledgePiotr(app: App): Promise<void> {
  const form: Record<string, string> = { justification: "", developmentConclusions: "Kurs pism urzędowych.", interviewDate: "" };
  for (const id of PIOTR_IDS) form[`score[${id}]`] = "7";
  const r = await call(app, "marek", "/cycles/cycle-piotr/assessment/approve", form);
  if (r.status !== 303) throw new Error(`Zatwierdzenie: ${r.status}`);
  const a = await call(app, "piotr", "/cycles/cycle-piotr/assessment/acknowledge", {});
  if (a.status !== 303) throw new Error(`Zapoznanie: ${a.status}`);
}
