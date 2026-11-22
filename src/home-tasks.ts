import type { Person } from "./people";

/**
 * Pola `heading`, `person`, `due`, `basis`, `action` są tylko do wyglądu karty sprawy (opcjonalne).
 * `quiet`: karta informacyjna, pokazywana tylko wtedy, gdy nie ma żadnej innej sprawy.
 * `standing`: stała możliwość (np. wniosek o zmianę terminu), widoczna zawsze w osobnej sekcji pod sprawami.
 */
export type HomeTask = {
  title: string;
  href: string;
  detail?: string;
  heading?: string;
  person?: string;
  due?: string;
  basis?: string;
  action?: string;
  quiet?: boolean;
  standing?: boolean;
  /** Drugi przycisk karty: odnośnik. */
  secondary?: { label: string; href: string };
  /** Przycisk karty wysyłający POST (bez treści). */
  post?: { label: string; action: string };
};
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
  const all = providers.flatMap((fn) => fn(person)).filter((t) => !t.standing);
  const active = all.filter((t) => !t.quiet);
  return active.length > 0 ? active : all;
}

/** Stałe możliwości osoby: pokazywane zawsze, niezależnie od innych spraw. */
export function homeOptions(person: Person): HomeTask[] {
  return providers.flatMap((fn) => fn(person)).filter((t) => t.standing);
}
