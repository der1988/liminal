import { Random } from './random';
import { makeSoul } from './identity';
import { Spatial } from './spatial';
import { movement } from './movement';
import { CONFIG, type Soul, type Relationship, type LifeEvent, type Encounter, type Sediment, type BirthRequest } from './types';
import { social,maintainRelations,seedSocial,mutualLove } from "./social";
import type { EventKind, RelationshipType } from "./types";
import { seedFamilies,processBirths } from "./births";
export class World {
 readonly souls=new Map<string,Soul>();living:Soul[]=[];relationships:Relationship[]=[];events:LifeEvent[]=[];
 encounters=new Map<string,Encounter>();sediments:Sediment[]=[];pending:BirthRequest[]=[];
 rng:Random;spatial=new Spatial();tick=0;nextSoul=1;nextEvent=1;nextRelation=1;nextRequest=1;
 relationIndex=new Map<string,Relationship[]>();
 childIndex=new Map<string,string[]>();lastNamedBirth:{id:string;year:number}|null=null;
 get seconds(){return this.tick*CONFIG.step;}get year(){return this.tick/675;}
 constructor(seed=91204,count:number=CONFIG.initialPopulation){this.rng=new Random(seed);for(let i=0;i<count;i++)this.createSoul(this.rng.between(0,74));seedSocial(this);seedFamilies(this);}
 createSoul(initialAge=0){const s=makeSoul('s'+String(this.nextSoul++).padStart(6,'0'),this.rng,this.year,initialAge);this.souls.set(s.id,s);this.living.push(s);this.record("birth",[s.id],s.birthYear);return s;}
 relationsOf=(id:string)=>(this.relationIndex.get(id)??[]).filter(r=>r.end===null);
 childrenOf(id:string){return (this.childIndex.get(id)??[]).map(id=>this.souls.get(id)!);}
 indexChild(child:Soul){for(const parent of child.parents){const children=this.childIndex.get(parent)??[];if(!children.includes(child.id))children.push(child.id);this.childIndex.set(parent,children);}}
 requestBirth(name:string){const clean=name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,40);if(!clean||this.pending.length>=6)return null;const r={id:this.nextRequest++,name:clean,requested:this.year};this.pending.push(r);return r;}
 cancelBirth(id:number){this.pending=this.pending.filter(r=>r.id!==id);}
 partner(id:string){const r=this.relationsOf(id).find(r=>r.type==='love');return r?this.souls.get(r.a===id?r.b:r.a):undefined;}
 record(kind:EventKind,people:string[],year=this.year){const e={id:'e'+this.nextEvent++,kind,people:[...people],year};this.events.push(e);for(const id of new Set(people))this.souls.get(id)?.events.push(e.id);return e;}
 createRelation(a:Soul,b:Soul,type:RelationshipType,intensity=.5,familiarity=0,meetings=0,sharedYears=0,start=this.year){
  if(type==='love'&&!mutualLove(this,a,b,familiarity))return undefined;
  if(a.id===b.id||a.deathYear!==null||b.deathYear!==null||this.relationsOf(a.id).some(r=>r.type===type&&(r.a===b.id||r.b===b.id)))return undefined;
  const r:Relationship={id:'r'+this.nextRelation++,a:a.id,b:b.id,type,start,end:null,intensity,familiarity,meetings,sharedYears,lastMeeting:this.year};this.relationships.push(r);
  for(const id of [a.id,b.id]){const list=this.relationIndex.get(id)??[];list.push(r);this.relationIndex.set(id,list);}
  if(type!=='family')this.record(type,[a.id,b.id],start);return r;
 }
 endRelation(r:Relationship){if(r.type==='family'||r.end!==null)return;r.end=this.year;this.record(r.type==='love'?'separation':'friendshipEnd',[r.a,r.b]);}

 step(){this.tick++;movement(this,CONFIG.step);if(this.tick%15===0){social(this);if(this.pending.length)processBirths(this);}if(this.tick%169===0){maintainRelations(this,169/675);processBirths(this,true);}}
}
