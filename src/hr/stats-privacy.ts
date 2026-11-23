/**
 * Ochrona statystyk dla kierownictwa przed odczytaniem wyniku pojedynczej osoby.
 * Grupy liczące mniej niż `min` różnych osób są ukrywane jako `null` („za mało danych”).
 * Gdy w podziale ukryta byłaby dokładnie jedna niepusta grupa, ukrywamy także najmniejszą
 * z pozostałych niepustych grup (wtórne ukrywanie), żeby wartości nie dało się odjąć od sumy.
 */

export const TOO_FEW_LABEL = "za mało danych";

/** Grupa przed ochroną: `count` to liczba spraw/ocen, `people` to liczba różnych osób za nimi. */
export type PrivacyGroup<T = number> = {
  key: string;
  label: string;
  count: number;
  people: number;
  value: T;
};

/** Grupa po zastosowaniu progu prywatności; `value` i `count` są `null`, gdy grupa została ukryta. */
export type ProtectedGroup<T = number> = {
  key: string;
  label: string;
  count: number | null;
  value: T | null;
  hidden: boolean;
};

/** Zwraca true, gdy liczba różnych osób w niepustej grupie jest poniżej progu minimalnej grupy. */
export function hideSmall(people: number, min: number): boolean {
  return people > 0 && people < min;
}

/** Pojedyncza wartość zbiorcza: ukryta (`null`), gdy stoi za nią mniej różnych osób niż próg. */
export function protectOne<T>(people: number, value: T, min: number): T | null {
  return hideSmall(people, min) ? null : value;
}

/**
 * Chroni podział na grupy przez ukrycie grup poniżej progu `min` oraz wtórne ukrywanie
 * najmniejszych z pozostałych niepustych grup tak długo, aż ukryte są co najmniej 2 grupy
 * i łączna liczba ukrytych osób (oraz spraw) wynosi co najmniej `min` (albo nic nie jest ukryte).
 * Zapobiega to wyliczeniu małej liczebności przez odjęcie od sumy ogólnej (także znanej z innej tabeli).
 */
export function protectGroups<T>(groups: readonly PrivacyGroup<T>[], min: number): ProtectedGroup<T>[] {
  const hidden = new Set(groups.filter((g) => hideSmall(g.people, min)).map((g) => g.key));
  const byKey = new Map(groups.map((g) => [g.key, g]));

  const hiddenTotals = () => {
    let people = 0;
    let count = 0;
    for (const key of hidden) {
      const g = byKey.get(key);
      if (!g) continue;
      people += g.people;
      count += g.count;
    }
    return { people, count };
  };

  while (hidden.size > 0) {
    const totals = hiddenTotals();
    if (hidden.size >= 2 && totals.people >= min && totals.count >= min) break;
    const smallest = groups
      .filter((g) => g.count > 0 && !hidden.has(g.key))
      .sort((a, b) => a.people - b.people || a.count - b.count || a.key.localeCompare(b.key))[0];
    if (!smallest) break;
    hidden.add(smallest.key);
  }

  return groups.map(({ key, label, count, value }) =>
    hidden.has(key)
      ? { key, label, count: null, value: null, hidden: true }
      : { key, label, count, value, hidden: false },
  );
}
