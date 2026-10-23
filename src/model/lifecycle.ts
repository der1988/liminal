import type { World } from "./world";
import type { Soul } from "./types";
import { remember, sediment } from "./memory";
export function die(w: World, s: Soul) {
  if (s.deathYear !== null) return false;
  s.deathYear = w.year;
  s.vx = s.vy = 0;
  s.target = null;
  s.state = "departure";
  w.record("death", [s.id]);
  const lost = new Set<string>();
  for (const r of w.relationsOf(s.id)) {
    const other = w.souls.get(r.a === s.id ? r.b : r.a)!;
    if (other.deathYear === null) {
      remember(other, s, r.intensity, r.sharedYears, w.year);
      if (!lost.has(other.id)) {
        w.record("loss", [other.id, s.id]);
        lost.add(other.id);
      }
    }
    if (r.type !== "family") r.end = w.year;
  }
  w.living = w.living.filter((p) => p.id !== s.id);
  w.fading.push(s.id);
  sediment(w, s.x, s.y, 0.35);
  return true;
}
export function lifecycle(w: World) {
  for (const s of [...w.living])
    if (w.year - s.birthYear >= s.lifespan) die(w, s);
  w.fading = w.fading.filter(
    (id) => w.year - w.souls.get(id)!.deathYear! < 0.25,
  );
}
