import type { World } from './model/world';
import type { Camera } from './view/camera';
export class Renderer {
 private ctx:CanvasRenderingContext2D;private dpr=1;
 constructor(private canvas:HTMLCanvasElement){const c=canvas.getContext('2d',{alpha:false});if(!c)throw Error('Canvas 2D non disponibile');this.ctx=c;this.resize();}
 resize(){this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=innerWidth*this.dpr;this.canvas.height=innerHeight*this.dpr;this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);}
 draw(world:World,camera:Camera,selected:string|null,alpha:number){const c=this.ctx;c.fillStyle='#050505';c.fillRect(0,0,camera.width,camera.height);for(const s of world.living){const p=camera.screen(s.px+(s.x-s.px)*alpha,s.py+(s.y-s.py)*alpha);c.fillStyle='#eeeeee';c.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,2,2);if(s.id===selected){c.strokeStyle='#aaa';c.lineWidth=.6;c.strokeRect(Math.round(p.x)-6.5,Math.round(p.y)-6.5,13,13);}}}
}
