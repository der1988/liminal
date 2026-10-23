import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/model/world";
import { snapshot, restore, validate } from "../src/model/snapshot";
import { CONFIG } from "../src/model/types";
/** Offline acceleration only: no hidden time skip in the interface. */
test(
  "three seeds sustain several generations without invalid relationships or graphical accumulation",
  { timeout: 240000 },
  () => {
    for (const seed of [91204, 42, 733]) {
      const w = new World(seed);
      let min = 120,
        max = 0;
      for (let year = 1; year <= 300; year++) {
        for (let tick = 0; tick < 675; tick++) w.step();
        min = Math.min(min, w.living.length);
        max = Math.max(max, w.living.length);
        assert.ok(
          w.living.length >= 35 && w.living.length <= CONFIG.maxLiving,
          `seed ${seed}, anno ${year}: ${w.living.length} anime`,
        );
        assert.ok(w.sediments.length <= CONFIG.sedimentLimit);
      }
      const data = snapshot(w);
      validate(data);
      const rebuilt = restore(data);
      assert.equal(rebuilt.rng.state, w.rng.state);
      assert.equal(rebuilt.events.length, w.events.length);
      const generation = (id: string): number => {
        const s = w.souls.get(id)!;
        return s.parents.length
          ? 1 + Math.max(...s.parents.map(generation))
          : 0;
      };
      assert.ok(
        Math.max(...w.living.map((s) => generation(s.id))) >= 4,
        `seed ${seed}: genealogia troppo corta`,
      );
      assert.ok(w.souls.size > 300);
      assert.equal(
        w.events.filter((e) => e.kind === "death").length,
        [...w.souls.values()].filter((s) => s.deathYear !== null).length,
      );
      const active = w.relationships.filter(
          (r) => r.end === null && r.type === "love",
        ),
        paired = active.flatMap((r) => [r.a, r.b]);
      assert.equal(new Set(paired).size, paired.length);
      const cx = w.living.reduce((sum, s) => sum + s.x, 0) / w.living.length,
        cy = w.living.reduce((sum, s) => sum + s.y, 0) / w.living.length;
      assert.ok(
        w.living.filter((s) => Math.hypot(s.x - cx, s.y - cy) > 120).length >
          w.living.length * 0.3,
      );
      console.log(
        `seed ${seed}: anno 300, ${w.living.length} vive, ${w.souls.size} vite, intervallo ${min}–${max}`,
      );
    }
  },
);
