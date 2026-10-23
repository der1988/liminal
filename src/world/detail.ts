import * as THREE from "three";
import { random } from "../simulation/math";
import { box, cylinder, type Materials } from "./materials";
/** Architectural micro-relief, rain-darkened ledges and physically lit puddles. */
export function architecturalDetail(scene: THREE.Scene, m: Materials) {
  const rng = random(840),
    g = new THREE.Group();
  g.position.z = -51;
  scene.add(g);
  for (const x of [-21.5, -14, -5.7, 5.7, 14, 21.5])
    for (let y = 5; y < (Math.abs(x) < 10 ? 33 : 22); y += 3.7) {
      cylinder(g, 0.11, 0.17, 0.54, x, y, 1.5, m.trim, 10);
      const statue = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.12, 0.48, 4, 8),
        m.stone,
      );
      statue.position.set(x, y + 0.65, 1.5);
      g.add(statue);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), m.trim);
      head.position.set(x, y + 1.1, 1.5);
      g.add(head);
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(0.36, 0.8, 6),
        m.trim,
      );
      canopy.position.set(x, y + 1.7, 1.5);
      g.add(canopy);
    }
  for (const x of [-18, -9, 0, 9, 18]) {
    const h = x === 0 ? 9 : 7,
      w = x === 0 ? 4 : 2.8;
    for (let layer = 0; layer < 3; layer++) {
      const points: THREE.Vector3[] = [];
      const ww = w / 2 + 0.22 + layer * 0.16;
      points.push(
        new THREE.Vector3(x - ww, 0.4, 1.9),
        new THREE.Vector3(x - ww, h * 0.65, 1.9),
      );
      for (let i = 0; i <= 24; i++) {
        const a = Math.PI - (i / 24) * Math.PI;
        points.push(
          new THREE.Vector3(
            x + Math.cos(a) * ww,
            h * 0.65 + Math.sin(a) * (h * 0.45),
            1.9,
          ),
        );
      }
      points.push(new THREE.Vector3(x + ww, 0.4, 1.9));
      g.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            42,
            0.065,
            5,
            false,
          ),
          m.trim,
        ),
      );
    }
    for (let row = 0; row < 4; row++)
      for (const side of [-1, 1]) {
        box(
          g,
          w * 0.35,
          0.63,
          0.08,
          x + side * w * 0.24,
          0.9 + row * 1.13,
          1.91,
          m.bronze,
        );
        const stud = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 6, 5),
          m.trim,
        );
        stud.position.set(x + side * w * 0.24, 0.9 + row * 1.13, 2.01);
        g.add(stud);
      }
  }
  // Marble block joints and finely carved balustrades.
  for (let y = 2; y < 32; y += 1.1) {
    const width = y < 18 ? 43 : y < 27 ? 28 : 12;
    box(g, width, 0.022, 0.018, 0, y, 1.02, m.building);
    for (let x = -width / 2; x < width / 2; x += 2.3)
      box(
        g,
        0.018,
        1.05,
        0.018,
        x + (Math.floor(y) % 2) * 1.1,
        y + 0.52,
        1.03,
        m.building,
      );
  }
  for (const y of [11.6, 17.2])
    for (let x = -21; x <= 21; x += 0.53) {
      cylinder(g, 0.04, 0.045, 0.5, x, y, 1.25, m.trim, 5);
    }
  // Puddles remain opaque PBR surfaces, so depth-aware fog and occlusion remain correct.
  const puddle = new THREE.MeshPhysicalMaterial({
    color: "#202a25",
    roughness: 0.065,
    metalness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });
  for (let i = 0; i < 35; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(1, 24), puddle);
    p.rotation.x = -Math.PI / 2;
    p.position.set((rng() - 0.5) * 76, 0.009, -34 + rng() * 75);
    p.scale.set(1.2 + rng() * 3.5, 0.4 + rng() * 1.1, 1);
    scene.add(p);
  }
}
