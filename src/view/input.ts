import type { World } from '../model/world';
import type { Camera } from './camera';
export class ObserverInput {
 private abort=new AbortController();private pointers=new Map<number,{x:number;y:number}>();private start={x:0,y:0};private moved=false;private pinch=0;
 constructor(canvas:HTMLCanvasElement,world:World,camera:Camera,select:(id:string|null)=>void,echoes:()=>string[]=()=>[]){const opts={signal:this.abort.signal};
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.start={x:e.clientX,y:e.clientY};this.moved=false;this.pinch=0;},opts);
 canvas.addEventListener('pointermove',e=>{const old=this.pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this.pointers.size>1){const [a,b]=[...this.pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(this.pinch)camera.zoomAt(d/this.pinch,(a.x+b.x)/2,(a.y+b.y)/2);this.pinch=d;this.moved=true;}else if(Math.hypot(e.clientX-this.start.x,e.clientY-this.start.y)>5||this.moved){camera.pan(dx,dy);this.moved=true;}},opts);
 canvas.addEventListener('pointerup',e=>{if(!this.moved&&this.pointers.size===1){let nearest:string|null=null,best=e.pointerType==='touch'?24:13;const ids=new Set([...world.living.map(s=>s.id),...echoes()]);for(const id of ids){const s=world.souls.get(id)!;const p=camera.screen(s.x,s.y),d=Math.hypot(p.x-e.clientX,p.y-e.clientY);if(d<best){best=d;nearest=id;}}select(nearest);}this.pointers.delete(e.pointerId);},opts);
 const cancel=()=>{this.pointers.clear();this.pinch=0;};canvas.addEventListener('pointercancel',cancel,opts);window.addEventListener('blur',cancel,opts);
 canvas.addEventListener('wheel',e=>{e.preventDefault();camera.zoomAt(Math.exp(-e.deltaY*.001),e.clientX,e.clientY);},{...opts,passive:false});
 }
 dispose(){this.abort.abort();}
}
