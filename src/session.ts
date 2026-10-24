import { loadGame, type Game, type Move } from '@jaychtw/match3-core';
import { ENGINE, level, definition, newGame } from './level.ts';
export const SAVE_KEY = 'snacks-raohe-session-v1';
export const BACKUP_KEY = 'snacks-raohe-session-backup-v1';
export interface SavedSession { version:1; engine:string; level:string; seed:string; initial:string; state:string; actions:Move[] }
export interface Session { game:Game; initial:string; actions:Move[]; levelId?:string }
export const freshSession = (levelId=level.id): Session => {const game=newGame(levelId); return {game,initial:game.serialize(),actions:[],levelId};};
export function encode(session: Session): string {
 const spec=definition(session.levelId??level.id);
 return JSON.stringify({version:1,engine:ENGINE,level:spec.id,seed:spec.seed,initial:session.initial,state:session.game.serialize(),actions:session.actions} satisfies SavedSession);
}
export function decode(raw: string): Session {
 const saved:SavedSession=JSON.parse(raw);
 const spec=definition(saved.level);
 if(saved.version!==1 || saved.engine!==ENGINE || saved.seed!==spec.seed || !Array.isArray(saved.actions) || saved.actions.length>256)throw new Error('Unsupported session');
 const game=loadGame(saved.state), initial=loadGame(saved.initial);
 const expected=newGame(spec.id).state.config;
 for(const candidate of [game,initial])if(JSON.stringify(candidate.state.config)!==JSON.stringify(expected))throw new Error('Unexpected level configuration');
 for(const action of saved.actions)for(const p of [action?.from,action?.to])if(!p || !Number.isInteger(p.row)||!Number.isInteger(p.col)||p.row<0||p.row>7||p.col<0||p.col>7)throw new Error('Invalid replay action');
 // Engine validates all board, RNG, counter and status fields; do not fabricate a replacement.
 return {game,initial:saved.initial,actions:saved.actions,levelId:spec.id};
}
export interface StorageLike { getItem(key:string):string|null; setItem(key:string,value:string):void }
export function readSession(storage: StorageLike): {session:Session|null; backup:Session|null; issue:'corrupt'|'storage'|null} {
 try {
  const raw=storage.getItem(SAVE_KEY);
  if(!raw)return {session:null,backup:null,issue:null};
  try{return {session:decode(raw),backup:null,issue:null};}
  catch {
   let backup:Session|null=null;
   try {const old=storage.getItem(BACKUP_KEY);if(old)backup=decode(old);}catch { /* keep corrupt primary untouched */ }
   return {session:null,backup,issue:'corrupt'};
  }
 } catch{return {session:null,backup:null,issue:'storage'};}
}
export function persist(storage: StorageLike, current:Session, previous?:Session): boolean {
 try {
  if(previous)storage.setItem(BACKUP_KEY,encode(previous));
  storage.setItem(SAVE_KEY,encode(current));return true;
 }catch {return false;}
}
export function diagnostic(session:Session, action:Move, code:string) {
 return {version:1,engine:ENGINE,level:session.levelId??level.id,seed:definition(session.levelId??level.id).seed,config:session.game.state.config,initial:session.initial,state:session.game.serialize(),actions:session.actions,attemptedAction:action,code};
}
