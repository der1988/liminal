import * as THREE from "three";
import type { Materials } from "./materials";
interface Limb {
  bones: THREE.Group[];
  phase: number;
  root: THREE.Group;
  length: number;
}
/** No attack logic, hitboxes or player targeting. These are autonomous silhouettes. */
export class Entities {
  private limbs: Limb[] = [];
  private bodies: { mesh: THREE.Mesh; phase: number; y: number }[] = [];
  constructor(scene: THREE.Scene, m: Materials) {
    for (const [x, z, scale, phase] of [
      [-26, -38, 1.25, 0],
      [29, -39, 1.5, 2],
      [8, 39, 0.8, 4],
    ]) {
      const root = new THREE.Group();
      root.position.set(x, 0, z);
      root.scale.setScalar(scale);
      scene.add(root);
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(1, 14, 10),
        m.monster,
      );
      body.scale.set(2.4, 6.5, 1.8);
      body.position.set(0, 22, 0);
      body.rotation.z = 0.15;
      root.add(body);
      this.bodies.push({ mesh: body, phase, y: 22 });
      // A small set of dim eyes stays barely legible through the fog.
      const eyeMat = new THREE.MeshBasicMaterial({ color: "#b4bd83" });
      for (const off of [-0.4, 0.1, 0.5]) {
        const eye = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 5, 4),
          eyeMat,
        );
        eye.position.set(off, 24.8, 1.6);
        root.add(eye);
      }
      for (let i = 0; i < 8; i++) {
        const limbRoot = new THREE.Group();
        limbRoot.position.set(
          Math.cos(i) * 1.5,
          i < 4 ? 19 : 26,
          Math.sin(i) * 1.2,
        );
        limbRoot.rotation.y = i * Math.PI * 0.25;
        root.add(limbRoot);
        const bones: THREE.Group[] = [];
        let parent: THREE.Object3D = limbRoot;
        const length = i < 4 ? 2.4 : 2;
        for (let j = 0; j < 9; j++) {
          const bone = new THREE.Group();
          if (j > 0) bone.position.y = length;
          parent.add(bone);
          const r = (1 - j / 10) * (i < 4 ? 0.46 : 0.32);
          const segment = new THREE.Mesh(
            new THREE.CylinderGeometry(r * 0.8, r, length, 6),
            m.monster,
          );
          segment.position.y = length / 2;
          bone.add(segment);
          bones.push(bone);
          parent = bone;
        }
        this.limbs.push({
          bones,
          phase: phase + i * 0.8,
          root: limbRoot,
          length,
        });
        limbRoot.rotation.z = i < 4 ? 2.3 + i * 0.3 : 0.3 + (i - 4) * 0.3;
      }
    }
  }
  update(t: number) {
    for (const l of this.limbs) {
      l.bones.forEach((b, i) => {
        b.rotation.x = Math.sin(t * 0.19 + l.phase + i * 0.38) * 0.16;
        b.rotation.z = Math.sin(t * 0.14 + l.phase + i * 0.46) * 0.19 + 0.08;
      });
    }
    for (const b of this.bodies) {
      b.mesh.position.y = b.y + Math.sin(t * 0.25 + b.phase) * 0.25;
      b.mesh.scale.x = 2.4 + Math.sin(t * 0.3 + b.phase) * 0.07;
    }
  }
}
