import { Field } from './simulation/field';
import { Agent } from './simulation/agent';
import { Growth } from './simulation/growth';
import { random } from './simulation/math';
import type { PointerState } from './input/pointer';
export class Scene {
 readonly field=new Field();readonly agent:Agent;readonly growth:Growth;time=0;
 constructor(seed=804){const rng=random(seed);this.agent=new Agent(rng);this.growth=new Growth(rng);}
 update(dt:number,pointer:PointerState){this.time+=dt;this.field.update(dt);if(pointer.active)this.field.deposit(pointer,125,dt*(pointer.pressed?-1.4:.65),'influence');this.agent.update(dt,this.field,this.growth.tips);this.growth.update(dt,this.field,this.agent.position);}
}
