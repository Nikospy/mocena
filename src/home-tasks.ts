import type { Person } from "./people";

/**
 * Pola `heading`, `person`, `due`, `basis`, `action` są tylko do wyglądu karty sprawy (opcjonalne).
 * `quiet`: karta informacyjna, pokazywana tylko wtedy, gdy nie ma żadnej innej sprawy.
 */
export type HomeTask = { title: string; href: string; detail?: string; heading?: string; person?: string; due?: string; basis?: string; action?: string; quiet?: boolean };
type Provider = (person: Person) => HomeTask[];

const providers: Provider[] = [];

/** Zwraca funkcję wyrejestrowującą (używają jej testy, żeby nie zostawiać dostawców w pamięci procesu). */
export function registerHomeTasks(fn: Provider): () => void {
  providers.push(fn);
  return () => {
    providers.splice(providers.indexOf(fn), 1);
  };
}

export function homeTasks(person: Person): HomeTask[] {
  const all = providers.flatMap((fn) => fn(person));
  const active = all.filter((t) => !t.quiet);
  return active.length > 0 ? active : all;
}
