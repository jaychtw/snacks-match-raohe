import { chromium } from '@playwright/test';
import { loadGame } from '@jaychtw/match3-core';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base=new URL(process.env.RAOHE_VERIFY_URL||'http://127.0.0.1:4180/snacks-match-raohe/');
if(!base.pathname.endsWith('/'))base.pathname+='/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
const key='snacks-raohe-session-v1';
const result={target:base.href,scope:['localhost','127.0.0.1'].includes(base.hostname)?'local static-host simulation':'published site',commit:process.env.GITHUB_SHA||null,files:[],viewports:[]};
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
try {
 const context=await browser.newContext();
 for(const name of readdirSync('dist',{recursive:true}).filter(name=>!name.endsWith('/')&&existsSync(`dist/${name}`))){
  const {statSync}=await import('node:fs');if(!statSync(`dist/${name}`).isFile())continue;
  const response=await context.request.get(new URL(name,base).href);assert.equal(response.status(),200,name);const local=readFileSync(`dist/${name}`);assert.equal(hash(await response.body()),hash(local),`Asset differs: ${name}`);result.files.push({name,sha256:hash(local),bytes:local.length});
 }
 await context.close();
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:1100},hasTouch:width===390,isMobile:width===390,reducedMotion:'reduce'});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base.href);
  const read=async()=>JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
  for(let i=0;i<3;i++){
   const game=loadGame((await read()).state),move=game.listLegalMoves()[0];assert.ok(move);assert.equal(game.applyMove(move).ok,true);
   for(const at of [move.from,move.to]){const cell=page.locator(`[data-cell="${at.row*8+at.col}"]`);if(width===390)await cell.tap();else await cell.click();}
   await page.waitForFunction(({key,state})=>JSON.parse(localStorage.getItem(key)||'{}').state===state&&document.querySelector('.board')?.dataset.reconciled==='true',{key,state:game.serialize()});
   assert.deepEqual(await page.locator('.cell').evaluateAll(cells=>cells.map(el=>({id:Number(el.dataset.id),type:el.dataset.type||null,special:el.dataset.special||null}))),game.state.board.flat());
  }
  const before=await read();await page.reload();assert.deepEqual(await read(),before);
  if(width===390)await page.locator('#language').tap();else await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('lang'),'zh-TW');assert.deepEqual(await read(),before);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
  await page.screenshot({path:`docs/evidence/site-verified-${width}.png`,fullPage:true});result.viewports.push({width,height:width===390?844:1100,turns:3,exactState:true,reload:true,liveLanguageSwitch:true,pageErrors:errors});await context.close();
 }
 result.status='passed';writeFileSync('docs/evidence/site-verification.json',JSON.stringify(result,null,2)+'\n');console.log(`${result.scope}: asset hashes, real gameplay, reload and language switching passed at desktop and touch-phone sizes.`);
}finally{await browser.close();}
