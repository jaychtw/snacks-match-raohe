import { EngineError, loadGame, type GameEvent, type Move } from '@jaychtw/match3-core';
import { project, reconciles, type View } from './projection.ts';
import { diagnostic, type Session } from './session.ts';
export type Outcome = {kind:'committed'; previous:Session; events:GameEvent[]} | {kind:'invalid';code:string} | {kind:'error';code:string} | {kind:'locked'};
const ordinaryRejections = new Set(['NO_MATCH','NOT_ADJACENT']);
export class TurnController {
 session:Session; view:View; busy=false;
 lastDiagnostic:ReturnType<typeof diagnostic>|null=null;
 constructor(session:Session) {this.session=session;this.view=project(session.game);}
 async attempt(action:Move, present:(view:View,event:GameEvent,eventCount:number)=>Promise<void>):Promise<Outcome> {
  if(this.busy||this.session.game.state.status!=='playing')return {kind:'locked'};
  this.busy=true;
  const previous=this.session;
  try {
   // The engine resolves on a private candidate. Saves/current session stay valid until presentation commits.
   const candidate=loadGame(previous.game.serialize());
   const result=candidate.applyMove(action);
   if(!result.ok) {
    if(ordinaryRejections.has(result.error.code))return {kind:'invalid',code:result.error.code};
    this.lastDiagnostic=diagnostic(previous,action,result.error.code);return {kind:'error',code:result.error.code};
   }
   for(const event of result.events)await present(this.view,event,result.events.length);
   if(!reconciles(this.view,result.state,candidate.objectives()))throw new Error('Engine/UI reconciliation failed');
   const checkpoint=previous.actions.length>=256;
   this.session={...previous,game:candidate,initial:checkpoint?previous.game.serialize():previous.initial,actions:[...(checkpoint?[]:previous.actions),structuredClone(action)]};
   return {kind:'committed',previous,events:result.events};
  }catch(error) {
   const code=error instanceof EngineError?error.code:'PRESENTATION_FAILURE';
   this.view=project(previous.game);
   this.lastDiagnostic=diagnostic(previous,action,code);
   return {kind:'error',code};
  }finally {this.busy=false;}
 }
}
