import * as THREE from "three";
import { box, cylinder, type Materials } from "./materials";
/** A procedural Gothic silhouette, inspired by the Duomo rather than a survey model. */
export function cathedral(parent: THREE.Object3D, m: Materials) {
  const g = new THREE.Group();
  g.position.set(0, 0, -51);
  parent.add(g);
  const wallZ = 0;
  function pointedArch(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    mat: THREE.Material,
  ) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(-w / 2, h * 0.65);
    shape.quadraticCurveTo(-w / 2, h * 0.82, 0, h);
    shape.quadraticCurveTo(w / 2, h * 0.82, w / 2, h * 0.65);
    shape.lineTo(w / 2, 0);
    shape.closePath();
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false,
        curveSegments: 8,
      }),
      mat,
    );
    mesh.position.set(x, y, z);
    g.add(mesh);
    return mesh;
  }
  // Five bays of stepped facade and the long nave behind it.
  box(g, 44, 18, 9, 0, 9, -4, m.stone);
  box(g, 30, 28, 8, 0, 14, -5, m.stone);
  box(g, 14, 35, 8, 0, 17.5, -5, m.stone);
  box(g, 28, 23, 43, 0, 11.5, -26, m.building);
  for (const [x, w, h] of [
    [-18, 8, 22],
    [-9, 10, 29],
    [0, 10, 38],
    [9, 10, 29],
    [18, 8, 22],
  ]) {
    const tri = new THREE.Shape();
    tri.moveTo(-w / 2, 0);
    tri.lineTo(0, 5);
    tri.lineTo(w / 2, 0);
    tri.closePath();
    const roof = new THREE.Mesh(
      new THREE.ExtrudeGeometry(tri, { depth: 8, bevelEnabled: false }),
      m.stone,
    );
    roof.position.set(x, h - 5, -8);
    g.add(roof);
    box(g, w, 0.35, 1.05, x, 12, 0.5, m.trim);
    box(g, w, 0.32, 1, x, 17.5, 0.5, m.trim);
  }
  for (const x of [-21.5, -14, -5.7, 5.7, 14, 21.5]) {
    const h = Math.abs(x) < 10 ? 34 : Math.abs(x) < 18 ? 27 : 22;
    box(g, 0.85, h, 1.5, x, h / 2, wallZ + 0.5, m.trim);
    box(g, 1.4, 1.4, 1.8, x, 1, 1, m.stone);
    for (let y = 7; y < h; y += 5) {
      box(g, 1.2, 0.4, 1.7, x, y, 0.7, m.trim);
      pointedArch(x, y + 0.35, 1.29, 0.5, 2.4, 0.1, m.dark);
    }
    spire(x, h + 3, 0, 1.1, 7.5);
  }
  function spire(x: number, y: number, z: number, r: number, height: number) {
    cylinder(g, r * 0.65, r, height * 0.32, x, y - height * 0.32, z, m.trim, 8);
    cylinder(g, 0, r * 0.8, height, x, y + height * 0.3, z, m.stone, 6);
    cylinder(g, 0.055, 0.055, 1.2, x, y + height * 0.82, z, m.trim, 5);
  }
  for (const x of [-18, -9, 0, 9, 18]) {
    const main = x === 0,
      doorW = main ? 4 : 2.8,
      doorH = main ? 9 : 7;
    pointedArch(x, 0.4, 1.05, doorW + 1, doorH + 1.2, 0.5, m.trim);
    pointedArch(x, 0.4, 1.62, doorW, doorH, 0.12, m.dark);
    // Bronze portal panels, thin trumeau and archivolts.
    box(g, 0.14, doorH * 0.65, 0.16, x, doorH * 0.325, 1.82, m.stone);
    for (const side of [-1, 1]) {
      box(
        g,
        0.16,
        doorH * 0.7,
        0.16,
        x + side * (doorW / 2 + 0.28),
        doorH * 0.35,
        1.85,
        m.stone,
      );
      for (let j = 1; j < 5; j++)
        box(
          g,
          doorW * 0.36,
          0.08,
          0.08,
          x + side * doorW * 0.25,
          j * 1.05,
          1.82,
          m.bronze,
        );
    }
    const wy = main ? 18 : Math.abs(x) === 9 ? 16 : 13.5,
      wh = main ? 11 : 8,
      ww = main ? 4.5 : 2.6;
    pointedArch(x, wy, 1.1, ww + 0.55, wh + 0.6, 0.3, m.trim);
    pointedArch(x, wy + 0.25, 1.43, ww, wh, 0.12, m.window);
    for (const off of [-0.25, 0, 0.25])
      box(g, 0.09, wh * 0.77, 0.12, x + off * ww, wy + wh * 0.38, 1.7, m.trim);
    for (let j = 1; j < 5; j++)
      box(g, ww, 0.06, 0.12, x, wy + j * wh * 0.145, 1.7, m.trim);
  }
  // Dense pinnacles, finials and roof railings are key to the recognizable skyline.
  for (let x = -21; x <= 21; x += 1.5) {
    const h = Math.abs(x) < 5.2 ? 38 : Math.abs(x) < 14 ? 29 : 22;
    spire(x, h + 0.5, -1, 0.22, 2.5);
    box(g, 1.5, 0.14, 0.35, x, h - 1, 0.2, m.trim);
  }
  for (const z of [-8, -16, -24, -32, -40])
    for (const x of [-15, 15]) {
      box(g, 0.8, 25, 0.8, x, 12.5, z, m.stone);
      spire(x, 27, z, 0.5, 6);
    }
  spire(0, 43, -23, 1, 15);
  const madonna = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 6, 6),
    new THREE.MeshBasicMaterial({ color: "#c9b775" }),
  );
  madonna.position.set(0, 56, -23);
  g.add(madonna);
  for (let i = 0; i < 4; i++)
    box(g, 47 + i * 1.3, 0.22, 1.8, 0, 0.22 * (4 - i), 3 + i * 1.4, m.stone);
  return g;
}
