import type { GameEvent, Move, Position } from '@jaychtw/match3-core';
import {consume, type View} from './projection.ts';
export interface AnimationUI { draw:()=>void; scale?:number; reduced:()=>boolean; announce:(event:GameEvent)=>void }
const button=(p:Position)=>document.querySelector<HTMLElement>(`[data-cell="${p.row*8+p.col}"]`);
const svg=(p:Position)=>button(p)?.querySelector<HTMLElement>('.piece');
const animate=async(el:Element|null|undefined,frames:Keyframe[],duration:number)=>{
 if(el)await el.animate(frames,{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'none'}).finished;
};
export async function rejectSwap(move:Move,reduced:boolean) {
 const a=button(move.from),b=button(move.to);
 if(!a||!b)return;
 const from=a.getBoundingClientRect(),to=b.getBoundingClientRect();
 const dx=(to.x-from.x)*.48,dy=(to.y-from.y)*.48;
 await Promise.all([animate(a,[{transform:'translate(0,0)'},{transform:reduced?'none':`translate(${dx}px,${dy}px)`,background:'#ffab9a55'},{transform:'translate(0,0)'}],reduced?80:260),animate(b,[{transform:'translate(0,0)'},{transform:reduced?'none':`translate(${-dx}px,${-dy}px)`,background:'#ffab9a55'},{transform:'translate(0,0)'}],reduced?80:260)]);
}
export async function playEvent(view:View,event:GameEvent,ui:AnimationUI) {
 ui.announce(event);
 const scale=ui.scale??1;
 const duration=ui.reduced()?0:150*scale;
 const pulse=async(positions:Position[],kind:'match'|'power')=>{
  const elements=positions.map(button).filter((x):x is HTMLElement=>!!x);
  elements.forEach(el=>el.classList.add(kind==='match'?'event-match':'event-power'));
  if(duration)await new Promise(resolve=>setTimeout(resolve,duration));
  elements.forEach(el=>el.classList.remove('event-match','event-power'));
 };
 if(event.type==='matched')await pulse(event.groups.flatMap(g=>g.cells),'match');
 if(event.type==='combined')await pulse(event.targets,'power');
 if(event.type==='activated')await pulse(event.targets,'power');
 if(event.type==='eliminated'&&duration)await Promise.all(event.cells.map(c=>animate(svg(c),[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.2)'}],duration)));
 const oldPositions=new Map<number,DOMRect>();
 if(event.type==='swapped'||event.type==='fell'||event.type==='reshuffled') {
  document.querySelectorAll<HTMLElement>('.cell[data-id]').forEach(el=>oldPositions.set(Number(el.dataset.id),el.getBoundingClientRect()));
 }
 consume(view,event);ui.draw();
 if(!duration)return;
 if(event.type==='swapped'||event.type==='fell'||event.type==='reshuffled') {
  await Promise.all([...document.querySelectorAll<HTMLElement>('.cell[data-id]')].map(el=>{
   const old=oldPositions.get(Number(el.dataset.id)),now=el.getBoundingClientRect();
   if(!old||(old.x===now.x&&old.y===now.y))return;
   return animate(el.querySelector('.piece'),[{transform:`translate(${old.x-now.x}px,${old.y-now.y}px)`},{transform:'translate(0,0)'}],(event.type==='reshuffled'?250:180)*scale);
  }));
 }
 if(event.type==='refilled')await Promise.all(event.cells.map(c=>animate(svg(c),[{transform:`translateY(-${(c.row+1)*100}%)`,opacity:.1},{transform:'translateY(0)',opacity:1}],200*scale)));
 if(event.type==='specialCreated'||event.type==='specialConverted')await animate(svg(event.at),[{transform:'scale(.5)',filter:'brightness(1.8)'},{transform:'scale(1.2)'},{transform:'scale(1)'}],210*scale);
}
