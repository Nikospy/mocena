import type { Person } from "./people";

/** Pola `heading`, `person`, `due`, `basis`, `action` są tylko do wyglądu karty sprawy (opcjonalne). */
export type HomeTask = { title: string; href: string; detail?: string; heading?: string; person?: string; due?: string; basis?: string; action?: string };
type Provider = (person: Person) => HomeTask[];

const providers: Provider[] = [];

export function registerHomeTasks(fn: Provider): void {
  providers.push(fn);
}

export function homeTasks(person: Person): HomeTask[] {
  return providers.flatMap((fn) => fn(person));
}
