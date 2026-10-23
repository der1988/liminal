import * as THREE from "three";
import { box, cylinder, type Materials } from "./materials";
import { random } from "../simulation/math";
export interface Lamp {
  position: THREE.Vector3;
  kind: "amber" | "red" | "blue";
  phase: number;
}
export function city(scene: THREE.Scene, m: Materials) {
  const rng = random(941),
    lamps: Lamp[] = [];
  box(scene, 160, 0.2, 200, 0, -0.13, -30, m.ground);
  // The arcades enclose the square without becoming a navigable maze.
  for (const side of [-1, 1])
    for (let i = 0; i < 8; i++) {
      const x = side * 48,
        z = 30 - i * 14,
        h = 18 + rng() * 9;
      box(scene, 13, h, 13, x, h / 2, z, m.building);
      box(scene, 13.8, 0.65, 13.8, x, h, z, m.trim);
      for (let floor = 0; floor < 3; floor++)
        for (let j = 0; j < 4; j++) {
          const windowMat = rng() > 0.76 ? m.window : m.dark;
          box(
            scene,
            0.07,
            2.2,
            1.2,
            x - side * 6.56,
            5.5 + floor * 4,
            z - 4.8 + j * 3,
            windowMat,
          );
          if (floor === 0)
            cylinder(
              scene,
              0.27,
              0.36,
              4.5,
              x - side * 7.2,
              2.25,
              z - 5 + j * 3,
              m.stone,
            );
        }
      box(scene, 2, 0.4, 13.6, x - side * 6, 4.5, z, m.trim);
    }
  box(scene, 110, 22, 8, 0, 11, 58, m.building);
  for (let x = -40; x <= 40; x += 7) {
    box(scene, 2.5, 4, 0.1, x, 10, 53.9, m.dark);
    box(scene, 2.5, 4, 0.1, x, 17, 53.9, m.window);
  }
  for (const x of [-29, 29])
    for (const z of [-32, 2, 34]) {
      cylinder(scene, 0.11, 0.2, 7.8, x, 3.9, z, m.bronze);
      cylinder(scene, 0.32, 0.5, 0.4, x, 0.2, z, m.bronze);
      for (const dx of [-1, 0, 1]) {
        const px = x + dx * 0.7;
        box(scene, 1.6, 0.08, 0.08, x, 7.4, z, m.bronze);
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.19, 8, 6),
          m.amber,
        );
        bulb.position.set(px, 7.7, z);
        scene.add(bulb);
        lamps.push({
          position: bulb.position.clone(),
          kind: "amber",
          phase: rng() * 6,
        });
      }
      const l = new THREE.PointLight("#ffce8a", 32, 17, 2);
      l.position.set(x, 7.1, z);
      scene.add(l);
    }
  // Police vans, barricades and abandoned signs: scenery, never player hazards.
  for (const [x, z, angle] of [
    [-20, -21, 0.12],
    [23, -26, -0.25],
    [-32, 16, 0.35],
  ]) {
    const van = new THREE.Group();
    van.position.set(x, 0, z);
    van.rotation.y = angle;
    scene.add(van);
    box(van, 2.7, 2.5, 5, 0, 1.55, 0, m.police);
    box(van, 2.75, 0.45, 5.1, 0, 1.3, 0, m.stone);
    box(van, 2.5, 0.8, 0.05, 0, 2.1, 2.53, m.dark);
    for (const sx of [-1, 1])
      for (const zz of [-1.55, 1.55]) {
        const wheel = cylinder(
          van,
          0.5,
          0.5,
          0.25,
          sx * 1.36,
          0.6,
          zz,
          m.dark,
          12,
        );
        wheel.rotation.z = Math.PI / 2;
      }
    for (const sx of [-1, 1]) {
      const beacon = box(van, 0.42, 0.16, 0.3, sx * 0.65, 2.94, 0, m.blue);
      van.updateMatrixWorld(true);
      lamps.push({
        position: beacon.getWorldPosition(new THREE.Vector3()),
        kind: "blue",
        phase: rng() * 6,
      });
    }
  }
  for (let i = 0; i < 7; i++) {
    const x = -11 + i * 3.2,
      z = -25;
    for (const off of [-1.4, 1.4]) {
      box(scene, 0.06, 1.05, 0.06, x + off, 0.52, z, m.helmet);
      box(scene, 0.5, 0.08, 0.6, x + off, 0.05, z, m.helmet);
    }
    box(scene, 3, 0.06, 0.08, x, 0.95, z, m.helmet);
    box(scene, 3, 0.06, 0.08, x, 0.3, z, m.helmet);
    for (let j = 0; j < 8; j++)
      box(scene, 0.035, 0.6, 0.05, x - 1.3 + j * 0.37, 0.62, z, m.helmet);
  }
  for (let i = 0; i < 65; i++) {
    const paper = box(
      scene,
      0.28 + rng() * 0.4,
      0.007,
      0.4 + rng() * 0.2,
      (rng() - 0.5) * 75,
      0.015,
      40 - rng() * 80,
      rng() > 0.5 ? m.stone : m.dark,
    );
    paper.rotation.y = rng() * 6;
  }
  // Halloween is present through modest jack-o'-lanterns, not a themed HUD.
  const pumpkin = new THREE.MeshStandardMaterial({
    color: "#864d24",
    roughness: 1,
  });
  for (const [x, z] of [
    [-27, 3],
    [28, -8],
    [-28, -30],
    [24, 23],
  ]) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), pumpkin);
    p.scale.set(1, 0.8, 1);
    p.position.set(x, 0.33, z);
    scene.add(p);
    for (const dx of [-0.12, 0.12])
      box(scene, 0.09, 0.09, 0.025, x + dx, 0.4, z + 0.35, m.amber);
    box(scene, 0.2, 0.035, 0.025, x, 0.27, z + 0.37, m.amber);
    cylinder(scene, 0.05, 0.06, 0.15, x, 0.68, z, m.bronze);
  }
  return lamps;
}
