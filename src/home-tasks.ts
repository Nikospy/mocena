import type { Person } from "./people";

export type HomeTask = { title: string; href: string; detail?: string };
type Provider = (person: Person) => HomeTask[];

const providers: Provider[] = [];

export function registerHomeTasks(fn: Provider): void {
  providers.push(fn);
}

export function homeTasks(person: Person): HomeTask[] {
  return providers.flatMap((fn) => fn(person));
}
