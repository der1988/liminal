import type { World } from './model/world';
import type { Camera } from './view/camera';
import { RELATION_COLORS } from "./model/social";
export class Renderer {
 private ctx:CanvasRenderingContext2D;private dpr=1;
 constructor(private canvas:HTMLCanvasElement){const c=canvas.getContext('2d',{alpha:false});if(!c)throw Error('Canvas 2D non disponibile');this.ctx=c;this.resize();}
 resize(){this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=innerWidth*this.dpr;this.canvas.height=innerHeight*this.dpr;this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);}
 draw(world:World,camera:Camera,selected:string|null,alpha:number){const c=this.ctx;c.fillStyle='#050505';c.fillRect(0,0,camera.width,camera.height);
 const connected=new Set<string>();
 for(const r of world.relationships){if(r.end!==null)continue;const a=world.souls.get(r.a)!,b=world.souls.get(r.b)!;if(a.deathYear!==null||b.deathYear!==null)continue;const direct=r.a===selected||r.b===selected;if(direct){connected.add(r.a);connected.add(r.b);}const aa=camera.screen(a.px+(a.x-a.px)*alpha,a.py+(a.y-a.py)*alpha),bb=camera.screen(b.px+(b.x-b.px)*alpha,b.py+(b.y-b.py)*alpha);c.strokeStyle=RELATION_COLORS[r.type];c.globalAlpha=direct?.45:.018;c.lineWidth=direct?.65:.4;c.beginPath();c.moveTo(aa.x,aa.y);c.lineTo(bb.x,bb.y);c.stroke();}c.globalAlpha=1;
 for(const s of world.living){const p=camera.screen(s.px+(s.x-s.px)*alpha,s.py+(s.y-s.py)*alpha);c.globalAlpha=Math.max(.15,Math.min(1,(world.year-s.birthYear)/.1));c.fillStyle='#eeeeee';c.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,2,2);c.globalAlpha=1;if(connected.has(s.id)&&s.id!==selected){c.strokeStyle='#ffffff44';c.lineWidth=.5;c.strokeRect(p.x-3.5,p.y-3.5,7,7);}if(s.id===selected){c.strokeStyle='#aaa';c.lineWidth=.6;c.strokeRect(Math.round(p.x)-6.5,Math.round(p.y)-6.5,13,13);}}}
}
