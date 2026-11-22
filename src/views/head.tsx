export const SITE_DESCRIPTION =
  "Asystent ocen okresowych w służbie cywilnej. Nie pisze oceny: zbiera fakty przez dwa lata i pilnuje terminów z przepisów. Prototyp na HackNation 2026.";
export const SITE_TITLE = "mOcena: ten asystent nie pisze oceny";

/** Wspólna zawartość <head>: podstawy, podgląd linku, ikona i arkusze stylów. */
export function Head(props: { title: string; printCss?: boolean }) {
  return (
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{props.title} · mOcena</title>
      <meta name="description" content={SITE_DESCRIPTION} />
      <meta name="theme-color" content="#f0f5fa" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="pl_PL" />
      <meta property="og:site_name" content="mOcena" />
      <meta property="og:title" content={SITE_TITLE} />
      <meta property="og:description" content={SITE_DESCRIPTION} />
      <meta property="og:image" content="/og.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SITE_TITLE} />
      <meta name="twitter:description" content={SITE_DESCRIPTION} />
      <meta name="twitter:image" content="/og.png" />
      <link rel="stylesheet" href="/rodzina.css" />
      <link rel="stylesheet" href="/style.css" />
      {props.printCss ? <link rel="stylesheet" href="/print.css" media="print" /> : null}
    </head>
  );
}
