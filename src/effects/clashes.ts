import * as THREE from "three";
import { unrestAt } from "../simulation/events";
import type { Materials } from "../world/materials";
export class Clashes {
  private stones: THREE.InstancedMesh;
  private canisters: THREE.InstancedMesh;
  private sparks: THREE.Points;
  private data: Float32Array;
  private dummy = new THREE.Object3D();
  private fallen: THREE.Group;
  constructor(scene: THREE.Scene, m: Materials) {
    this.stones = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.065, 0),
      m.stone,
      18,
    );
    this.stones.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.stones.frustumCulled = false;
    scene.add(this.stones);
    this.canisters = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8),
      m.helmet,
      5,
    );
    this.canisters.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.canisters.frustumCulled = false;
    scene.add(this.canisters);
    this.data = new Float32Array(90 * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.data, 3));
    this.sparks = new THREE.Points(
      g,
      new THREE.PointsMaterial({
        color: "#e28c42",
        size: 0.055,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(this.sparks);
    this.fallen = new THREE.Group();
    this.fallen.position.set(7, 0.1, -13);
    scene.add(this.fallen);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.07, 0.07),
      m.helmet,
    );
    frame.position.y = 0.9;
    this.fallen.add(frame);
    for (let i = 0; i < 8; i++) {
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5),
        m.helmet,
      );
      rail.position.set(-0.9 + i * 0.25, 0.45, 0);
      this.fallen.add(rail);
    }
  }
  update(t: number) {
    const u = unrestAt(t),
      d = this.dummy;
    for (let i = 0; i < 18; i++) {
      const phase = (t * 0.24 + i * 0.17) % 1,
        active = u.volley > 0.05 || u.pressure > 0.65;
      const from = -15 + (i % 3),
        to = -24;
      d.position.set(
        -18 + i * 2.1 + Math.sin(i) * 0.6,
        active ? 1.4 + Math.sin(phase * Math.PI) * 3 : -5,
        from + (to - from) * phase,
      );
      d.rotation.set(t * 4 + i, t * 3, 0);
      d.scale.setScalar(1);
      d.updateMatrix();
      this.stones.setMatrixAt(i, d.matrix);
    }
    for (let i = 0; i < 5; i++) {
      const phase = (t * 0.14 + i * 0.2) % 1;
      d.position.set(
        -17 + i * 7,
        1.3 + Math.sin(phase * Math.PI) * 4,
        -24 + phase * 17,
      );
      d.rotation.set(t * 3, i, 1);
      d.updateMatrix();
      this.canisters.setMatrixAt(i, d.matrix);
    }
    for (let i = 0; i < 90; i++) {
      const age = (t * 0.65 + i * 0.011) % 1,
        x = i % 2 ? -12 : 13;
      this.data[i * 3] = x + Math.sin(i * 54) * age * 1.3;
      this.data[i * 3 + 1] = 0.25 + age * (1.6 + (i % 4) * 0.4) - age * age;
      this.data[i * 3 + 2] = -10 + Math.cos(i * 9) * age;
    }
    this.stones.instanceMatrix.needsUpdate = true;
    this.canisters.instanceMatrix.needsUpdate = true;
    this.sparks.geometry.attributes.position.needsUpdate = true;
    this.fallen.rotation.x = -0.7 - u.recoil * 0.65;
    this.fallen.rotation.z = Math.sin(t * 11) * u.charge * 0.025;
  }
}
