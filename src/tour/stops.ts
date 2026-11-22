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
    lead: "Marek zaczyna dwuletni cykl oceny Piotra. System sam dobrał arkusz i podpowiada kryteria dodatkowe, każde z powodem. Wybór należy do Marka.",
    look: [
      { text: "Termin oceny z przepisem.", selector: ".rule" },
      { text: "Podpowiedzi kryteriów: ramka przerywana, powód, można odrzucić.", selector: ".hint" },
      { text: "Karta rozmowy rozpoczynającej z tematami z przepisu.", selector: 'a[href$="/cards/opening"]' },
    ],
    tryIt: "Zaznacz „Orientacja na klienta/interesanta” i „Myślenie analityczne”, potem przekaż Piotrowi.",
    basis: basis(d.criteriaTalkDays.basis),
    screen: (c) => `/cycles/${c}/part1`,
  },
  "1b": {
    title: "Piotr potwierdza kryteria",
    short: "notatka",
    lead: "Piotr zna kryteria i oczekiwania, zanim zacznie się okres oceny. Potwierdza je jednym kliknięciem.",
    look: [
      { text: "Przycisk potwierdzenia.", selector: 'form[action$="/part1/confirm"] button' },
      { text: "Po potwierdzeniu miejscowość, data i nazwisko wpisują się same, a kryteria się blokują.", selector: ".sheet" },
    ],
    screen: (c) => `/cycles/${c}/part1`,
  },
  "2": {
    title: "Notatka w dniu, w którym coś się stało",
    short: "nieobecność",
    lead: "Marek zapisuje fakt w dniu, w którym się zdarzył, a nie po dwóch latach z pamięci. Asystent nie ocenia notatki. Zauważa tylko słowo „przejął” i pyta, czy to stała zmiana zadań.",
    look: [
      { text: "Po wpisaniu »przejął« pole »Zmiana zadań pracownika« zaznacza się samo jako podpowiedź; można je odznaczyć.", selector: ".hint" },
      { text: "Po zapisie pytanie „To stała zmiana zadań?”, a po „Tak” karta rozmowy i forma rozwoju." },
      { text: "Przy nazwisku Piotra nie ma punktów ani etykiet." },
    ],
    tryIt: "Wpisz „Piotr przejął kolejkę wniosków po odejściu kolegi”, wybierz kryterium Rzetelność i zapisz.",
    screen: () => "/people/piotr/notes/new",
  },
  "3": {
    title: "Nieobecność przesuwa termin",
    short: "ocena",
    lead: "Joanna wpisuje dwie nieobecności Piotra rozdzielone weekendem. System liczy je jako jedną, dłuższą niż miesiąc, i sam przesuwa termin oceny.",
    look: [
      { text: "Jedna ciągła nieobecność od 05.10 do 06.11.2026.", selector: 'section[aria-labelledby="h-abs"]' },
      { text: "Nowy termin oceny z przepisem.", selector: ".rule" },
      { text: "Na osi czasu kropka pełna to przepis, a pusta to wpis człowieka." },
    ],
    tryIt: "Wpisz 05.10–16.10.2026 i 19.10–06.11.2026, potem otwórz oś czasu.",
    basis: basis(d.longAbsenceOverMonths.basis),
    screen: (c) => `/cycles/${c}/absences`,
  },
  "4": {
    title: "Jedna „1” przesądza o wyniku",
    short: "zapoznanie",
    lead: "Formularz oceny wypełnia się w ostatnim tygodniu, ale notatki są z 24 miesięcy. Punkty stawia Marek. System liczy wynik według przepisu i pilnuje braków.",
    look: [
      { text: "Notatki i pola wyboru przy kryteriach.", selector: ".crit-notes .note-list" },
      { text: "Ostrzeżenie, gdy fakty do kryterium są tylko z ostatniego miesiąca.", selector: ".st.warn" },
      { text: "Po „1” przy Rzetelności wynik jest negatywny mimo średniej powyżej 4, a zatwierdzenie czeka na uzasadnienie i wnioski do programu rozwoju.", selector: "#assessment-result" },
    ],
    tryIt: "Postaw „1” przy Rzetelności i kliknij „Wstaw do uzasadnienia”.",
    note: "„1” stawiamy na pokaz, żeby było widać regułę.",
    basis: basis("§ 11 ust. 1 pkt 4"),
    screen: (c) => `/cycles/${c}/assessment`,
  },
  "5": {
    title: "Zapoznanie i 7 dni na sprzeciw",
    short: "kadry",
    lead: "Piotr czyta ocenę z uzasadnieniem złożonym z notatek i potwierdza zapoznanie. Od tej chwili biegnie termin na sprzeciw.",
    look: [
      { text: "Przycisk potwierdzenia zapoznania.", selector: 'form[action$="/assessment/acknowledge"] button' },
      { text: "Termin sprzeciwu z przepisem; gdy wypada w dzień wolny, przesuwa się na dzień roboczy.", selector: ".rule" },
    ],
    tryIt: "Potwierdź zapoznanie.",
    basis: basis(d.objectionDays.basis),
    screen: (c) => `/cycles/${c}/assessment`,
  },
  "5b": {
    title: "Kadry widzą cały urząd",
    short: "koniec",
    lead: "Joanna widzi stan wszystkich cykli w urzędzie. System przypomina o obowiązku urzędu: Tomaszowi należy się kolejny stopień służbowy z mocy prawa.",
    look: [
      { text: "Karta stopnia Tomasza z terminem i przepisem.", selector: ".card.rule" },
      { text: "Piotr ma nowy cykl. Kryteria do 30.11.2026 (§ 7 pkt 2), ponowna ocena po 22.05.2027.", selector: ".hr-table" },
      { text: "„Drukuj / pobierz PDF” przy arkuszu." },
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
