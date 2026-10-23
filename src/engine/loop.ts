/** Bound catch-up after stalls; hidden tabs never fast-forward the ecosystem. */
export class Loop {
 private frame=0;private last=0;private accumulator=0; paused=false;
 readonly step=1/60;
 constructor(private update:(dt:number)=>void,private render:(alpha:number)=>void){}
 start(){this.last=performance.now();this.frame=requestAnimationFrame(this.tick);}
 private tick=(now:number)=>{const elapsed=Math.min((now-this.last)/1000,.1);this.last=now;if(!this.paused&&!document.hidden){this.accumulator+=elapsed;while(this.accumulator>=this.step){this.update(this.step);this.accumulator-=this.step;}}else this.accumulator=0;this.render(this.accumulator/this.step);this.frame=requestAnimationFrame(this.tick);};
 stop(){cancelAnimationFrame(this.frame);}
}
