import { expect, test } from "bun:test";
import { homeTasks } from "./home-tasks";
import { personById } from "./people";
import { createTestApp } from "./test-helpers";
import "./reminders";

const marek = () => homeTasks(personById("marek")!).filter((t) => t.title.startsWith("Termin oceny"));

test("przypomnienie o terminie Piotra pojawia się 30 dni przed 27.11.2026", () => {
  createTestApp({ today: "2026-10-27", seedOptions: { afterStep1: true } });
  expect(marek()).toEqual([]);
  createTestApp({ today: "2026-10-28", seedOptions: { afterStep1: true } });
  const t = marek();
  expect(t.length).toBe(1);
  expect(t[0].title).toContain("27.11.2026");
  expect(t[0].detail).toContain("ustawienie urzędu");
});
