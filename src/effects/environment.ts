import * as THREE from "three";
/** One-time HDR lighting bake: wet surfaces reflect a night city, not a flat gray void. */
export function nightEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#161e1b");
  const geometries: THREE.BufferGeometry[] = [],
    materials: THREE.Material[] = [];
  for (let i = 0; i < 12; i++) {
    const geometry = new THREE.PlaneGeometry(i % 3 ? 5 : 1.2, i % 3 ? 16 : 7);
    geometries.push(geometry);
    const material = new THREE.MeshBasicMaterial({
      color: i % 4 === 0 ? "#6084b8" : "#bd9870",
      side: THREE.DoubleSide,
    });
    material.color.multiplyScalar(i % 3 ? 1.3 : 5);
    materials.push(material);
    const pane = new THREE.Mesh(geometry, material),
      angle = (i / 12) * Math.PI * 2;
    pane.position.set(Math.cos(angle) * 30, 7, Math.sin(angle) * 30);
    pane.lookAt(0, 7, 0);
    scene.add(pane);
  }
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(scene, 0.05, 0.1, 100);
  generator.dispose();
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  return target;
}
