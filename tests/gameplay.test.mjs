import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame,loadGame } from '@jaychtw/match3-core';
import { newGame,level,ENGINE } from '../src/level.ts';
import { project,consume,reconciles } from '../src/projection.ts';
import { TurnController } from '../src/controller.ts';
import { freshSession,encode,decode,persist,readSession,SAVE_KEY,BACKUP_KEY } from '../src/session.ts';
const present=async(view,event)=>consume(view,event);
const pairs=[['horizontal','horizontal'],['horizontal','vertical'],['vertical','vertical'],['horizontal','bomb'],['vertical','bomb'],['bomb','bomb'],['color','horizontal'],['color','vertical'],['color','bomb'],['color','color']];
function withSpecials(a,b,seed=level.seed) {
 const state=createGame(level.config,seed).state;
 for(const [i,special] of [a,b].entries())state.board[3][3+i]={...state.board[3][3+i],special,type:special==='color'?null:state.board[3][3+i].type};
 return loadGame(state);
}
for(const [a,b] of pairs)test(`real-engine ${a}+${b} → event projection and exact committed UI state`,async()=>{
 const game=withSpecials(a,b),initial=game.serialize(),oldIds=[game.state.board[3][3].id,game.state.board[3][4].id];
 const controller=new TurnController({game,initial,actions:[]});
 const result=await controller.attempt({from:{row:3,col:3},to:{row:3,col:4}},present);
 assert.equal(result.kind,'committed');
 assert.ok(result.events.some(e=>e.type==='combined'));
 assert.equal(result.events.filter(e=>e.type==='activated'&&oldIds.includes(e.piece.id)).length,2);
 assert.ok(result.events.some(e=>e.type==='eliminated'));
 assert.ok(reconciles(controller.view,controller.session.game.state,controller.session.game.objectives()));
 assert.equal(controller.view.moves,1);
 if(a==='color'&&['horizontal','vertical','bomb'].includes(b))assert.ok(result.events.some(e=>e.type==='specialConverted'));
});
test('activation and combination targets cannot remove a protected or overlapping piece',()=>{
 const game=withSpecials('horizontal','bomb'),view=project(game),before=structuredClone(view.board),p=view.board[3][3];
 consume(view,{type:'activated',wave:0,at:{row:3,col:3},piece:p,targets:[{row:3,col:3},{row:3,col:4}],selectedType:null});
 consume(view,{type:'combined',wave:0,pieces:[],targets:[{row:3,col:3}]});
 assert.deepEqual(view.board,before);
 consume(view,{type:'eliminated',wave:0,cells:[{row:3,col:3,piece:p}]});assert.equal(view.board[3][3],null);assert.deepEqual(view.board[3][4],before[3][4]);
});
test('invalid adjacent swap reverts without move, score, board or RNG consumption',async()=>{
 const session=freshSession(),controller=new TurnController(session),before=session.game.serialize();
 let invalid;
 for(let r=0;r<8&&!invalid;r++)for(let c=0;c<7;c++){const move={from:{row:r,col:c},to:{row:r,col:c+1}};if(!session.game.isLegalMove(move)){invalid=move;break;}}
 assert.ok(invalid);const result=await controller.attempt(invalid,present);
 assert.equal(result.kind,'invalid');assert.equal(result.code,'NO_MATCH');assert.equal(session.game.serialize(),before);assert.deepEqual(controller.view,project(session.game));
});
test('duplicate submissions stay locked through the complete event presentation',async()=>{
 const c=new TurnController(freshSession()),move=c.session.game.listLegalMoves()[0];let release;
 const wait=new Promise(resolve=>release=resolve);
 const pending=c.attempt(move,async(view,event)=>{await wait;consume(view,event);});
 assert.equal(c.busy,true);assert.equal((await c.attempt(move,present)).kind,'locked');assert.equal(c.session.game.state.moves,0);
 release();assert.equal((await pending).kind,'committed');assert.equal(c.session.game.state.moves,1);assert.equal(c.busy,false);
});
test('failed reconciliation preserves last valid session and reproducible diagnostic',async()=>{
 const c=new TurnController(freshSession()),before=c.session.game.serialize(),move=c.session.game.listLegalMoves()[0];
 const result=await c.attempt(move,async()=>{});
 assert.deepEqual(result,{kind:'error',code:'PRESENTATION_FAILURE'});assert.equal(c.session.game.serialize(),before);assert.deepEqual(c.view,project(c.session.game));
 assert.equal(c.lastDiagnostic.engine,ENGINE);assert.equal(c.lastDiagnostic.state,before);assert.deepEqual(c.lastDiagnostic.attemptedAction,move);
});
test('animation exceptions also roll back the presentation and keep last valid state',async()=>{
 const c=new TurnController(freshSession()),before=c.session.game.serialize();
 assert.equal((await c.attempt(c.session.game.listLegalMoves()[0],async()=>{throw Error('interrupted');})).kind,'error');assert.equal(c.session.game.serialize(),before);assert.equal(c.busy,false);
});
test('saved wrapper restores exact RNG, special metadata, counters and deterministic continuation',async()=>{
 const game=withSpecials('color','bomb'),c=new TurnController({game,initial:game.serialize(),actions:[]});
 await c.attempt({from:{row:3,col:3},to:{row:3,col:4}},present);
 const restored=decode(encode(c.session));assert.deepEqual(restored.game.state,c.session.game.state);
 if(restored.game.state.status==='playing'){
  const action=restored.game.listLegalMoves()[0];assert.ok(action);assert.deepEqual(restored.game.applyMove(action),c.session.game.applyMove(action));
 }
});
const memory=()=>{const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('corrupt/incompatible primary is preserved and a validated backup is offered',()=>{
 const store=memory(),session=freshSession();persist(store,session,session);store.setItem(SAVE_KEY,'{corrupt');
 const result=readSession(store);assert.equal(result.issue,'corrupt');assert.deepEqual(result.backup.game.state,session.game.state);assert.equal(store.getItem(SAVE_KEY),'{corrupt');
 for(const patch of [{engine:'moving-main'},{version:2},{state:'{}'},{actions:[{}]}])assert.throws(()=>decode(JSON.stringify({...JSON.parse(encode(session)),...patch})));
});
test('blocked/quota-limited storage does not throw or claim persistence',()=>{
 const store={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('quota');}};
 assert.equal(readSession(store).issue,'storage');assert.equal(persist(store,freshSession()),false);
});
test('backup survives a primary write failure',()=>{
 const store=memory(),previous=freshSession();
 const limited={getItem:store.getItem,setItem:(k,v)=>{if(k===SAVE_KEY)throw Error('quota');store.setItem(k,v);}};
 assert.equal(persist(limited,previous,previous),false);assert.deepEqual(decode(store.getItem(BACKUP_KEY)).game.state,previous.game.state);
});
test('full representative level has reproducible win and loss routes (heuristic evidence)',async()=>{
 for(const direction of ['max','min']) {
  const c=new TurnController(freshSession());let turns=0;
  while(c.session.game.state.status==='playing') {
   const choices=c.session.game.listLegalMoves().map(move=>{const g=loadGame(c.session.game.serialize());const result=g.applyMove(move);return {move,result};}).filter(x=>x.result.ok);
   assert.ok(choices.length);choices.sort((a,b)=>direction==='max'?b.result.state.score-a.result.state.score:a.result.state.score-b.result.state.score);
   const outcome=await c.attempt(choices[0].move,present);assert.equal(outcome.kind,'committed');assert.ok(reconciles(c.view,c.session.game.state,c.session.game.objectives()));
   assert.ok(++turns<=18);
  }
  assert.equal(c.session.game.state.status,direction==='max'?'won':'lost');
 }
});
test('seeded sessions reconcile every successful turn, including cascades and special creation',async()=>{
 const covered=new Set();let committed=0;
 for(let seed=0;seed<20;seed++) {
  const game=createGame({...level.config,moveLimit:30,objectives:[]},`stress-${seed}`),c=new TurnController({game,initial:game.serialize(),actions:[]});
  for(let turn=0;turn<30;turn++) {
   const choices=c.session.game.listLegalMoves();if(!choices.length)break;
   const outcome=await c.attempt(choices[(turn*17+seed)%choices.length],present);
   assert.notEqual(outcome.kind,'error',JSON.stringify(c.lastDiagnostic));
   if(outcome.kind==='committed'){committed++;for(const e of outcome.events){covered.add(e.type);if(e.type==='specialCreated')covered.add(e.piece.special);if('wave'in e&&e.wave>0)covered.add('cascade');}}
  }
 }
 assert.equal(committed,600);for(const event of ['matched','eliminated','fell','refilled','scored','objectives','specialCreated','activated','cascade'])assert.ok(covered.has(event),event);
});

const {creationFixture}=await import('./fixtures.mjs');
for(const special of ['horizontal','vertical','bomb','color']) {
 test(`engine-generated ${special} creation is projected with exact identity`,async()=>{
  const {session,move}=creationFixture(special),c=new TurnController(session);
  const result=await c.attempt(move,present);assert.equal(result.kind,'committed');
  assert.ok(result.events.some(e=>e.type==='specialCreated'&&e.piece.special===special));assert.ok(reconciles(c.view,c.session.game.state,c.session.game.objectives()));
 });
 test(`ordinary partner activates ${special} with authoritative elimination`,async()=>{
  const game=withSpecials(special,null),c=new TurnController({game,initial:game.serialize(),actions:[]});
  const result=await c.attempt({from:{row:3,col:3},to:{row:3,col:4}},present);
  assert.equal(result.kind,'committed');assert.ok(result.events.some(e=>e.type==='activated'&&e.piece.special===special));assert.ok(reconciles(c.view,c.session.game.state,c.session.game.objectives()));
 });
}
const failures=JSON.parse((await import('node:fs')).readFileSync('tests/engine-failure-fixtures.json','utf8'));
for(const [code,fixture]of Object.entries(failures))test(`${code} is an actual engine failure, keeps state/RNG, and records replay data`,async()=>{
 const game=loadGame(fixture.state),session={game,initial:fixture.state,actions:[]},c=new TurnController(session);
 const outcome=await c.attempt(fixture.action,present);
 assert.deepEqual(outcome,{kind:'error',code});assert.equal(c.session.game.serialize(),fixture.state);assert.equal(c.lastDiagnostic.code,code);assert.deepEqual(c.view,project(game));
 const replay=loadGame(c.lastDiagnostic.state).applyMove(c.lastDiagnostic.attemptedAction);assert.equal(replay.ok,false);assert.equal(replay.error.code,code);
});
test('requested reshuffle is projected by piece identity without consuming a move',()=>{
 const game=newGame(),view=project(game),result=game.reshuffle();assert.equal(result.ok,true);
 result.events.forEach(event=>consume(view,event));assert.ok(reconciles(view,result.state,game.objectives()));assert.equal(view.moves,0);
});
