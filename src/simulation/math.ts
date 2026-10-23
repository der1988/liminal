export interface Vec { x: number; y: number }
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x-b.x,a.y-b.y);
export const clamp = (v:number,lo:number,hi:number) => Math.max(lo,Math.min(hi,v));
export function random(seed:number) { let s=seed>>>0; return () => { s+=0x6D2B79F5; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
