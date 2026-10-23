import * as THREE from "three";
import { random } from "../simulation/math";
export function makeMaterials() {
  const rng = random(371);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#6d7161";
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32)
    for (let x = -32; x < 512; x += 64) {
      const offset = ((y / 32) % 2) * 32;
      const v = 70 + rng() * 35;
      ctx.fillStyle = `rgb(${v},${v + 5},${v - 2})`;
      ctx.fillRect(x + offset + 1, y + 1, 62, 30);
      ctx.fillStyle = "#b3b7a10c";
      ctx.fillRect(x + offset + 2, y + 2, 60, 2);
    }
  for (let i = 0; i < 25000; i++) {
    ctx.fillStyle = rng() > 0.5 ? "#d8dac010" : "#121c1814";
    ctx.fillRect(rng() * 512, rng() * 512, rng() * 5, 1);
  }
  const pavement = new THREE.CanvasTexture(canvas);
  pavement.wrapS = pavement.wrapT = THREE.RepeatWrapping;
  pavement.repeat.set(16, 16);
  pavement.colorSpace = THREE.SRGBColorSpace;
  return {
    stone: new THREE.MeshStandardMaterial({
      color: "#7e8878",
      roughness: 0.95,
    }),
    trim: new THREE.MeshStandardMaterial({ color: "#9a9e88", roughness: 0.85 }),
    dark: new THREE.MeshStandardMaterial({ color: "#111d18", roughness: 1 }),
    window: new THREE.MeshStandardMaterial({
      color: "#30392b",
      emissive: "#57532c",
      emissiveIntensity: 0.3,
      roughness: 0.6,
    }),
    ground: new THREE.MeshStandardMaterial({
      map: pavement,
      color: "#a2a99a",
      roughness: 0.39,
      metalness: 0.15,
    }),
    building: new THREE.MeshStandardMaterial({
      color: "#4b5749",
      roughness: 1,
    }),
    roof: new THREE.MeshStandardMaterial({ color: "#303c32", roughness: 1 }),
    bronze: new THREE.MeshStandardMaterial({
      color: "#2b3527",
      metalness: 0.4,
      roughness: 0.7,
    }),
    police: new THREE.MeshStandardMaterial({
      color: "#101e24",
      roughness: 0.8,
    }),
    helmet: new THREE.MeshStandardMaterial({
      color: "#24302c",
      roughness: 0.35,
      metalness: 0.4,
    }),
    shield: new THREE.MeshStandardMaterial({
      color: "#67786a",
      transparent: true,
      opacity: 0.34,
      roughness: 0.25,
      metalness: 0.45,
      side: THREE.DoubleSide,
    }),
    skin: new THREE.MeshStandardMaterial({ color: "#7a8070", roughness: 1 }),
    monster: new THREE.MeshStandardMaterial({
      color: "#131f19",
      roughness: 0.7,
      metalness: 0.12,
    }),
    amber: new THREE.MeshBasicMaterial({ color: "#ffcf8b" }),
    flare: new THREE.MeshBasicMaterial({ color: "#ff6340" }),
    blue: new THREE.MeshBasicMaterial({ color: "#759ac9" }),
  };
}
export type Materials = ReturnType<typeof makeMaterials>;
export function box(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
export function cylinder(
  parent: THREE.Object3D,
  top: number,
  bottom: number,
  height: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  sides = 8,
) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(top, bottom, height, sides),
    mat,
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
