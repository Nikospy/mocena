import { expect, test } from "bun:test";
import { createTestApp } from "../test-helpers";
import { runDemo } from "./run";

test("pokaz przechodzi bez błędu dwa razy z rzędu, każdy w nowej sesji", async () => {
  const { app } = createTestApp({ seedOptions: { liveStep2: true } });
  for (let run = 1; run <= 2; run++) {
    const results = await runDemo((path, init) => app.request(path, init));
    const failures = results.filter((r) => r.status !== "ok").map((r) => `krok ${r.step}: ${r.status} ${r.detail ?? r.description}`);
    expect(failures).toEqual([]);
    expect(results.map((r) => r.step)).toEqual(["1", "2", "3", "4", "5", "5a", "5b", "5c"]);
  }
});
