import type { Vec } from '../simulation/math';
export interface PointerState extends Vec { active:boolean; pressed:boolean }
export class Pointer {
 readonly state:PointerState={x:0,y:0,active:false,pressed:false};
 private controller=new AbortController();
 constructor(canvas:HTMLCanvasElement,toWorld:(x:number,y:number)=>Vec){
  const options={signal:this.controller.signal};
  const move=(e:PointerEvent)=>{Object.assign(this.state,toWorld(e.clientX,e.clientY),{active:true});};
  canvas.addEventListener('pointermove',move,options);
  canvas.addEventListener('pointerdown',e=>{move(e);this.state.pressed=true;canvas.setPointerCapture(e.pointerId);},options);
  const end=(e:PointerEvent)=>{this.state.pressed=false;if(e.pointerType!=='mouse')this.state.active=false;};
  canvas.addEventListener('pointerup',end,options);canvas.addEventListener('pointercancel',end,options);
  canvas.addEventListener('pointerleave',()=>{this.state.active=false;},options);
  window.addEventListener('blur',()=>{this.state.active=false;this.state.pressed=false;},options);
 }
 dispose(){this.controller.abort();}
}
