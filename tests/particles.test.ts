import test from "node:test";
import assert from "node:assert/strict";
import { ParticleSystem } from "../src/simulation/particles";
test("two existing points create a persistent undirected line, without duplicates or self-links", () => {
  const s = new ParticleSystem(1000, 700, 2);
  const [a, b] = s.particles;
  assert.ok(s.connect(a.id, b.id));
  assert.equal(s.connect(b.id, a.id), false);
  assert.equal(s.connect(a.id, a.id), false);
  assert.equal(s.connect(a.id, 9999), false);
  s.update(1 / 60);
  assert.deepEqual(s.links, [{ a: a.id, b: b.id }]);
});
test("random movement stays bounded and retains links for five simulated minutes", () => {
  const s = new ParticleSystem(640, 480, 80);
  s.connect(0, 1);
  const before = { x: s.particles[0].x, y: s.particles[0].y };
  for (let i = 0; i < 18000; i++) s.update(1 / 60);
  assert.notEqual(s.particles[0].x, before.x);
  assert.equal(s.links.length, 1);
  for (const p of s.particles) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.vx));
    assert.ok(p.x >= 4 && p.x <= 636 && p.y >= 4 && p.y <= 476);
    assert.ok(Math.hypot(p.vx, p.vy) < 21);
  }
});
test("pause, selection and dragging hold points steady; editing still works while paused", () => {
  const s = new ParticleSystem(800, 600, 3);
  s.selected = 0;
  s.held = 1;
  const start = s.particles.map((p) => [p.x, p.y]);
  s.update(1);
  assert.deepEqual([s.particles[0].x, s.particles[0].y], start[0]);
  assert.deepEqual([s.particles[1].x, s.particles[1].y], start[1]);
  s.paused = true;
  const p = s.particles[2];
  const pos = [p.x, p.y];
  s.update(1);
  assert.deepEqual([p.x, p.y], pos);
  s.move(0, 200, 300);
  assert.equal(s.particles[0].x, 200);
  assert.ok(s.connect(0, 1));
});
test("removing points prunes links and selection; resizing preserves IDs and topology", () => {
  const s = new ParticleSystem(800, 600, 5);
  s.connect(0, 1);
  s.connect(0, 4);
  s.selected = 4;
  s.setCount(3);
  assert.equal(s.links.length, 1);
  assert.equal(s.selected, null);
  const x = s.particles[0].x;
  s.resize(400, 300);
  assert.equal(s.particles[0].x, x * 0.5);
  assert.deepEqual(s.links, [{ a: 0, b: 1 }]);
  s.reset(19);
  assert.equal(s.particles.length, 3);
  assert.equal(s.links.length, 0);
});
test("line hit-testing tracks moved endpoints and supports deletion", () => {
  const s = new ParticleSystem(800, 600, 0);
  const a = s.add(100, 100)!,
    b = s.add(300, 100)!;
  s.connect(a.id, b.id);
  assert.equal(s.nearestLink(200, 102, 8), 0);
  assert.equal(s.nearestLink(200, 150, 8), -1);
  s.move(b.id, 300, 300);
  assert.equal(s.nearestLink(200, 200, 8), 0);
  s.removeLink(0);
  assert.equal(s.links.length, 0);
});
test("point counts are bounded and seeded simulations are repeatable", () => {
  const a = new ParticleSystem(800, 600, 20, 12),
    b = new ParticleSystem(800, 600, 20, 12);
  for (let i = 0; i < 120; i++) {
    a.update(1 / 60);
    b.update(1 / 60);
  }
  assert.deepEqual(a.particles, b.particles);
  a.setCount(800);
  assert.equal(a.particles.length, 500);
  assert.equal(a.add(10, 10), null);
  a.setCount(-30);
  assert.equal(a.particles.length, 0);
});
