import type { Soul } from './types';
/** Fixed cells keep neighbor queries local; archives never enter the spatial grid. */
export class Spatial {
 private cells=new Map<string,Soul[]>();
 constructor(readonly size=85){}
 rebuild(souls:readonly Soul[]){this.cells.clear();for(const s of souls){const key=this.key(s.x,s.y),bucket=this.cells.get(key)??[];bucket.push(s);this.cells.set(key,bucket);}}
 private key(x:number,y:number){return Math.floor(x/this.size)+','+Math.floor(y/this.size);}
 near(s:Soul,radius=this.size){const found:Soul[]=[],r=Math.ceil(radius/this.size),cx=Math.floor(s.x/this.size),cy=Math.floor(s.y/this.size);for(let x=cx-r;x<=cx+r;x++)for(let y=cy-r;y<=cy+r;y++)for(const p of this.cells.get(x+','+y)??[])if(p.id!==s.id&&(p.x-s.x)**2+(p.y-s.y)**2<radius*radius)found.push(p);return found;}
}
