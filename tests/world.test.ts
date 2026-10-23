import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/model/world";
import { Clock } from "../src/model/clock";
import { CONFIG } from "../src/model/types";
import { movementSpeed } from "../src/model/movement";
test("souls have stable identities, bounded traits and normalized preferences", () => {
  const w = new World();
  assert.equal(w.living.length, 80);
  assert.equal(new Set(w.living.map((s) => s.id)).size, 80);
  for (const s of w.living) {
    assert.ok(s.name);
    assert.ok(s.traits.every((v) => v >= 0 && v <= 100));
    assert.ok(
      Math.abs(s.preferences.weights.reduce((a, b) => a + b) - 1) < 1e-10,
    );
  }
  const ids = w.living.map((s) => s.id);
  w.step();
  assert.deepEqual(
    w.living.map((s) => s.id),
    ids,
  );
});
test("the natural year is 22.5 seconds and speed multipliers preserve the simulation", () => {
  const worlds = [new World(7), new World(7), new World(7)];
  for (const [i, speed] of [1, 3, 8].entries()) {
    const c = new Clock(worlds[i]);
    c.speed = speed as 1 | 3 | 8;
    c.advance(22.5 / speed);
  }
  assert.equal(worlds[0].year, 1);
  assert.equal(
    JSON.stringify(worlds[0].living),
    JSON.stringify(worlds[1].living),
  );
  assert.equal(worlds[0].rng.state, worlds[2].rng.state);
  assert.equal(
    JSON.stringify(worlds[0].living),
    JSON.stringify(worlds[2].living),
  );
});
test("movement is bounded, individual, and traits affect behavior", () => {
  const w = new World(4);
  const s = w.living[0];
  s.traits[5] = 0;
  const slow = movementSpeed(s, w.year);
  s.traits[5] = 100;
  assert.ok(movementSpeed(s, w.year) > slow);
  for (let i = 0; i < 9000; i++) w.step();
  for (const p of w.living) {
    assert.ok(
      p.x >= 0 && p.x <= CONFIG.width && p.y >= 0 && p.y <= CONFIG.height,
    );
    assert.ok(Number.isFinite(p.vx));
  }
  const cx = w.living.reduce((a, s) => a + s.x, 0) / 80,
    cy = w.living.reduce((a, s) => a + s.y, 0) / 80;
  assert.ok(
    w.living.filter((s) => Math.hypot(s.x - cx, s.y - cy) > 100).length > 40,
  );
});
import { attraction, continuityLoss } from "../src/model/affinity";
import { mutualLove } from "../src/model/social";
test("attraction is subjective and may be asymmetric; love needs reciprocity and adults", () => {
  const w = new World(9, 0),
    a = w.createSoul(25),
    b = w.createSoul(25);
  a.traits = [90, 20, 10, 90, 20, 10];
  b.traits = [10, 90, 90, 20, 90, 90];
  a.preferences = { weights: [1, 0, 0, 0, 0, 0], ideals: [10, 0, 0, 0, 0, 0] };
  b.preferences = { weights: [1, 0, 0, 0, 0, 0], ideals: [0, 0, 0, 0, 0, 0] };
  assert.ok(attraction(a, b) > 0.6);
  assert.ok(attraction(b, a) < 0.3);
  assert.equal(mutualLove(w, a, b, 0.7), false);
  b.birthYear = -12;
  assert.equal(mutualLove(w, a, b, 1), false);
});
test("stability changes continuity while familiarity and encounters are real", () => {
  const w = new World(19, 0),
    a = w.createSoul(30),
    b = w.createSoul(30);
  a.traits[4] = b.traits[4] = 0;
  const weak = continuityLoss(a, b, 1);
  a.traits[4] = b.traits[4] = 100;
  assert.ok(continuityLoss(a, b, 1) < weak);
  a.x = b.x = 800;
  a.y = 500;
  b.y = 515;
  for (let i = 0; i < 300; i++) w.step();
  assert.ok(w.encounters.size > 0);
  const e = [...w.encounters.values()][0];
  assert.ok(e.duration > 0 && e.familiarity > 0);
});
import { snapshot } from "../src/model/snapshot";
test("speed changes preserve births, deaths, histories and RNG through fifteen simulated years", () => {
  const worlds = [new World(101), new World(101), new World(101)];
  for (const [i, speed] of [1, 3, 8].entries()) {
    const clock = new Clock(worlds[i]);
    clock.speed = speed as 1 | 3 | 8;
    clock.advance((22.5 * 15) / speed);
  }
  assert.ok(worlds[0].souls.size > 80);
  assert.ok(worlds[0].events.some((e) => e.kind === "death"));
  assert.deepEqual(snapshot(worlds[0]), snapshot(worlds[1]));
  assert.deepEqual(snapshot(worlds[0]), snapshot(worlds[2]));
});
import { attention } from "../src/model/affinity";
import { Random } from "../src/model/random";
test("charm affects attention rather than guaranteeing affection; openness changes actual encounter choices", () => {
  const w = new World(2, 0),
    a = w.createSoul(30),
    b = w.createSoul(30);
  a.preferences.weights = [1, 0, 0, 0, 0, 0];
  b.traits[1] = 0;
  const score = attraction(a, b),
    noticed = attention(a, b);
  b.traits[1] = 100;
  assert.equal(attraction(a, b), score);
  assert.ok(attention(a, b) > noticed);
  let seed = 1;
  for (; seed < 100; seed++) {
    const rng = new Random(seed);
    rng.next();
    const r = rng.next();
    if (r > 0.15 && r < 0.6) break;
  }
  const worlds = [new World(4, 0), new World(4, 0)];
  for (const [i, world] of worlds.entries()) {
    const from = world.createSoul(30),
      to = world.createSoul(30);
    from.x = from.px = 800;
    from.y = from.py = 500;
    to.x = to.px = 825;
    to.y = to.py = 500;
    from.nextDecision = 0;
    from.traits[3] = i ? 100 : 0;
    world.rng.state = seed;
    world.step();
  }
  assert.notEqual(worlds[0].living[0].state, worlds[1].living[0].state);
});
test("adult accompaniment can return to a friend without being trapped by childhood family proximity", () => {
  const w = new World(1, 0),
    adult = w.createSoul(30),
    p = w.createSoul(60),
    q = w.createSoul(60),
    friend = w.createSoul(30);
  adult.parents = [p.id, q.id];
  w.indexChild(adult);
  w.createRelation(p, adult, "family");
  w.createRelation(q, adult, "family");
  w.createRelation(adult, friend, "friendship");
  adult.x = 800;
  adult.y = 500;
  adult.traits[5] = 0;
  adult.nextDecision = 0;
  p.x = 100;
  p.y = 100;
  q.x = 1500;
  q.y = 100;
  friend.x = 1500;
  friend.y = 900;
  w.rng.state = 1;
  w.step();
  assert.equal(adult.state, "accompaniment");
  assert.equal(adult.target, friend.id);
  assert.equal(
    w.relationsOf(adult.id).filter((r) => r.type === "family").length,
    2,
  );
});
