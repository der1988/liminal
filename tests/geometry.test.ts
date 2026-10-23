import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { mergeStatic } from "../src/world/merge";
test("baking geometry preserves transformed anatomy and subsequent parent animation", () => {
  const root = new THREE.Group();
  root.position.set(12, 3, -8);
  root.scale.set(1.4, 1.2, 1.4);
  root.rotation.y = 0.3;
  const material = new THREE.MeshStandardMaterial();
  for (let i = 0; i < 3; i++) {
    const part = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), material);
    part.position.set(i, 2, i * 0.6);
    root.add(part);
  }
  const expected = root.clone();
  const before = new THREE.Box3().setFromObject(root, true);
  mergeStatic(root);
  const after = new THREE.Box3().setFromObject(root, true);
  assert.ok(before.min.distanceTo(after.min) < 1e-5);
  assert.ok(before.max.distanceTo(after.max) < 1e-5);
  assert.equal(root.children.filter((c) => c instanceof THREE.Mesh).length, 1);
  root.position.y += 4;
  expected.position.y += 4;
  const animated = new THREE.Box3().setFromObject(root, true),
    reference = new THREE.Box3().setFromObject(expected, true);
  assert.ok(animated.min.distanceTo(reference.min) < 1e-5);
  assert.ok(animated.max.distanceTo(reference.max) < 1e-5);
});
