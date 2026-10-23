/** Mulberry32 with explicit, serializable state. Observation never consumes it. */
export class Random {
 constructor(public state:number){this.state>>>=0;}
 next(){this.state=(this.state+0x6d2b79f5)>>>0;let t=this.state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
 between(a:number,b:number){return a+(b-a)*this.next();}
 normal(){return Math.sqrt(-2*Math.log(Math.max(1e-12,this.next())))*Math.cos(Math.PI*2*this.next());}
 pick<T>(items:readonly T[]){return items[Math.floor(this.next()*items.length)];}
}
