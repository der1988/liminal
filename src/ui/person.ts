import type { World } from "../model/world";
import { ageOf, TRAIT_NAMES, type Soul, type LifeEvent } from "../model/types";
import { RELATION_COLORS, RELATION_LABELS } from "../model/social";
import { echoesFor } from "../model/memory";
import { radar } from "./radar";
function button(text: string, action: () => void) {
  const b = document.createElement("button");
  b.textContent = text;
  b.onclick = action;
  return b;
}
function details(title: string, open = false) {
  const d = document.createElement("details"),
    s = document.createElement("summary");
  s.textContent = title;
  d.append(s);
  d.open = open;
  return d;
}
export function renderPerson(
  container: HTMLElement,
  w: World,
  s: Soul,
  navigate: (id: string) => void,
) {
  const open = Array.from(container.querySelectorAll("details")).map(
    (d) => [d.querySelector("summary")!.textContent, d.open] as const,
  );
  container.replaceChildren(radar(s.traits));
  const traits = details(
    "Caratteristiche",
    open.find((v) => v[0] === "Caratteristiche")?.[1],
  );
  const dl = document.createElement("dl");
  s.traits.forEach((v, i) => {
    const name = document.createElement("dt"),
      value = document.createElement("dd");
    name.textContent = TRAIT_NAMES[i];
    value.textContent = String(Math.round(v));
    dl.append(name, value);
  });
  traits.append(dl);
  container.append(traits);
  const relations = document.createElement("section");
  relations.className = "relations";
  const list = w.relationships.filter(
    (r) =>
      (r.a === s.id || r.b === s.id) &&
      (r.end === null || s.deathYear !== null),
  );
  const caption = document.createElement("h3");
  caption.textContent = "Legami";
  relations.append(caption);
  for (const r of list) {
    const other = w.souls.get(r.a === s.id ? r.b : r.a)!;
    const row = document.createElement("div");
    row.className = "relation";
    const dot = document.createElement("i");
    dot.style.background = RELATION_COLORS[r.type];
    const person = button(other.name, () => navigate(other.id));
    const label = document.createElement("small");
    label.textContent =
      RELATION_LABELS[r.type] +
      (other.deathYear !== null
        ? " · assente"
        : r.end !== null
          ? " · concluso"
          : "");
    row.append(dot, person, label);
    relations.append(row);
  }
  if (!list.length) {
    const none = document.createElement("p");
    none.className = "muted";
    none.textContent = "Nessun legame attuale.";
    relations.append(none);
  }
  container.append(relations);
  const echoes = echoesFor(w, s.id).filter(
    (m) => !list.some((r) => r.a === m.person || r.b === m.person),
  );
  if (echoes.length) {
    const d = details("Ricordi", open.find((v) => v[0] === "Ricordi")?.[1]);
    for (const m of echoes) {
      const p = w.souls.get(m.person)!;
      const row = document.createElement("div");
      row.className = "memory";
      row.append(button(p.name, () => navigate(p.id)));
      const strength = document.createElement("small");
      strength.textContent = "eco " + Math.round(m.strength * 100) + "%";
      row.append(strength);
      d.append(row);
    }
    container.append(d);
  }
  const history = details("Storia", open.find((v) => v[0] === "Storia")?.[1]);
  const eventIndex = new Map(w.events.map((e) => [e.id, e]));
  const events = s.events
    .map((id) => eventIndex.get(id)!)
    .filter((e) => e && !(e.kind === "child" && e.people[2] === s.id))
    .sort(
      (a, b) =>
        a.year - b.year || Number(a.id.slice(1)) - Number(b.id.slice(1)),
    );
  const labels: Record<LifeEvent["kind"], string> = {
    birth: "Nascita",
    friendship: "Una nuova amicizia",
    love: "Inizio di un amore",
    separation: "Fine di un amore",
    friendshipEnd: "Un’amicizia si allontana",
    child: "Nascita di un figlio",
    loss: "Perdita",
    death: "Scomparsa",
  };
  for (const e of events) {
    const row = document.createElement("div");
    row.className = "biography";
    const date = document.createElement("time");
    date.textContent = "anno " + e.year.toFixed(1);
    const text = document.createElement("p");
    text.textContent =
      e.kind === "loss" && e.people[1] === s.id
        ? "Un ricordo lasciato in"
        : labels[e.kind];
    row.append(date, text);
    for (const id of e.people.filter((id) => id !== s.id)) {
      const person = w.souls.get(id)!;
      row.append(button(person.name, () => navigate(id)));
    }
    history.append(row);
  }
  container.append(history);
}
