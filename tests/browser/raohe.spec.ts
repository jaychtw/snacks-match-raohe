import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {loadGame,type Move} from '@jaychtw/match3-core';
import {readFileSync} from 'node:fs';
const key='snacks-raohe-session-v1';
const report=JSON.parse(readFileSync('docs/evidence/level-validation.json','utf8'));
async function saved(page:Page){return JSON.parse((await page.evaluate(k=>localStorage.getItem(k),key))!);}
async function open(page:Page){await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');}
async function turn(page:Page,move:Move,touch=false){
 const game=loadGame((await saved(page)).state);expect(game.applyMove(move).ok).toBe(true);
 for(const at of [move.from,move.to]){const el=page.locator(`[data-cell="${at.row*8+at.col}"]`);if(touch)await el.tap();else await el.click();}
 await expect(page.locator('.board')).toHaveAttribute('data-moves',String(game.state.moves));await expect(page.locator('.board')).toHaveAttribute('data-reconciled','true');expect(JSON.parse((await saved(page)).state)).toEqual(game.state);
}
for(const width of [320,390,768,1440])for(const lang of ['en','zh-TW'])test(`render, interaction, localization and accessibility: ${width}px ${lang}`,async({page})=>{
 await page.setViewportSize({width,height:width<640?900:1100});await open(page);if(lang==='zh-TW')await page.locator('#language').click();
 await expect(page.locator('.cell')).toHaveCount(64);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 const hud=await page.locator('#moves').boundingBox();expect(hud).not.toBeNull();expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('#moves')!==null,{x:hud!.x+hud!.width/2,y:hud!.y+hud!.height/2})).toBe(true);
 const initial=await saved(page);await turn(page,loadGame(initial.state).listLegalMoves()[0]);const checkpoint=await saved(page);await page.reload();expect(await saved(page)).toEqual(checkpoint);await expect(page.locator('html')).toHaveAttribute('lang',lang);
 const board=await page.locator('.board').boundingBox();expect(board!.width).toBeGreaterThanOrEqual(width===320?290:width===390?350:300);
 await page.screenshot({path:`docs/evidence/active-${width}-${lang}.png`,fullPage:true});
});
test('hints are legal and free; reshuffle preserves pieces, moves, score, and exact persistence',async({page})=>{
 await open(page);const before=await saved(page);const game=loadGame(before.state);
 await page.locator('#hint').click();await expect(page.locator('.hinted')).toHaveCount(2);const ids=await page.locator('.hinted').evaluateAll(c=>c.map(el=>Number((el as HTMLElement).dataset.cell)));expect(game.isLegalMove({from:{row:Math.floor(ids[0]/8),col:ids[0]%8},to:{row:Math.floor(ids[1]/8),col:ids[1]%8}})).toBe(true);expect(await saved(page)).toEqual(before);
 await page.locator('#shuffle-board').click();await page.getByRole('button',{name:'Shuffle board',exact:true}).click();await expect(page.locator('.board')).toHaveAttribute('data-reconciled','true');const after=loadGame((await saved(page)).state);expect(after.state.moves).toBe(0);expect(after.state.score).toBe(0);expect(after.state.board.flat().sort((a,b)=>a.id-b.id)).toEqual(game.state.board.flat().sort((a,b)=>a.id-b.id));expect(after.serialize()).not.toBe(game.serialize());const stable=await saved(page);await page.reload();expect(await saved(page)).toEqual(stable);
});
test('keyboard operation submits an engine move; selection and pause preserve state',async({page})=>{
 await open(page);const move=loadGame((await saved(page)).state).listLegalMoves()[0];const from=page.locator(`[data-cell="${move.from.row*8+move.from.col}"]`);await from.focus();await page.keyboard.press('Enter');await expect(from).toHaveAttribute('aria-pressed','true');const dr=move.to.row-move.from.row,dc=move.to.col-move.from.col;await page.keyboard.press(dr?(dr>0?'ArrowDown':'ArrowUp'):(dc>0?'ArrowRight':'ArrowLeft'));await page.keyboard.press('Space');await expect(page.locator('.board')).toHaveAttribute('data-moves','1');const before=await saved(page);await page.locator('#pause').click();await expect(page.getByRole('dialog')).toContainText('Take your time');await page.getByRole('button',{name:'Continue playing',exact:true}).click();expect(await saved(page)).toEqual(before);
});
for(const lang of ['en','zh-TW'])test(`complete defeat, retry and victory flow in ${lang}`,async({page})=>{
 test.setTimeout(120000);await open(page);if(lang==='zh-TW')await page.locator('#language').click();
 for(const action of report.levels[0].loss.actions)await turn(page,action);
 await expect(page.getByRole('dialog')).toContainText(lang==='en'?'One more bite':'再嚐一口');await page.getByRole('button',{name:lang==='en'?'Play again':'再玩一次',exact:true}).click();await expect(page.locator('.board')).toHaveAttribute('data-moves','0');
 for(const action of report.levels[0].win.actions)await turn(page,action);
 await expect(page.getByRole('dialog')).toContainText(lang==='en'?'Deliciously done':'美味上桌');await page.screenshot({path:`docs/evidence/win-${lang}.png`,fullPage:true});await page.getByRole('button',{name:lang==='en'?'Next level':'下一關',exact:true}).click();await expect(page.locator('.board')).toHaveAttribute('data-moves','0');
});
test('touch input swaps and swipes; language switching retains exact session',async({browser})=>{
 const context=await browser.newContext({baseURL:'http://127.0.0.1:4173/',viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});const page=await context.newPage();await page.goto('./');const action=loadGame((await saved(page)).state).listLegalMoves()[0];await turn(page,action,true);const before=await saved(page);await page.locator('#language').tap();await expect(page.locator('html')).toHaveAttribute('lang','zh-TW');expect(await saved(page)).toEqual(before);
 const game=loadGame(before.state),next=game.listLegalMoves()[0];game.applyMove(next);
 await page.locator('.board').scrollIntoViewIfNeeded();
 const rect=await page.locator(`[data-cell="${next.from.row*8+next.from.col}"]`).boundingBox();
 const x=rect!.x+rect!.width/2,y=rect!.y+rect!.height/2,dx=(next.to.col-next.from.col)*rect!.width,dy=(next.to.row-next.from.row)*rect!.height;
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(page.locator('.board')).toHaveAttribute('data-moves',String(game.state.moves));await expect(page.locator('.board')).toHaveAttribute('data-reconciled','true');expect(JSON.parse((await saved(page)).state)).toEqual(game.state);
 await page.screenshot({path:'docs/evidence/mobile-touch-zh-TW.png',fullPage:true});await context.close();
});
test('invalid swap consumes no moves and corrupt save requires explicit recovery',async({page})=>{
 await open(page);const before=await saved(page),game=loadGame(before.state);let invalid:Move|undefined;for(let r=0;r<8&&!invalid;r++)for(let c=0;c<7;c++){const m={from:{row:r,col:c},to:{row:r,col:c+1}};if(!game.isLegalMove(m)){invalid=m;break;}}
 for(const at of [invalid!.from,invalid!.to])await page.locator(`[data-cell="${at.row*8+at.col}"]`).click();await expect(page.getByRole('status')).toContainText('No move used');expect(await saved(page)).toEqual(before);
 await page.evaluate(k=>localStorage.setItem(k,'{broken'),key);await page.reload();await expect(page.getByRole('dialog')).toContainText('could not be restored');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{broken');await page.getByRole('button',{name:'Start a new session',exact:true}).click();await expect(page.locator('.board')).toHaveAttribute('data-moves','0');
});
test('ordinary motion animates committed engine events and reconciles',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('./');await turn(page,loadGame((await saved(page)).state).listLegalMoves()[0]);await expect(page.locator('.board')).toHaveAttribute('data-reconciled','true');
});
test('larger pieces provide 44px targets and bounded panning at 320px',async({page})=>{
 await page.setViewportSize({width:320,height:900});await open(page);await page.locator('#large').click();const box=await page.locator('.cell').first().boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('#pan-right').click();await expect.poll(()=>page.locator('.board-scroll').evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);await page.locator('#pan-left').click();await expect.poll(()=>page.locator('.board-scroll').evaluate(el=>el.scrollLeft)).toBe(0);await turn(page,loadGame((await saved(page)).state).listLegalMoves()[0]);await page.screenshot({path:'docs/evidence/large-board-320.png',fullPage:true});
});
test('blocked local storage still permits real in-memory gameplay with a warning',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));await open(page);await expect(page.locator('.save-notice')).toContainText('Storage is unavailable');await expect(page.locator('.cell')).toHaveCount(64);const {newGame}=await import('../../src/level.ts');const move=newGame().listLegalMoves()[0];for(const at of [move.from,move.to])await page.locator(`[data-cell="${at.row*8+at.col}"]`).click();await expect(page.locator('.board')).toHaveAttribute('data-moves','1');await expect(page.locator('.board')).toHaveAttribute('data-reconciled','true');
});
