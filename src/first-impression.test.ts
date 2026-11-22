import { existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { createTestApp } from "./test-helpers";
import { PERSON_COOKIE } from "./people";
import index from "./index";

const { app, db } = createTestApp();
const personId = (db.query("SELECT id FROM people WHERE role = 'appraiser' LIMIT 1").get() as { id: string | number }).id;

async function html(path: string, cookie?: string) {
  const res = await app.request(path, cookie ? { headers: { cookie } } : undefined);
  return { res, body: await res.text() };
}

describe("wspólny head i klawiatura", () => {
  const pages: [string, string | undefined][] = [
    ["/", undefined],
    ["/tour", undefined],
    ["/", `${PERSON_COOKIE}=${personId}`],
  ];
  for (const [path, cookie] of pages) {
    test(`${path} ${cookie ? "z kontem" : "bez konta"}: head i pierwszy odnośnik`, async () => {
      const { res, body } = await html(path, cookie);
      expect(res.status).toBe(200);
      expect(body).toContain('lang="pl"');
      expect(body).toContain('property="og:title"');
      expect(body).toContain('property="og:image"');
      expect(body).toContain('name="description"');
      expect(body).toContain('rel="icon"');
      const bodyHtml = body.slice(body.indexOf("<body"));
      const firstLink = bodyHtml.match(/<a [^>]*>[^<]*<\/a>/)![0];
      expect(firstLink).toContain('href="#main"');
      expect(firstLink).toContain("Przejdź do treści");
      expect(body).toContain('id="main"');
    });
  }
});

describe("strony błędów", () => {
  test("404 w układzie mOceny", async () => {
    const { res, body } = await html("/nie-ma-takiej");
    expect(res.status).toBe(404);
    expect(body).toContain("Nie ma takiej strony");
    expect(body).toContain("/style.css");
    expect(body).toContain('href="/tour"');
  });

  test("500 bez stosu i angielskiego tekstu", async () => {
    const boom = new Hono();
    boom.get("/boom", () => {
      throw new Error("tajny komunikat z src/index.tsx");
    });
    boom.onError(index.errorHandler);
    const origError = console.error;
    console.error = () => {};
    const res = await boom.request("/boom");
    console.error = origError;
    const body = await res.text();
    expect(res.status).toBe(500);
    expect(body).toContain("Coś poszło nie tak");
    expect(body).toContain('action="/tour/1"');
    expect(body).not.toContain("Error");
    expect(body).not.toContain("tajny");
    expect(body).not.toMatch(/\bat |\.tsx?/);
  });
});

test("zasoby podglądu istnieją", () => {
  expect(existsSync("public/favicon.svg")).toBe(true);
  expect(existsSync("public/og.png") || existsSync("public/og.svg")).toBe(true);
  expect(existsSync("public/robots.txt")).toBe(true);
});
