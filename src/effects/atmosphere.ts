import * as THREE from "three";
import { random } from "../simulation/math";
import type { Lamp } from "../world/city";
function cloudTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,.4)");
  grad.addColorStop(0.3, "rgba(255,255,255,.27)");
  grad.addColorStop(0.65, "rgba(255,255,255,.08)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
export class Atmosphere {
  private smoke: {
    sprite: THREE.Sprite;
    x: number;
    y: number;
    z: number;
    phase: number;
    red: boolean;
  }[] = [];
  private halos: { sprite: THREE.Sprite; lamp: Lamp }[] = [];
  private ash: THREE.Points;
  private positions: Float32Array;
  private rng = random(888);
  constructor(
    scene: THREE.Scene,
    lamps: Lamp[],
    flares: { position: THREE.Vector3; phase: number }[],
  ) {
    const map = cloudTexture();
    for (let i = 0; i < 42; i++) {
      const red = i < 14;
      const x = red
          ? (i % 2 ? -12 : 13) + (this.rng() - 0.5) * 9
          : (this.rng() - 0.5) * 90,
        z = red ? -10 + (this.rng() - 0.5) * 20 : -45 + this.rng() * 80,
        y = 1 + this.rng() * 9;
      const mat = new THREE.SpriteMaterial({
        map,
        color: red ? "#ca7850" : "#a6b29a",
        transparent: true,
        opacity: red ? 0.36 : 0.19,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(x, y, z);
      sprite.scale.set(13 + this.rng() * 12, 6 + this.rng() * 9, 1);
      scene.add(sprite);
      this.smoke.push({ sprite, x, y, z, phase: this.rng() * 6, red });
    }
    const all = [
      ...lamps,
      ...flares.map((f) => ({
        position: f.position,
        phase: f.phase,
        kind: "red" as const,
      })),
    ];
    for (const lamp of all) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map,
          color:
            lamp.kind === "red"
              ? "#ff6739"
              : lamp.kind === "blue"
                ? "#779eee"
                : "#ffd0a1",
          transparent: true,
          opacity: lamp.kind === "blue" ? 0.7 : 0.8,
          toneMapped: false,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      sprite.position.copy(lamp.position);
      sprite.scale.setScalar(
        lamp.kind === "red" ? 5 : lamp.kind === "blue" ? 3 : 3.8,
      );
      scene.add(sprite);
      this.halos.push({ sprite, lamp });
    }
    this.positions = new Float32Array(270 * 3);
    for (let i = 0; i < 270; i++) {
      this.positions[i * 3] = (this.rng() - 0.5) * 100;
      this.positions[i * 3 + 1] = this.rng() * 24;
      this.positions[i * 3 + 2] = (this.rng() - 0.5) * 120;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.ash = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: "#d9c19b",
        size: 0.045,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    );
    scene.add(this.ash);
  }
  update(t: number, dt: number) {
    for (const s of this.smoke) {
      s.sprite.position.x = s.x + Math.sin(t * 0.035 + s.phase) * 4;
      s.sprite.position.y = s.y + Math.sin(t * 0.09 + s.phase) * 0.7;
      (s.sprite.material as THREE.SpriteMaterial).rotation =
        Math.sin(t * 0.025 + s.phase) * 0.16;
    }
    for (const { sprite, lamp } of this.halos) {
      const blue = lamp.kind === "blue";
      sprite.material.opacity = blue
        ? 0.12 + Math.pow(Math.max(0, Math.sin(t * 7 + lamp.phase)), 6) * 0.85
        : 0.8 + Math.sin(t * 4 + lamp.phase) * 0.15;
    }
    for (let i = 0; i < this.positions.length; i += 3) {
      this.positions[i] += Math.sin(t * 0.2 + i) * dt * 0.15;
      this.positions[i + 1] -= dt * 0.14;
      if (this.positions[i + 1] < 0) this.positions[i + 1] = 24;
    }
    this.ash.geometry.attributes.position.needsUpdate = true;
  }
}
