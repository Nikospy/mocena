import type { Child } from "hono/jsx";
import { verdictText } from "../assessment/verdict";
import { computeAssessment, criterion, partialLevelName } from "../engine/scoring";
import { STOPS, personLabel } from "../tour/stops";
import { LegalBasis } from "./components";
import { Head } from "./head";
import { formatDateLong } from "./layout";

const PLAY = <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z" /></svg>;

/** Wspólna powłoka wejścia i ekranu końcowego: bez paska „Pokaz” i bez karty kroku. */
export function TourShell(props: { title: string; children?: Child }) {
  return (
    <html lang="pl">
      <Head title={props.title} />
      <body>
        <a class="skip-link" href="#main">Przejdź do treści</a>
        <header class="top">
          <div class="top-in">
            <a class="brand" href="/tour">
              <span class="brand-mark">
                <b>m</b>Ocena
              </span>
              <span class="brand-desc">Asystent ocen okresowych w służbie cywilnej</span>
            </a>
            <p class="who">Pokaz dla jury</p>
          </div>
        </header>
        <main class="e-wrap" id="main">{props.children}</main>
        <footer class="foot">
          <div class="foot-in">
            <a href="/about">Wdrożenie i dane</a>
            <a href="https://github.com/Nikospy/mocena">Kod źródłowy</a>
          </div>
        </footer>
      </body>
    </html>
  );
}

// Pięć chwil na osi: przystanki 1, 2, 3, 4, 5 (pozycje z makiety v3-entry.html, procent szerokości dwóch lat).
const AXIS = [1.643835616438356, 64.24657534246575, 88, 93, 98];
const MOB_GAPS: Record<number, string> = { 2: "15 miesięcy notatek", 3: "8 miesięcy notatek" };

// Miniatura wyniku z kroku 4: szkic Marka (5 przy sześciu kryteriach) i jedna „1” przy Rzetelności.
// Wynik, średnia i przepis liczy silnik z tych samych reguł co ekran oceny, więc miniatura nie rozjedzie się z produktem.
const PEEK_SCORES: [string, number][] = [
  ["wykorzystywanie-wiedzy", 5],
  ["rzetelnosc", 1],
  ["organizacja-pracy", 5],
  ["wspolpraca", 5],
  ["komunikacja", 5],
  ["orientacja-na-klienta", 5],
  ["myslenie-analityczne", 5],
];

/** Statyczny podgląd karty wyniku obok wejścia: w 5 sekund widać, że jedna „1” przesądza mimo średniej. */
function ResultPeek() {
  const r = computeAssessment(Object.fromEntries(PEEK_SCORES));
  const { verdict } = verdictText(r);
  const ones = PEEK_SCORES.filter(([, v]) => v === 1).map(([id]) => criterion(id).name);
  const basis = /\((§[^)]*)\)/.exec(r.reasons[0] ?? "")?.[1] ?? "";
  return (
    <figure class="e-peek">
      <figcaption class="e-peek-cap">
        Krok 4 · tak wygląda wynik po jednej „1”
      </figcaption>
      <div class={`rule res e-peek-card ${r.outcome === "negative" ? "neg" : "pos"}`}>
        <p class="voice rule-v">
          <span class="pg" aria-hidden="true">§</span>
          <span><b>Wynik oceny</b> · wyliczony z przepisu</span>
        </p>
        <div class="e-peek-scores">
          <p class="e-peek-l">Oceny cząstkowe przy {PEEK_SCORES.length} kryteriach</p>
          <ul>
            {PEEK_SCORES.map(([id, v]) => (
              <li class={v === 1 ? "low" : undefined}>
                <span class="vh">{criterion(id).name}: </span>
                {v}
              </li>
            ))}
          </ul>
        </div>
        <div class="verdict-box">
          <p class="verdict">
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z" /><path d="M12 10v4.5M12 17.5h.01" /></svg>
            <span>{verdict}</span>
          </p>
          <ul class="reason">
            {ones.map((name) => (
              <li>
                {name}: 1, {partialLevelName(1)} {basis ? <LegalBasis basis={basis} /> : null}
              </li>
            ))}
          </ul>
        </div>
        <p class="avg-line">
          <b>Średnia {r.mean.toFixed(2).replace(".", ",")}</b> – nie zmienia wyniku
        </p>
      </div>
    </figure>
  );
}

export function TourEntry() {
  const moments = STOPS.filter((s) => ["1", "2", "3", "4", "5"].includes(s.id));
  return (
    <TourShell title="Prowadzi ocenę okresową od pierwszej notatki do arkusza">
      <div class="e-top">
      <div class="e-head">
        <p class="e-ctx">5 kroków · 3 min · bez modelu językowego</p>
        <h1 class="e-h1">Ten asystent prowadzi ocenę od pierwszej notatki do arkusza.</h1>
        <p class="e-lead">
          Przełożony ocenia dwa lata pracy, a pamięta ostatnie tygodnie. Asystent zbiera fakty, kiedy się dzieją, i pilnuje każdego terminu z przepisu. Oceny cząstkowe stawia oceniający – asystent nie pisze ani zdania oceny.
        </p>
        <div class="e-cta">
          <form method="post" action="/tour/1">
            <button class="btn primary" type="submit">{PLAY}Rozpocznij pokaz</button>
          </form>
          <a href="/account">Wybierz konto i klikaj samodzielnie</a>
        </div>
        <p class="e-note">Pokaz idzie po ocenie Piotra Wójcika. Każdy krok sam przełącza konto i datę.</p>
      </div>
      <ResultPeek />
      </div>
      <section class="card axis-card" aria-labelledby="h-ax">
        <h2 id="h-ax">Dwa lata Piotra w pięciu chwilach</h2>
        <p class="sub">Sama ocena to ostatni tydzień. Asystent pracuje przez cały cykl, od poprzedniej oceny 27 listopada 2024 do terminu oceny.</p>
        <div class="ax2">
          <span class="memo-l">Ostatnie tygodnie (powiększone) – tyle pamięta przełożony</span>
          <span class="memo"></span>
          <span class="line"></span>
          <span class="tick" style="inset-inline-start:0">XI 2024</span>
          <span class="tick" style="inset-inline-start:25.47945205479452%">2025</span>
          <span class="tick" style="inset-inline-start:62.87671232876713%">2026</span>
          <span class="tick end" style="inset-inline-start:100%">XI 2026</span>
          {moments.map((s, i) => (
            <span class="stop" style={`inset-inline-start:${AXIS[i]}%`}>
              <button class="t-dot" type="submit" form={`tour-stop-${s.id}`} aria-label={`Krok ${s.step}: ${s.title}`}>
                {s.step}
              </button>
            </span>
          ))}
        </div>
        <ol class="labs">
          {moments.map((s) => (
            <li>
              <form method="post" action={`/tour/${s.id}`} id={`tour-stop-${s.id}`} class="lab-card">
                <button class="lab-btn" type="submit">
                  <span class="n">{s.step}</span>
                  <span class="d">{formatDateLong(s.date)}</span>
                  <b>{s.title}</b>
                  <small>{personLabel(s.personId)}</small>
                  {s.basis ? (
                    <span class="basis mini">
                      <span class="art">{s.basis.art}</span>
                      <span class="ver">{s.basis.ver}</span>
                    </span>
                  ) : null}
                </button>
              </form>
            </li>
          ))}
        </ol>
        <ol class="e-mob">
          {moments.map((s) => (
            <>
              {MOB_GAPS[s.step] ? <li class="gap">{MOB_GAPS[s.step]}</li> : null}
              {s.step === 3 ? <li class="memo">Ostatnie tygodnie (powiększone) – tyle pamięta przełożony</li> : null}
              <li>
                <button class="t-dot" type="submit" form={`tour-stop-${s.id}`} aria-label={`Krok ${s.step}: ${s.title}`}>
                  {s.step}
                </button>
                <span>
                  <b>{s.title}</b>
                  <small>
                    {formatDateLong(s.date)} · {personLabel(s.personId)}
                  </small>
                </span>
              </li>
            </>
          ))}
        </ol>
      </section>
      <p class="e-foot">Działa na regułach, bez modelu językowego. Osoby i zdarzenia są fikcyjne.</p>
    </TourShell>
  );
}
