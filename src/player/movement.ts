import { clamp } from "../simulation/math";
export interface Position {
  x: number;
  z: number;
}
/** The only player-world constraint is the edge of the explorable square. */
export function walk(
  position: Position,
  yaw: number,
  forward: number,
  strafe: number,
  dt: number,
): Position {
  const norm = Math.max(1, Math.hypot(forward, strafe)),
    speed = 2.25;
  return {
    x: clamp(
      position.x +
        ((strafe * Math.cos(yaw) - forward * Math.sin(yaw)) * speed * dt) /
          norm,
      -39,
      39,
    ),
    z: clamp(
      position.z +
        ((-forward * Math.cos(yaw) - strafe * Math.sin(yaw)) * speed * dt) /
          norm,
      -38,
      46,
    ),
  };
}
