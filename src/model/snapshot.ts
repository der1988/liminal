import {
  CONFIG,
  type Soul,
  type Relationship,
  type LifeEvent,
  type Encounter,
  type Sediment,
  type BirthRequest,
} from "./types";
import { World } from "./world";
import { closeKin } from "./genealogy";
export interface WorldState {
  tick: number;
  rng: number;
  nextSoul: number;
  nextEvent: number;
  nextRelation: number;
  nextRequest: number;
  souls: Soul[];
  relationships: Relationship[];
  events: LifeEvent[];
  encounters: [string, Encounter][];
  sediments: Sediment[];
  pending: BirthRequest[];
  lastNamedBirth: { id: string; year: number } | null;
}
export function snapshot(w: World): WorldState {
  return structuredClone({
    tick: w.tick,
    rng: w.rng.state,
    nextSoul: w.nextSoul,
    nextEvent: w.nextEvent,
    nextRelation: w.nextRelation,
    nextRequest: w.nextRequest,
    souls: [...w.souls.values()],
    relationships: w.relationships,
    events: w.events,
    encounters: [...w.encounters],
    sediments: w.sediments,
    pending: w.pending,
    lastNamedBirth: w.lastNamedBirth,
  });
}
const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
const assert = (v: unknown, message: string) => {
  if (!v) throw new Error("Salvataggio non valido: " + message);
};
export function validate(data: unknown): asserts data is WorldState {
  assert(data && typeof data === "object", "formato");
  const d = data as WorldState;
  assert(Number.isSafeInteger(d.tick) && d.tick >= 0, "tempo");
  assert(Number.isInteger(d.rng) && d.rng >= 0 && d.rng <= 0xffffffff, "seed");
  for (const key of [
    "nextSoul",
    "nextEvent",
    "nextRelation",
    "nextRequest",
  ] as const)
    assert(Number.isSafeInteger(d[key]) && d[key] > 0, "identificativi");
  assert(
    Array.isArray(d.souls) &&
      d.souls.length <= 50000 &&
      Array.isArray(d.relationships) &&
      Array.isArray(d.events) &&
      Array.isArray(d.encounters) &&
      Array.isArray(d.sediments) &&
      Array.isArray(d.pending),
    "elenchi",
  );
  const souls = new Map<string, Soul>(),
    year = d.tick / 675;
  for (const s of d.souls) {
    assert(
      s && typeof s.id === "string" && /^s\d+$/.test(s.id) && !souls.has(s.id),
      "ID anima",
    );
    assert(
      typeof s.name === "string" &&
        s.name.trim().length > 0 &&
        s.name.length <= 40,
      "nome",
    );
    assert(
      finite(s.birthYear) &&
        s.birthYear <= year &&
        finite(s.lifespan) &&
        s.lifespan > 0,
      "nascita",
    );
    assert(
      s.deathYear === null ||
        (finite(s.deathYear) &&
          s.deathYear >= s.birthYear &&
          s.deathYear <= year),
      "morte",
    );
    assert(typeof s.named === "boolean", "nome affidato");
    assert(
      Array.isArray(s.traits) &&
        s.traits.length === 6 &&
        s.traits.every((v) => finite(v) && v >= 0 && v <= 100),
      "caratteristiche",
    );
    assert(
      s.preferences &&
        s.preferences.weights.length === 6 &&
        s.preferences.ideals.length === 6,
      "preferenze",
    );
    assert(
      s.preferences.weights.every((v) => finite(v) && v >= 0 && v <= 1) &&
        Math.abs(s.preferences.weights.reduce((a, b) => a + b) - 1) < 1e-6 &&
        s.preferences.ideals.every((v) => finite(v) && v >= 0 && v <= 100),
      "pesi",
    );
    for (const value of [
      s.x,
      s.y,
      s.px,
      s.py,
      s.vx,
      s.vy,
      s.phase,
      s.heading,
      s.stateUntil,
      s.nextDecision,
      s.lastChildYear,
    ])
      assert(finite(value), "movimento");
    assert(
      s.x >= 0 && s.x <= CONFIG.width && s.y >= 0 && s.y <= CONFIG.height,
      "confini",
    );
    assert(
      [
        "exploration",
        "curiosity",
        "encounter",
        "accompaniment",
        "departure",
      ].includes(s.state),
      "stato",
    );
    assert(
      Array.isArray(s.parents) &&
        (s.parents.length === 0 || s.parents.length === 2) &&
        new Set(s.parents).size === s.parents.length,
      "genitori",
    );
    assert(
      s.memories && typeof s.memories === "object" && Array.isArray(s.events),
      "memorie",
    );
    souls.set(s.id, s);
  }
  assert(
    d.souls.filter((s) => s.deathYear === null).length <= CONFIG.maxLiving,
    "popolazione",
  );
  for (const s of d.souls) {
    for (const id of s.parents) {
      const p = souls.get(id);
      assert(p && p.birthYear + 20 <= s.birthYear && id !== s.id, "genealogia");
    }
    assert(s.target === null || souls.has(s.target), "destinazione");
    for (const m of Object.values(s.memories))
      assert(
        m &&
          souls.has(m.person) &&
          finite(m.strength) &&
          m.strength >= 0 &&
          m.strength <= 1 &&
          finite(m.sharedYears) &&
          finite(m.lastYear),
        "ricordo",
      );
  }
  const ids = new Set<string>(),
    partners = new Set<string>(),
    active = new Set<string>();
  for (const r of d.relationships) {
    assert(
      r &&
        typeof r.id === "string" &&
        !ids.has(r.id) &&
        souls.has(r.a) &&
        souls.has(r.b) &&
        r.a !== r.b,
      "rapporto",
    );
    ids.add(r.id);
    assert(
      ["love", "friendship", "family"].includes(r.type) &&
        finite(r.start) &&
        r.start <= year &&
        (r.end === null ||
          (finite(r.end) && r.end >= r.start && r.end <= year)),
      "durata rapporto",
    );
    for (const value of [r.intensity, r.familiarity])
      assert(finite(value) && value >= 0 && value <= 1, "intensità");
    for (const value of [r.meetings, r.sharedYears, r.lastMeeting])
      assert(finite(value), "incontri");
    if (r.type === "love")
      assert(
        r.start - souls.get(r.a)!.birthYear >= 20 &&
          r.start - souls.get(r.b)!.birthYear >= 20 &&
          !closeKin(souls.get(r.a)!, souls.get(r.b)!, souls),
        "coppia incompatibile",
      );
    if (r.type === "family") {
      assert(r.end === null, "famiglia permanente");
      assert(
        souls.get(r.a)!.parents.some((id) => id === r.b) ||
          souls.get(r.b)!.parents.some((id) => id === r.a),
        "parentela",
      );
    }
    if (r.end === null) {
      const key = [r.a, r.b].sort().join("|") + "|" + r.type;
      assert(!active.has(key), "duplicato");
      active.add(key);
      if (r.type === "love") {
        assert(!partners.has(r.a) && !partners.has(r.b), "coppia multipla");
        partners.add(r.a);
        partners.add(r.b);
        assert(
          souls.get(r.a)!.deathYear === null &&
            souls.get(r.b)!.deathYear === null,
          "coppia scomparsa",
        );
      }
    }
  }
  for (const s of d.souls)
    for (const p of s.parents)
      assert(
        d.relationships.some(
          (r) =>
            r.type === "family" &&
            ((r.a === s.id && r.b === p) || (r.b === s.id && r.a === p)),
        ),
        "legame genealogico mancante",
      );
  const events = new Set<string>();
  for (const e of d.events) {
    assert(
      e &&
        typeof e.id === "string" &&
        !events.has(e.id) &&
        [
          "birth",
          "friendship",
          "love",
          "separation",
          "friendshipEnd",
          "child",
          "loss",
          "death",
        ].includes(e.kind) &&
        finite(e.year) &&
        e.year <= year &&
        Array.isArray(e.people) &&
        e.people.length > 0 &&
        e.people.every((id) => souls.has(id)),
      "evento",
    );
    events.add(e.id);
  }
  for (const s of d.souls)
    assert(
      s.events.every((id) => events.has(id)),
      "biografia",
    );
  assert(
    d.sediments.length <= CONFIG.sedimentLimit &&
      d.sediments.every(
        (s) =>
          finite(s.x) && finite(s.y) && finite(s.strength) && finite(s.year),
      ),
    "sedimenti",
  );
  assert(
    d.pending.length <= 6 &&
      d.pending.every(
        (r) =>
          Number.isInteger(r.id) &&
          typeof r.name === "string" &&
          r.name.length > 0 &&
          r.name.length <= 40 &&
          finite(r.requested),
      ),
    "richieste",
  );
  for (const entry of d.encounters) {
    assert(Array.isArray(entry) && entry.length === 2, "incontro");
    const e = entry[1];
    assert(
      souls.has(e.a) &&
        souls.has(e.b) &&
        [e.familiarity, e.meetings, e.duration, e.lastSeen, e.lastVisit].every(
          finite,
        ),
      "incontro",
    );
  }
  if (d.lastNamedBirth)
    assert(
      souls.get(d.lastNamedBirth.id)?.named && finite(d.lastNamedBirth.year),
      "ultimo nome",
    );
  assert(
    d.nextSoul >
      d.souls.reduce((m, s) => Math.max(m, Number(s.id.slice(1))), 0),
    "contatore anime",
  );
  assert(
    d.nextRelation >
      d.relationships.reduce((m, r) => Math.max(m, Number(r.id.slice(1))), 0),
    "contatore rapporti",
  );
  assert(
    d.nextEvent >
      d.events.reduce((m, e) => Math.max(m, Number(e.id.slice(1))), 0),
    "contatore eventi",
  );
}
export function restore(data: unknown) {
  validate(data);
  const d = structuredClone(data),
    w = new World(0, 0);
  w.tick = d.tick;
  w.rng.state = d.rng;
  for (const key of [
    "nextSoul",
    "nextEvent",
    "nextRelation",
    "nextRequest",
  ] as const)
    w[key] = d[key];
  for (const s of d.souls) w.souls.set(s.id, s);
  w.living = d.souls.filter((s) => s.deathYear === null);
  w.relationships = d.relationships;
  w.events = d.events;
  w.encounters = new Map(d.encounters);
  w.sediments = d.sediments;
  w.pending = d.pending;
  w.lastNamedBirth = d.lastNamedBirth;
  for (const s of d.souls) {
    w.indexChild(s);
    if (s.deathYear !== null && w.year - s.deathYear < 0.25)
      w.fading.push(s.id);
  }
  for (const r of w.relationships)
    for (const id of [r.a, r.b]) {
      const list = w.relationIndex.get(id) ?? [];
      list.push(r);
      w.relationIndex.set(id, list);
    }
  w.spatial.rebuild(w.living);
  return w;
}
