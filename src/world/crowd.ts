import * as THREE from "three";
import { random } from "../simulation/math";
import { avoidance, unrestAt, type Threat } from "../simulation/events";
import type { Materials } from "./materials";
import { DetailedPolice } from "./detailed-police";
interface Person {
  x: number;
  z: number;
  phase: number;
  speed: number;
  angle: number;
  police: boolean;
  sign: boolean;
  front: boolean;
  height: number;
}
export class Crowd {
  private detailed: DetailedPolice;
  private lastTime = 0;
  readonly people: Person[] = [];
  private parts: Record<string, THREE.InstancedMesh> = {};
  private signs: { mesh: THREE.Group; owner: number }[] = [];
  private poses: { x: number; z: number; yaw: number }[] = [];
  private dummy = new THREE.Object3D();
  private up = new THREE.Vector3(0, 1, 0);
  private tempA = new THREE.Vector3();
  private tempB = new THREE.Vector3();
  readonly flares: { position: THREE.Vector3; phase: number }[] = [];
  constructor(scene: THREE.Scene, m: Materials) {
    const rng = random(701),
      n = 270,
      policeCount = 44;
    const cloth = new THREE.MeshStandardMaterial({
      color: "#b9bfc1",
      roughness: 0.91,
    });
    const skin = new THREE.MeshStandardMaterial({
      color: "#8e8d80",
      roughness: 0.83,
    });
    const sphere = new THREE.SphereGeometry(1, 12, 10),
      tube = new THREE.CylinderGeometry(1, 1, 1, 9);
    const make = (
      name: string,
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      count: number,
    ) => {
      const mesh = new THREE.InstancedMesh(geo, mat, count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      scene.add(mesh);
      this.parts[name] = mesh;
      return mesh;
    };
    make("torso", sphere, cloth, n);
    make("pelvis", sphere, cloth, n);
    make("heads", sphere, skin, n);
    make("necks", tube, skin, n);
    make("hoods", sphere, cloth, n);
    make("limbs", tube, cloth, n * 8);
    make("joints", sphere, cloth, n * 4);
    make("hands", sphere, skin, n * 2);
    make("boots", sphere, m.dark, n * 2);
    make("helmets", sphere, m.helmet, policeCount);
    make(
      "visors",
      new THREE.SphereGeometry(1, 12, 8, 0, Math.PI),
      m.shield,
      policeCount,
    );
    make(
      "shields",
      new THREE.BoxGeometry(0.58, 0.94, 0.045),
      m.shield,
      policeCount,
    );
    make("batons", tube, m.dark, policeCount);
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 256;
    labelCanvas.height = 64;
    const labelContext = labelCanvas.getContext("2d")!;
    labelContext.fillStyle = "#1b2c3a";
    labelContext.fillRect(0, 0, 256, 64);
    labelContext.fillStyle = "#bcc8cb";
    labelContext.font = "bold 36px Arial";
    labelContext.textAlign = "center";
    labelContext.fillText("POLIZIA", 128, 45);
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    make(
      "labels",
      new THREE.PlaneGeometry(0.5, 0.125),
      new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.8 }),
      policeCount,
    );
    const shadowMap = this.shadowTexture();
    make(
      "shadows",
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: shadowMap,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
      n,
    );
    for (let i = 0; i < n; i++) {
      const police = i < policeCount,
        front = !police && i < policeCount + 65;
      const p: Person = {
        x: police ? -19 + (i % 22) * 1.78 : (rng() - 0.5) * 62,
        z: police
          ? -20 - Math.floor(i / 22) * 1.35
          : front
            ? -16 + rng() * 5
            : -9 + rng() * 46,
        phase: rng() * 6.28,
        speed: 0.15 + rng() * 0.3,
        angle: police ? 0 : Math.PI + (rng() - 0.5) * 1.6,
        police,
        front,
        sign: !police && !front && rng() < 0.11,
        height: 0.92 + rng() * 0.16,
      };
      if (police && i >= 22 && i < 28) {
        p.x = -7 + (i - 22) * 0.85;
        p.z = 10 + (i - 22) * 0.6;
      }
      if (!police && Math.hypot(p.x - 2, p.z - 21) < 4.5) p.z -= 10;
      this.people.push(p);
      const color = new THREE.Color().setHSL(
        0.19 + rng() * 0.13,
        0.05 + rng() * 0.12,
        0.075 + rng() * 0.13,
      );
      if (police) color.set("#172630");
      for (const key of ["torso", "pelvis", "hoods"])
        this.parts[key].setColorAt(i, color);
      for (let j = 0; j < 8; j++) this.parts.limbs.setColorAt(i * 8 + j, color);
      for (let j = 0; j < 4; j++)
        this.parts.joints.setColorAt(i * 4 + j, color);
      const face = new THREE.Color().setHSL(0.08, 0.12, 0.35 + rng() * 0.25);
      this.parts.heads.setColorAt(i, face);
      this.parts.necks.setColorAt(i, face);
      for (let j = 0; j < 2; j++) this.parts.hands.setColorAt(i * 2 + j, face);
      if (p.sign) {
        const sign = new THREE.Group(),
          pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.018, 1.3, 6),
            m.bronze,
          );
        pole.position.y = 0.85;
        sign.add(pole);
        const face = new THREE.Mesh(
          new THREE.PlaneGeometry(0.85, 0.58),
          this.signMaterial(i),
        );
        face.position.y = 1.5;
        sign.add(face);
        scene.add(sign);
        this.signs.push({ mesh: sign, owner: i });
      }
    }
    for (const [x, z, phase] of [
      [-12, -10, 0],
      [13, -15, 2],
      [-22, 12, 5],
      [10, 26, 4],
    ]) {
      this.flares.push({ position: new THREE.Vector3(x, 0.25, z), phase });
      const light = new THREE.PointLight("#ff4f25", 65, 19, 1.8);
      light.position.set(x, 0.8, z);
      scene.add(light);
      const emitter = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 10, 8),
        m.flare,
      );
      emitter.position.set(x, 0.25, z);
      scene.add(emitter);
    }
    this.detailed = new DetailedPolice(scene, (index) => {
      for (const name of [
        "torso",
        "pelvis",
        "heads",
        "necks",
        "hoods",
        "helmets",
        "visors",
      ])
        this.set(name, index, 0, -10, 0, 0, 0, 0);
      for (let j = 0; j < 8; j++)
        this.set("limbs", index * 8 + j, 0, -10, 0, 0, 0, 0);
      for (let j = 0; j < 4; j++)
        this.set("joints", index * 4 + j, 0, -10, 0, 0, 0, 0);
      for (let j = 0; j < 2; j++) {
        this.set("hands", index * 2 + j, 0, -10, 0, 0, 0, 0);
        this.set("boots", index * 2 + j, 0, -10, 0, 0, 0, 0);
      }
    });
    this.update(0, []);
  }
  private shadowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d")!,
      g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "#000a");
    g.addColorStop(1, "#0000");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  private signMaterial(index: number) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 160;
    const x = c.getContext("2d")!;
    x.fillStyle = "#93907d";
    x.fillRect(0, 0, 256, 160);
    x.fillStyle = "#30352a";
    x.textAlign = "center";
    x.font = "bold 25px sans-serif";
    const w = [
      ["ASCOLTATECI", ""],
      ["RESTIAMO", "QUI"],
      ["UN’ALTRA", "NOTTE"],
      ["IL FUTURO", "È APERTO"],
    ][index % 4];
    x.fillText(w[0], 128, 75);
    x.fillText(w[1], 128, 113);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map,
      side: THREE.DoubleSide,
      roughness: 1,
    });
  }
  private set(
    name: string,
    index: number,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    const d = this.dummy;
    d.position.set(x, y, z);
    d.rotation.set(rx, ry, rz);
    d.scale.set(sx, sy, sz);
    d.updateMatrix();
    this.parts[name].setMatrixAt(index, d.matrix);
  }
  private bone(index: number, a: THREE.Vector3, b: THREE.Vector3, r: number) {
    const d = this.dummy;
    d.position.copy(a).add(b).multiplyScalar(0.5);
    this.tempB.copy(b).sub(a);
    d.quaternion.setFromUnitVectors(this.up, this.tempB.clone().normalize());
    d.scale.set(r, this.tempB.length(), r);
    d.updateMatrix();
    this.parts.limbs.setMatrixAt(index, d.matrix);
  }
  update(t: number, threats: readonly Threat[]) {
    const dt = Math.min(0.1, Math.max(0, t - this.lastTime));
    this.lastTime = t;
    const unrest = unrestAt(t);
    this.people.forEach((p, i) => {
      const fear = avoidance(p.x, p.z, threats),
        panic = Math.min(1, Math.hypot(fear.x, fear.z) * 0.24);
      const charge = p.police
        ? unrest.charge * 3.3 - unrest.recoil * 0.8
        : p.front
          ? -unrest.pressure * 2.4 + unrest.charge * 1.9 + unrest.recoil * 2.5
          : 0;
      const x =
        p.x +
        Math.sin(t * p.speed + p.phase) * (p.police ? 0.15 : 0.8) +
        fear.x * 1.1;
      const z =
        p.z +
        charge +
        Math.cos(t * p.speed * 0.7 + p.phase) * (p.police ? 0.08 : 0.65) +
        Math.abs(fear.z) * 0.8 +
        panic * 2.5;
      const fight = (p.front || p.police) && unrest.pressure > 0.48;
      const motion = panic > 0.1 ? 5.8 : fight ? 4.2 : 2,
        phase = t * motion + p.phase,
        stride =
          Math.sin(phase) *
          (p.police ? unrest.charge * 0.25 : 0.18 + panic * 0.35);
      const bob = Math.abs(Math.sin(phase)) * (0.012 + panic * 0.035),
        height = p.height;
      const yaw =
        panic > 0.35
          ? Math.atan2(fear.x, fear.z)
          : p.police
            ? 0
            : p.front
              ? Math.PI
              : p.angle;
      this.poses[i] = { x, z, yaw };
      if (this.detailed.has(i)) {
        this.detailed.update(
          i,
          x,
          z,
          yaw,
          height,
          Math.max(unrest.charge, panic),
          dt,
        );
        this.set(
          "shields",
          i,
          x,
          1.02 * height,
          z + 0.45,
          1,
          1,
          1,
          -0.12 - unrest.charge * 0.2,
          yaw,
        );
        this.set(
          "labels",
          i,
          x,
          1.2 * height,
          z + 0.5,
          1,
          1,
          1,
          -0.12 - unrest.charge * 0.2,
          yaw,
        );
        this.set(
          "batons",
          i,
          x + 0.35,
          1.28 + Math.max(0, Math.sin(t * 5.5 + p.phase)) * 0.35,
          z + 0.48,
          0.025,
          0.65,
          0.025,
          fight ? -1.1 : -0.3,
          0,
          0.2,
        );
        this.set("shadows", i, x, 0.013, z, 1.2, 0.7, 1, -Math.PI / 2);
        return;
      }

      const local = (xx: number, yy: number, zz: number) =>
        new THREE.Vector3(
          x + (xx * Math.cos(yaw) + zz * Math.sin(yaw)) * height,
          yy * height + bob,
          z + (-xx * Math.sin(yaw) + zz * Math.cos(yaw)) * height,
        );
      const torso = local(0, 1.19, fight ? 0.04 : 0);
      this.set(
        "torso",
        i,
        torso.x,
        torso.y,
        torso.z,
        0.235 * height,
        0.32 * height,
        0.14 * height,
        fight ? -0.12 : 0,
        yaw,
      );
      const pelvis = local(0, 0.88, 0);
      this.set(
        "pelvis",
        i,
        pelvis.x,
        pelvis.y,
        pelvis.z,
        0.19 * height,
        0.135 * height,
        0.14 * height,
        0,
        yaw,
      );
      const head = local(0, 1.64, 0.025);
      this.set(
        "heads",
        i,
        head.x,
        head.y,
        head.z,
        0.105 * height,
        0.135 * height,
        0.115 * height,
        -0.04,
        yaw,
      );
      const neck = local(0, 1.48, 0);
      this.set(
        "necks",
        i,
        neck.x,
        neck.y,
        neck.z,
        0.05 * height,
        0.14 * height,
        0.05 * height,
        0,
        yaw,
      );
      this.set(
        "hoods",
        i,
        head.x,
        head.y + 0.012,
        head.z - 0.035,
        0.12 * height,
        p.police ? 0 : 0.14 * height,
        0.12 * height,
        0,
        yaw,
      );
      this.set("shadows", i, x, 0.013, z, 1.2, 0.7, 1, -Math.PI / 2);
      for (const side of [-1, 1]) {
        const k = side === 1 ? 1 : 0,
          step = stride * side;
        const hip = local(side * 0.12, 0.85, 0),
          knee = local(side * 0.13, 0.49, step),
          ankle = local(side * 0.14, 0.09, -step * 0.8);
        this.bone(i * 8 + k * 4, hip, knee, 0.095 * height);
        this.bone(i * 8 + k * 4 + 1, knee, ankle, 0.072 * height);
        this.set(
          "joints",
          i * 4 + k,
          knee.x,
          knee.y,
          knee.z,
          0.09 * height,
          0.095 * height,
          0.088 * height,
        );
        this.set(
          "boots",
          i * 2 + k,
          ankle.x,
          0.065 * height,
          ankle.z + 0.035,
          0.09 * height,
          0.07 * height,
          0.16 * height,
          0,
          yaw,
        );
        const shoulder = local(side * 0.215, 1.4, 0);
        const swing = fight ? Math.max(0, Math.sin(t * 5.5 + p.phase)) * 1 : 0;
        const elbow = local(
          side * 0.29,
          fight ? 1.2 + swing * 0.13 : 1.12,
          fight ? 0.24 : -step * 0.6,
        );
        const hand = local(
          side * 0.27,
          fight ? 1.15 + swing * 0.45 : p.sign && side === 1 ? 1.85 : 0.89,
          fight ? 0.4 + swing * 0.25 : step * 0.5,
        );
        this.bone(i * 8 + k * 4 + 2, shoulder, elbow, 0.079 * height);
        this.bone(i * 8 + k * 4 + 3, elbow, hand, 0.061 * height);
        this.set(
          "joints",
          i * 4 + 2 + k,
          elbow.x,
          elbow.y,
          elbow.z,
          0.075 * height,
          0.075 * height,
          0.075 * height,
        );
        this.set(
          "hands",
          i * 2 + k,
          hand.x,
          hand.y,
          hand.z,
          0.045 * height,
          0.066 * height,
          0.04 * height,
          0,
          yaw,
        );
      }
      if (p.police) {
        this.set(
          "labels",
          i,
          x,
          1.2 * height,
          z + 0.5,
          1,
          1,
          1,
          -0.12 - unrest.charge * 0.2,
          yaw,
        );
        this.set(
          "helmets",
          i,
          head.x,
          head.y + 0.03,
          head.z,
          0.135 * height,
          0.15 * height,
          0.145 * height,
          0,
          yaw,
        );
        this.set(
          "visors",
          i,
          head.x,
          head.y - 0.01,
          head.z + 0.04,
          0.14 * height,
          0.13 * height,
          0.14 * height,
          0.12,
          yaw,
        );
        this.set(
          "shields",
          i,
          x,
          1.02 * height,
          z + 0.45,
          1,
          1,
          1,
          -0.12 - unrest.charge * 0.2,
          yaw,
        );
        this.set(
          "batons",
          i,
          x + 0.35,
          1.28 + Math.max(0, Math.sin(t * 5.5 + p.phase)) * 0.35,
          z + 0.48,
          0.025,
          0.65,
          0.025,
          fight ? -1.1 : -0.3,
          0,
          0.2,
        );
      }
    });
    for (const { mesh, owner } of this.signs) {
      const pose = this.poses[owner];
      mesh.position.set(
        pose.x + 0.3,
        1.1 + Math.sin(t * 0.9 + owner) * 0.045,
        pose.z,
      );
      mesh.rotation.set(0, pose.yaw, Math.sin(t * 0.7 + owner) * 0.09);
    }
    for (const mesh of Object.values(this.parts))
      mesh.instanceMatrix.needsUpdate = true;
  }
}
