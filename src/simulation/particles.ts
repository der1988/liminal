import { clamp, random } from "./math";
import type { RelationshipType } from "./relationships";
export interface Particle {
  id: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  vx: number;
  vy: number;
  brightness: number;
  size: number;
}
export interface Link {
  a: number;
  b: number;
  type: RelationshipType;
}
export class ParticleSystem {
  readonly particles: Particle[] = [];
  readonly links: Link[] = [];
  selected: number | null = null;
  held: number | null = null;
  speed = 1;
  paused = false;
  private nextId = 0;
  private rng: () => number;
  constructor(
    public width: number,
    public height: number,
    count = 180,
    seed = 2048,
  ) {
    this.rng = random(seed);
    this.setCount(count);
  }
  get(id: number) {
    return this.particles.find((p) => p.id === id);
  }
  add(x: number, y: number) {
    if (this.particles.length >= 500) return null;
    const angle = this.rng() * Math.PI * 2,
      speed = 7 + this.rng() * 13;
    const p: Particle = {
      id: this.nextId++,
      x: clamp(x, 4, this.width - 4),
      y: clamp(y, 4, this.height - 4),
      previousX: 0,
      previousY: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      brightness: 0.45 + this.rng() * 0.55,
      size: this.rng() > 0.91 ? 3 : 2,
    };
    p.previousX = p.x;
    p.previousY = p.y;
    this.particles.push(p);
    return p;
  }
  setCount(count: number) {
    count = Math.round(clamp(count, 0, 500));
    while (this.particles.length < count)
      this.add(
        8 + this.rng() * (this.width - 16),
        8 + this.rng() * (this.height - 16),
      );
    if (this.particles.length > count) this.particles.length = count;
    this.prune();
  }
  private prune() {
    const ids = new Set(this.particles.map((p) => p.id));
    for (let i = this.links.length - 1; i >= 0; i--)
      if (!ids.has(this.links[i].a) || !ids.has(this.links[i].b))
        this.links.splice(i, 1);
    if (this.selected !== null && !ids.has(this.selected)) this.selected = null;
    if (this.held !== null && !ids.has(this.held)) this.held = null;
  }
  connect(a: number, b: number, type: RelationshipType = "love") {
    if (
      a === b ||
      !this.get(a) ||
      !this.get(b) ||
      this.links.length >= 5000 ||
      this.links.some(
        (e) => (e.a === a && e.b === b) || (e.a === b && e.b === a),
      )
    )
      return false;
    this.links.push({ a, b, type });
    return true;
  }
  removeLink(index: number) {
    if (index >= 0 && index < this.links.length) this.links.splice(index, 1);
  }
  clearLinks() {
    this.links.length = 0;
    this.selected = null;
  }
  reset(seed = Date.now()) {
    const count = this.particles.length;
    this.particles.length = 0;
    this.clearLinks();
    this.held = null;
    this.rng = random(seed);
    this.nextId = 0;
    this.setCount(count);
  }
  move(id: number, x: number, y: number) {
    const p = this.get(id);
    if (p) {
      p.x = p.previousX = clamp(x, 4, this.width - 4);
      p.y = p.previousY = clamp(y, 4, this.height - 4);
    }
  }
  nearest(x: number, y: number, radius: number) {
    let best: Particle | undefined;
    let d = radius * radius;
    for (const p of this.particles) {
      const distance = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (distance <= d) {
        best = p;
        d = distance;
      }
    }
    return best;
  }
  nearestLink(x: number, y: number, radius: number) {
    let best = -1,
      d = radius;
    for (let i = 0; i < this.links.length; i++) {
      const e = this.links[i],
        a = this.get(e.a),
        b = this.get(e.b);
      if (!a || !b) continue;
      const dx = b.x - a.x,
        dy = b.y - a.y,
        len = dx * dx + dy * dy,
        t =
          len === 0 ? 0 : clamp(((x - a.x) * dx + (y - a.y) * dy) / len, 0, 1),
        distance = Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
      if (distance < d) {
        d = distance;
        best = i;
      }
    }
    return best;
  }
  resize(width: number, height: number) {
    const sx = width / this.width,
      sy = height / this.height;
    this.width = width;
    this.height = height;
    for (const p of this.particles) {
      p.x = p.previousX = clamp(p.x * sx, 4, width - 4);
      p.y = p.previousY = clamp(p.y * sy, 4, height - 4);
    }
  }
  update(dt: number) {
    for (const p of this.particles) {
      p.previousX = p.x;
      p.previousY = p.y;
      if (this.paused || p.id === this.selected || p.id === this.held) continue;
      // Small randomized changes of direction give a wandering motion without jitter.
      const t = dt * this.speed,
        angle = (this.rng() - 0.5) * Math.sqrt(t) * 0.65,
        cos = Math.cos(angle),
        sin = Math.sin(angle),
        vx = p.vx * cos - p.vy * sin;
      p.vy = p.vx * sin + p.vy * cos;
      p.vx = vx;
      p.x += p.vx * t;
      p.y += p.vy * t;
      if (p.x < 4 || p.x > this.width - 4) {
        p.x = clamp(p.x, 4, this.width - 4);
        p.vx *= -1;
      }
      if (p.y < 4 || p.y > this.height - 4) {
        p.y = clamp(p.y, 4, this.height - 4);
        p.vy *= -1;
      }
    }
  }
}
