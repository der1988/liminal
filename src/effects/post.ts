import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
export class Post {
  readonly composer: EffectComposer;
  private film: ShaderPass;
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(innerWidth, innerHeight),
        0.52,
        0.7,
        0.7,
      ),
    );
    this.composer.addPass(new OutputPass());
    this.film = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
        reduced: {
          value: matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0,
        },
      },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform sampler2D tDiffuse;uniform float time;uniform float reduced;uniform vec2 resolution;varying vec2 vUv;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 center=vUv-.5;vec2 fringe=center*dot(center,center)*.006;vec3 c=vec3(texture2D(tDiffuse,vUv+fringe).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-fringe).b);float n=hash(floor(vUv*resolution)+floor(time*(1.-reduced)*15.));c+=(n-.5)*.055;c*=1.-dot(center,center)*.65;c=mix(c,vec3(dot(c,vec3(.3,.59,.11))),.13);gl_FragColor=vec4(c,1.);}`,
    });
    this.composer.addPass(this.film);
  }
  resize(w: number, h: number) {
    this.composer.setSize(w, h);
    this.film.uniforms.resolution.value.set(w, h);
  }
  render(t: number) {
    this.film.uniforms.time.value = t;
    this.composer.render();
  }
}
