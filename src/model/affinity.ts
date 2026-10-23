import type { Soul } from './types';
/** Subjective ideal matching, not a ranking of people. Fascination only affects first attention. */
export function attraction(from:Soul,to:Soul,familiarity=0){
 const fit=from.preferences.weights.reduce((sum,weight,i)=>sum+weight*(1-Math.abs(to.traits[i]-from.preferences.ideals[i])/100),0);
 const mental=Math.pow(1-Math.abs(from.traits[0]-to.traits[0])/100,1+from.traits[0]/150);
 const complement=1-Math.abs(from.traits[2]+to.traits[2]-100)/100;
 return .62*fit+.18*mental+.1*complement+.1*Math.min(1,familiarity);
}
export const attention=(from:Soul,to:Soul)=>attraction(from,to)*(.7+to.traits[1]/250);
export const continuityLoss=(a:Soul,b:Soul,years:number)=>years*.045*(1-(a.traits[4]+b.traits[4])/250);
