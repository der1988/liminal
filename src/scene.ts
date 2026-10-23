import * as THREE from "three";
import { makeMaterials } from "./world/materials";
import { cathedral } from "./world/cathedral";
import { city } from "./world/city";
import { mergeStatic } from "./world/merge";
import { Crowd } from "./world/crowd";
import { Entities } from "./world/entities";
import { Atmosphere } from "./effects/atmosphere";
import { architecturalDetail } from "./world/detail";
import { Clashes } from "./effects/clashes";
export class World {
  readonly scene = new THREE.Scene();
  private crowd: Crowd;
  private entities: Entities;
  private atmosphere: Atmosphere;
  private blue: THREE.PointLight;
  private clashes: Clashes;
  time = 0;
  constructor() {
    const s = this.scene;
    s.background = new THREE.Color("#202b24");
    s.fog = new THREE.FogExp2("#202b24", 0.0135);
    s.add(new THREE.HemisphereLight("#98a08b", "#29362c", 1.0));
    const moon = new THREE.DirectionalLight("#829887", 0.55);
    moon.position.set(-20, 45, 10);
    s.add(moon);
    const m = makeMaterials();
    cathedral(s, m);
    const lamps = city(s, m);
    architecturalDetail(s, m);
    mergeStatic(s);
    // Oblique facade lighting reveals details without turning night into daylight.
    const facade = new THREE.SpotLight(
      "#b9ae87",
      430,
      110,
      Math.PI / 3,
      0.85,
      1.6,
    );
    facade.position.set(-22, 4, -14);
    facade.target.position.set(0, 20, -50);
    s.add(facade, facade.target);
    const warm = new THREE.PointLight("#b69157", 65, 45, 1.5);
    warm.position.set(17, 5, -35);
    s.add(warm);
    this.blue = new THREE.PointLight("#668ec2", 40, 25, 2);
    this.blue.position.set(-20, 3, -21);
    s.add(this.blue);
    this.crowd = new Crowd(s, m);
    this.entities = new Entities(s, m);
    this.atmosphere = new Atmosphere(s, lamps, this.crowd.flares);
    this.clashes = new Clashes(s, m);
  }
  update(dt: number) {
    this.time += dt;
    this.entities.update(this.time);
    this.crowd.update(this.time, this.entities.threats);
    this.atmosphere.update(this.time, dt);
    this.clashes.update(this.time);
    this.blue.intensity =
      8 + Math.pow(Math.max(0, Math.sin(this.time * 7)), 5) * 48;
  }
}
