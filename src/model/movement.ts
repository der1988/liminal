import type { Random } from './random';
import { CONFIG, ageOf, type Soul, type Relationship } from './types';
import { Spatial } from './spatial';
import { clamp } from '../simulation/math';
import { attention } from "./affinity";
export const movementSpeed=(s:Soul,year:number)=>{const age=ageOf(s,year);return (4+s.traits[5]*.065)*(.65+.35*clamp(age/24,0,1))*(1-.35*clamp((age-65)/35,0,1));};
export interface MovementWorld {living:Soul[];souls:Map<string,Soul>;year:number;seconds:number;rng:Random;spatial:Spatial;relationsOf:(id:string)=>Relationship[]}
export function movement(w:MovementWorld,dt:number){
 w.spatial.rebuild(w.living);
 for(const s of w.living){
  s.px=s.x;s.py=s.y;const near=w.spatial.near(s,75),speed=movementSpeed(s,w.year);
  if(w.seconds>=s.nextDecision){
   s.nextDecision=w.seconds+w.rng.between(2,6);
   if(w.seconds>s.stateUntil){s.state='exploration';s.target=null;}
   if(s.state==='exploration'&&near.length&&w.rng.next()<.12+s.traits[3]/180){const weights=near.map(p=>attention(s,p)*((!w.relationsOf(s.id).some(r=>r.type==='love')&&!w.relationsOf(p.id).some(r=>r.type==='love')&&ageOf(s,w.year)>=20&&ageOf(p,w.year)>=20)?1.6:1)),sum=weights.reduce((a,b)=>a+b,0);let roll=w.rng.next()*sum;const candidate=near.find((_,i)=>(roll-=weights[i])<=0)??near[0];s.target=candidate.id;s.state='curiosity';s.stateUntil=w.seconds+w.rng.between(14,30);}
   if(s.state==='exploration'){const links=w.relationsOf(s.id).filter(r=>r.end===null&&w.souls.get(r.a===s.id?r.b:r.a)?.deathYear===null);if(links.length&&w.rng.next()<.3-s.traits[5]*.0013){const r=w.rng.pick(links);s.target=r.a===s.id?r.b:r.a;s.state='accompaniment';s.stateUntil=w.seconds+w.rng.between(18,38);}}
  }
  const phase=w.seconds*.13+s.phase;let angle=s.heading+Math.sin(phase)*.045+Math.sin(phase*.37)*.022;
  let dx=Math.cos(angle)*speed,dy=Math.sin(angle)*speed;
  const target=s.target?w.souls.get(s.target):null;
  if(target&&target.deathYear===null){const tx=target.x-s.x,ty=target.y-s.y,d=Math.hypot(tx,ty)||1;
   if(s.state==='curiosity'){dx=dx*.45+tx/d*speed*.6;dy=dy*.45+ty/d*speed*.6;if(d<22){s.state='encounter';s.stateUntil=w.seconds+w.rng.between(7,16);}}
   if(s.state==='encounter'){dx*=.12;dy*=.12;if(d<12){dx-=tx/d*speed*.3;dy-=ty/d*speed*.3;}if(w.seconds>s.stateUntil){s.state='departure';s.stateUntil=w.seconds+7;}}
   if(s.state==='accompaniment'){dx=dx*.55+target.vx*.25+tx/d*Math.min(d*.04,4);dy=dy*.55+target.vy*.25+ty/d*Math.min(d*.04,4);}
   if(s.state==='departure'){dx-=tx/d*speed*.3;dy-=ty/d*speed*.3;}
  }else if(s.target){s.target=null;s.state='departure';s.stateUntil=w.seconds+5;}
  // Children remain loosely near their living parents, without being locked to them.
  const age=ageOf(s,w.year);if(age<19&&s.parents.length){const parent=w.souls.get(s.parents[0]);if(parent&&parent.deathYear===null){const tx=parent.x-s.x,ty=parent.y-s.y,d=Math.hypot(tx,ty)||1;if(d>70){const force=Math.min(3,(d-70)*.02)*(1-age/22);dx+=tx/d*force;dy+=ty/d*force;}}}
  for(const p of near){const tx=s.x-p.x,ty=s.y-p.y,d=Math.hypot(tx,ty)||.1;if(d<16){const f=(1-d/16)*5;dx+=tx/d*f;dy+=ty/d*f;}}
  const margin=95;dx+=Math.max(0,margin-s.x)*.065-Math.max(0,s.x-(CONFIG.width-margin))*.065;dy+=Math.max(0,margin-s.y)*.065-Math.max(0,s.y-(CONFIG.height-margin))*.065;
  let ax=(dx-s.vx)*.7,ay=(dy-s.vy)*.7,a=Math.hypot(ax,ay);if(a>3.5){ax*=3.5/a;ay*=3.5/a;}s.vx+=ax*dt;s.vy+=ay*dt;const v=Math.hypot(s.vx,s.vy);if(v>speed){s.vx*=speed/v;s.vy*=speed/v;}
  s.x=clamp(s.x+s.vx*dt,2,CONFIG.width-2);s.y=clamp(s.y+s.vy*dt,2,CONFIG.height-2);if(Math.hypot(s.vx,s.vy)>.2)s.heading=Math.atan2(s.vy,s.vx);
 }
}
