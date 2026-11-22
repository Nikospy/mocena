import type { Cycle } from "./cycles";
import type { Person } from "./people";

export type CycleLink = { label: string; href: string };
type Provider = (cycle: Cycle, person: Person) => CycleLink[];

const providers: Provider[] = [];

/** Zwraca funkcję wyrejestrowującą (używają jej testy, żeby nie zostawiać dostawców w pamięci procesu). */
export function registerCycleLinks(fn: Provider): () => void {
  providers.push(fn);
  return () => {
    providers.splice(providers.indexOf(fn), 1);
  };
}

export function cycleLinks(cycle: Cycle, person: Person): CycleLink[] {
  return providers.flatMap((fn) => fn(cycle, person));
}
