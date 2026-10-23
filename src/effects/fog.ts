import * as THREE from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
/** Depth-aware height fog. The ray terminates at the nearest opaque surface. */
export function fogPass(camera: THREE.PerspectiveCamera) {
  const steps = matchMedia("(pointer:coarse)").matches ? 6 : 10;
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      tDepth: { value: null },
      time: { value: 0 },
      inverseProjection: { value: camera.projectionMatrixInverse },
      cameraWorld: { value: camera.matrixWorld },
      eye: { value: camera.position },
    },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
 uniform sampler2D tDiffuse,tDepth;uniform float time;uniform mat4 inverseProjection,cameraWorld;uniform vec3 eye;varying vec2 vUv;
 float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){
 float depth=texture2D(tDepth,vUv).x;vec4 view=inverseProjection*vec4(vUv*2.-1.,depth*2.-1.,1.);view/=view.w;
 vec3 endpoint=(cameraWorld*view).xyz;vec3 delta=endpoint-eye;float len=min(length(delta),140.);vec3 dir=normalize(delta);float stepSize=len/${steps}.;float transmit=1.;vec3 scatter=vec3(0.);
 for(int i=0;i<${steps};i++){
  vec3 p=eye+dir*(float(i)+.5)*stepSize;
  float n=noise(p*.12+vec3(time*.023,0.,time*.008))*.7+noise(p*.29-vec3(time*.013,0.,0.))*.3;
  float height=exp(-max(0.,p.y)*.16);
  float density=(.008+height*.032)*(.35+n*.95);
  float amount=1.-exp(-density*stepSize);
  vec3 tint=vec3(.037,.052,.047);
  float red=exp(-length(p-vec3(-12.,2.,-10.))*.105)+exp(-length(p-vec3(13.,2.,-15.))*.13);
  tint+=vec3(.16,.031,.008)*red*.7;
  float blue=exp(-length(p-vec3(-20.,3.,-21.))*.12)*(.3+pow(max(0.,sin(time*7.)),5.));tint+=vec3(.012,.035,.12)*blue;
  scatter+=tint*amount*transmit;transmit*=1.-amount;
 }
 vec3 color=texture2D(tDiffuse,vUv).rgb;gl_FragColor=vec4(color*transmit+scatter,1.);
 }`,
  });
}
