import { Hono } from "hono";
import data from "../../content/suggestion-sources.json";
import { registerHomeTasks } from "../home-tasks";
import { currentPerson } from "../people";
import { today } from "../settings";
import { suggestionMode } from "../suggestions";
import { SuggestionSourcesView } from "../views/suggestion-sources";

registerHomeTasks((person) => (person.role === "admin" ? [{ title: "Skąd biorą się podpowiedzi", href: "/admin/suggestion-sources" }] : []));

const app = new Hono();

app.get("/admin/suggestion-sources", (c) => {
  const viewer = currentPerson(c);
  if (!viewer) return c.redirect("/account");
  if (viewer.role !== "admin") return c.text("Brak uprawnień.", 403);
  return c.html(<SuggestionSourcesView viewer={viewer} today={today()} data={data} modeLabel={data.modes[suggestionMode()]} />);
});

export default app;
