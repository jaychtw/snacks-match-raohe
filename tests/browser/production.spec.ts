import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
import {loadGame,type Move} from '@jaychtw/match3-core';
import {levels,FREE} from '../../src/level.ts';
const report=JSON.parse(readFileSync('docs/evidence/level-validation.json','utf8'));
async function read(page:Page){return JSON.parse((await page.evaluate(()=>localStorage.getItem('snacks-raohe-session-v1')))!);}
async function move(page:Page,action:Move){
 const game=loadGame((await read(page)).state),result=game.applyMove(action);expect(result.ok).toBe(true);
 await page.locator(`[data-cell="${action.from.row*8+action.from.col}"]`).click();await page.locator(`[data-cell="${action.to.row*8+action.to.col}"]`).click();
 await expect(page.locator('.board')).toHaveAttribute('data-moves',String(game.state.moves));await expect(page.locator('.board')).toHaveAttribute('data-reconciled','true');
 expect(JSON.parse((await read(page)).state)).toEqual(game.state);
 expect(await page.locator('.cell').evaluateAll(cells=>cells.map(el=>({id:Number((el as HTMLElement).dataset.id),type:(el as HTMLElement).dataset.type||null,special:(el as HTMLElement).dataset.special||null})))).toEqual(game.state.board.flat());
}
async function open(page:Page){await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');}
test('entire campaign: real winning moves, chapter unlocks, completion reload and replay',async({page})=>{
 test.setTimeout(300000);await open(page);
 await page.locator('#journey').click();await expect(page.locator('[data-level]:disabled')).toHaveCount(14);await page.getByRole('button',{name:'Back to game',exact:true}).click();
 for(const [i,level] of levels.entries()){
  expect((await read(page)).level).toBe(level.id);
  for(const action of report.levels[i].win.actions)await move(page,action);
  await expect(page.getByRole('dialog')).toContainText(i===14?'A feast to remember':'Deliciously done');
  const saved=await read(page);await page.reload();expect(await read(page)).toEqual(saved);
  const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('snacks-raohe-progress-v1')!));expect(progress.completed).toHaveLength(i+1);
  if(i<14)await page.getByRole('button',{name:'Next level',exact:true}).click();
 }
 await page.getByRole('button',{name:'Choose a level',exact:true}).click();await expect(page.locator('[data-level]:disabled')).toHaveCount(0);
 await page.screenshot({path:'docs/evidence/campaign-completed-journey.png',fullPage:true});
 await page.locator(`[data-level="${levels[0].id}"]`).click();expect((await read(page)).level).toBe(levels[0].id);await expect(page.locator('.board')).toHaveAttribute('data-moves','0');
});
test('Free Play and Journey retain separate exact sessions across navigation and restart',async({page})=>{
 await open(page);const journey=await read(page);await move(page,loadGame(journey.state).listLegalMoves()[0]);const playedJourney=await read(page);
 await page.locator('#free').click();expect((await read(page)).level).toBe(FREE);await expect(page.locator('#moves')).toHaveText('∞');await expect(page.locator('.goal-card')).toContainText('Play at your own pace');
 await move(page,loadGame((await read(page)).state).listLegalMoves()[0]);const free=await read(page);await expect(page.getByRole('status')).toHaveText('Snacks swapped: 1');
 await page.reload();expect(await read(page)).toEqual(free);await page.locator('#journey').click();expect(await read(page)).toEqual(playedJourney);
 // Choosing Journey from Free Play restores its active session through Home Continue.
 // The level tile explicitly starts a replay; use mode control to resume instead below.
 await page.locator('#free').click();expect(await read(page)).toEqual(free);
 await page.locator('#home').click();await page.getByRole('button',{name:'Continue playing',exact:true}).click();expect(await read(page)).toEqual(free);
 await page.locator('#restart').click();await page.getByRole('button',{name:'Keep playing',exact:true}).click();expect(await read(page)).toEqual(free);
 await page.locator('#restart').click();await page.getByRole('button',{name:'Restart',exact:true}).click();expect((await read(page)).level).toBe(FREE);await expect(page.locator('.board')).toHaveAttribute('data-moves','0');
 expect(playedJourney.level).toBe(levels[0].id);
});
for(const width of [320,1440])test(`settings, audio, bilingual tutorials and modal accessibility at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.addInitScript(()=>{const Original=window.AudioContext;(window as any).__audio=[];window.AudioContext=class extends Original{constructor(){super();(window as any).__audio.push(this);}createOscillator(){(window as any).__oscillators=((window as any).__oscillators??0)+1;return super.createOscillator();}};});await open(page);
 await page.locator('.cell').first().click();await expect.poll(()=>page.evaluate(()=>(window as any).__oscillators??0)).toBeGreaterThan(0);
 await page.locator('#settings').click();await page.locator('[data-preference=effects]').uncheck();await page.locator('[data-preference=music]').check();await page.locator('[data-preference=muted]').check();await page.getByRole('slider').fill('25');await page.locator('[data-preference=large]').check();
 let prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('snacks-raohe-preferences')!));expect(prefs).toMatchObject({music:true,muted:true,effects:false,volume:.25,large:true});
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.getByRole('button',{name:'Back to game',exact:true}).click();await page.reload();await page.locator('#settings').click();await expect(page.locator('[data-preference=effects]')).not.toBeChecked();await expect(page.locator('[data-preference=music]')).toBeChecked();await expect(page.locator('[data-preference=muted]')).toBeChecked();await expect(page.getByRole('slider')).toHaveValue('25');
 await page.locator('[data-preference=muted]').uncheck();
 await expect.poll(()=>page.evaluate(()=>(window as any).__audio?.[0]?.state)).toBe('running');await expect.poll(()=>page.evaluate(()=>(window as any).__oscillators??0)).toBeGreaterThan(0);await page.getByRole('button',{name:'Back to game',exact:true}).click();
 await page.locator('#tutorial').click();await expect(page.getByRole('dialog')).toContainText('prism');expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);await page.keyboard.press('Escape');
 await page.locator('#language').click();await page.locator('#tutorial').click();await expect(page.getByRole('dialog')).toContainText('稜鏡');await page.screenshot({path:`docs/evidence/campaign-tutorial-${width}-zh-TW.png`,fullPage:true});await page.keyboard.press('Escape');
 await page.locator('#journey').click();expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);await page.screenshot({path:`docs/evidence/campaign-levels-${width}-zh-TW.png`,fullPage:true});await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/campaign-board-${width}-zh-TW.png`,fullPage:true});
});
test('corrupt progression is preserved until explicit recovery',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('snacks-raohe-progress-v1','{damaged'));await open(page);await page.locator('#journey').click();
 expect(await page.evaluate(()=>localStorage.getItem('snacks-raohe-progress-v1'))).toBe('{damaged');await page.getByRole('button',{name:'Recover progression',exact:true}).click();await page.getByRole('button',{name:'Keep playing',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('snacks-raohe-progress-v1'))).toBe('{damaged');
 await page.getByRole('button',{name:'Recover progression',exact:true}).click();await page.getByRole('button',{name:'Restart',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('snacks-raohe-progress-v1-damaged'))).toBe('{damaged');expect(JSON.parse((await page.evaluate(()=>localStorage.getItem('snacks-raohe-progress-v1'))))!).toMatchObject({version:1,completed:[]});
});
test('replacing an unfinished Journey from Free Play requires confirmation',async({page})=>{
 await open(page);await move(page,loadGame((await read(page)).state).listLegalMoves()[0]);const journey=await read(page);
 await page.evaluate(()=>localStorage.setItem('snacks-raohe-progress-v1',JSON.stringify({version:1,completed:['g2-bright-beginning'],best:{'g2-bright-beginning':1800}})));await page.reload();await page.locator('#free').click();const free=await read(page);
 await page.locator('#home').click();await page.getByRole('button',{name:'Choose a level',exact:true}).click();await page.locator(`[data-level="${levels[1].id}"]`).click();await expect(page.getByRole('dialog')).toContainText('replaces this board');await page.getByRole('button',{name:'Keep playing',exact:true}).click();expect(await read(page)).toEqual(free);
 expect(JSON.parse((await page.evaluate(()=>localStorage.getItem('snacks-raohe-journey-session-v1')))!)).toEqual(journey);
 await page.locator(`[data-level="${levels[1].id}"]`).click();await page.getByRole('button',{name:'Start level',exact:true}).click();expect((await read(page)).level).toBe(levels[1].id);
});
test('a corrupt inactive mode slot stays intact until explicit new-game recovery',async({page})=>{
 await open(page);const journey=await read(page);await page.evaluate(()=>localStorage.setItem('snacks-raohe-free-session-v1','{broken'));await page.locator('#free').click();await expect(page.getByRole('dialog')).toContainText('saved mode');expect(await page.evaluate(()=>localStorage.getItem('snacks-raohe-free-session-v1'))).toBe('{broken');await page.getByRole('button',{name:'Keep playing',exact:true}).click();expect(await read(page)).toEqual(journey);
 await page.locator('#free').click();await page.getByRole('button',{name:'Start a new session',exact:true}).click();expect((await read(page)).level).toBe(FREE);
});
