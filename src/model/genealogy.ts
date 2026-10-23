import { ageOf, CONFIG, type Soul } from './types';
import type { World } from './world';
export function ancestors(s: Soul,souls:Map<string,Soul>,depth=3){const result=new Set<string>();let level=[...s.parents];for(let i=0;i<depth&&level.length;i++){const next:string[]=[];for(const id of level){if(result.has(id))continue;result.add(id);const p=souls.get(id);if(p)next.push(...p.parents);}level=next;}return result;}
export function closeKin(a:Soul,b:Soul,souls:Map<string,Soul>){if(a.id===b.id)return true;const aa=ancestors(a,souls),bb=ancestors(b,souls);return aa.has(b.id)||bb.has(a.id)||[...aa].some(id=>bb.has(id));}
export function canLove(w:World,a:Soul,b:Soul){return a.deathYear===null&&b.deathYear===null&&ageOf(a,w.year)>=CONFIG.adultAge&&ageOf(b,w.year)>=CONFIG.adultAge&&!closeKin(a,b,w.souls)&&!w.partner(a.id)&&!w.partner(b.id);}
