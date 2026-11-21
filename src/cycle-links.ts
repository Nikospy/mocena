import type { Cycle } from "./cycles";
import type { Person } from "./people";

export type CycleLink = { label: string; href: string };
type Provider = (cycle: Cycle, person: Person) => CycleLink[];

const providers: Provider[] = [];

export function registerCycleLinks(fn: Provider): void {
  providers.push(fn);
}

export function cycleLinks(cycle: Cycle, person: Person): CycleLink[] {
  return providers.flatMap((fn) => fn(cycle, person));
}
