import { expect, test } from "bun:test";
import { handle } from "./vercel";

const base = "https://mocena.test";

test("first visit gets its own seeded demo session and keeps it", async () => {
  const first = await handle(new Request(base + "/account"));
  expect(first.status).toBe(200);
  const cookie = first.headers.get("set-cookie")!.split(";")[0];
  expect(cookie).toMatch(/^mocena_demo=/);
  expect(await first.text()).toContain("Marek");

  const again = await handle(new Request(base + "/about", { headers: { Cookie: cookie } }));
  expect(again.status).toBe(200);
  expect(again.headers.get("set-cookie")).toBeNull();
});

test("restart hands out a new session", async () => {
  const res = await handle(new Request(base + "/demo/restart", { method: "POST", headers: { Cookie: "mocena_demo=abc" } }));
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("/account");
  expect(res.headers.get("set-cookie")).not.toContain("mocena_demo=abc");
});
