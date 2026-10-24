import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadGame} from '@jaychtw/match3-core';
import {levels,definition,newGame,FREE,validateManifest} from '../src/level.ts';
import {freshSession,encode,decode,diagnostic} from '../src/session.ts';
import {consume} from '../src/projection.ts';
import {TurnController} from '../src/controller.ts';
import {complete,emptyProgress,unlocked,readProgress,PROGRESS_KEY} from '../src/progress.ts';
import {messages} from '../src/i18n.ts';
const report=JSON.parse(readFileSync('docs/evidence/level-validation.json','utf8'));
for(const level of levels)test(`level ${level.number}: validated manifest, deterministic victory and defeat witnesses`,()=>{
 assert.equal(level.chapter,Math.ceil(level.number/5));assert.ok(level.seed&&level.mechanic&&level.difficulty);assert.ok(messages.en[level.titleKey]&&messages['zh-TW'][level.titleKey]);
 const evidence=report.levels.find(l=>l.level.id===level.id);assert.equal(evidence.initial,newGame(level.id).serialize());
 assert.equal(newGame(level.id).state.config.rows,8);assert.equal(newGame(level.id).state.config.cols,8);
 for(const [key,status] of [['win','won'],['loss','lost']]){const game=newGame(level.id);for(const move of evidence[key].actions){assert.equal(game.applyMove(move).ok,true);}assert.equal(game.state.status,status);assert.equal(game.state.moves,evidence[key].moves);assert.equal(game.state.score,evidence[key].score);const session=freshSession(level.id);session.game=game;assert.equal(decode(encode(session)).game.serialize(),game.serialize());}
});
test('chapter progression unlocks only the successor and preserves best replay score',()=>{let p=emptyProgress();for(let i=0;i<15;i++){assert.equal(unlocked(p,levels[i].id),true);if(i<14)assert.equal(unlocked(p,levels[i+1].id),false);p=complete(p,levels[i].id,1000+i);p=complete(p,levels[i].id,5);}assert.equal(p.completed.length,15);assert.equal(p.best[levels[0].id],1000);const memory={getItem:()=>JSON.stringify(p),setItem:()=>{}};assert.deepEqual(readProgress(memory).progress,p);assert.equal(readProgress({...memory,getItem:()=>'{damaged'}).issue,true);assert.equal(PROGRESS_KEY,'snacks-raohe-progress-v1');});
test('Free Play has no move limit or objectives and checkpoints replay after 256 turns',async()=>{
 const controller=new TurnController(freshSession(FREE));assert.equal(controller.session.game.state.config.moveLimit,null);assert.deepEqual(controller.session.game.objectives(),[]);
 for(let i=0;i<258;i++){const action=controller.session.game.listLegalMoves()[0];assert.ok(action);const result=await controller.attempt(action,async(view,event)=>consume(view,event));assert.equal(result.kind,'committed');}
 assert.equal(controller.session.game.state.status,'playing');assert.equal(controller.session.game.state.moves,258);assert.equal(controller.session.actions.length,2);assert.equal(loadGame(controller.session.initial).state.moves,256);
 const restored=decode(encode(controller.session));assert.equal(restored.levelId,FREE);assert.equal(restored.game.serialize(),controller.session.game.serialize());
 const action=restored.game.listLegalMoves()[0];assert.deepEqual(restored.game.applyMove(action),controller.session.game.applyMove(action));assert.equal(diagnostic(restored,action,'TEST').level,FREE);assert.throws(()=>definition('untrusted-level'));
});
test('English and Traditional Chinese cover every production message',()=>{assert.deepEqual(Object.keys(messages.en),Object.keys(messages['zh-TW']));for(const lang of Object.values(messages))for(const value of Object.values(lang))assert.ok(typeof value==='string'&&value.trim());});

test('manifest rejects wrong counts, duplicate seeds and invalid special setup',()=>{assert.throws(()=>validateManifest(levels.slice(0,14)));const duplicate=structuredClone(levels);duplicate[1].seed=duplicate[0].seed;assert.throws(()=>validateManifest(duplicate));const invalid=structuredClone(levels);invalid[6].setup[0].row=8;assert.throws(()=>validateManifest(invalid));});
