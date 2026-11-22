// Dane i działania potrzebne do odtworzenia stanów z coverage.md.
import regulation from "../rules/regulation-2016-470.json";
import { openCycle } from "../src/cycles";
import { getDb } from "../src/db";
import { STOPS } from "../src/tour/stops";

export type Fields = Record<string, string | string[]>;
export type CaptureOptions = {
  status?: number;
  check?: string;
  selector?: string;
  redirect?: string;
  tour?: string;
  tabs?: number;
  hover?: string;
  print?: boolean;
  download?: "csv" | "ics" | "json";
  form?: { action: string; button?: string; fields?: Record<string, string>; omitSubmitter?: boolean; noValidate?: boolean; checks?: { selector: string; count: number } };
};

type Capture = (who: string | null, path: string, name: string, options?: CaptureOptions) => Promise<void>;
type Post = (who: string | null, path: string, fields?: Fields) => Promise<string>;

const M = "marek", P = "piotr", H = "joanna", A = "admin", S = "anna", D = "dyrektor-urzedu";
const cycle = "/cycles/cycle-piotr";
const missing = "/cycles/audit-missing";
const closed = "/cycles/cycle-piotr-2022";
const part1 = cycle + "/part1";
const assessment = cycle + "/assessment";
const fiction = assessment + "/fiction";
const timeline = cycle + "/timeline";
const opening = cycle + "/cards/opening";
const cardAssessment = cycle + "/cards/assessment-conversation";
const note = "/people/piotr/notes";
const history = "/people/piotr/history";
const people = "/hr/people";
const edit = people + "/piotr/edit";
const substitutions = "/hr/substitutions";
const deadline = cycle + "/deadline-change";
const request = deadline + "/request";
const invitations = cycle + "/invitations";
const invitationOpening = invitations + "/new?kind=opening";
const invitationAssessment = invitations + "/new?kind=assessment";
const absences = cycle + "/absences";
const appraiser = cycle + "/appraiser";
const sources = "/admin/suggestion-sources";
const before = cycle + "/before-meeting";
const appreciation = cycle + "/appreciation";
const exportCsv = "/hr/export.csv";
const exportAssessment = assessment + "/export.json";

export async function auditScenarios(shot: Capture, post: Post) {
  const date = (value: string) => post(A, "/demo/date", { date: value });
  const roles = async (path: string, name: string, viewers: (string | null)[], options?: CaptureOptions) => {
    for (const who of viewers) await shot(who, path, `${name}-${who ?? "anonim"}`, options);
  };
  const invalid = (who: string | null, path: string, name: string, action: string, form: Omit<NonNullable<CaptureOptions["form"]>, "action"> = {}, status = 422) =>
    shot(who, path, name, { status, form: { action, ...form } });
  const keyboard = async (who: string, path: string, name: string) => {
    for (const tabs of [1, 3, 6]) await shot(who, path, `${name}-tab-${tabs}`, { tabs });
  };
  const denied = async (route: string, name: string, viewer: string, absent?: string) => {
    await shot(viewer, route, `${name}-403`, { status: 403 });
    if (absent) await shot(M, absent, `${name}-404`, { status: 404 });
  };

  await shot(null, "/", "home-guest");
  await shot(null, "/account", "account");
  await roles("/account", "account", [M, P, H, A, D]);
  await invalid(null, "/account", "account-error", "/account", { omitSubmitter: true });
  await roles("/about", "about", [null, M, P, H, A, D], { check: "Wdrożenie i dane" });
  await shot(M, "/", "home-marek");
  await keyboard(M, "/", "home");
  await shot(H, "/", "home-hr");
  await shot(A, "/", "home-admin");
  await shot(D, "/", "home-director", { check: "Terminowość w urzędzie" });
  await shot(D, "/office/statistics", "office-statistics-initial");
  await denied("/office/statistics", "office-statistics", H);
  // Pusta lista spraw na prawdziwym koncie: Piotr przed wyznaczeniem kryteriów nie ma nic do załatwienia.
  await shot(P, "/", "home-empty", { check: "Teraz nie masz spraw do załatwienia" });
  // Pierwsze uruchomienie: bez trybu pokazu i bez kont (chwilowo, w punkcie zapisu bazy pomiarowej).
  const firstRun = getDb();
  firstRun.exec("SAVEPOINT audit_first_run; DELETE FROM settings WHERE key = 'demo_date'; UPDATE people SET has_account = 0");
  try {
    await shot(null, "/account", "first-run", { check: "Pierwsze uruchomienie" });
  } finally {
    firstRun.exec("ROLLBACK TO audit_first_run; RELEASE audit_first_run");
  }
  await roles(cycle, "cycle", [M, P], { redirect: part1 });
  await shot(M, part1, "part1-edit", { selector: ".p1-form" });
  await shot(M, "/notes", "notes-before-criteria", { check: "Wyznacz kryteria" });
  await invalid(M, part1, "part1-error", part1 + "/submit", {
    button: 'button[formaction$="/part1/submit"]',
    checks: { selector: 'input[name="additional"]', count: 4 },
  });
  await shot(P, part1, "part1-piotr-wait");
  await shot(H, part1, "part1-hr-edit");
  await shot(M, assessment, "assessment-no-part1", { check: "bez potwierdzonej części I" });
  await roles(assessment, "assessment-no-part1", [P, H], { check: "bez potwierdzonej części I" });
  await shot(M, deadline, "deadline-decision-too-early", { check: "nie minęło jeszcze 6 miesięcy" });
  await shot(P, request, "deadline-request-too-early", { check: "nie minęło jeszcze 6 miesięcy" });
  await shot(M, opening, "card-opening");
  await shot(P, opening, "card-opening-piotr");
  await shot(M, invitationOpening, "invitation-opening");
  await shot(M, invitationOpening, "hover-primary", { hover: "main button.btn.primary" });
  await shot(M, invitations + "/new?kind=unknown", "invitation-kind-404", { status: 404 });
  await invalid(M, invitationOpening, "invitation-error", invitations);
  const invitation = await post(M, invitations, { kind: "opening", date: "2024-12-10", time: "10:30", place: "Pokój 214" });
  await shot(M, invitationOpening, "invitation-prefilled");
  await shot(M, opening, "card-opening-sent");
  await roles(invitation, "invitation-sent", [M, P]);
  await roles(invitation + ".ics", "calendar", [M, P], { download: "ics" });
  await denied(invitation, "invitation", H, invitations + "/0");
  await denied(invitation + ".ics", "calendar", H, invitations + "/0.ics");
  await post(P, invitation + "/confirm");
  await roles(invitation, "invitation-confirmed", [M, P]);
  await shot(M, invitation, "hover-secondary", { hover: 'main a.btn[href$=".ics"]' });

  const extra = ["orientacja-na-klienta", "myslenie-analityczne"];
  const criteria = { additional: extra, "expectation[orientacja-na-klienta]": "Kompletne odpowiedzi dla interesantów, z numerem sprawy." };
  await post(M, part1 + "/submit", criteria);
  await shot(M, part1, "part1-submitted", { check: "Czeka na potwierdzenie" });
  await shot(P, "/", "home-piotr");
  await shot(P, part1, "part1-to-confirm", { selector: 'form[action$="/part1/confirm"]' });
  await shot(H, part1, "part1-hr-pending");
  await post(P, part1 + "/confirm");
  await shot(P, part1, "part1-confirmed");
  await shot(M, part1, "part1-done-marek");
  await shot(H, part1, "part1-hr-done");
  await shot(P, assessment, "assessment-piotr-wait", { check: "nie jest jeszcze zatwierdzona" });
  await shot(H, assessment, "assessment-hr-wait", { check: "nie jest jeszcze zatwierdzona" });
  await roles(timeline, "timeline-start", [M, P, H]);

  await date("2026-03-11");
  await shot(M, invitation, "invitation-expired");
  await shot(M, note + "/new", "note-form");
  await invalid(M, note + "/new", "note-error", note);
  // Notatki widzi tylko autor: oceniany, kadry i administrator dostają stronę odmowy 403.
  await roles("/notes", "notes-empty", [P, H, A], { status: 403 });
  await roles("/feedback", "feedback-empty", [M, P, H, A]);
  const noteFields = { criterion_id: "wspolpraca", text: "Po odejściu koleżanki 9 marca przejął jej kolejkę wniosków i spisał, co jest otwarte.", rating: "good", task_change: "1", date: "2026-03-11" };
  const question = await post(M, note, noteFields);
  await shot(M, question, "task-change-question");
  await invalid(M, question, "task-change-error", question, { omitSubmitter: true });
  await post(M, question, { answer: "yes" });
  await shot(M, question, "task-change-card");
  const nextQuestion = await post(M, note, { ...noteFields, text: "Jednorazowo przejął dyżur kolegi." });
  await post(M, nextQuestion, { answer: "no" });
  await shot(M, nextQuestion, "task-change-no");
  const feedback = question.replace(/task-change$/, "feedback");
  await shot(M, feedback, "feedback-form");
  await invalid(M, feedback, "feedback-error", feedback, { fields: { text: "" } });
  await shot(M, await post(M, feedback, { text: "Dziękuję za uporządkowanie kolejki." }), "notes-feedback-sent");
  await shot(P, "/feedback", "feedback-received", { check: "Dziękuję za uporządkowanie kolejki." });
  await shot(M, await post(M, note, { ...noteFields, task_change: "", text: "Zaktualizował rejestr." }), "notes-saved");
  await shot(M, "/notes", "notes-list");
  await denied(question, "task-change", P, "/notes/0/task-change");
  await denied(feedback, "feedback-form", P, "/notes/0/feedback");

  await date("2026-11-10");
  await shot(H, absences, "absence-form");
  await invalid(H, absences, "absence-error", absences);
  const logAbsence = (from: string, to: string) => post(H, absences, { from, to, excused: "1" });
  await shot(H, await logAbsence("2026-10-05", "2026-10-16"), "timeline-saved-unchanged", { check: "Termin oceny się nie zmienił" });
  await shot(H, await logAbsence("2026-10-19", "2026-11-06"), "timeline-saved-extended", { check: "Nowy termin oceny widzą" });
  await shot(H, absences, "absence-filled", { check: "05.10.2026" });
  await shot(H, timeline, "timeline");
  await roles(timeline, "timeline-shifted", [M, P]);
  await shot(H, closed + "/absences", "absence-closed");
  await invalid(H, closed + "/absences", "absence-closed-post", closed + "/absences", {}, 409);

  await date("2026-11-21");
  await shot(M, "/", "home-marek-late");
  await shot(M, before, "before-meeting");
  await shot(M, appreciation, "appreciation");
  await shot(M, cardAssessment, "card-assessment");
  await shot(M, invitationAssessment, "invitation-assessment");
  await post(M, invitations, { kind: "assessment", date: "2026-11-23", time: "09:00", place: "Pokój 214" });
  await shot(M, cardAssessment, "card-assessment-sent");
  await shot(M, assessment, "assessment-empty", { selector: "#assessment-form" });
  await shot(M, exportAssessment, "assessment-export-not-approved", { status: 404, check: "nie jest jeszcze zatwierdzona" });
  await keyboard(M, assessment, "assessment");
  await invalid(M, assessment, "assessment-error", assessment + "/approve", { button: 'button[formaction$="/assessment/approve"]' });
  const draft: Fields = { justification: "Trzy odpowiedzi wyszły po terminie (notatki z 11.02.2025 i 26.08.2026).", developmentConclusions: "Rozmowa o priorytetach i podziale kolejki wniosków.", interviewDate: "2026-11-21" };
  for (const id of [...regulation.sheets.C.mandatoryCriteria, ...extra]) draft[`score[${id}]`] = id === "rzetelnosc" ? "1" : "7";
  await post(M, assessment, draft);
  await shot(M, assessment, "assessment-draft", { selector: 'input[name="score[rzetelnosc]"][value="1"]:checked' });
  await post(M, assessment + "/approve", draft);
  await shot(M, assessment, "assessment-approved");
  await shot(H, assessment, "assessment-hr-approved");
  await roles(exportAssessment, "assessment-export-approved", [M, P, H], { download: "json" });
  await denied(exportAssessment, "assessment-export", A, missing + "/assessment/export.json");
  await shot(M, deadline, "deadline-decision-blocked");
  await shot(P, request, "deadline-request-blocked");
  await shot(M, fiction, "fiction-form");
  await invalid(M, fiction, "fiction-error", fiction);

  await shot(H, await logAbsence("2026-11-19", "2026-11-20"), "timeline-saved-approved", { check: "Ocena jest już zatwierdzona" });

  await date("2026-11-22");
  await shot(P, assessment, "assessment-piotr", { selector: 'form[action$="/assessment/acknowledge"]' });
  await post(P, assessment + "/acknowledge");
  await shot(P, assessment, "assessment-acknowledged");
  await shot(M, assessment, "assessment-done-marek");
  await shot(H, assessment, "assessment-hr-done");
  await roles(exportAssessment, "assessment-export-acknowledged", [M, P, H], { download: "json" });
  const nextCycle = openCycle(P);
  if (!nextCycle || nextCycle.id === "cycle-piotr") throw new Error("Brak kolejnego cyklu Piotra po zapoznaniu");
  const next = `/cycles/${nextCycle.id}`;
  await shot(M, next + "/part1", "part1-after-negative");
  await shot(M, next + "/invitations/new?kind=opening", "invitation-after-negative");
  await shot(P, next + "/deadline-change/request", "deadline-request-after-negative");
  await shot(M, next + "/deadline-change", "deadline-decision-after-negative");
  await shot(M, fiction, "fiction-blocked", { status: 409 });
  await shot(M, deadline, "deadline-decision-closed", { check: "Cykl jest zamknięty" });
  await shot(P, request, "deadline-request-closed", { check: "Cykl jest zamknięty" });
  await shot(M, cycle + "/sheet", "sheet");
  await shot(H, "/cycles/cycle-office-head/sheet", "sheet-a", { check: "arkusz A" });
  await shot(H, "/cycles/cycle-tomasz/sheet", "sheet-b", { check: "arkusz B" });
  await roles(cycle + "/sheet", "sheet", [P, H]);
  await roles(cycle + "/sheet?part=1", "sheet-part1", [M, P, H]);
  await shot(M, cycle + "/sheet", "sheet-print", { print: true });
  await roles(history, "history", [M, P, H]);

  await shot(H, "/hr", "hr");
  const objectionCycle = "/cycles/cycle-katarzyna";
  const objection = objectionCycle + "/objection-outcome";
  await roles(objectionCycle + "/assessment", "assessment-objection-filed", [S, H]);
  // Wybór wyniku ma `required`: pomiar wyłącza walidację przeglądarki, żeby trasa zwróciła formularz z błędem (422).
  await invalid(H, "/hr", "objection-error", objection, { noValidate: true });
  await shot(H, await post(H, objection, { outcome: "rejected" }), "hr-objection-resolved", { check: "Sprzeciw rozpatrzony" });
  await roles(objectionCycle + "/assessment", "assessment-objection-resolved", [S, H]);
  // Ocena sporządzona po raz drugi (art. 83 ust. 4 ustawy): ten sam sprzeciw rozstrzygnięty inaczej, w punkcie zapisu cofanym po zrzutach.
  const redoDb = getDb();
  redoDb.exec("SAVEPOINT audit_redo");
  try {
    redoDb.query("DELETE FROM events WHERE cycle_id = 'cycle-katarzyna' AND type = 'objection_resolved'").run();
    await post(H, objection, { outcome: "redone" });
    const redoAssessment = objectionCycle + "/assessment";
    await shot(S, redoAssessment, "assessment-redo-form", { selector: "#assessment-form", check: "po raz drugi" });
    const redoFields: Fields = { justification: "", developmentConclusions: "Szkolenie z zarządzania zespołem w ciągu roku.", interviewDate: "2026-11-22" };
    for (const id of regulation.sheets.C.mandatoryCriteria) redoFields[`score[${id}]`] = id === "rzetelnosc" ? "3" : "5";
    await post(S, redoAssessment, redoFields);
    await invalid(S, redoAssessment, "assessment-redo-lowered", redoAssessment + "/approve", { button: 'button[formaction$="/assessment/approve"]' });
    redoFields["score[rzetelnosc]"] = "7";
    await post(S, redoAssessment + "/approve", redoFields);
    await roles(redoAssessment, "assessment-redo-approved", [S, H]);
    await shot(H, objectionCycle + "/sheet", "sheet-redo", { check: "po raz drugi" });
  } finally {
    redoDb.exec("ROLLBACK TO audit_redo; RELEASE audit_redo");
  }
  // Rozstrzygnięcie „zmiana oceny” (art. 83 ust. 3 ustawy): kadry wpisują zmienione oceny cząstkowe; też cofane po zrzutach.
  redoDb.exec("SAVEPOINT audit_change");
  try {
    redoDb.query("DELETE FROM events WHERE cycle_id = 'cycle-katarzyna' AND type = 'objection_resolved'").run();
    const change = await post(H, objection, { outcome: "changed" });
    await shot(H, change, "objection-change-form", { check: "Zapisujesz decyzję rozpatrującego sprzeciw" });
    await invalid(H, change, "objection-change-lowered", change, { checks: { selector: 'input[name="score[rzetelnosc]"][value="3"]', count: 1 } });
    const changed: Fields = {};
    for (const id of regulation.sheets.C.mandatoryCriteria) changed[`score[${id}]`] = id === "rzetelnosc" ? "7" : "5";
    await roles(await post(H, change, changed), "assessment-changed", [S, H]);
  } finally {
    redoDb.exec("ROLLBACK TO audit_change; RELEASE audit_change");
  }
  await shot(D, "/office/statistics", "office-statistics-final");
  await keyboard(H, "/hr", "hr");
  await shot(H, "/hr", "hover-link", { hover: "a.brand" });
  await shot(H, await post(H, "/hr/grades/tomasz"), "hr-awarded");
  await roles(people, "people", [H, A]);
  const peopleImport = people + "/import";
  const importCsv = [
    "Osoba;Stanowisko;Komórka;Oceniający;Stan cyklu;Termin oceny;Termin sprzeciwu;Data ostatniej oceny;Wynik ostatniej oceny",
    "Jan Nowicki;Specjalista;Wydział Kadr i Szkoleń;Marek Zieliński;;;;10.03.2025;pozytywna",
    "Piotr Wójcik;Starszy specjalista;Wydział Organizacyjny;Marek Zieliński;Okres oceny;27.11.2026;;27.11.2024;pozytywna",
    "Ola Bez;Referent;Wydział Nieistniejący;Marek Zieliński;;;;10.03.2025;pozytywna",
  ].join("\n");
  await shot(H, peopleImport, "people-import");
  await invalid(H, peopleImport, "people-import-preview", peopleImport, { fields: { csv: importCsv } }, 200);
  await invalid(H, peopleImport, "people-import-error", peopleImport, { fields: { csv: "Imię;Nazwisko\nJan;Nowak" } });
  await shot(H, people, "hr-people");
  await roles(people + "?q=brak-wynikow-audyt", "people-empty", [H, A]);
  await roles(exportCsv, "export", [H, A], { download: "csv" });
  for (const who of [H, A]) {
    await shot(who, people + "/new", `person-new-${who}`);
    await invalid(who, people + "/new", `person-new-error-${who}`, people);
    await shot(who, edit, `person-edit-${who}`);
    await shot(who, people + "/maria/edit", `person-edit-no-cycle-${who}`);
    await invalid(who, edit, `person-edit-error-${who}`, edit, { fields: { name: "" } });
    await shot(who, substitutions, `substitutions-${who}`);
    await invalid(who, substitutions, `substitutions-error-${who}`, substitutions);
  }
  const person = { name: "Jan Testowy", position_title: "Specjalista", unit: "Wydział Organizacyjny", supervisor_id: M, prev_on: "2024-04-17", prev_outcome: "positive" };
  await shot(H, await post(H, people, person), "people-saved");
  await shot(A, await post(A, people, { ...person, name: "Ola Testowa" }), "people-saved-admin");
  const piotr = { name: "Piotr Wójcik", position_title: "Starszy specjalista", unit: "Wydział Organizacyjny", supervisor_id: M, sheet: "C", prev_on: "2024-11-27", prev_outcome: "positive" };
  await shot(H, await post(H, edit, piotr), "people-updated");
  await shot(A, await post(A, edit, piotr), "people-updated-admin");
  await shot(H, "/people/maria/history", "history-empty");
  await shot(M, "/cycles/cycle-jan-testowy/before-meeting", "before-meeting-empty");
  await shot(M, "/cycles/cycle-jan-testowy/appreciation", "appreciation-empty");
  const substitute = { absent_id: M, substitute_id: S, date_from: "2026-11-21", date_to: "2026-11-30" };
  await shot(H, await post(H, substitutions, substitute), "substitutions-saved-joanna");
  await shot(A, await post(A, substitutions, { ...substitute, date_from: "2026-12-01", date_to: "2026-12-03" }), "substitutions-saved-admin");
  await shot(S, timeline, "timeline-substitute");
  await shot(S, history, "history-anna");
  await shot(S, cycle + "/sheet", "sheet-anna");
  await shot(S, cycle + "/sheet?part=1", "sheet-part1-anna");
  await shot(S, exportAssessment, "assessment-export-substitute", { download: "json" });
  await shot(S, note + "/new", "note-substitute");

  const newAppraiser = "/cycles/cycle-jan-testowy/appraiser";
  await shot(H, newAppraiser, "appraiser-change");
  await shot(H, newAppraiser + "?to=anna", "appraiser-prefilled");
  await invalid(H, newAppraiser, "appraiser-error", newAppraiser);
  await shot(H, closed + "/appraiser", "appraiser-closed");
  await shot(A, sources, "suggestion-sources");
  await shot(A, "/admin/rules", "admin-rules", { check: "Obowiązuje teraz" });
  await shot(A, "/admin/corrections", "admin-corrections");
  const correction = "/cycles/cycle-tomasz/sheet/correction";
  await shot(A, correction, "sheet-correction");
  await invalid(A, correction, "sheet-correction-error", correction);
  await denied(correction, "sheet-correction", M);
  await shot(A, missing + "/sheet/correction", "sheet-correction-404", { status: 404 });
  await denied("/admin/rules", "admin-rules", H);
  await denied(cycle, "cycle", A, missing);
  await denied(part1, "part1", A, missing + "/part1");
  await denied(opening, "opening", A, missing + "/cards/opening");
  await denied(assessment, "assessment", A, missing + "/assessment");
  await denied(fiction, "fiction", P, missing + "/assessment/fiction");
  await denied("/hr", "hr", P);
  await denied(cycle + "/sheet", "sheet", A, missing + "/sheet");
  await denied(history, "history", A, "/people/audit-missing/history");
  await denied(note + "/new", "note", A, "/people/audit-missing/notes/new");
  await denied(cardAssessment, "assessment-card", P, missing + "/cards/assessment-conversation");
  await denied(absences, "absences", P, missing + "/absences");
  await denied(timeline, "timeline", A, missing + "/timeline");
  await denied(appraiser, "appraiser", P, missing + "/appraiser");
  await denied(people, "people", P);
  await denied(people + "/new", "person-new", P);
  await denied(edit, "person-edit", P);
  await shot(H, people + "/audit-missing/edit", "person-edit-404", { status: 404 });
  await denied(substitutions, "substitutions", P);
  await denied(exportCsv, "export", P);
  await denied(before, "before-meeting", P, missing + "/before-meeting");
  await denied(appreciation, "appreciation", P, missing + "/appreciation");
  await denied(sources, "sources", P);
  await denied(invitationOpening, "invitation-new", P, missing + "/invitations/new?kind=opening");
  await shot(M, "/no-such-page", "error-404", { status: 404 });
  await shot(null, "/hr", "hr-anonymous", { redirect: "/account" });
  const db = getDb();
  db.exec("SAVEPOINT audit_server_error; ALTER TABLE people RENAME TO unavailable_people");
  try {
    await shot(M, "/", "error-500", { status: 500, check: "Coś poszło nie tak" });
  } finally {
    db.exec("ROLLBACK TO audit_server_error; RELEASE audit_server_error");
  }
  await shot(H, await post(H, newAppraiser, { appraiser_id: S }), "timeline-appraiser-changed");
  const deletion = people + "/jan-testowy/delete";
  await shot(H, deletion, "person-delete-confirm");
  await invalid(H, deletion, "person-delete-error", deletion, { omitSubmitter: true });
  await shot(H, people + "/marek/delete", "person-delete-blocked", { status: 409 });
  await shot(A, deletion, "person-delete-403", { status: 403 });
  await shot(H, people + "/audit-missing/delete", "person-delete-404", { status: 404 });
  await shot(H, await post(H, deletion, { confirmed: "1" }), "people-deleted", { check: "Usunięto dane pracownika." });

  const directorDecision = "/cycles/cycle-anna/deadline-change";
  await shot(D, directorDecision, "deadline-director-pending", { check: "zmiana stanowiska pracy" });
  const directorLetter = await post(D, directorDecision, { case: "4", newDate: "2027-03-15", reason: "Uwzględniono zmianę stanowiska." });
  await shot(D, directorLetter, "deadline-letter-director");
  await shot(S, directorLetter, "deadline-letter-appraiser-as-employee");

  // Oddzielne dane do wariantów, które zmieniłyby termin lub zamknęły ten sam cykl.
  await post(null, "/tour/4");
  await post(H, substitutions, substitute);
  await shot(S, assessment, "assessment-substitute", { selector: "#assessment-form" });
  await shot(S, cycle, "cycle-anna", { redirect: part1 });
  await shot(S, part1, "part1-substitute");
  await shot(S, opening, "opening-substitute");
  await shot(S, "/", "home-substitute");
  await shot(P, request, "deadline-request");
  await invalid(P, request, "deadline-request-error", request);
  await shot(M, deadline, "deadline-decision");
  await invalid(M, deadline, "deadline-decision-error", deadline);
  await denied(deadline, "deadline-change", P, missing + "/deadline-change");
  await denied(request, "deadline-request", H, missing + "/deadline-change/request");
  const motion = { reason: "Zmiana zakresu obowiązków.", requestedDate: "2027-01-15" };
  await shot(P, await post(P, request, motion), "deadline-request-pending");
  await shot(M, deadline, "deadline-pending");
  await invalid(M, deadline, "deadline-reject-error", deadline + "/reject");
  await post(M, deadline + "/reject", { reason: "Termin pozostaje aktualny." });
  await shot(P, request, "deadline-request-rejected");
  await post(P, request, motion);
  const letter = await post(M, deadline, { case: "4", newDate: motion.requestedDate, reason: "Uwzględniono zmianę zakresu obowiązków." });
  await roles(letter, "deadline-letter", [M, P, H]);
  await denied(letter, "deadline-letter", A, deadline + "/0/letter");
  await shot(P, request, "deadline-request-accepted");
  await post(null, "/tour/5");
  await post(H, substitutions, substitute);
  await shot(S, fiction, "fiction-substitute");
  await invalid(S, fiction, "fiction-substitute-error", fiction);
  await shot(M, await post(M, fiction, { reason: "could_not", deliveryMethod: "post", deliveredOn: "2026-11-22" }), "assessment-fiction-saved");

  await shot(null, "/tour", "tour-entry");
  await shot(M, "/tour", "tour");
  await roles("/tour", "tour-entry", [P, H, A, D]);
  for (const stop of STOPS) {
    const path = await post(null, `/tour/${stop.id}`);
    await shot(stop.personId, path, `tour-${stop.id}`, { tour: stop.id, selector: "#tour-guide" });
  }
  await shot(H, "/tour/done", "tour-done", { tour: STOPS.at(-1)?.id, check: "Koniec pokazu" });
  await roles("/tour/done", "tour-done-direct", [null, M, P, H, A, D]);
  await shot(H, await post(null, "/tour/extra/ewa-timeline"), "tour-extra-ewa-timeline");
  await shot(M, await post(null, "/tour/extra/fiction"), "tour-extra-fiction");
  await shot(A, await post(null, "/tour/extra/sources"), "tour-extra-sources");
}
