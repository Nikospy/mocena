import data from "../content/cards.json";

export type Card = {
  title: string;
  purpose: string;
  questions?: string[];
  hardSituations?: { situation: string; whatToDo: string }[];
};

export function card(id: string): Card {
  const c = (data as Record<string, Card>)[id];
  if (!c) throw new Error(`Nie ma karty „${id}”`);
  return c;
}
