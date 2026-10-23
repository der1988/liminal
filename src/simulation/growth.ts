import { clamp, distance, type Vec } from './math';
import type { Field } from './field';
export interface Segment { a:Vec; b:Vec; age:number; depth:number }
interface Tip extends Vec { angle:number; remaining:number; depth:number; travel:number }
export class Growth {
 readonly segments:Segment[]=[];readonly tips:Tip[]=[]; private accumulator=0;
 constructor(private rng:()=>number){this.tips.push({x:395,y:485,angle:-2.2,remaining:25,depth:0,travel:0},{x:395,y:485,angle:-.9,remaining:27,depth:0,travel:0});}
 update(dt:number,field:Field,agent:Vec){
  for(const s of this.segments)s.age+=dt;
  this.accumulator+=dt;if(this.accumulator<.35)return;this.accumulator-=.35;
  if(this.segments.length>=2200)return;
  for(const tip of [...this.tips]){
   if(this.segments.length>=2200)break;
   const grad=field.gradient(tip,'influence'),mem=field.gradient(tip,'memory');
   const dx=tip.x-agent.x,dy=tip.y-agent.y,d=Math.hypot(dx,dy)||1,proximity=Math.max(0,1-d/95);
   const vx=Math.cos(tip.angle)+grad.x*65+mem.x*10+dx/d*proximity*.7;
   const vy=Math.sin(tip.angle)+grad.y*65+mem.y*10+dy/d*proximity*.7;
   tip.angle=Math.atan2(vy,vx)+(this.rng()-.5)*.24;
   const step=(1.7+this.rng()*.6)*(1-proximity*.6);
   const end={x:clamp(tip.x+Math.cos(tip.angle)*step,160,840),y:clamp(tip.y+Math.sin(tip.angle)*step,310,585)};
   if(distance(tip,end)<.2){this.tips.splice(this.tips.indexOf(tip),1);continue;}
   this.segments.push({a:{x:tip.x,y:tip.y},b:end,age:0,depth:tip.depth});tip.x=end.x;tip.y=end.y;tip.travel+=step;tip.remaining--;
   field.deposit(tip,32,.018,'memory');
   if(tip.remaining<=0){
    tip.remaining=17+Math.floor(this.rng()*22);
    if(this.tips.length<22&&tip.depth<5){this.tips.push({...tip,angle:tip.angle+(this.rng()>.5?1:-1)*(.45+this.rng()*.5),depth:tip.depth+1,travel:0});tip.angle+=(this.rng()-.5)*.6;tip.depth++;}
    if(tip.depth>6||tip.travel>470)this.tips.splice(this.tips.indexOf(tip),1);
   }
  }
 }
}
