import type { World } from './world';
import { attraction, continuityLoss } from './affinity';
import { canLove } from './genealogy';
import { ageOf, type Soul } from './types';
export const RELATION_COLORS={friendship:'#8BAED0',love:'#D59AA5',family:'#C4B28E'};
export const RELATION_LABELS={friendship:'Amicizia',love:'Amore',family:'Famiglia'};
export function mutualLove(w:World,a:Soul,b:Soul,familiarity:number){return canLove(w,a,b)&&attraction(a,b,familiarity)>.53&&attraction(b,a,familiarity)>.53;}
export function social(w:World){
 for(const a of w.living)for(const b of w.spatial.near(a,32)){
  if(a.id>=b.id)continue;
  const key=a.id+'|'+b.id;
  let e=w.encounters.get(key);if(!e){e={a:a.id,b:b.id,familiarity:0,meetings:0,duration:0,lastSeen:-100,lastVisit:-100};w.encounters.set(key,e);}
  if(w.seconds-e.lastSeen>2&&w.seconds-e.lastVisit>6){e.meetings++;e.lastVisit=w.seconds;}
  e.lastSeen=w.seconds;e.duration+=.5;e.familiarity=Math.min(1,e.familiarity+.012*(.5+(a.traits[3]+b.traits[3])/200));
  const existing=w.relationsOf(a.id).find(r=>r.a===b.id||r.b===b.id);
  if(existing){existing.lastMeeting=w.year;existing.sharedYears+=.5/22.5;existing.meetings=e.meetings;existing.familiarity=e.familiarity;existing.intensity=Math.min(1,existing.intensity+.001*(.6+(a.traits[2]+b.traits[2])/200));}
  if(e.meetings<2||e.familiarity<.24)continue;
  const fit=(attraction(a,b,e.familiarity)+attraction(b,a,e.familiarity))/2;
  if(!existing&&fit>.48&&w.rng.next()<.035*(.5+(a.traits[3]+b.traits[3])/200))w.createRelation(a,b,'friendship',.35+fit*.25,e.familiarity,e.meetings,e.duration/22.5);
  else if(existing?.type==='friendship'&&existing.intensity>.5&&e.meetings>=3&&e.duration>35&&mutualLove(w,a,b,e.familiarity)&&w.rng.next()<.024){w.endRelation(existing);w.createRelation(a,b,'love',.65,e.familiarity,e.meetings,e.duration/22.5);}
 }
 // Encounter working memory is bounded; completed relationships retain their own history.
 if(w.tick%675===0)for(const [key,e]of w.encounters)if(w.seconds-e.lastSeen>180||!w.souls.get(e.a)||!w.souls.get(e.b))w.encounters.delete(key);
}
export function maintainRelations(w:World,years:number){for(const r of w.relationships){if(r.end!==null||r.type==='family')continue;const a=w.souls.get(r.a)!,b=w.souls.get(r.b)!;if(a.deathYear!==null||b.deathYear!==null)continue;const apart=w.year-r.lastMeeting;const loss=continuityLoss(a,b,years)*(apart>1?1:.12);r.intensity=Math.max(0,r.intensity-loss);if(r.intensity<.1||(r.type==='love'&&w.rng.next()<years*.003*(1-(a.traits[4]+b.traits[4])/220)))w.endRelation(r);}}
export function seedSocial(w:World){
 if(w.living.length<2)return;
 const adults=w.living.filter(s=>ageOf(s,w.year)>=23&&ageOf(s,w.year)<59);let couples=0;
 for(const a of adults){if(couples>=12)break;const b=adults.find(b=>b.id!==a.id&&mutualLove(w,a,b,.65));if(!b)continue;
  const year=Math.max(a.birthYear+20,b.birthYear+20,-w.rng.between(1,8));w.createRelation(a,b,'love',w.rng.between(.6,.9),.7,10,2,year);
  b.x=b.px=Math.min(1500,Math.max(100,a.x+w.rng.between(-32,32)));b.y=b.py=Math.min(900,Math.max(100,a.y+w.rng.between(-32,32)));couples++;
 }
 for(let i=0;i<38;i++){const a=w.rng.pick(w.living),b=w.rng.pick(w.living);if(a.id===b.id||w.relationsOf(a.id).some(r=>r.a===b.id||r.b===b.id))continue;const start=Math.max(a.birthYear+2,b.birthYear+2,-w.rng.between(0,6));if(start<=0)w.createRelation(a,b,'friendship',w.rng.between(.35,.8),.6,5,1,start);}
}
