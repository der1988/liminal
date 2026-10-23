import test from "node:test";
import assert from "node:assert/strict";
import { attackAt, avoidance, unrestAt } from "../src/simulation/events";
test("creatures coil, strike rapidly, and recover instead of constantly swaying", () => {
  assert.equal(attackAt(3, 0).strike, 0);
  assert.ok(attackAt(5.9, 0).windup > 0.9);
  assert.ok(attackAt(6.44, 0).strike > 0.95);
  assert.equal(attackAt(12, 0).strike, 0);
  assert.deepEqual(attackAt(3, 5), attackAt(19, 5));
});
test("all choreography stays finite and bounded through repeated cycles", () => {
  for (let i = 0; i < 10000; i++) {
    const t = i * 0.13;
    for (const v of Object.values(attackAt(t, 5))) assert.ok(v >= 0 && v <= 1);
    for (const v of Object.values(unrestAt(t))) assert.ok(v >= 0 && v <= 1);
  }
});
test("NPCs move away from nearby creatures and react more strongly during a strike", () => {
  const idle = avoidance(3, 0, [{ x: 0, z: 0, radius: 10, strength: 1.5 }]);
  const strike = avoidance(3, 0, [{ x: 0, z: 0, radius: 10, strength: 8 }]);
  assert.ok(idle.x > 0);
  assert.ok(strike.x > idle.x * 4);
  assert.deepEqual(
    avoidance(20, 0, [{ x: 0, z: 0, radius: 10, strength: 8 }]),
    { x: 0, z: 0 },
  );
});
test("charges and retreats are separate phases of the police/crowd clash", () => {
  assert.ok(unrestAt(8).charge > 0.99);
  assert.equal(unrestAt(8).recoil, 0);
  assert.ok(unrestAt(11).recoil > 0.99);
  assert.equal(unrestAt(11).charge, 0);
});
