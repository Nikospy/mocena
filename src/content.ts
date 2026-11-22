import data from "../content/cards.json";

/** Nazwa licencji kodu. Wartość tymczasowa: autor ustala licencję przed oddaniem; zmiana tylko tutaj. */
export const CODE_LICENSE = "do ustalenia przez autora";

export type Card = {
  title: string;
  purpose: string;
  questions?: string[];
  hardSituations?: { situation: string; whatToDo: string }[];
  legal?: { text: string; basis: string };
  texts?: Record<string, string>;
};

export function card(id: string): Card {
  const c = (data as Record<string, Card>)[id];
  if (!c) throw new Error(`Nie ma karty „${id}”`);
  return c;
}
