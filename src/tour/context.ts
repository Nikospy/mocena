// Tryb przewodnika dla bieżącego żądania: układ czyta go bez przekazywania przez każdy widok (jak withDb w db.ts).
import { AsyncLocalStorage } from "node:async_hooks";
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { isTourStopId, type TourStopId } from "./state";

export const TOUR_COOKIE = "mocena_tour";

export type TourRequest = { stop: TourStopId | null; path: string };

const store = new AsyncLocalStorage<TourRequest>();

export const tourContext: MiddlewareHandler = (c, next) => {
  const raw = getCookie(c, TOUR_COOKIE);
  const stop = isTourStopId(raw) ? raw : null;
  return store.run({ stop, path: new URL(c.req.url).pathname }, next);
};

export function currentTour(): TourRequest {
  return store.getStore() ?? { stop: null, path: "" };
}
