import type { Scene } from './scene';
import type { PointerState } from './input/pointer';
export class Renderer {
 private ctx:CanvasRenderingContext2D;private scale=1;private ox=0;private oy=0;
 constructor(private canvas:HTMLCanvasElement){const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D non disponibile');this.ctx=ctx;this.resize();}
 resize(){const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=innerWidth*dpr;this.canvas.height=innerHeight*dpr;this.scale=Math.min(innerWidth/1000,innerHeight/700);this.ox=(innerWidth-1000*this.scale)/2;this.oy=(innerHeight-700*this.scale)/2;}
 toWorld=(x:number,y:number)=>({x:(x-this.ox)/this.scale,y:(y-this.oy)/this.scale});
 draw(scene:Scene,pointer:PointerState,alpha:number){const c=this.ctx,dpr=Math.min(devicePixelRatio||1,2);c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#deddd3';c.fillRect(0,0,innerWidth,innerHeight);c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);
  // A wall, an unlit doorway, a thin plane of light. No game HUD.
  const wash=c.createLinearGradient(0,100,0,650);wash.addColorStop(0,'#d9d9cf');wash.addColorStop(.46,'#e7e5db');wash.addColorStop(1,'#d6d5c9');c.fillStyle=wash;c.fillRect(95,120,810,500);
  c.strokeStyle='#b4b6a356';c.lineWidth=.7;c.beginPath();c.moveTo(95,305);c.lineTo(905,305);c.stroke();
  c.fillStyle='#c2c5b8';c.fillRect(710,186,58,119);c.fillStyle='#a0a797';c.fillRect(715,190,49,115);const dark=c.createLinearGradient(715,190,764,305);dark.addColorStop(0,'#697563');dark.addColorStop(1,'#949e89');c.fillStyle=dark;c.fillRect(720,190,44,115);
  c.fillStyle='#efeddf88';c.beginPath();c.moveTo(720,306);c.lineTo(764,306);c.lineTo(840,440);c.lineTo(697,440);c.fill();
  c.strokeStyle='#a5aa9640';c.beginPath();c.moveTo(95,620);c.lineTo(905,620);c.stroke();
  // Only a faint residue makes the shared memory visible.
  for(let y=0;y<scene.field.rows;y++)for(let x=0;x<scene.field.cols;x++){const v=scene.field.memory[y*scene.field.cols+x];if(v<.025)continue;c.fillStyle=`rgba(105,119,88,${v*.045})`;c.beginPath();c.ellipse(x*20,y*20,24,8,0,0,Math.PI*2);c.fill();}
  c.lineCap='round';for(const s of scene.growth.segments){const opacity=Math.min(1,s.age/2);c.strokeStyle=`rgba(79,99,68,${opacity*(.58-s.depth*.055)})`;c.lineWidth=Math.max(.55,2.1-s.depth*.28);c.beginPath();c.moveTo(s.a.x,s.a.y);c.lineTo(s.b.x,s.b.y);c.stroke();}
  c.fillStyle='#6d795b';c.beginPath();c.ellipse(395,485,3,1.4,0,0,Math.PI*2);c.fill();
  const a=scene.agent,x=a.previous.x+(a.position.x-a.previous.x)*alpha,y=a.previous.y+(a.position.y-a.previous.y)*alpha;
  c.fillStyle='#5b665426';c.beginPath();c.ellipse(x+3,y+2,12,3,0,0,Math.PI*2);c.fill();
  const walking=!['rest','observe'].includes(a.state),swing=walking?Math.sin(a.phase)*2:0;
  c.strokeStyle='#53604d';c.lineWidth=2;c.beginPath();c.moveTo(x-2,y-9);c.lineTo(x-3-swing,y);c.moveTo(x+2,y-9);c.lineTo(x+3+swing,y);c.stroke();
  c.fillStyle='#68755d';c.beginPath();c.ellipse(x,y-13,4,7,0,0,Math.PI*2);c.fill();c.fillStyle='#515e49';c.beginPath();c.arc(x+Math.cos(a.heading)*.8,y-23+Math.sin(scene.time*1.3)*.25,3.4,0,Math.PI*2);c.fill();
  if(pointer.active){c.strokeStyle=pointer.pressed?'#94796055':'#818d7055';c.lineWidth=.6;c.beginPath();c.ellipse(pointer.x,pointer.y,22+Math.sin(scene.time*2)*2,8,0,0,Math.PI*2);c.stroke();c.fillStyle='#7a866566';c.beginPath();c.arc(pointer.x,pointer.y,1.5,0,Math.PI*2);c.fill();}
 }
}
