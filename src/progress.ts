import {level,levels} from './level.ts';
import type {StorageLike} from './session.ts';
export const PROGRESS_KEY='snacks-raohe-progress-v1';
export interface Progress {version:1;completed:string[];best:Record<string,number>}
export const emptyProgress=():Progress=>({version:1,completed:[],best:{}});
export function readProgress(store:StorageLike):{progress:Progress;issue:boolean} {
 try {
  const raw=store.getItem(PROGRESS_KEY);if(!raw)return {progress:emptyProgress(),issue:false};
  const data=JSON.parse(raw);
  if(data.version!==1||!Array.isArray(data.completed)||!data.best||typeof data.best!=='object'||Array.isArray(data.best)||data.completed.some((id:unknown)=>typeof id!=='string'||!levels.some(l=>l.id===id))||Object.entries(data.best).some(([id,score])=>!levels.some(l=>l.id===id)||typeof score!=='number'||!Number.isSafeInteger(score)||score<0))throw Error('Invalid progress');
  return {progress:{version:1,completed:[...new Set<string>(data.completed)],best:data.best},issue:false};
 }catch{return {progress:emptyProgress(),issue:true};}
}
export const unlocked=(progress:Progress,id:string)=>{const i=levels.findIndex(l=>l.id===id);return i===0||(i>0&&progress.completed.includes(levels[i-1].id));};
export function complete(progress:Progress,id:string,score:number):Progress {
 if(!levels.some(l=>l.id===id))return progress;
 return {version:1,completed:[...new Set([...progress.completed,id])],best:{...progress.best,[id]:Math.max(score,progress.best[id]??0)}};
}
export const nextLevel=(id:string)=>levels[levels.findIndex(l=>l.id===id)+1]?.id??null;
export const firstAvailable=(p:Progress)=>levels.find(l=>!p.completed.includes(l.id)&&unlocked(p,l.id))?.id??level.id;
