import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/model/world";
import { encode, decode, type ObserverState } from "../src/model/persistence";
import { snapshot, restore } from "../src/model/snapshot";
const observer: ObserverState = {
  speed: 3,
  accumulator: 0.01,
  camera: { x: 800, y: 500, zoom: 1, follow: null },
  selected: null,
};
test("round-trip preserves genealogy, events, traits, memories, RNG and subsequent evolution", () => {
  const w = new World(27);
  w.requestBirth("Luce");
  for (let i = 0; i < 2000; i++) w.step();
  w.requestBirth("In attesa");
  const state = snapshot(w),
    recovered = decode(encode(w, observer));
  assert.deepEqual(snapshot(recovered.world), state);
  assert.deepEqual(recovered.observer, observer);
  for (let i = 0; i < 200; i++) {
    w.step();
    recovered.world.step();
  }
  assert.deepEqual(snapshot(w), snapshot(recovered.world));
});
test("corrupt versions and impossible genealogies are rejected instead of silently accepted", () => {
  const w = new World();
  const save = encode(w, observer);
  assert.throws(() => decode({ ...save, version: 2 }));
  assert.throws(() => decode({ ...save, payload: save.payload + " " }));
  const bad = snapshot(w);
  bad.souls[0].parents = [bad.souls[0].id, bad.souls[1].id];
  assert.throws(() => restore(bad));
  const invalid = snapshot(w);
  invalid.souls[0].traits[0] = 101;
  assert.throws(() => restore(invalid));
});
import { Clock } from "../src/model/clock";
test("switching between temporal speeds keeps a serializable nonnegative residual", () => {
  const w = new World(14),
    clock = new Clock(w);
  for (let i = 0; i < 120; i++) {
    clock.speed = ([1, 3, 8] as const)[i % 3];
    clock.advance(1 / 60);
    assert.ok(clock.accumulator >= 0 && clock.accumulator < 1 / 30);
  }
  assert.doesNotThrow(() =>
    decode(
      encode(w, {
        ...observer,
        speed: clock.speed,
        accumulator: clock.accumulator,
      }),
    ),
  );
});
