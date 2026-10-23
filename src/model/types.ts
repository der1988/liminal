export const TRAIT_NAMES=['Intelligenza','Fascino','Sensibilità','Apertura','Stabilità','Autonomia'] as const;
export type Traits=[number,number,number,number,number,number];
export type SoulId=string;
export type MotionState='exploration'|'curiosity'|'encounter'|'accompaniment'|'departure';
export interface Preferences {weights:Traits;ideals:Traits}
export interface Memory {person:SoulId;strength:number;sharedYears:number;lastYear:number}
export interface Soul {
 id:SoulId;name:string;birthYear:number;deathYear:number|null;lifespan:number;named:boolean;
 parents:[]|[SoulId,SoulId];traits:Traits;preferences:Preferences;
 x:number;y:number;px:number;py:number;vx:number;vy:number;phase:number;heading:number;
 state:MotionState;target:SoulId|null;stateUntil:number;nextDecision:number;lastChildYear:number;
 memories:Record<SoulId,Memory>;events:string[];
}
export type RelationshipType='friendship'|'love'|'family';
export interface Relationship {
 id:string;a:SoulId;b:SoulId;type:RelationshipType;start:number;end:number|null;
 intensity:number;familiarity:number;meetings:number;sharedYears:number;lastMeeting:number;
}
export type EventKind='birth'|'friendship'|'love'|'separation'|'friendshipEnd'|'child'|'loss'|'death';
export interface LifeEvent {id:string;kind:EventKind;year:number;people:SoulId[]}
export interface Encounter {a:SoulId;b:SoulId;familiarity:number;meetings:number;duration:number;lastSeen:number;lastVisit:number}
export interface Sediment {x:number;y:number;strength:number;year:number}
export interface BirthRequest {id:number;name:string;requested:number}
export const CONFIG={width:1600,height:1000,initialPopulation:80,targetLow:80,targetHigh:100,maxLiving:120,secondsPerYear:22.5,step:1/30,adultAge:20,parentMaxAge:64,birthGap:4,maxChildren:5,sedimentLimit:192} as const;
export const ageOf=(s:Soul,year:number)=>(s.deathYear??year)-s.birthYear;
export const stageOf=(age:number)=>age<13?'Infanzia':age<20?'Adolescenza':age<65?'Età adulta':'Vecchiaia';
