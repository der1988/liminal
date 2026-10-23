import { clamp, type Vec } from './math';
/** Shared, bounded memory. Visits linger; disturbances fade quickly. */
export class Field {
 readonly cols=51; readonly rows=36;
 readonly memory=new Float32Array(this.cols*this.rows);
 readonly influence=new Float32Array(this.cols*this.rows);
 constructor(readonly width=1000,readonly height=700){}
 deposit(p:Vec,radius:number,amount:number,channel:'memory'|'influence') {
  const values=this[channel], sx=this.width/(this.cols-1),sy=this.height/(this.rows-1);
  for(let y=Math.max(0,Math.floor((p.y-radius)/sy));y<=Math.min(this.rows-1,Math.ceil((p.y+radius)/sy));y++)
   for(let x=Math.max(0,Math.floor((p.x-radius)/sx));x<=Math.min(this.cols-1,Math.ceil((p.x+radius)/sx));x++) {
    const d=Math.hypot(x*sx-p.x,y*sy-p.y); if(d<radius){const i=y*this.cols+x;values[i]=clamp(values[i]+amount*(1-d/radius)**2,-1,1);}
   }
 }
 sample(p:Vec,channel:'memory'|'influence') {
  const x=clamp(p.x/this.width*(this.cols-1),0,this.cols-1),y=clamp(p.y/this.height*(this.rows-1),0,this.rows-1);
  const ix=Math.min(this.cols-2,Math.floor(x)),iy=Math.min(this.rows-2,Math.floor(y)),fx=x-ix,fy=y-iy,a=this[channel],i=iy*this.cols+ix;
  return (a[i]*(1-fx)+a[i+1]*fx)*(1-fy)+(a[i+this.cols]*(1-fx)+a[i+this.cols+1]*fx)*fy;
 }
 gradient(p:Vec,channel:'memory'|'influence'):Vec { const e=14;return {x:(this.sample({x:p.x+e,y:p.y},channel)-this.sample({x:p.x-e,y:p.y},channel))/(2*e),y:(this.sample({x:p.x,y:p.y+e},channel)-this.sample({x:p.x,y:p.y-e},channel))/(2*e)}; }
 update(dt:number){const m=Math.exp(-dt/100),f=Math.exp(-dt/3.5);for(let i=0;i<this.memory.length;i++){this.memory[i]*=m;this.influence[i]*=f;}}
}
