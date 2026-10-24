import {writeFileSync}from'node:fs';
import {loadGame}from'@jaychtw/match3-core';
import {levels,newGame,ENGINE}from'../src/level.ts';
function value(game){return game.objectives().reduce((sum,p)=>sum+Math.min(1,p.current/p.objective.target),0);}
export function choices(game,maximize=true){
 return game.listLegalMoves().map(action=>{const candidate=loadGame(game.serialize()),result=candidate.applyMove(action);return{action,candidate,result,utility:value(candidate)};}).filter(x=>x.result.ok).sort((a,b)=>maximize?(b.utility-a.utility||b.candidate.state.score-a.candidate.state.score):(a.utility-b.utility||a.candidate.state.score-b.candidate.state.score));
}
export function witness(id,maximize){
 const game=newGame(id),actions=[];let failures=0;
 while(game.state.status==='playing'){
  const ranked=choices(game,maximize);if(!ranked.length){failures++;break;}
  const action=ranked[0].action,result=game.applyMove(action);if(!result.ok)throw Error(result.error.code);
  actions.push(action);if(actions.length>100)throw Error('Witness budget');
 }
 return {policy:maximize?'maximize normalized objective progress':'minimize normalized objective progress',status:game.state.status,moves:game.state.moves,score:game.state.score,progress:game.objectives(),actions,failures};
}
export function beamWitness(id,width=8){
 let frontier=[{game:newGame(id),actions:[]}],simulations=0;
 for(let depth=0;depth<(newGame(id).state.config.moveLimit??0);depth++){
  const next=[];
  for(const node of frontier)for(const pick of choices(node.game,true)){
   simulations++;const actions=[...node.actions,pick.action];
   if(pick.candidate.state.status==='won')return {policy:`Beam search width ${width}; normalized engine objectives and score`,status:'won',moves:pick.candidate.state.moves,score:pick.candidate.state.score,progress:pick.candidate.objectives(),actions,failures:0,simulations};
   if(pick.candidate.state.status==='playing')next.push({game:pick.candidate,actions});
  }
  const unique=new Map();for(const node of next)unique.set(node.game.serialize(),node);
  frontier=[...unique.values()].sort((a,b)=>value(b.game)-value(a.game)||b.game.state.score-a.game.state.score).slice(0,width);
  if(!frontier.length)break;
 }
 return null;
}
if(process.argv[1]?.endsWith('validate-levels.mjs')){
 const cases=[];
 for(const level of levels){let win=witness(level.id,true);const loss=witness(level.id,false);if(win.status!=='won')win=beamWitness(level.id)??win;cases.push({level,config:newGame(level.id).state.config,seed:level.seed,initial:newGame(level.id).serialize(),verification:{method:'Greedy engine simulation; deterministic witness, not exhaustive proof',humanReview:'pending G5 creative review'},win,loss});console.log(`${level.number}: ${win.status} ${win.moves}/${win.score}; ${loss.status} ${loss.moves}/${loss.score}`);}
 const report={engine:ENGINE,version:1,chapters:3,levels:cases};writeFileSync('docs/evidence/level-validation.json',JSON.stringify(report,null,2)+'\n');
 if(cases.some(c=>c.win.status!=='won'||c.loss.status!=='lost'))process.exitCode=1;
}
