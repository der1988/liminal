import { clamp, distance, type Vec } from './math';
import type { Field } from './field';
export type State='wander'|'rest'|'observe'|'approach'|'retreat'|'return';
export class Agent {
 position:Vec={x:610,y:445}; previous:Vec={...this.position}; target:Vec={...this.position};
 state:State='rest'; timer=3; phase=0; heading=0;
 readonly home:Vec={x:650,y:460};
 constructor(private rng:()=>number){}
 update(dt:number,field:Field,tips:readonly Vec[]){
  this.previous={...this.position};this.timer-=dt;
  const nearby=tips.reduce<Vec|undefined>((a,b)=>!a||distance(b,this.position)<distance(a,this.position)?b:a,undefined);
  const nearDistance=nearby?distance(nearby,this.position):Infinity;
  const influence=field.sample(this.position,'influence');
  if((nearDistance<32||influence<-.12)&&this.state!=='retreat'){
   this.state='retreat';this.timer=3;
   const source=nearby&&nearDistance<32?nearby:this.position;
   const g=field.gradient(this.position,'influence');
   this.target={x:clamp(this.position.x+(this.position.x-source.x)*3+g.x*2500,160,840),y:clamp(this.position.y+(this.position.y-source.y)*3+g.y*2500,315,590)};
  } else if(this.timer<=0){
   const r=this.rng();this.timer=4+this.rng()*7;
   if(r<.25){this.state='rest';}
   else if(r<.45&&nearby){this.state='observe';this.heading=Math.atan2(nearby.y-this.position.y,nearby.x-this.position.x);}
   else if(r<.65&&nearby){this.state='approach';const dx=this.position.x-nearby.x,dy=this.position.y-nearby.y,d=Math.hypot(dx,dy)||1;this.target={x:clamp(nearby.x+dx/d*65,160,840),y:clamp(nearby.y+dy/d*65,315,590)};}
   else if(r<.8){this.state='return';this.target={...this.home};}
   else {this.state='wander';this.target={x:180+this.rng()*640,y:330+this.rng()*230};}
  }
  if(!['rest','observe'].includes(this.state)){
   const g=field.gradient(this.position,'influence'),m=field.gradient(this.position,'memory');
   const dx=this.target.x-this.position.x+g.x*3000+m.x*250,dy=this.target.y-this.position.y+g.y*3000+m.y*250,d=Math.hypot(dx,dy);
   if(d>4){const step=Math.min(d,dt*(this.state==='retreat'?19:10));this.position.x=clamp(this.position.x+dx/d*step,150,850);this.position.y=clamp(this.position.y+dy/d*step,310,600);this.heading=Math.atan2(dy,dx);this.phase+=step*.22;}else this.timer=0;
  }
  field.deposit(this.position,45,dt*.08,'memory');
 }
}
