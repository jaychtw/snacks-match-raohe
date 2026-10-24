import { icon } from './icons.ts';
import './style.css';
import { loadGame, type GameEvent, type Move, type Special } from '@jaychtw/match3-core';
import { messages, format, type Lang, type Messages } from './i18n.ts';
import { piece, shapes, type Shape } from './pieces.ts';
import { level, levels, definition, FREE } from './level.ts';
import { complete, readProgress, unlocked, nextLevel, PROGRESS_KEY, emptyProgress } from './progress.ts';
import { Sound } from './audio.ts';
import { TurnController } from './controller.ts';
import { playEvent, rejectSwap } from './animation.ts';
import { diagnostic, freshSession, persist, readSession, encode, decode, type StorageLike } from './session.ts';
import { reconciles, type View } from './projection.ts';

const storage:StorageLike={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
const restored=readSession(storage);
let controller=new TurnController(restored.session??freshSession());
const journey=readProgress(storage);let progress=journey.progress,progressIssue=journey.issue;
const sound=new Sound();
const spec=()=>definition(controller.session.levelId??level.id);
const slot=(id:string)=>id===FREE?'snacks-raohe-free-session-v1':'snacks-raohe-journey-session-v1';
let lang:Lang='en', reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, large=false;
let storageFailed=restored.issue==='storage', corrupt=restored.issue==='corrupt';
try {
 const prefs=JSON.parse(storage.getItem('snacks-raohe-preferences')||'{}');
 if(prefs.lang==='en'||prefs.lang==='zh-TW')lang=prefs.lang;
 if(typeof prefs.reduced==='boolean')reduced=prefs.reduced;
 if(typeof prefs.large==='boolean')large=prefs.large;
 for(const key of ['muted','music','effects'] as const)if(typeof prefs[key]==='boolean')sound.preferences[key]=prefs[key];
 if(typeof prefs.volume==='number'&&Number.isFinite(prefs.volume))sound.preferences.volume=Math.max(0,Math.min(1,prefs.volume));
}catch {storageFailed=true;}
if(!restored.session&&!restored.issue)storageFailed=!persist(storage,controller.session);
let selected=-1, focusCell=0, uiBusy=false;
let feedback:{key:keyof Messages;values:Record<string,string|number>}={key:'readyPlay',values:{}};
let errorCode:string|null=null, resultDismissed=false;
const app=document.querySelector<HTMLDivElement>('#app')!;
app.addEventListener('pointerdown',()=>{void sound.unlock();},{capture:true});
app.addEventListener('keydown',()=>{void sound.unlock();},{capture:true});
document.addEventListener('visibilitychange',()=>sound.music());
// Some touch browsers suppress compatibility clicks after a captured board gesture.
// Activate off-board controls from a completed touch pointer, without relying on that click.
let controlTouch:{id:number;control:HTMLButtonElement|HTMLInputElement;x:number;y:number}|null=null;
let handledControlTap:{x:number;y:number;until:number}|null=null;
// A touch-generated native click can be retargeted to newly rendered controls.
// Suppress that one trailing click; real mouse pointerdown and keyboard remain native.
app.addEventListener('click',event=>{
 if(!event.isTrusted)return; // Explicit pointerup activation uses HTMLElement.click().
 const target=event.target as Element;
 const control=target.closest('button,input[type=checkbox]')??target.closest('label')?.querySelector('input[type=checkbox]');
 const source=event as MouseEvent&{sourceCapabilities?:{firesTouchEvents:boolean}};
 const nativeTouch=(event as PointerEvent).pointerType==='touch'||source.sourceCapabilities?.firesTouchEvents===true;
 const handledControl=nativeTouch&&control&&!control.closest('.board');
 const trailing=handledControlTap&&event.detail!==0&&performance.now()<=handledControlTap.until&&Math.hypot(event.clientX-handledControlTap.x,event.clientY-handledControlTap.y)<=24;
 if(!handledControl&&!trailing)return;
 handledControlTap=null;event.preventDefault();event.stopImmediatePropagation();
},true);
app.addEventListener('pointerdown',event=>{
 handledControlTap=null; // A fresh physical gesture owns its own activation.
 if(event.pointerType!=='touch'||!event.isPrimary)return;
 const target=event.target as Element;
 if(target.closest('.board'))return;
 const control=target.closest<HTMLButtonElement|HTMLInputElement>('button,input[type=checkbox]')??target.closest('label')?.querySelector<HTMLInputElement>('input[type=checkbox]');
 if(!control||control.disabled)return;
 event.preventDefault();
 controlTouch={id:event.pointerId,control,x:event.clientX,y:event.clientY};
});
app.addEventListener('pointerup',event=>{
 if(!controlTouch||controlTouch.id!==event.pointerId)return;
 const touch=controlTouch;controlTouch=null;
 if(Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>12||!touch.control.isConnected||touch.control.disabled)return;
 event.preventDefault();handledControlTap={x:event.clientX,y:event.clientY,until:performance.now()+800};touch.control.focus({preventScroll:true});touch.control.click();
});
app.addEventListener('pointercancel',()=>{controlTouch=null;});

const specials:Special[]=['horizontal','vertical','bomb','color'];
const t=()=>messages[lang];
const number=(n:number)=>new Intl.NumberFormat(lang).format(n);
function preferences() {try{storage.setItem('snacks-raohe-preferences',JSON.stringify({lang,reduced,large,...sound.preferences}));}catch{storageFailed=true;}}
function say(key:keyof Messages,values:Record<string,string|number>={}) {
 feedback={key,values}; const status=document.querySelector('.feedback');if(status)status.textContent=format(t()[key],values);
}
function draw(view=controller.view) {
 const cells=[...document.querySelectorAll<HTMLButtonElement>('[data-cell]')];
 view.board.flat().forEach((p,i)=>{
  const el=cells[i];if(!el)return;
  const shape=(p?.type??'pepper_bun') as Shape;
  el.dataset.id=p?String(p.id):'';el.dataset.type=p?.type??'';el.dataset.special=p?.special??'';
  el.innerHTML=p?piece(shape,p.special):'';
  el.classList.toggle('selected',selected===i);
  el.setAttribute('aria-pressed',String(selected===i));
  el.setAttribute('aria-label',`${t().row} ${Math.floor(i/8)+1}, ${t().col} ${i%8+1}: ${p?(p.special==='color'?t().color:t()[shape]+(p.special?', '+t()[p.special]:'')):t().resolving}`);
  el.disabled=uiBusy;el.classList.remove('hinted');el.tabIndex=i===focusCell?0:-1;
  el.setAttribute('aria-disabled',String(view.status!=='playing'||corrupt));
 });
 const limit=controller.session.game.state.config.moveLimit;
 document.querySelector('#moves')!.textContent=limit===null?'∞':number(limit-view.moves);
 document.querySelector('#score')!.textContent=number(view.score);
 view.progress.forEach((p,i)=>{
  const el=document.querySelector(`[data-progress="${i}"]`);if(el)el.textContent=format(p.objective.kind==='clear'?t().collectProgress:t().progressScore,{current:number(p.current),target:number(p.objective.target)});
  const bar=document.querySelector<HTMLElement>(`[data-bar="${i}"]`);if(bar)bar.style.width=`${Math.min(100,p.current/p.objective.target*100)}%`;
 });
 const board=document.querySelector<HTMLElement>('.board')!;
 board.dataset.reconciled=uiBusy?'false':'true';
 board.dataset.score=String(view.score);board.dataset.moves=String(view.moves);board.dataset.status=view.status;
 board.setAttribute('aria-busy',String(uiBusy));
}
function render() {
 const oldScroll=document.querySelector('.board-scroll')?.scrollLeft??0;
 const m=t(),current=spec(),free=current.id===FREE; document.documentElement.lang=lang;document.documentElement.dataset.motion=reduced?'reduced':'full';
 app.innerHTML=`<header class="header">
 <button class="brand" aria-label="${m.brand}"><span class="brand-mark">${icon('lantern')}</span><span>${m.brand}<small>${m.edition}</small></span></button>
 <nav aria-label="${m.menu}"><button id="journey" class="${free?'':'nav-active'}">${m.journey}</button><button id="free" class="${free?'nav-active':''}">${m.free}</button></nav>
 <div class="header-actions"><button id="language" class="language" aria-label="${m.language}">${lang==='en'?'繁中':'EN'}<span aria-hidden="true"> ⇄</span></button><button id="settings" class="icon-button" aria-label="${m.settings}">${icon('settings')}</button></div>
</header>
<main>
 <section class="intro"><div class="eyebrow"><span></span>${m.nightMarket}<span></span></div><h1>${m.title}</h1><p>${m.subtitle}</p></section>
 <div class="game-layout">
  <aside class="order-sign"><div class="sign-hooks" aria-hidden="true"></div><div class="level-copy"><span class="eyebrow">${free?m.free:format(m.levelLabel,{number:current.number})}</span><h2>${m[current.titleKey as keyof Messages]}</h2></div>
   <div class="goal-card"><span class="eyebrow">${m.goal}</span>${controller.view.progress.length?controller.view.progress.map((p,i)=>`<div class="goal-line"><div class="mini-shape">${p.objective.kind==='clear'?piece(p.objective.types[0] as Shape):'<span class="score-seal" aria-hidden="true">✦</span>'}</div><strong>${p.objective.kind==='score'?format(m.goalScore,{target:number(p.objective.target)}):format(m.collectTypes,{types:p.objective.types.map(type=>m[type as Shape]).join(' · '),target:number(p.objective.target)})}</strong></div><div class="progress-track"><span data-bar="${i}"></span></div><small data-progress="${i}" ${i===0?'id="objective-current"':''}></small>`).join(''):`<p>${m.noTarget}</p>`}</div>
   <div class="hud"><div><span>${m.moves}</span><strong id="moves"></strong></div><div><span>${m.score}</span><strong id="score"></strong></div></div><div class="sign-bottom" aria-hidden="true">✦</div>
  </aside>
  <section class="gate" aria-label="${free?m.free:format(m.levelLabel,{number:current.number})}">
   <img class="gate-art" src="art/gate.webp" alt="" aria-hidden="true"><div class="gate-sign"><span>${lang==='en'?m.gateSub:m.gateTitle}</span><strong>${lang==='en'?m.gateTitle:m.gateSub}</strong><div aria-hidden="true">◆ ━━━━━ ◆</div></div>
   <div class="board-wrap"><div class="board-scroll ${large?'enlarged':''}"><div class="board" role="group" aria-label="${m.board}" aria-describedby="board-help">${Array.from({length:64},(_,i)=>`<button class="cell" data-cell="${i}"></button>`).join('')}</div></div><div class="effect-overlay" aria-hidden="true"></div></div>
   ${large?`<div class="pan-controls"><button id="pan-left" aria-label="${m.panLeft}">←</button><small>${m.largeHelp}</small><button id="pan-right" aria-label="${m.panRight}">→</button></div>`:''}
   <div class="board-foot"><span aria-hidden="true">◆</span>${free?m.free:format(m.note,{level:current.number})}<span aria-hidden="true">◆</span></div>
  </section>
  <aside class="market-tools" aria-label="${m.playTools}"><span class="eyebrow">${m.hintTip}</span><button id="hint" class="tool-button">${icon('hint')}<span>${m.hintButton}</span></button><button id="shuffle-board" class="tool-button">${icon('shuffle')}<span>${m.shuffleButton}</span></button><button id="pause" class="tool-button">${icon('pause')}<span>${m.pause}</span></button><div class="tools-divider"></div><button id="restart" class="tool-small">${icon('restart')}<span>${free?m.restartFree:m.restart}</span></button><button id="large" class="tool-small" aria-pressed="${large}">${large?m.compact:m.large}</button></aside>
 </div>
 <div class="below-board"><p class="feedback" role="status" aria-live="polite">${format(m[feedback.key],feedback.values)}</p><p id="board-help">${m.controlsSub}</p><p class="keyboard-help">${m.keyboardHelp}</p><div class="direction-pad" role="group" aria-label="${m.swapHint}"><button data-direction="up" aria-label="${m.up}">↑</button><button data-direction="left" aria-label="${m.left}">←</button><span aria-hidden="true">✦</span><button data-direction="right" aria-label="${m.right}">→</button><button data-direction="down" aria-label="${m.down}">↓</button></div><div class="game-toolbar"><button id="home">${icon('home')}${m.home}</button><button id="tutorial">${icon('book')}${m.tutorial}</button><label class="motion-control"><input type="checkbox" id="motion" ${reduced?'checked':''}>${m.motion}</label></div><p class="save-notice ${storageFailed||progressIssue?'warning':''}" ${storageFailed?'role="alert"':''}>${icon('check')}${storageFailed?m.storageWarning:progressIssue?m.progressProblem:m.saved}</p></div>
 <section class="collection"><div class="section-heading"><span class="eyebrow">${m.shapeLabel}</span><h2>${m.pieces}</h2><p>${m.piecesSub}</p></div><div class="shape-gallery">${shapes.map(s=>`<div class="specimen"><div>${piece(s)}</div><span>${m[s]}</span></div>`).join('')}</div><div class="special-gallery">${specials.map((s,i)=>`<div class="special-specimen">${piece((['candied_fruit','grilled_corn','bubble_tea','pepper_bun'] as Shape[])[i],s)}<span>${m[s]}</span></div>`).join('')}</div><p>${m.powersSub}</p></section>
</main><footer><span>${m.madeIn}</span><span>${m.study}</span></footer><dialog aria-labelledby="dialog-title" aria-describedby="dialog-body"><h2 id="dialog-title"></h2><p id="dialog-body"></p><div class="dialog-actions"></div></dialog>`;
 draw();document.querySelector('.board-scroll')!.scrollLeft=oldScroll;
 document.querySelector('.brand')!.addEventListener('click',e=>{e.preventDefault();if(!uiBusy)home();});
 document.querySelector('#journey')!.addEventListener('click',()=>{if(spec().id===FREE)switchMode(level.id);else levelMenu();});
 document.querySelector('#free')!.addEventListener('click',()=>switchMode(FREE));
 document.querySelector('#home')!.addEventListener('click',home);
 document.querySelector('#settings')!.addEventListener('click',settings);
 document.querySelector('#tutorial')!.addEventListener('click',tutorial);
 document.querySelector('#language')!.addEventListener('click',()=>{if(uiBusy)return;lang=lang==='en'?'zh-TW':'en';preferences();render();document.querySelector<HTMLButtonElement>('#language')!.focus();showNeededDialog();});
 document.querySelector('#motion')!.addEventListener('change',e=>{reduced=(e.target as HTMLInputElement).checked;preferences();document.documentElement.dataset.motion=reduced?'reduced':'full';});
 document.querySelector('#large')!.addEventListener('click',()=>{if(uiBusy)return;large=!large;preferences();render();document.querySelector<HTMLButtonElement>('#large')!.focus();});
 document.querySelector('#restart')!.addEventListener('click',()=>confirmRestart());
 document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(el=>el.addEventListener('click',()=>{if(selected>=0)void directional(selected,el.dataset.direction!);}));
 document.querySelector('#pan-left')?.addEventListener('click',()=>document.querySelector('.board-scroll')!.scrollBy({left:-200,behavior:reduced?'instant':'smooth'}));
 document.querySelector('#pan-right')?.addEventListener('click',()=>document.querySelector('.board-scroll')!.scrollBy({left:200,behavior:reduced?'instant':'smooth'}));
 document.querySelector('#hint')!.addEventListener('click',showHint);
 document.querySelector('#shuffle-board')!.addEventListener('click',confirmShuffle);
 document.querySelector('#pause')!.addEventListener('click',()=>{if(!uiBusy)dialog(t().pause,t().pauseBody,[{label:t().continueGame,run:()=>focus(focusCell)}],()=>focus(focusCell));});
 bindBoard();
}
function showHint(){
 if(locked())return;
 document.querySelectorAll('.hinted').forEach(el=>el.classList.remove('hinted'));
 const move=controller.session.game.listLegalMoves()[0];
 if(!move)return;
 for(const at of [move.from,move.to])document.querySelector(`[data-cell="${at.row*8+at.col}"]`)?.classList.add('hinted');
 say('hintShown');
}
function confirmShuffle(){
 if(locked())return;
 dialog(t().shuffleTitle,t().shuffleBody,[{label:t().cancel,run:()=>focus(focusCell)},{label:t().shuffleConfirm,run:()=>{void shuffleBoard();}}],()=>focus(focusCell));
}
async function shuffleBoard(){
 const previous=controller.session;
 const candidate=loadGame(previous.game.serialize()),result=candidate.reshuffle();
 if(!result.ok){say('shuffleFailed');return;}
 busy(true);
 try{
  for(const event of result.events)await playEvent(controller.view,event,{draw:()=>draw(),reduced:()=>reduced||matchMedia('(prefers-reduced-motion: reduce)').matches,announce});
  if(!reconciles(controller.view,result.state,candidate.objectives()))throw Error('Reconciliation');
  controller=new TurnController({...previous,game:candidate,initial:candidate.serialize(),actions:[]});
  selected=-1;save(previous);say('shuffle');
 }catch{controller=new TurnController(previous);say('shuffleFailed');}
 busy(false);render();focus(focusCell);
}
function focus(index:number,scroll=false) {
 focusCell=index;document.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach(el=>el.tabIndex=Number(el.dataset.cell)===index?0:-1);
 const el=document.querySelector<HTMLButtonElement>(`[data-cell="${index}"]`)!;el.focus({preventScroll:true});if(scroll)el.scrollIntoView({block:'nearest',inline:'nearest'});
}
function locked(){return uiBusy||corrupt||controller.session.game.state.status!=='playing'||!!document.querySelector('dialog[open]');}
function choose(index:number) {
 if(locked())return;
 focusCell=index;
 if(selected===index){selected=-1;say('readyPlay');draw();focus(index);return;}
 if(selected>=0) {
  const from={row:Math.floor(selected/8),col:selected%8},to={row:Math.floor(index/8),col:index%8};
  if(Math.abs(from.row-to.row)+Math.abs(from.col-to.col)===1){void submit({from,to});return;}
 }
 document.querySelectorAll('.hinted').forEach(el=>el.classList.remove('hinted'));selected=index;sound.cue('select');say('selectedPlay');draw();focus(index);
}
function neighbor(index:number,direction:string):number|null {
 const r=Math.floor(index/8),c=index%8;
 if(direction==='up'&&r>0)return index-8;if(direction==='down'&&r<7)return index+8;
 if(direction==='left'&&c>0)return index-1;if(direction==='right'&&c<7)return index+1;return null;
}
async function directional(index:number,direction:string) {
 if(locked())return;
 const next=neighbor(index,direction);if(next===null){say('edge');return;}
 await submit({from:{row:Math.floor(index/8),col:index%8},to:{row:Math.floor(next/8),col:next%8}});
}
function bindBoard() {
 const board=document.querySelector<HTMLElement>('.board')!;
 let start:{id:number;index:number;x:number;y:number;width:number}|null=null;
 board.addEventListener('pointerdown',e=>{
  if(locked()||e.button!==0||start)return;
  const cell=(e.target as Element).closest<HTMLElement>('[data-cell]');if(!cell)return;
  start={id:e.pointerId,index:Number(cell.dataset.cell),x:e.clientX,y:e.clientY,width:cell.getBoundingClientRect().width};
  board.setPointerCapture(e.pointerId);
 });
 board.addEventListener('pointerup',e=>{
  if(!start||start.id!==e.pointerId)return;
  const origin=start;start=null;
  const dx=e.clientX-origin.x,dy=e.clientY-origin.y,threshold=Math.max(12,Math.min(22,origin.width*.3));
  if(Math.hypot(dx,dy)<threshold){choose(origin.index);return;}
  // Ambiguous diagonal movement does not accidentally spend a move.
  if(Math.max(Math.abs(dx),Math.abs(dy))<Math.min(Math.abs(dx),Math.abs(dy))*1.2)return;
  const direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
  void directional(origin.index,direction);
 });
 board.addEventListener('pointercancel',()=>{start=null;});
 board.addEventListener('lostpointercapture',()=>{start=null;});
 board.addEventListener('click',e=>{if(e.detail!==0)return;const cell=(e.target as Element).closest<HTMLElement>('[data-cell]');if(cell)choose(Number(cell.dataset.cell));});
 board.addEventListener('keydown',e=>{
  if(locked())return;const cell=(e.target as Element).closest<HTMLElement>('[data-cell]');if(!cell)return;
  const directions:Record<string,string>={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
  if(directions[e.key]){e.preventDefault();const next=neighbor(Number(cell.dataset.cell),directions[e.key]);if(next!==null)focus(next,true);}
  if(e.key==='Escape'){selected=-1;draw();say('readyPlay');}
 });
}
function busy(value:boolean) {
 uiBusy=value;document.querySelectorAll<HTMLButtonElement>('#language,#restart,#large,#pan-left,#pan-right,#journey,#free,#home,#settings,#tutorial,#hint,#shuffle-board,#pause,[data-direction]').forEach(el=>el.disabled=value);
 document.querySelector<HTMLElement>('.board')!.dataset.reconciled=value?'false':'true';draw();
}
function sparkle(label:string,at?:{row:number;col:number}) {
 const overlay=document.querySelector<HTMLElement>('.effect-overlay')!;
 overlay.innerHTML='';
 const text=document.createElement('span');text.className='effect-message';text.textContent=label;overlay.append(text);
 const wrap=document.querySelector('.board-wrap')!.getBoundingClientRect();
 const cell=at?document.querySelector(`[data-cell="${at.row*8+at.col}"]`)?.getBoundingClientRect():null;
 for(let i=0;i<8;i++){
  const spark=document.createElement('i');spark.textContent='✦';
  spark.style.setProperty('--x',`${cell?cell.x-wrap.x+cell.width/2:wrap.width/2}px`);
  spark.style.setProperty('--y',`${cell?cell.y-wrap.y+cell.height/2:wrap.height/2}px`);
  spark.style.setProperty('--turn',`${i*45}deg`);spark.style.setProperty('--spread',`${i*45}deg`);overlay.append(spark);
 }
 overlay.classList.add('show');setTimeout(()=>overlay.classList.remove('show'),650);
}
function announce(event:GameEvent) {
 if(event.type==='matched')sound.cue(event.wave?'cascade':'match');
 if(event.type==='specialCreated')sound.cue('create');
 if(event.type==='activated'||event.type==='combined')sound.cue('activate');
 if(event.type==='specialCreated')sparkle(t().specialMade,event.at);
 if(event.type==='combined')sparkle(t().combination,event.pieces[0]);
 if(event.type==='activated')sparkle(t().specialActive,event.at);
 if(event.type==='matched'&&event.wave>0)sparkle(format(t().cascadeCount,{count:event.wave+1}));
 if(event.type==='matched')say(event.wave>0?'cascadeCount':'matchActive',{count:event.wave+1});
 if(event.type==='specialCreated')say('specialMade');
 if(event.type==='activated')say('specialActive');
 if(event.type==='combined')say('combination');
 if(event.type==='reshuffled')say('shuffle');
}
function domMatches(view:View) {
 return [...document.querySelectorAll<HTMLElement>('[data-cell]')].every((el,i)=>{
  const p=view.board[Math.floor(i/8)][i%8];return el.dataset.id===(p?String(p.id):'')&&el.dataset.type===(p?.type??'')&&el.dataset.special===(p?.special??'');
 })&&view.progress.every((p,i)=>document.querySelector(`[data-progress="${i}"]`)?.textContent===format(p.objective.kind==='clear'?t().collectProgress:t().progressScore,{current:number(p.current),target:number(p.objective.target)}))&&document.querySelector('#score')!.textContent===number(view.score)&&document.querySelector('#moves')!.textContent===(controller.session.game.state.config.moveLimit===null?'∞':number(controller.session.game.state.config.moveLimit!-view.moves))&&document.querySelector<HTMLElement>('.board')!.dataset.status===view.status;
}
async function submit(action:Move) {
 if(locked())return;
 sound.cue('swap');selected=-1;focusCell=action.to.row*8+action.to.col;say('resolving');busy(true);
 const outcome=await controller.attempt(action,(view,event,eventCount)=>playEvent(view,event,{scale:Math.min(1,16/eventCount),draw:()=>draw(view),reduced:()=>reduced||matchMedia('(prefers-reduced-motion: reduce)').matches,announce}));
 if(outcome.kind==='committed') {
  if(!domMatches(controller.view)) {
   const report=diagnostic(outcome.previous,action,'DOM_RECONCILIATION');controller=new TurnController(outcome.previous);controller.lastDiagnostic=report;errorCode='DOM_RECONCILIATION';
  }else {
   save(outcome.previous);
   recordWin();
   if(spec().id===FREE)say('freeProgress',{moves:number(controller.view.moves)});
   else say('movesAnnouncement',{moves:controller.session.game.state.config.moveLimit!-controller.view.moves,score:number(controller.view.score)});
   resultDismissed=false;
  }
 }else if(outcome.kind==='invalid') {sound.cue('invalid');say('invalid');await rejectSwap(action,reduced||matchMedia('(prefers-reduced-motion: reduce)').matches);}
 else if(outcome.kind==='error')errorCode=outcome.code;
 if(errorCode&&controller.lastDiagnostic)try{storage.setItem('snacks-raohe-diagnostic-v1',JSON.stringify(controller.lastDiagnostic));}catch{/* diagnostic remains downloadable in memory */}
 busy(false);render();focus(focusCell);showNeededDialog();
}
function dialog(title:string,body:string,actions:{label:string;run:()=>void}[],onCancel?:()=>void) {
 const el=document.querySelector<HTMLDialogElement>('dialog')!;
 el.querySelectorAll('.level-menu,.settings-content,.tutorial-content').forEach(node=>node.remove());
 document.querySelector('#dialog-title')!.textContent=title;document.querySelector('#dialog-body')!.textContent=body;
 const row=document.querySelector('.dialog-actions')!;row.innerHTML='';
 for(const {label,run} of actions){const b=document.createElement('button');b.className='action-button';b.textContent=label;b.addEventListener('click',()=>{el.close();run();});row.append(b);}
 el.oncancel=e=>{if(!onCancel)e.preventDefault();else onCancel();};
 if(el.open)el.close();el.showModal();
}
function restart() {
 const previous=controller.session;controller=new TurnController(freshSession(spec().id));selected=-1;focusCell=0;resultDismissed=false;corrupt=false;errorCode=null;
 save(previous);say('readyPlay');render();focus(0);
}
function confirmRestart() {
 if(uiBusy||corrupt)return;
 dialog(spec().id===FREE?t().restartFreeTitle:t().restartTitle,spec().id===FREE?t().restartFreeBody:t().restartBody,[{label:t().cancel,run:()=>focus(focusCell)},{label:t().confirm,run:restart}],()=>focus(focusCell));
}
function showNeededDialog() {
 if(corrupt) {
  const actions=[];
  if(restored.backup)actions.push({label:t().restoreBackup,run:()=>{controller=new TurnController(restored.backup!);corrupt=false;storageFailed=!persist(storage,controller.session);render();focus(0);showNeededDialog();}});
  actions.push({label:t().recoverNew,run:restart});dialog(t().recoveryTitle,t().corrupt,actions);return;
 }
 if(errorCode) {
  dialog(t().errorTitle,format(t().engineError,{code:errorCode}),[{label:t().dismiss,run:()=>{errorCode=null;focus(focusCell);}},{label:t().diagnostic,run:()=>{download();showNeededDialog();}},{label:t().restart,run:()=>{errorCode=null;confirmRestart();}}]);return;
 }
 if(controller.view.status!=='playing'&&!resultDismissed) {
  const won=controller.view.status==='won';sound.cue(won?'won':'lost');
  const next=won?nextLevel(spec().id):null;
  dialog(won?(spec().number===15?t().journeyComplete:t().won):t().lost,won?(spec().number===15?t().journeyCompleteBody:t().wonBody):t().lostBody,[...(next?[{label:t().next,run:()=>start(next)}]:[]),{label:t().retry,run:restart},{label:t().chooseLevel,run:levelMenu},{label:t().closeResult,run:()=>{resultDismissed=true;focus(focusCell);}}],()=>{resultDismissed=true;focus(focusCell);});
 }
}
function download() {
 const url=URL.createObjectURL(new Blob([JSON.stringify(controller.lastDiagnostic,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='snacks-raohe-diagnostic.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function save(previous?:typeof controller.session){
 storageFailed=!persist(storage,controller.session,previous)||storageFailed;
 try{storage.setItem(slot(spec().id),encode(controller.session));}catch{storageFailed=true;}
}
function recordWin(){
 if(controller.view.status!=='won'||progressIssue)return;
 progress=complete(progress,spec().id,controller.view.score);
 try{storage.setItem(PROGRESS_KEY,JSON.stringify(progress));}catch{storageFailed=true;}
}
function start(id:string,resume=false){
 if(uiBusy)return;
 save();let session=freshSession(id);
 if(resume)try{const raw=storage.getItem(slot(id));if(raw){const saved=decode(raw);if((saved.levelId===FREE)===(id===FREE))session=saved;}}catch{dialog(t().recoveryTitle,t().slotProblem,[{label:t().cancel,run:()=>{}},{label:t().recoverNew,run:()=>start(id)}],()=>{});return;}
 controller=new TurnController(session);selected=-1;focusCell=0;resultDismissed=false;errorCode=null;corrupt=false;save();say('readyPlay');render();focus(0);showNeededDialog();
}
function switchMode(id:string){if(uiBusy)return;if((spec().id===FREE)===(id===FREE)){if(id!==FREE)levelMenu();return;}start(id,true);}
function requestLevel(id:string){
 if(!unlocked(progress,id))return;
 if(spec().id===id&&controller.view.status==='playing'){document.querySelector<HTMLDialogElement>('dialog')!.close();focus(focusCell);return;}
 let replacing=spec().id!==FREE&&controller.view.moves>0&&controller.view.status==='playing';
 if(spec().id===FREE)try{const raw=storage.getItem(slot(level.id));if(raw){const saved=decode(raw);replacing=saved.game.state.status==='playing'&&saved.game.state.moves>0;}}catch{replacing=true;}
 if(replacing)dialog(t().leaveTitle,t().leaveBody,[{label:t().cancel,run:levelMenu},{label:t().startLevel,run:()=>start(id)}],levelMenu);
 else start(id);
}
function home(){if(uiBusy)return;dialog(t().brand,t().subtitle,[{label:t().continueGame,run:()=>focus(focusCell)},{label:t().chooseLevel,run:levelMenu},{label:t().free,run:()=>switchMode(FREE)},{label:t().settings,run:settings},{label:t().tutorial,run:tutorial}],()=>focus(focusCell));}
function levelMenu(){
 if(uiBusy)return;
 dialog(t().chooseLevel,format(t().progressSummary,{count:progress.completed.length,total:15}),[{label:t().back,run:()=>focus(focusCell)}],()=>focus(focusCell));
 const content=document.createElement('div');content.className='level-menu';
 for(let chapter=1;chapter<=3;chapter++){
  const heading=document.createElement('h3');heading.textContent=t()[('chapter'+chapter) as keyof Messages];content.append(heading);
  const group=document.createElement('div');group.className='level-grid';
  for(const level of levels.filter(l=>l.chapter===chapter)){
   const button=document.createElement('button');button.className='level-tile';button.dataset.level=level.id;button.disabled=!unlocked(progress,level.id);
   button.textContent=`${format(t().levelLabel,{number:level.number})} · ${t()[level.titleKey as keyof Messages]}${button.disabled?' · '+t().locked:progress.completed.includes(level.id)?' · '+t().completed+' · '+format(t().best,{score:number(progress.best[level.id]??0)}):''}`;
   button.onclick=()=>requestLevel(level.id);group.append(button);
  }content.append(group);
 }
 if(progressIssue){const recover=document.createElement('button');recover.className='action-button';recover.textContent=t().recoverProgress;recover.onclick=()=>dialog(t().recoverProgress,t().recoverProgressBody,[{label:t().cancel,run:levelMenu},{label:t().confirm,run:()=>{try{const raw=storage.getItem(PROGRESS_KEY);if(raw)storage.setItem(PROGRESS_KEY+'-damaged',raw);storage.setItem(PROGRESS_KEY,JSON.stringify(emptyProgress()));progress=emptyProgress();progressIssue=false;recordWin();levelMenu();}catch{storageFailed=true;render();}}}],levelMenu);content.append(recover);}
 document.querySelector('.dialog-actions')!.before(content);
}
function settings(){
 if(uiBusy)return;
 dialog(t().settings,t().soundNotice,[{label:t().back,run:()=>{render();focus(focusCell);}}],()=>{render();focus(focusCell);});
 const content=document.createElement('div');content.className='settings-content';
 for(const [key,label,value] of [['muted',t().mute,sound.preferences.muted],['effects',t().effects,sound.preferences.effects],['music',t().music,sound.preferences.music],['reduced',t().motion,reduced],['large',t().large,large]] as const){
  const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=value;input.dataset.preference=key;
  input.onchange=()=>{if(key==='reduced'){reduced=input.checked;document.documentElement.dataset.motion=reduced?'reduced':'full';}else if(key==='large')large=input.checked;else sound.preferences[key]=input.checked;preferences();sound.apply();sound.cue('select');};row.append(input,document.createTextNode(label));content.append(row);
 }
 const row=document.createElement('label'),volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='100';volume.value=String(sound.preferences.volume*100);volume.setAttribute('aria-label',t().volume);volume.oninput=()=>{sound.preferences.volume=Number(volume.value)/100;preferences();sound.apply();};volume.onchange=()=>sound.cue('select');row.append(document.createTextNode(t().volume),volume);content.append(row);
 if(!sound.available){const notice=document.createElement('p');notice.textContent=t().soundUnavailable;content.append(notice);}
 document.querySelector('.dialog-actions')!.before(content);
}
function tutorial(){
 if(uiBusy)return;
 dialog(t().tutorial,t().tutorialIntro+' '+(spec().id===FREE?t().freeHint:t()[('hint'+spec().number) as keyof Messages]),[{label:t().back,run:()=>focus(focusCell)}],()=>focus(focusCell));
 const content=document.createElement('div');content.className='tutorial-content';
 for(const key of ['tutorialControls','tutorialSpecial','tutorialCombos','tutorialGoals','tutorialSafety'] as const){const paragraph=document.createElement('p');paragraph.textContent=t()[key];content.append(paragraph);}
 document.querySelector('.dialog-actions')!.before(content);
}
recordWin();
render();showNeededDialog();
