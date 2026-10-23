import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
interface Unit {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  idle: THREE.AnimationAction;
  walk: THREE.AnimationAction;
  run: THREE.AnimationAction;
  active: THREE.AnimationAction;
  scale: number;
}
/** A small detailed front row; the larger crowd keeps using efficient instancing. */
export class DetailedPolice {
  private units = new Map<number, Unit>();
  ready = false;
  constructor(scene: THREE.Scene, hideProxy: (index: number) => void) {
    new GLTFLoader().load(
      "/models/riot-unit.glb",
      (gltf) => {
        const height = new THREE.Box3()
          .setFromObject(gltf.scene)
          .getSize(new THREE.Vector3()).y;
        const materials = new Map<THREE.Material, THREE.Material>();
        gltf.scene.traverse((o) => {
          if (o instanceof THREE.Mesh && !Array.isArray(o.material)) {
            let mat = materials.get(o.material);
            if (!mat) {
              const replacement: THREE.Material = o.material.clone();
              if (replacement instanceof THREE.MeshStandardMaterial) {
                replacement.color.multiply(new THREE.Color("#67737a"));
                replacement.roughness = 0.76;
              }
              materials.set(o.material, replacement);
              mat = replacement;
            }
            o.material = mat;
            o.frustumCulled = false;
          }
        });
        for (let i = 0; i < 28; i++) {
          const root = clone(gltf.scene),
            scale = 1.8 / height;
          root.scale.setScalar(scale);
          root.visible = false;
          scene.add(root);
          const mixer = new THREE.AnimationMixer(root),
            clip = (name: string) =>
              gltf.animations.find((a) => a.name === name)!;
          const idle = mixer.clipAction(clip("Idle")),
            walk = mixer.clipAction(clip("Walk")),
            run = mixer.clipAction(clip("Run"));
          idle.play();
          idle.time = i * 0.137;
          this.units.set(i, {
            root,
            mixer,
            idle,
            walk,
            run,
            active: idle,
            scale,
          });
          hideProxy(i);
        }
        this.ready = true;
      },
      undefined,
      () => {
        /* The procedural riot units remain if the optional detailed asset fails. */
      },
    );
  }
  has(index: number) {
    return this.units.has(index);
  }
  update(
    index: number,
    x: number,
    z: number,
    yaw: number,
    height: number,
    activity: number,
    dt: number,
  ) {
    const u = this.units.get(index);
    if (!u) return;
    u.root.visible = true;
    u.root.position.set(x, 0, z);
    u.root.rotation.y = yaw;
    u.root.scale.setScalar(u.scale * height);
    const next = activity > 0.65 ? u.run : activity > 0.12 ? u.walk : u.idle;
    if (next !== u.active) {
      u.active.fadeOut(0.22);
      next.reset().fadeIn(0.22).play();
      u.active = next;
    }
    u.mixer.update(dt);
  }
}
