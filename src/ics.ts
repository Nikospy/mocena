// Plik kalendarza iCalendar (RFC 5545) bez bibliotek. Godzina w strefie Europe/Warsaw.

const enc = new TextEncoder();

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
}

/** Zawija linię do 75 oktetów (bez rozcinania znaków wielobajtowych); kontynuacja zaczyna się spacją. */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let cur = "";
  let size = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > limit) {
      parts.push(cur);
      cur = "";
      size = 1;
      limit = 75;
    }
    cur += ch;
    size += n;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

const stamp = (iso: string, hhmm: string) => `${iso.replaceAll("-", "")}T${hhmm.replace(":", "")}00`;

/** Koniec 60 minut po początku; może przejść na następny dzień. */
function plusHour(date: string, time: string): string {
  const t = new Date(`${date}T${time}:00Z`);
  t.setUTCMinutes(t.getUTCMinutes() + 60);
  const iso = t.toISOString();
  return stamp(iso.slice(0, 10), iso.slice(11, 16));
}

export type IcsEvent = { uid: string; summary: string; description: string; location: string; date: string; time: string; stampDate: string };

export function buildIcs(e: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mOcena//zaproszenie//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Warsaw",
    "BEGIN:STANDARD",
    "DTSTART:19701025T030000",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "DTSTART:19700329T020000",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${stamp(e.stampDate, "00:00")}Z`,
    `DTSTART;TZID=Europe/Warsaw:${stamp(e.date, e.time)}`,
    `DTEND;TZID=Europe/Warsaw:${plusHour(e.date, e.time)}`,
    `SUMMARY:${escapeText(e.summary)}`,
    `DESCRIPTION:${escapeText(e.description)}`,
    `LOCATION:${escapeText(e.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
