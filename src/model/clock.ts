import { CONFIG } from "./types";
import type { World } from "./world";
export type Speed = 0 | 1 | 3 | 8;
export class Clock {
  speed: Speed = 1;
  accumulator = 0;
  constructor(readonly world: World) {}
  advance(realSeconds: number) {
    this.accumulator += realSeconds * this.speed;
    const count = Math.floor((this.accumulator + 1e-10) / CONFIG.step);
    this.accumulator = Math.max(0, this.accumulator - count * CONFIG.step);
    for (let i = 0; i < count; i++) this.world.step();
  }
  get alpha() {
    return this.speed === 0
      ? 1
      : Math.max(0, Math.min(1, this.accumulator / CONFIG.step));
  }
}
