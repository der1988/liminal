import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { fogPass } from "./fog";
export class Post {
  readonly composer: EffectComposer;
  private film: ShaderPass;
  private fog: ShaderPass;
  private aa: ShaderPass;
  private pixelRatio: number;
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
  ) {
    this.pixelRatio = renderer.getPixelRatio();
    this.composer = new EffectComposer(renderer);
    for (const target of [
      this.composer.renderTarget1,
      this.composer.renderTarget2,
    ]) {
      target.depthTexture = new THREE.DepthTexture(
        target.width,
        target.height,
        THREE.UnsignedIntType,
      );
    }
    this.composer.addPass(new RenderPass(scene, camera));
    this.fog = fogPass(camera);
    this.composer.addPass(this.fog);
    this.composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(innerWidth, innerHeight),
        0.52,
        0.7,
        0.7,
      ),
    );
    this.composer.addPass(new OutputPass());
    this.aa = new ShaderPass(FXAAShader);
    this.aa.uniforms.resolution.value.set(
      1 / (innerWidth * this.pixelRatio),
      1 / (innerHeight * this.pixelRatio),
    );
    this.composer.addPass(this.aa);
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
      fragmentShader: `uniform sampler2D tDiffuse;uniform float time;uniform float reduced;uniform vec2 resolution;varying vec2 vUv;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 center=vUv-.5;vec2 fringe=center*dot(center,center)*.006;vec3 c=vec3(texture2D(tDiffuse,vUv+fringe).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-fringe).b);float n=hash(floor(vUv*resolution)+floor(time*(1.-reduced)*15.));c+=(n-.5)*.028;c*=1.-dot(center,center)*.65;c=mix(c,vec3(dot(c,vec3(.3,.59,.11))),.13);gl_FragColor=vec4(c,1.);}`,
    });
    this.composer.addPass(this.film);
  }
  resize(w: number, h: number) {
    this.composer.setSize(w, h);
    this.aa.uniforms.resolution.value.set(
      1 / (w * this.pixelRatio),
      1 / (h * this.pixelRatio),
    );
    this.film.uniforms.resolution.value.set(w, h);
  }
  render(t: number) {
    this.film.uniforms.time.value = t;
    this.fog.uniforms.time.value = t;
    this.camera.updateMatrixWorld(true);
    this.fog.uniforms.inverseProjection.value.copy(
      this.camera.projectionMatrixInverse,
    );
    this.fog.uniforms.cameraWorld.value.copy(this.camera.matrixWorld);
    this.fog.uniforms.eye.value.copy(this.camera.position);
    this.fog.uniforms.tDepth.value = this.composer.readBuffer.depthTexture;
    this.composer.render();
  }
}
