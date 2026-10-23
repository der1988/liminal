import test from "node:test";
import assert from "node:assert/strict";
import { walk } from "../src/player/movement";
test("forward follows the viewing direction", () => {
  const a = walk({ x: 0, z: 0 }, 0, 1, 0, 1);
  assert.equal(a.x, 0);
  assert.equal(a.z, -2.25);
  const b = walk({ x: 0, z: 0 }, Math.PI / 2, 1, 0, 1);
  assert.ok(Math.abs(b.x + 2.25) < 1e-8);
  assert.ok(Math.abs(b.z) < 1e-8);
});
test("diagonal movement has the same speed as forward movement", () => {
  const p = walk({ x: 0, z: 0 }, 0, 1, 1, 1);
  assert.ok(Math.abs(Math.hypot(p.x, p.z) - 2.25) < 1e-8);
});
test("the player stays in the square, independently of crowd events", () => {
  let p = { x: 0, z: 0 };
  for (let i = 0; i < 10000; i++) p = walk(p, 0, 1, 1, 1 / 60);
  assert.equal(p.x, 39);
  assert.equal(p.z, -38);
  p = walk(p, 0, -1, -1, 100);
  assert.ok(p.x >= -39 && p.z <= 46);
});
test("fixed substeps reproduce a single unobstructed second", () => {
  let p = { x: 0, z: 0 };
  for (let i = 0; i < 60; i++) p = walk(p, 0.4, 1, 0, 1 / 60);
  const one = walk({ x: 0, z: 0 }, 0.4, 1, 0, 1);
  assert.ok(Math.hypot(p.x - one.x, p.z - one.z) < 1e-8);
});
