import { getDb } from "../db";
import { criterion } from "../engine/scoring";

const ID = {
  "Orientacja na klienta/interesanta": "orientacja-na-klienta",
  "Rzetelność": "rzetelnosc",
  "Zarządzanie ludźmi": "zarzadzanie-ludzmi",
  "Komunikacja": "komunikacja",
  "Wykorzystywanie wiedzy i doskonalenie zawodowe": "wykorzystywanie-wiedzy",
  "Współpraca": "wspolpraca",
  "Podejmowanie decyzji i odpowiedzialność": "podejmowanie-decyzji",
  "Organizacja pracy i orientacja na osiąganie celów": "organizacja-pracy",
} as const;

const AUTHOR: Record<string, string> = { ewa: "marek", piotr: "marek", tomasz: "anna" };
const G = "good", N = "needs_improvement";
type Row = [date: string, who: string, criterion: keyof typeof ID, rating: "good" | "needs_improvement", taskChange: 0 | 1, text: string];

/** Dosłownie z context/foundation/demo.md, „Notatki do wgrania”. */
export const DEMO_NOTES: Row[] = [
  ["2024-12-12", "ewa", "Orientacja na klienta/interesanta", G, 0, "Interesant przyszedł z niekompletnym wnioskiem i podniesionym głosem. Ewa wypisała braki zwykłymi słowami, dokończyli wniosek przy okienku, wyszedł bez kolejnej wizyty."],
  ["2025-02-11", "piotr", "Rzetelność", N, 0, "Pismo do gminy poszło 11 lutego, a termin, który Piotr podał interesantowi, był 5 lutego. Nie uprzedził ani interesanta, ani mnie."],
  ["2025-03-12", "tomasz", "Zarządzanie ludźmi", G, 0, "Po błędzie w piśmie wydziału rozdzielił odpowiedzialność na piśmie i ustalił, kto sprawdza projekt przed wysyłką. Nie robił tego przy całym zespole."],
  ["2025-05-20", "ewa", "Rzetelność", G, 0, "Zestawienie do kontroli oddała 19 maja, termin był 20 maja. Liczby zgadzały się z rejestrem, kontrola nie odesłała zestawienia."],
  ["2025-06-03", "piotr", "Komunikacja", N, 0, "Odpowiedź na pismo gminy była tak ogólna, że gmina dopytała dwa razy. Piotr poprawił ją dopiero po drugim dopytaniu."],
  ["2025-08-04", "piotr", "Orientacja na klienta/interesanta", G, 0, "Interesant dzwonił zdenerwowany, bo nie miał numeru sprawy. Piotr znalazł wniosek, dokończył braki tego samego dnia i oddzwonił z numerem."],
  ["2025-10-07", "ewa", "Wykorzystywanie wiedzy i doskonalenie zawodowe", G, 0, "Sama znalazła nowy wzór formularza i poprawiła trzy projekty, zanim wyszły. Powiedziała o tym na odprawie, Maria poprawiła swoje dwa."],
  ["2025-11-18", "piotr", "Współpraca", N, 0, "Uzgodnienie dla koleżanki z obsługi prawnej miało być 17 listopada. 18 listopada rano go nie było, koleżanka nie wiedziała, czy ma czekać."],
  ["2025-12-02", "tomasz", "Podejmowanie decyzji i odpowiedzialność", G, 0, "Dwa wydziały przysłały sprzeczne uwagi do tego samego pisma. Tomasz wybrał wersję tego samego dnia, zapisał dlaczego i został przy niej, gdy pytanie wróciło."],
  ["2026-03-11", "piotr", "Współpraca", G, 1, "Po odejściu koleżanki 9 marca przejął jej kolejkę wniosków i spisał, co jest otwarte, a co czeka na brak. Przekazał listę mnie i Marii, bez sporu o podział."],
  ["2026-04-21", "piotr", "Organizacja pracy i orientacja na osiąganie celów", N, 0, "Od przejęcia kolejki zostaje po 18:00. W tym tygodniu trzy sprawy z wtorku, które sam oznaczył jako pilne, przeszły na czwartek."],
  ["2026-05-19", "tomasz", "Współpraca", G, 0, "Oddał naczelnikowi z drugiego wydziału swój wzór pisma do uzgodnień. Tamten wysłał pismo na tym wzorze, bez poprawek, i napisał o tym do mnie."],
  ["2026-06-18", "piotr", "Komunikacja", G, 0, "Przepisał pismo do gminy: jedno zdanie, czego brakuje, i termin. Gmina odpowiedziała raz, bez dopytywania. Warto mu to powiedzieć, nie tylko odhaczyć."],
  ["2026-08-26", "piotr", "Rzetelność", N, 0, "Trzy odpowiedzi wyszły po terminie, który sam wpisał w marcu: 12, 19 i 25 sierpnia. Żadnej nie zgłosił wcześniej; wyszło to przy przeglądzie rejestru odpowiedzi 26 sierpnia."],
  ["2026-09-03", "ewa", "Współpraca", G, 0, "Po powrocie 31 sierpnia poprosiła Marię o pół godziny, żeby odtworzyć kolejkę. Nie udawała, że pamięta sprawy sprzed lutego; spisała, co ma przejąć."],
  ["2026-11-12", "piotr", "Wykorzystywanie wiedzy i doskonalenie zawodowe", G, 0, "Po powrocie 9 listopada przeszedł zaległe szkolenie z nowego rejestru wniosków i tego samego dnia wprowadził do niego swoje otwarte sprawy. Nie czekał na przypomnienie."],
];

export function seedNotes(opts: { liveStep2?: boolean; afterStep1?: boolean } = {}): void {
  const db = getDb();
  const ins = db.prepare(
    `INSERT INTO notes (author_id, subject_id, cycle_id, criterion_id, date, text, rating, task_change, suggested_task_change, suggestion_source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'none', ?)`,
  );
  for (const [date, who, crit, rating, taskChange, text] of DEMO_NOTES) {
    if (opts.liveStep2 && date === "2026-03-11") continue;
    const id = ID[crit];
    if (!id || criterion(id).name !== crit) throw new Error(`Notatka pokazowa: kryterium „${crit}” nie zgadza się z plikiem reguł`);
    const cycle = db.query("SELECT id FROM cycles WHERE person_id = ? ORDER BY period_start DESC LIMIT 1").get(who) as { id: string } | null;
    ins.run(AUTHOR[who], who, cycle?.id ?? null, id, date, text, rating, taskChange, date);
  }
}
