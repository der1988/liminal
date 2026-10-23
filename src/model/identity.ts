import { Random } from "./random";
import { CONFIG, type Soul, type Traits, type Preferences } from "./types";
import { clamp } from "../simulation/math";
const names = [
  "Ada",
  "Elia",
  "Nora",
  "Ivo",
  "Lia",
  "Amir",
  "Mira",
  "Noè",
  "Lea",
  "Dario",
  "Ari",
  "Milo",
  "Alma",
  "Iris",
  "Teo",
  "Zeno",
  "Gaia",
  "Nina",
  "Remo",
  "Eva",
  "Luca",
  "Dina",
  "Yara",
  "Enea",
  "Olga",
  "Samir",
  "Luce",
  "Ines",
  "Vera",
  "Mina",
  "Eli",
  "Ciro",
  "Anna",
  "Nadir",
  "Sofia",
  "Ruben",
  "Adele",
  "Loris",
  "Sara",
  "Nico",
];
export function randomTraits(rng: Random): Traits {
  return Array.from({ length: 6 }, () =>
    Math.round(rng.between(10, 90)),
  ) as Traits;
}
export function preferences(rng: Random): Preferences {
  const w = Array.from({ length: 6 }, () => rng.between(0.2, 1)),
    sum = w.reduce((a, b) => a + b);
  return {
    weights: w.map((v) => v / sum) as Traits,
    ideals: randomTraits(rng),
  };
}
export function makeSoul(
  id: string,
  rng: Random,
  year: number,
  initialAge = 0,
): Soul {
  const traits = randomTraits(rng),
    angle = rng.between(0, Math.PI * 2),
    x = rng.between(90, CONFIG.width - 90),
    y = rng.between(90, CONFIG.height - 90);
  return {
    id,
    name: rng.pick(names),
    birthYear: year - initialAge,
    deathYear: null,
    lifespan: Math.max(
      initialAge + rng.between(0.5, 5),
      clamp(
        CONFIG.lifeMean + rng.normal() * CONFIG.lifeSpread,
        CONFIG.lifeMin,
        CONFIG.lifeMax,
      ),
    ),
    named: false,
    parents: [],
    traits,
    preferences: preferences(rng),
    x,
    y,
    px: x,
    py: y,
    vx: Math.cos(angle) * 5,
    vy: Math.sin(angle) * 5,
    phase: rng.between(0, 100),
    heading: angle,
    state: "exploration",
    target: null,
    stateUntil: 0,
    nextDecision: rng.between(0, 5),
    lastChildYear: -1000,
    memories: {},
    events: [],
  };
}
