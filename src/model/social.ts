import type { World } from "./world";
import { attraction, continuityLoss } from "./affinity";
import { canLove } from "./genealogy";
import { ageOf, type Soul } from "./types";
import { encounterScale } from "./parameters";
export const RELATION_COLORS = {
  friendship: "#8BAED0",
  love: "#D59AA5",
  family: "#C4B28E",
};
export const RELATION_LABELS = {
  friendship: "Amicizia",
  love: "Amore",
  family: "Famiglia",
};
export function mutualLove(w: World, a: Soul, b: Soul, familiarity: number) {
  return (
    canLove(w, a, b) &&
    attraction(a, b, familiarity) > 0.53 &&
    attraction(b, a, familiarity) > 0.53
  );
}
export function social(w: World) {
  for (const a of w.living)
    for (const b of w.spatial.near(a, 44 * encounterScale(w.living.length))) {
      if (a.id >= b.id) continue;
      const key = a.id + "|" + b.id;
      const known = w
        .relationsOf(a.id)
        .find((r) => r.a === b.id || r.b === b.id);
      let e = w.encounters.get(key);
      if (!e) {
        e = {
          a: a.id,
          b: b.id,
          familiarity: known?.familiarity ?? 0,
          meetings: known?.meetings ?? 0,
          duration: (known?.sharedYears ?? 0) * 22.5,
          lastSeen: -100,
          lastVisit: -100,
        };
        w.encounters.set(key, e);
      }
      if (w.seconds - e.lastSeen > 2 && w.seconds - e.lastVisit > 6) {
        e.meetings++;
        e.lastVisit = w.seconds;
      }
      e.lastSeen = w.seconds;
      e.duration += 0.5;
      e.familiarity = Math.min(
        1,
        e.familiarity + 0.012 * (0.5 + (a.traits[3] + b.traits[3]) / 200),
      );
      const existing = w
        .relationsOf(a.id)
        .find((r) => r.a === b.id || r.b === b.id);
      if (existing) {
        existing.lastMeeting = w.year;
        existing.sharedYears += 0.5 / 22.5;
        existing.meetings = e.meetings;
        existing.familiarity = e.familiarity;
        existing.intensity = Math.min(
          1,
          existing.intensity +
            0.001 * (0.6 + (a.traits[2] + b.traits[2]) / 200),
        );
      }
      if (e.meetings < 2 || e.familiarity < 0.24) continue;
      const fit =
        (attraction(a, b, e.familiarity) + attraction(b, a, e.familiarity)) / 2;
      if (
        !existing &&
        fit > 0.48 &&
        w.rng.next() < 0.035 * (0.5 + (a.traits[3] + b.traits[3]) / 200)
      )
        w.createRelation(
          a,
          b,
          "friendship",
          0.35 + fit * 0.25,
          e.familiarity,
          e.meetings,
          e.duration / 22.5,
        );
      else if (
        existing?.type === "friendship" &&
        existing.intensity > 0.42 &&
        e.meetings >= 2 &&
        e.duration > 18 &&
        mutualLove(w, a, b, e.familiarity) &&
        w.rng.next() < 0.055
      ) {
        w.endRelation(existing);
        w.createRelation(
          a,
          b,
          "love",
          0.65,
          e.familiarity,
          e.meetings,
          e.duration / 22.5,
        );
      }
    }
  // Encounter working memory is bounded; completed relationships retain their own history.
  if (w.tick % 675 === 0)
    for (const [key, e] of w.encounters)
      if (
        w.seconds - e.lastSeen > 180 ||
        !w.souls.get(e.a) ||
        !w.souls.get(e.b)
      )
        w.encounters.delete(key);
}
export function maintainRelations(w: World, years: number) {
  for (const r of w.relationships) {
    if (r.end !== null) continue;
    const a = w.souls.get(r.a)!,
      b = w.souls.get(r.b)!;
    if (a.deathYear !== null || b.deathYear !== null) continue;
    const apart = w.year - r.lastMeeting;
    if (r.type === "family") {
      if (apart > 1)
        r.intensity = Math.max(
          0.05,
          r.intensity - continuityLoss(a, b, years) * 0.4,
        );
      continue;
    }
    const loss = continuityLoss(a, b, years) * (apart > 1 ? 1 : 0.12);
    r.intensity = Math.max(0, r.intensity - loss);
    if (
      r.intensity < 0.1 ||
      (r.type === "love" &&
        w.rng.next() < years * 0.003 * (1 - (a.traits[4] + b.traits[4]) / 220))
    )
      w.endRelation(r);
  }
}
export function seedSocial(w: World) {
  if (w.living.length < 2) return;
  const adults = w.living.filter(
    (s) => ageOf(s, w.year) >= 23 && ageOf(s, w.year) < 59,
  );
  let couples = 0;
  for (const a of adults) {
    if (couples >= 12) break;
    const b = adults.find((b) => b.id !== a.id && mutualLove(w, a, b, 0.65));
    if (!b) continue;
    const year = Math.max(
      a.birthYear + 20,
      b.birthYear + 20,
      -w.rng.between(1, 8),
    );
    w.createRelation(a, b, "love", w.rng.between(0.6, 0.9), 0.7, 10, 2, year);
    b.x = b.px = Math.min(1500, Math.max(100, a.x + w.rng.between(-32, 32)));
    b.y = b.py = Math.min(900, Math.max(100, a.y + w.rng.between(-32, 32)));
    couples++;
  }
  for (let i = 0; i < 38; i++) {
    const a = w.rng.pick(w.living),
      b = w.rng.pick(w.living);
    if (
      a.id === b.id ||
      w.relationsOf(a.id).some((r) => r.a === b.id || r.b === b.id)
    )
      continue;
    const start = Math.max(
      a.birthYear + 2,
      b.birthYear + 2,
      -w.rng.between(0, 6),
    );
    if (start <= 0)
      w.createRelation(
        a,
        b,
        "friendship",
        w.rng.between(0.35, 0.8),
        0.6,
        5,
        1,
        start,
      );
  }
}
