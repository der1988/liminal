import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
/** Bake static architecture per material, keeping city draw calls bounded. */
export function mergeStatic(root: THREE.Object3D) {
  root.updateWorldMatrix(true, true);
  const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map<
    THREE.Material,
    { geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }
  >();
  root.traverse((object) => {
    if (
      !(object instanceof THREE.Mesh) ||
      object instanceof THREE.InstancedMesh ||
      Array.isArray(object.material)
    )
      return;
    const mesh = object as THREE.Mesh;
    const g = mesh.geometry.index
      ? mesh.geometry.toNonIndexed()
      : mesh.geometry.clone();
    g.applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inverseRoot, mesh.matrixWorld),
    );
    const entry = groups.get(mesh.material as THREE.Material) ?? {
      geometries: [],
      meshes: [],
    };
    entry.geometries.push(g);
    entry.meshes.push(mesh);
    groups.set(mesh.material as THREE.Material, entry);
  });
  for (const [material, { geometries, meshes }] of groups) {
    const merged = mergeGeometries(geometries);
    if (!merged) throw new Error("Unable to merge architecture");
    const mesh = new THREE.Mesh(merged, material);
    root.add(mesh);
    for (const old of meshes) {
      old.removeFromParent();
      old.geometry.dispose();
    }
    for (const g of geometries) g.dispose();
  }
}
