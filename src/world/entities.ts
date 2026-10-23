import * as THREE from "three";
import type { Materials } from "./materials";
import { mergeStatic } from "./merge";
import { attackAt, type Threat } from "../simulation/events";
interface Limb {
  bones: THREE.Group[];
  phase: number;
  attackArm: boolean;
  root: THREE.Group;
  baseX: number;
}
interface Creature {
  root: THREE.Group;
  torso: THREE.Group;
  jaw: THREE.Group;
  limbs: Limb[];
  phase: number;
  x: number;
  z: number;
  scale: number;
  eyes: THREE.Mesh[];
}
/** Creatures attack the scene and scatter NPCs; the observer is never a target. */
export class Entities {
  readonly threats: Threat[] = [];
  private creatures: Creature[] = [];
  private up = new THREE.Vector3(0, 1, 0);
  constructor(scene: THREE.Scene, m: Materials) {
    const toothMat = new THREE.MeshStandardMaterial({
      color: "#9a9e7a",
      roughness: 0.65,
    });
    const mouthMat = new THREE.MeshStandardMaterial({
      color: "#100e0b",
      roughness: 0.32,
    });
    for (const [x, z, scale, phase] of [
      [-23, -27, 1.35, 0],
      [26, -32, 1.7, 5],
      [14, 0, 0.66, 10],
    ]) {
      const root = new THREE.Group();
      root.position.set(x, 0, z);
      root.scale.setScalar(scale);
      scene.add(root);
      const torso = new THREE.Group();
      torso.position.y = 10.8;
      root.add(torso);
      const mass = new THREE.Mesh(
        new THREE.SphereGeometry(1, 24, 20),
        m.monster,
      );
      mass.scale.set(2.3, 4.3, 1.7);
      mass.rotation.x = 0.27;
      torso.add(mass);
      const skull = new THREE.Mesh(
        new THREE.SphereGeometry(1, 24, 20),
        m.monster,
      );
      skull.scale.set(1.75, 2.1, 1.6);
      skull.position.set(0, 3.7, 1.2);
      skull.rotation.x = 0.28;
      torso.add(skull);
      // Obsidian ribs, shoulder blades and thorned spine break the smooth balloon silhouette.
      for (let i = 0; i < 8; i++) {
        const rib = new THREE.Mesh(
          new THREE.TorusGeometry(1.7 - i * 0.07, 0.12, 5, 18, Math.PI * 1.3),
          m.monster,
        );
        rib.position.set(0, -2 + i * 0.7, 0.4);
        rib.rotation.set(Math.PI / 2, 0.12, Math.PI * 0.85);
        torso.add(rib);
        for (const side of [-1, 1]) {
          const thorn = new THREE.Mesh(
            new THREE.ConeGeometry(0.26, 0.9 + i * 0.09, 6),
            m.monster,
          );
          thorn.position.set(
            side * (1.8 + Math.sin(i) * 0.15),
            -2 + i * 0.75,
            -0.4,
          );
          thorn.rotation.z = -side * 0.8;
          torso.add(thorn);
        }
      }
      const mouth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 20, 12),
        mouthMat,
      );
      mouth.scale.set(1.05, 1.45, 0.3);
      mouth.position.set(0, 3.25, 2.93);
      torso.add(mouth);
      const jaw = new THREE.Group();
      jaw.position.set(0, 2.1, 2.92);
      torso.add(jaw);
      const mandible = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.22, 8, 18, Math.PI),
        m.monster,
      );
      mandible.rotation.z = Math.PI;
      mandible.position.y = -0.1;
      jaw.add(mandible);
      for (let i = 0; i < 16; i++)
        for (const lower of [false, true]) {
          const theta = (i / 15) * Math.PI,
            px = Math.cos(theta) * 0.93,
            py = Math.sin(theta) * 0.6;
          const tooth = new THREE.Mesh(
            new THREE.ConeGeometry(0.075, 0.5 + (i % 3) * 0.12, 5),
            toothMat,
          );
          tooth.position.set(
            px,
            lower ? -0.1 - py : 4.05 + py,
            lower ? 0.15 : 3.2,
          );
          tooth.rotation.z = lower ? 0 : Math.PI;
          (lower ? jaw : torso).add(tooth);
        }
      const faceLight = new THREE.PointLight("#c28b64", 8, 9, 1.6);
      faceLight.position.set(0, 4.5, 4.1);
      torso.add(faceLight);
      for (const side of [-1, 1]) {
        const points = [
          new THREE.Vector3(side, 4.5, 0.8),
          new THREE.Vector3(side * 1.8, 5.8, 0.1),
          new THREE.Vector3(side * 2.5, 6.9, -0.6),
          new THREE.Vector3(side * 2.3, 7.6, -1.1),
        ];
        const horn = new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            20,
            0.19,
            8,
            false,
          ),
          m.monster,
        );
        torso.add(horn);
      }
      mergeStatic(jaw);
      const eyes: THREE.Mesh[] = [];
      const eyeMaterial = new THREE.MeshBasicMaterial({
        color: "#ff9c45",
        toneMapped: false,
      });
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++) {
          const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 10, 8),
            eyeMaterial,
          );
          eye.scale.set(1, 0.4, 1);
          eye.position.set(
            side * (0.5 + i * 0.28),
            4.4 + i * 0.12,
            3.02 - i * 0.02,
          );
          torso.add(eye);
          eyes.push(eye);
          const brow = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.12, 0.7, 4, 8),
            m.monster,
          );
          brow.rotation.z = side * 0.9;
          brow.position.set(side * (0.8 + i * 0.1), 4.7, 3.08);
          torso.add(brow);
        }
      // Four bowed, weight-bearing legs actually meet the pavement.
      for (let i = 0; i < 4; i++) {
        const side = i % 2 ? -1 : 1,
          back = i < 2 ? -1 : 1;
        const points = [
          new THREE.Vector3(side * 1.5, 10, back * 0.6),
          new THREE.Vector3(side * 4.4, 7, back * 2),
          new THREE.Vector3(side * 5, 3.5, back * 3.4),
          new THREE.Vector3(side * 6, 0.15, back * 4.2),
        ];
        const leg = new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            28,
            0.32,
            8,
            false,
          ),
          m.monster,
        );
        root.add(leg);
        for (let j = 0; j < 3; j++) {
          const claw = new THREE.Mesh(
            new THREE.ConeGeometry(0.14, 1.2, 6),
            toothMat,
          );
          claw.rotation.z = side * 0.7;
          claw.position.set(side * (6 + j * 0.22), 0.38, back * 4.2 + j * 0.2);
          root.add(claw);
        }
      }
      const limbs: Limb[] = [];
      for (let i = 0; i < 8; i++) {
        const limbRoot = new THREE.Group();
        limbRoot.position.set((i % 2 ? 1 : -1) * 1.5, 1.5 + (i % 3) * 0.7, 0.4);
        limbRoot.rotation.set(
          i < 4 ? 1.9 : -0.2,
          0,
          (i % 2 ? 1 : -1) * (i < 4 ? 0.7 : 1.25),
        );
        torso.add(limbRoot);
        const bones: THREE.Group[] = [];
        let parent: THREE.Object3D = limbRoot;
        for (let j = 0; j < 10; j++) {
          const b = new THREE.Group();
          if (j) b.position.y = 1.3;
          parent.add(b);
          const r = 0.36 * (1 - j / 11);
          const segment = new THREE.Mesh(
            new THREE.CylinderGeometry(r * 0.82, r, 1.35, 10),
            m.monster,
          );
          segment.position.y = 0.65;
          b.add(segment);
          if (j > 3 && j % 2 === 0) {
            const spike = new THREE.Mesh(
              new THREE.ConeGeometry(0.1, 0.6, 5),
              m.monster,
            );
            spike.rotation.z = 1.4;
            spike.position.set(0.25, 0.7, 0);
            b.add(spike);
          }
          mergeStatic(b);
          bones.push(b);
          parent = b;
        }
        limbs.push({
          bones,
          phase: i * 0.65 + phase,
          attackArm: i < 4,
          root: limbRoot,
          baseX: i < 4 ? 1.9 : -0.2,
        });
      }
      const shell = new THREE.Group();
      torso.add(shell);
      for (const child of [...torso.children])
        if (child instanceof THREE.Mesh && !eyes.includes(child))
          shell.add(child);
      mergeStatic(shell);
      const legs = new THREE.Group();
      root.add(legs);
      for (const child of [...root.children])
        if (child instanceof THREE.Mesh) legs.add(child);
      mergeStatic(legs);
      this.creatures.push({
        root,
        torso,
        jaw,
        limbs,
        phase,
        x,
        z,
        scale,
        eyes,
      });
      this.threats.push({ x, z, radius: 10 * scale, strength: 0 });
    }
    this.update(0);
  }
  update(t: number) {
    this.creatures.forEach((c, index) => {
      const attack = attackAt(t, c.phase),
        lunge = attack.strike;
      c.torso.position.set(
        Math.sin(t * 0.3 + c.phase) * 0.15,
        10.8 - lunge * 1.8,
        Math.sin(t * 0.25 + c.phase) * 0.3 + lunge * 3.1,
      );
      c.torso.rotation.x = 0.08 + attack.windup * 0.13 + lunge * 0.48;
      c.torso.rotation.z = Math.sin(t * 0.4 + c.phase) * 0.045;
      c.jaw.rotation.x = 0.22 + attack.windup * 0.25 + lunge * 0.7;
      for (const limb of c.limbs) {
        limb.root.rotation.x =
          limb.baseX + (limb.attackArm ? lunge * 0.45 : attack.windup * 0.1);
        limb.bones.forEach((bone, i) => {
          const whip = limb.attackArm
            ? Math.sin(i * 0.5 - lunge * 3) * lunge
            : 0;
          bone.rotation.x =
            Math.sin(t * 0.7 + limb.phase + i * 0.4) * 0.17 + whip * 0.32;
          bone.rotation.z =
            Math.sin(t * 0.55 + limb.phase + i * 0.35) * 0.22 +
            attack.windup * 0.035;
        });
      }
      for (const eye of c.eyes)
        eye.scale.y = 0.3 + attack.windup * 0.2 + lunge * 0.35;
      Object.assign(this.threats[index], {
        x: c.x,
        z: c.z + lunge * 4 * c.scale,
        strength: 1.5 + attack.windup + 7 * lunge,
      });
    });
  }
}
