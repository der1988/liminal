import { clamp } from "../simulation/math";
/** Compensate sparse populations with opportunities to meet, never guaranteed affection. */
export const encounterScale = (population: number) =>
  clamp(Math.sqrt(100 / Math.max(20, population)), 1, 2);
