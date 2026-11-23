// Treść przystanków przewodnika pokazu. Konto i datę daje state.ts, przepisy i terminy pochodzą z pliku reguł.
import { getDb } from "../db";
import { rules, rulesVersionLabel } from "../engine/rules";
import { TOUR_STOPS, type TourStop, type TourStopId } from "./state";

export type Look = { text: string; selector?: string };
export type Basis = { art: string; ver: string };

export type StopContent = TourStop & {
  title: string;
  /** Krótka nazwa przystanku w przycisku „Dalej: …”. */
  short: string;
  lead: string;
  look: Look[];
  tryIt?: string;
  /** Miejsce działania z „Spróbuj”: przewodnik przewija do niego, gdy po wejściu nie jest widoczne. */
  tryTarget?: string;
  note?: string;
  basis?: Basis;
  prev: TourStopId | null;
  next: TourStopId | "done";
  screen: (cycleId: string) => string;
};

const ver = rulesVersionLabel(rules.version);
const d = rules.deadlines;
const basis = (art: string): Basis => ({ art, ver });

const PERSON_LABEL: Record<string, string> = { marek: "Marek, oceniający", piotr: "Piotr, oceniany", joanna: "Joanna, kadry" };
const PERSON_GENITIVE: Record<string, string> = { marek: "Marka", piotr: "Piotra", joanna: "Joanny" };

type Body = Omit<StopContent, keyof TourStop | "prev" | "next">;

const BODY: Record<TourStopId, Body> = {
  "1": {
    title: "Kryteria na początku cyklu",
    short: "Piotr potwierdza",
    lead: "System podpowiada, wybiera Marek.",
    look: [
      { text: "„Karta rozmowy o kryteriach” z tematami z przepisu.", selector: '[data-tour="opening-card"]' },
      { text: "Termin oceny z przepisem.", selector: ".rule" },
      { text: "Nic nie jest zaznaczone z góry.", selector: ".hint" },
    ],
    tryIt: "Zaznacz dwa pierwsze kryteria z podpowiedzi i kliknij „Potwierdzam rozmowę i przekazuję część I”.",
    tryTarget: 'label.cb:has(input[value="orientacja-na-klienta"])',
    basis: basis(d.criteriaTalkDays.basis),
    screen: (c) => `/cycles/${c}/part1`,
  },
  "1b": {
    title: "Piotr potwierdza kryteria",
    short: "notatka",
    lead: "Piotr zna kryteria i oczekiwania od początku okresu podlegania ocenie, a nie dopiero przy ocenie.",
    look: [
      { text: "Po potwierdzeniu miejscowość, data i nazwisko wpiszą się tu same, a kryteria się zablokują.", selector: ".p1-confirmation" },
      { text: "Przycisk potwierdzenia.", selector: 'form[action$="/part1/confirm"] button' },
    ],
    tryIt: "Kliknij „Potwierdzam rozmowę, kryteria i termin oceny”.",
    tryTarget: 'form[action$="/part1/confirm"] button',
    screen: (c) => `/cycles/${c}/part1`,
  },
  "2": {
    title: "Notatka w dniu, w którym coś się stało",
    short: "nieobecność",
    lead: "Fakt w dniu zdarzenia, a nie z pamięci po dwóch latach. Asystent nie ocenia notatki.",
    look: [
      { text: "Słowo „przejął” zaznacza pole zmiany zadań. Można je odznaczyć.", selector: ".hint" },
      { text: "Po zapisie pytanie „To stała zmiana zadań?”." },
      { text: "Nazwisko bez punktów i etykiet." },
    ],
    tryIt: "Wpisz „Piotr przejął kolejkę po koledze”, wybierz Rzetelność i zapisz.",
    tryTarget: "#text",
    screen: () => "/people/piotr/notes/new",
  },
  "3": {
    title: "Nieobecność przesuwa termin",
    short: "ocena",
    lead: "Dwie nieobecności dzieli weekend: to jedna, dłuższa niż miesiąc.",
    look: [
      { text: "Daty drugiej są już wpisane.", selector: ".ct-form" },
      { text: "Pierwsza: 12 dni, termin bez zmian.", selector: ".abs-merged" },
      { text: "Po zapisie: jedna nieobecność 05.10–06.11.2026 i nowy termin." },
    ],
    tryIt: "Kliknij „Zapisz nieobecność”. Oś czasu otworzy się sama.",
    tryTarget: '.abs-form button[type="submit"]',
    basis: basis(d.longAbsenceOverMonths.basis),
    screen: (c) => `/cycles/${c}/absences`,
  },
  "4": {
    title: "Jedna „1” przesądza o wyniku",
    short: "zapoznanie",
    lead: "Szkic Marka: 5 przy sześciu kryteriach. „1” stawiamy na pokaz.",
    look: [
      { text: "Notatki z 24 miesięcy do zaznaczenia.", selector: ".crit-notes-d > summary" },
      { text: "Ostrzeżenie: fakty tylko z ostatniego miesiąca.", selector: ".st.warn" },
      { text: "Ocena negatywna mimo średniej 4,43.", selector: "#assessment-result" },
    ],
    tryIt: "Postaw „1” przy Rzetelności, zaznacz notatki i kliknij „Wstaw do uzasadnienia”.",
    tryTarget: '[data-crit="rzetelnosc"] .crit-row',
    basis: basis("§ 11 ust. 1 pkt 4"),
    screen: (c) => `/cycles/${c}/assessment`,
  },
  "5": {
    title: "Zapoznanie i 7 dni na sprzeciw",
    short: "kadry",
    lead: "Marek złożył uzasadnienie z notatek. Od zapoznania system liczy 7 dni na sprzeciw.",
    look: [
      { text: "Przycisk potwierdzenia.", selector: 'form[action$="/assessment/acknowledge"] button' },
      { text: "Termin sprzeciwu z przepisem. Dzień wolny go przesuwa.", selector: "#objection-clock" },
    ],
    tryIt: "Kliknij „Potwierdzam zapoznanie z oceną”.",
    tryTarget: 'form[action$="/assessment/acknowledge"] button',
    basis: basis(d.objectionDays.basis),
    screen: (c) => `/cycles/${c}/assessment`,
  },
  "5b": {
    title: "Kadry widzą cały urząd",
    short: "koniec",
    lead: "Joanna widzi wszystkie cykle w urzędzie i obowiązki urzędu z mocy prawa.",
    look: [
      { text: "Tomaszowi należy się kolejny stopień służbowy: termin i przepis.", selector: ".card.rule" },
      { text: "Sprzeciw Katarzyny: kadry odnotowują wynik rozpatrzenia.", selector: ".hr-obj" },
      // Ramka na komórce z nazwiskiem: pseudoelement na <tr> rozsuwa tabelę, a na komórce „Termin” telefon kasuje numer (style.css).
      { text: "Nowy cykl Piotra: kryteria do 30.11.2026, ponowna ocena 23.05.2027.", selector: '[data-tour="reassessment-cycle"] > th' },
      { text: "„Drukuj / pobierz PDF” przy ocenie Piotra.", selector: 'a[href="/cycles/cycle-piotr/sheet?print=1"]' },
    ],
    basis: basis(d.mandatoryGradeDays.basis),
    screen: () => "/hr",
  },
};

export const STOPS: StopContent[] = TOUR_STOPS.map((s, i) => ({
  ...s,
  ...BODY[s.id],
  prev: i > 0 ? TOUR_STOPS[i - 1].id : null,
  next: i < TOUR_STOPS.length - 1 ? TOUR_STOPS[i + 1].id : "done",
}));

export function stopById(id: string): StopContent | null {
  return STOPS.find((s) => s.id === id) ?? null;
}

/** „Krok 1 z 5 · część 2 z 2”: krok z kilkoma przystankami (1 i 1b, 5 i 5b) liczy też części, żeby licznik szedł naprzód po „Dalej”. */
export function stepLabel(stop: TourStop): string {
  const parts = TOUR_STOPS.filter((s) => s.step === stop.step);
  const head = `Krok ${stop.step} z 5`;
  return parts.length > 1 ? `${head} · część ${parts.findIndex((s) => s.id === stop.id) + 1} z ${parts.length}` : head;
}

export function personLabel(personId: string): string {
  return PERSON_LABEL[personId] ?? personId;
}
/** „Marka”, „Piotra”, „Joanny”: do dopisku pod przyciskiem „Dalej”. */
export function personGenitive(personId: string): string {
  return PERSON_GENITIVE[personId] ?? personId;
}

/** Adres ekranu przystanku; cykl Piotra z bazy (może być zamknięty w 5b). */
export function stopScreenPath(stop: StopContent): string {
  return stop.screen("cycle-piotr");
}

/** Identyfikator cyklu osoby (np. Ewy) albo null, gdy cyklu nie ma. */
export function cycleIdOf(personId: string): string | null {
  const row = getDb().query("SELECT id FROM cycles WHERE person_id = ? ORDER BY period_start DESC LIMIT 1").get(personId) as { id: string } | null;
  return row?.id ?? null;
}
