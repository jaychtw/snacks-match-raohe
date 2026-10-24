import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createGame, loadGame } from '@jaychtw/match3-core';
import ts from 'typescript';
const source = name => ts.transpile(readFileSync(new URL(`../src/${name}.ts`,import.meta.url),'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const { en, zh } = await import(`data:text/javascript;base64,${Buffer.from(source('i18n')).toString('base64')}`);
test('verified engine artifact and immutable identity',()=>{
 const evidence=JSON.parse(readFileSync('vendor/release-evidence.json','utf8'));
 assert.equal(evidence.commit,'9863f8e023a227540a58491282e87d9f11a0cf79');
 assert.equal(createHash('sha256').update(readFileSync('vendor/jaychtw-match3-core-1.0.0.tgz')).digest('hex'),evidence.sha256);
 assert.equal(evidence.independentBuilds,2);
});
test('six-shape engine initialization and exact restore/replay',()=>{
 const a=createGame({pieceTypes:['pepper_bun','grilled_squid','candied_fruit','grilled_corn','bubble_tea','chicken_cutlet']},'snacks-raohe-g1');
 const b=loadGame(a.serialize());
 assert.equal(a.state.board.length,8);
 assert.ok(a.state.board.every(row=>row.length===8));
 assert.deepEqual(a.state,b.state);
 const action=a.listLegalMoves()[0]; assert.ok(action);
 assert.deepEqual(a.applyMove(action),b.applyMove(action));
});
test('localization keys have complete bilingual parity and nonempty text',()=>{
 assert.deepEqual(Object.keys(en).sort(),Object.keys(zh).sort());
 for(const dictionary of [en,zh])for(const value of Object.values(dictionary))assert.ok(typeof value==='string'&&value.length>0);
});
