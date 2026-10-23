import './style.css';
import { Loop } from './engine/loop';
import { World } from './model/world';
import { Clock,type Speed } from './model/clock';
import { ageOf,stageOf } from './model/types';
import { Camera } from './view/camera';
import { ObserverInput } from './view/input';
import { Renderer } from './renderer';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const world=new World(),clock=new Clock(world),camera=new Camera(innerWidth,innerHeight),renderer=new Renderer($<HTMLCanvasElement>('#space'));
let selected:string|null=null;
function select(id:string|null){selected=id;$('#person').hidden=!id;if(!id)camera.follow=null;refresh();}
function refresh(){const s=selected?world.souls.get(selected):null;$('#year').textContent='anno '+Math.floor(world.year);if(s){$('#name').textContent=s.name;$('#age').textContent=Math.floor(ageOf(s,world.year))+' anni · '+stageOf(ageOf(s,world.year));$('#follow').textContent=camera.follow===s.id?'Smetti di seguire':'Segui';}}
$('#close').onclick=()=>select(null);$('#follow').onclick=()=>{if(selected)camera.follow=camera.follow===selected?null:selected;refresh();};
document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b=>b.onclick=()=>{clock.speed=Number(b.dataset.speed) as Speed;document.querySelectorAll('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
const input=new ObserverInput($<HTMLCanvasElement>('#space'),world,camera,select);
const abort=new AbortController();window.addEventListener('resize',()=>{camera.width=innerWidth;camera.height=innerHeight;renderer.resize();},{signal:abort.signal});
let uiTime=0;const loop=new Loop(dt=>{clock.advance(dt);if(camera.follow){const s=world.souls.get(camera.follow);if(s)camera.target={x:s.x,y:s.y};}camera.update(dt);uiTime+=dt;if(uiTime>.25){refresh();uiTime=0;}},()=>renderer.draw(world,camera,selected,clock.alpha));loop.start();
if(import.meta.hot)import.meta.hot.dispose(()=>{loop.stop();input.dispose();abort.abort();});
