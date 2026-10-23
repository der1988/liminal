import type { World } from './world';
import { CONFIG, ageOf, type Soul, type Traits } from './types';
import { closeKin } from './genealogy';
import { clamp } from '../simulation/math';
import { sediment } from "./memory";
export function eligibleParents(w:World,a:Soul,b:Soul){return w.living.length<CONFIG.maxLiving&&a.deathYear===null&&b.deathYear===null&&ageOf(a,w.year)>=20&&ageOf(a,w.year)<=64&&ageOf(b,w.year)>=20&&ageOf(b,w.year)<=64&&!closeKin(a,b,w.souls)&&w.partner(a.id)?.id===b.id&&w.year-a.lastChildYear>=CONFIG.birthGap&&w.year-b.lastChildYear>=CONFIG.birthGap&&w.childrenOf(a.id).length<CONFIG.maxChildren&&w.childrenOf(b.id).length<CONFIG.maxChildren;}
export function eligiblePairs(w:World){return w.relationships.filter(r=>r.type==='love'&&r.end===null).map(r=>[w.souls.get(r.a)!,w.souls.get(r.b)!] as [Soul,Soul]).filter(([a,b])=>eligibleParents(w,a,b));}
export function birth(w:World,a:Soul,b:Soul,name?:string){
 if(!eligibleParents(w,a,b))return null;
 const child=w.createSoul();child.parents=[a.id,b.id];child.named=name!==undefined;if(name!==undefined)child.name=name;
 child.x=child.px=(a.x+b.x)/2;child.y=child.py=(a.y+b.y)/2;child.vx=child.vy=0;
 child.traits=a.traits.map((v,i)=>{const weight=w.rng.between(.35,.65);return Math.round(clamp(v*weight+b.traits[i]*(1-weight)+w.rng.normal()*6,0,100));}) as Traits;
 const weights=child.preferences.weights.map((v,i)=>v*.45+(a.preferences.weights[i]+b.preferences.weights[i])*.275),sum=weights.reduce((a,b)=>a+b);child.preferences.weights=weights.map(v=>v/sum) as Traits;
 child.preferences.ideals=child.preferences.ideals.map((v,i)=>clamp(v*.5+(a.preferences.ideals[i]+b.preferences.ideals[i])*.25+w.rng.normal()*4,0,100)) as Traits;
 a.lastChildYear=b.lastChildYear=w.year;w.indexChild(child);
 const event=w.events.find(e=>e.id===child.events[0])!;event.people=[child.id,a.id,b.id];
 w.record('child',[a.id,b.id,child.id]);w.createRelation(a,child,'family',.8,1,0,0);w.createRelation(b,child,'family',.8,1,0,0);
 sediment(w,child.x,child.y,.2);
 if(child.named)w.lastNamedBirth={id:child.id,year:w.year};
 return child;
}
export function processBirths(w:World,spontaneous=false){
 const pairs=eligiblePairs(w);if(!pairs.length)return;
 if(w.pending.length){const request=w.pending.shift()!;const [a,b]=w.rng.pick(pairs);birth(w,a,b,request.name);return;}
 if(spontaneous&&w.living.length<CONFIG.targetHigh&&w.rng.next()<(169/675)*(w.living.length<CONFIG.targetLow?2.8:1.3)){const [a,b]=w.rng.pick(pairs);birth(w,a,b);}
}
export function seedFamilies(w:World){
 const children=w.living.filter(s=>ageOf(s,w.year)<19);
 for(const child of children){const age=ageOf(child,w.year);const pairs=w.relationships.filter(r=>r.type==='love'&&r.end===null).map(r=>[w.souls.get(r.a)!,w.souls.get(r.b)!] as [Soul,Soul]).filter(([a,b])=>ageOf(a,w.year)-age>=22&&ageOf(b,w.year)-age>=22&&w.childrenOf(a.id).length<4&&w.childrenOf(b.id).length<4);
  if(!pairs.length)continue;const [a,b]=w.rng.pick(pairs);child.parents=[a.id,b.id];w.indexChild(child);const r=w.relationsOf(a.id).find(r=>r.type==='love')!;const old=r.start;r.start=Math.min(r.start,child.birthYear-.5);const e=w.events.find(e=>e.kind==='love'&&e.year===old&&e.people.includes(a.id)&&e.people.includes(b.id));if(e)e.year=r.start;
  child.x=child.px=clamp((a.x+b.x)/2+w.rng.between(-22,22),10,1590);child.y=child.py=clamp((a.y+b.y)/2+w.rng.between(-22,22),10,990);
  const be=w.events.find(e=>e.id===child.events[0])!;be.people=[child.id,a.id,b.id];w.record('child',[a.id,b.id,child.id],child.birthYear);w.createRelation(a,child,'family',.8,1,0,age,child.birthYear);w.createRelation(b,child,'family',.8,1,0,age,child.birthYear);
  a.lastChildYear=Math.max(a.lastChildYear,child.birthYear);b.lastChildYear=Math.max(b.lastChildYear,child.birthYear);
 }
}
