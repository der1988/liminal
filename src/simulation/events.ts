import { clamp } from "./math";
export interface Threat {
  x: number;
  z: number;
  radius: number;
  strength: number;
}
export interface Unrest {
  pressure: number;
  charge: number;
  recoil: number;
  volley: number;
}
/** Shared choreography: crowd clashes and creature strikes have no player input. */
export function unrestAt(t: number): Unrest {
  const cycle = ((t % 22) + 22) % 22;
  const pulse = (center: number, width: number) =>
    Math.max(0, 1 - Math.abs(cycle - center) / width);
  return {
    pressure: 0.25 + pulse(6, 5) * 0.75,
    charge: pulse(8, 3),
    recoil: pulse(11, 2.5),
    volley: pulse(16, 3),
  };
}
export function attackAt(t: number, phase: number) {
  const cycle = (((t + phase) % 16) + 16) % 16;
  // Slow coiling, a fast strike, then a longer recovery; not a constant sine sway.
  if (cycle < 6) return { windup: cycle / 6, strike: 0, recovery: 0 };
  if (cycle < 6.45)
    return { windup: 1, strike: (cycle - 6) / 0.45, recovery: 0 };
  if (cycle < 8)
    return { windup: 0, strike: 1 - (cycle - 6.45) / 1.55, recovery: 1 };
  return { windup: 0, strike: 0, recovery: 0 };
}
export function avoidance(x: number, z: number, threats: readonly Threat[]) {
  let dx = 0,
    dz = 0;
  for (const threat of threats) {
    const vx = x - threat.x,
      vz = z - threat.z,
      d = Math.hypot(vx, vz) || 0.01;
    const force = clamp(1 - d / threat.radius, 0, 1) * threat.strength;
    dx += (vx / d) * force;
    dz += (vz / d) * force;
  }
  return { x: dx, z: dz };
}
