import { Random } from './random';
import { makeSoul } from './identity';
import { Spatial } from './spatial';
import { movement } from './movement';
import { CONFIG, type Soul, type Relationship, type LifeEvent, type Encounter, type Sediment, type BirthRequest } from './types';
export class World {
 readonly souls=new Map<string,Soul>();living:Soul[]=[];relationships:Relationship[]=[];events:LifeEvent[]=[];
 encounters=new Map<string,Encounter>();sediments:Sediment[]=[];pending:BirthRequest[]=[];
 rng:Random;spatial=new Spatial();tick=0;nextSoul=1;nextEvent=1;nextRelation=1;nextRequest=1;
 get seconds(){return this.tick*CONFIG.step;}get year(){return this.tick/675;}
 constructor(seed=91204,count:number=CONFIG.initialPopulation){this.rng=new Random(seed);for(let i=0;i<count;i++)this.createSoul(this.rng.between(0,74));}
 createSoul(initialAge=0){const s=makeSoul('s'+String(this.nextSoul++).padStart(6,'0'),this.rng,this.year,initialAge);this.souls.set(s.id,s);this.living.push(s);return s;}
 relationsOf=(id:string)=>this.relationships.filter(r=>(r.a===id||r.b===id)&&r.end===null);
 step(){this.tick++;movement(this,CONFIG.step);}
}
