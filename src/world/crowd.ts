import * as THREE from "three";
import { random } from "../simulation/math";
import type { Materials } from "./materials";
interface Person {
  x: number;
  z: number;
  phase: number;
  speed: number;
  angle: number;
  police: boolean;
  sign: boolean;
  flare: boolean;
}
export class Crowd {
  readonly people: Person[] = [];
  private body: THREE.InstancedMesh;
  private heads: THREE.InstancedMesh;
  private legs: THREE.InstancedMesh;
  private arms: THREE.InstancedMesh;
  private shields: THREE.InstancedMesh;
  private helmets: THREE.InstancedMesh;
  private signs: { mesh: THREE.Group; owner: number }[] = [];
  private dummy = new THREE.Object3D();
  readonly flares: { position: THREE.Vector3; phase: number }[] = [];
  constructor(scene: THREE.Scene, m: Materials) {
    const rng = random(701),
      n = 210,
      policeCount = 36;
    this.body = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.21, 0.27, 0.67, 6),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1 }),
      n,
    );
    this.heads = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.145, 7, 6),
      m.skin,
      n,
    );
    this.legs = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.075, 0.065, 0.76, 5),
      m.dark,
      n * 2,
    );
    this.arms = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.066, 0.06, 0.55, 5),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1 }),
      n * 2,
    );
    this.helmets = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.18, 8, 6),
      m.helmet,
      policeCount,
    );
    this.shields = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.62, 0.95, 0.04),
      m.shield,
      policeCount,
    );
    for (const mesh of [
      this.body,
      this.heads,
      this.legs,
      this.arms,
      this.helmets,
      this.shields,
    ]) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      scene.add(mesh);
    }
    for (let i = 0; i < n; i++) {
      const police = i < policeCount;
      const p = {
        x: police ? -18 + (i % 18) * 2.05 : (rng() - 0.5) * 61,
        z: police ? -23 - Math.floor(i / 18) * 1.5 : -15 + rng() * 53,
        phase: rng() * Math.PI * 2,
        speed: 0.08 + rng() * 0.17,
        angle: police ? 0 : (rng() - 0.5) * 2.4,
        police,
        sign: !police && rng() < 0.19,
        flare: false,
      };
      if (!police && Math.hypot(p.x - 2, p.z - 21) < 5) p.z -= 12;
      this.people.push(p);
      const coat = new THREE.Color().setHSL(
        0.22 + rng() * 0.08,
        0.06 + rng() * 0.1,
        0.075 + rng() * 0.06,
      );
      if (police) coat.set("#162022");
      this.body.setColorAt(i, coat);
      this.arms.setColorAt(i * 2, coat);
      this.arms.setColorAt(i * 2 + 1, coat);
      this.heads.setColorAt(
        i,
        new THREE.Color().setHSL(0.11, 0.08, 0.16 + rng() * 0.14),
      );
      if (p.sign) {
        const sign = new THREE.Group();
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 1.3, 4),
          m.bronze,
        );
        pole.position.y = 0.9;
        sign.add(pole);
        const face = new THREE.Mesh(
          new THREE.PlaneGeometry(0.9, 0.62),
          this.signMaterial(i),
        );
        face.position.y = 1.55;
        sign.add(face);
        scene.add(sign);
        this.signs.push({ mesh: sign, owner: i });
      }
    }
    for (const [x, z, phase] of [
      [-12, -7, 0],
      [13, -13, 2],
      [-22, 16, 5],
      [8, 24, 4],
    ]) {
      this.flares.push({ position: new THREE.Vector3(x, 1.6, z), phase });
      const glow = new THREE.PointLight("#fc5a2c", 45, 15, 2);
      glow.position.set(x, 1.8, z);
      scene.add(glow);
      const ember = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 8, 6),
        m.flare,
      );
      ember.position.set(x, 1.6, z);
      scene.add(ember);
    }
    this.update(0);
  }
  private signMaterial(index: number) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 160;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#838574";
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = "#2a3428";
    ctx.textAlign = "center";
    ctx.font = "bold 28px sans-serif";
    const words = [
      ["ASCOLTATECI", ""],
      ["RESTIAMO", "QUI"],
      ["UN’ALTRA", "NOTTE"],
      ["IL FUTURO", "È APERTO"],
    ][index % 4];
    ctx.fillText(words[0], 128, 75);
    ctx.fillText(words[1], 128, 113);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map: t,
      side: THREE.DoubleSide,
      roughness: 1,
    });
  }
  update(t: number) {
    const d = this.dummy;
    const set = (
      mesh: THREE.InstancedMesh,
      i: number,
      x: number,
      y: number,
      z: number,
      rx = 0,
      ry = 0,
      rz = 0,
    ) => {
      d.position.set(x, y, z);
      d.rotation.set(rx, ry, rz);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    };
    this.people.forEach((p, i) => {
      const x = p.x + (p.police ? 0 : Math.sin(t * p.speed + p.phase) * 1.4),
        z = p.z + (p.police ? 0 : Math.cos(t * p.speed * 0.7 + p.phase) * 1.2),
        bob = Math.sin(t * 1.5 + p.phase) * (p.police ? 0.006 : 0.022),
        swing = Math.sin(t * 1.5 + p.phase) * (p.police ? 0.01 : 0.17);
      set(this.body, i, x, 1.05 + bob, z, 0, p.angle);
      set(this.heads, i, x, 1.6 + bob, z, 0, p.angle);
      for (const side of [-1, 1]) {
        const k = i * 2 + (side === 1 ? 1 : 0);
        set(this.legs, k, x + side * 0.12, 0.42, z, side * swing, p.angle);
        const raised = !p.police && (i % 9 === 0 || p.sign) && side === 1;
        set(
          this.arms,
          k,
          x + side * 0.31,
          raised ? 1.55 : 1.04 + bob,
          z,
          raised ? -0.4 : side * swing,
          p.angle,
          raised ? -0.5 : side * 0.09,
        );
      }
      if (p.police) {
        set(this.helmets, i, x, 1.66, z);
        set(this.shields, i, x, 1, z + 0.39, -0.08);
      }
    });
    for (const { mesh, owner } of this.signs) {
      const p = this.people[owner];
      mesh.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 1.4 + 0.3,
        1.1 + Math.sin(t * 0.8 + p.phase) * 0.05,
        p.z + Math.cos(t * p.speed * 0.7 + p.phase) * 1.2,
      );
      mesh.rotation.set(0, p.angle, Math.sin(t * 0.5 + p.phase) * 0.08);
    }
    for (const mesh of [
      this.body,
      this.heads,
      this.legs,
      this.arms,
      this.helmets,
      this.shields,
    ])
      mesh.instanceMatrix.needsUpdate = true;
  }
}
