import type { World } from './world';
import type { Soul } from './types';
import { CONFIG } from './types';
export function remember(from:Soul,person:Soul,intensity:number,sharedYears:number,year:number){
 if(from.deathYear!==null||from.id===person.id)return;
 const strength=Math.min(1,(.16+intensity*.55+Math.min(.2,sharedYears*.025))*(.65+from.traits[2]/150));
 const old=from.memories[person.id];from.memories[person.id]={person:person.id,strength:Math.max(old?.strength??0,strength),sharedYears:Math.max(old?.sharedYears??0,sharedYears),lastYear:year};
}
export function sediment(w:World,x:number,y:number,amount:number){let s=w.sediments.find(s=>Math.hypot(s.x-x,s.y-y)<65);if(!s){s={x,y,strength:0,year:w.year};if(w.sediments.length>=CONFIG.sedimentLimit){let weakest=0;for(let i=1;i<w.sediments.length;i++)if(w.sediments[i].strength<w.sediments[weakest].strength)weakest=i;w.sediments.splice(weakest,1);}w.sediments.push(s);}s.strength=Math.min(1,s.strength+amount);s.year=w.year;}
export function memories(w:World,years:number){
 for(const r of w.relationships){if(r.end!==null)continue;const a=w.souls.get(r.a)!,b=w.souls.get(r.b)!;if(a.deathYear===null&&b.deathYear===null){remember(a,b,r.intensity,r.sharedYears,w.year);remember(b,a,r.intensity,r.sharedYears,w.year);}}
 for(const s of w.living)for(const m of Object.values(s.memories)){const target=w.souls.get(m.person);if(!target)continue;const active=w.relationsOf(s.id).some(r=>(r.a===m.person||r.b===m.person)&&target.deathYear===null);if(!active)m.strength*=Math.exp(-years/(4+s.traits[2]*.25+Math.min(12,m.sharedYears)));}
 for(const s of w.sediments)s.strength*=Math.exp(-years/80);w.sediments=w.sediments.filter(s=>s.strength>.004);
}
export function echoesFor(w:World,id:string|null){const s=id?w.souls.get(id):null;if(!s||s.deathYear!==null)return [];return Object.values(s.memories).filter(m=>m.strength>.035&&w.souls.get(m.person)?.deathYear!==null).sort((a,b)=>b.strength-a.strength).slice(0,10);}
