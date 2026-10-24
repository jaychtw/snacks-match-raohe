import { createGame, loadGame, type Config, type Special } from '@jaychtw/match3-core';
import { shapes } from './pieces.ts';
export const ENGINE = '9863f8e023a227540a58491282e87d9f11a0cf79';
export interface Level {id:string;seed:string;chapter:number;number:number;config:Config;mechanic:string;difficulty:string;titleKey:string;setup?:{row:number;col:number;special:Special}[]}
const config=(moves:number|null,objectives:Config['objectives']):Config=>({rows:8,cols:8,pieceTypes:[...shapes],objectives,moveLimit:moves});
const score=(target:number)=>({kind:'score' as const,target});
const clear=(types:string[],target:number)=>({kind:'clear' as const,types,target});
const special=(kind:Special,col=3)=>({row:3,col,special:kind});
// Each seed, objective and authored special setup is a deliberate fixed design choice.
export const levels:Level[]=[
 {id:'g2-bright-beginning',seed:'shape-match-g2-bright',chapter:1,number:1,titleKey:'level1',config:config(18,[score(1800)]),mechanic:'Adjacent swaps, matching, scoring and invalid-swap recovery.',difficulty:'Introductory; the approved G2 level is retained unchanged.'},
 {id:'coral-connections',seed:'sm-v1-coral-02',chapter:1,number:2,titleKey:'level2',config:config(18,[clear(['pepper_bun'],18)]),mechanic:'Choose matches of a particular silhouette.',difficulty:'Gentle targeted collection.'},
 {id:'golden-route',seed:'sm-v1-golden-03',chapter:1,number:3,titleKey:'level3',config:config(20,[score(1100),clear(['grilled_squid'],12)]),mechanic:'Read and satisfy two simultaneous objectives.',difficulty:'Gentle planning; score and collection together.'},
 {id:'blue-and-mint',seed:'sm-v1-mint-04',chapter:1,number:4,titleKey:'level4',config:config(20,[clear(['candied_fruit','grilled_corn'],28)]),mechanic:'Distinguish candied_fruit and grilled_corn; either contributes to the same collection.',difficulty:'Target selection with two useful silhouettes.'},
 {id:'first-finale',seed:'sm-v1-finale-05',chapter:1,number:5,titleKey:'level5',config:config(22,[score(2400)]),mechanic:'Plan beyond the first match and notice cascades.',difficulty:'Chapter review with room to experiment.'},
 {id:'across-the-sky',seed:'sm-v1-line-h-06',chapter:2,number:6,titleKey:'level6',config:config(16,[score(2000)]),setup:[special('horizontal')],mechanic:'A marked horizontal piece starts on the board; swap it to activate a row.',difficulty:'Supported introduction to horizontal line power.'},
 {id:'mint-columns',seed:'sm-v1-line-v-07',chapter:2,number:7,titleKey:'level7',config:config(18,[clear(['candied_fruit','grilled_corn'],42)]),setup:[special('vertical',4)],mechanic:'A vertical line starts on the board; aim collection along its column.',difficulty:'Targeted collection with vertical power.'},
 {id:'violet-burst',seed:'sm-v1-bomb-08',chapter:2,number:8,titleKey:'level8',config:config(20,[score(2400),clear(['chicken_cutlet'],15)]),setup:[special('bomb')],mechanic:'A bomb starts on the board; its local burst can trigger neighboring specials.',difficulty:'Two goals with a supplied area effect.'},
 {id:'prism-party',seed:'sm-v1-prism-09',chapter:2,number:9,titleKey:'level9',config:config(20,[clear(['bubble_tea'],28)]),setup:[special('color')],mechanic:'Swap the neutral prism with a type to clear that ordinary type.',difficulty:'Choose a useful prism partner.'},
 {id:'power-pair',seed:'sm-v1-pair-10',chapter:2,number:10,titleKey:'level10',config:config(20,[score(3500)]),setup:[special('horizontal'),special('bomb',4)],mechanic:'Adjacent line and bomb demonstrate a special combination.',difficulty:'Chapter review: combine powers, then build score.'},
 {id:'crossroads',seed:'sm-v1-cross-11',chapter:3,number:11,titleKey:'level11',config:config(22,[score(3200),clear(['pepper_bun'],25)]),setup:[special('horizontal'),special('vertical',4)],mechanic:'Combine crossing line effects while pursuing a particular type.',difficulty:'Compound objective with a useful opening combination.'},
 {id:'golden-fireworks',seed:'sm-v1-fireworks-12',chapter:3,number:12,titleKey:'level12',config:config(20,[clear(['grilled_squid','chicken_cutlet'],60)]),setup:[special('color'),special('horizontal',4)],mechanic:'Prism plus line converts ordinary partners to alternating lines.',difficulty:'Plan collection around conversion chains.'},
 {id:'double-bloom',seed:'sm-v1-bloom-13',chapter:3,number:13,titleKey:'level13',config:config(22,[score(4200),clear(['bubble_tea'],25)]),setup:[special('bomb'),special('bomb',4)],mechanic:'Two bombs combine into a larger area; use cascades for remaining goals.',difficulty:'Balance broad clears with targeted collection.'},
 {id:'mint-constellation',seed:'sm-v1-stars-14',chapter:3,number:14,titleKey:'level14',config:config(24,[score(5000),clear(['grilled_corn'],40)]),setup:[special('color'),special('bomb',4)],mechanic:'Prism and bomb conversion starts a chain; finish both objectives.',difficulty:'Advanced mixed-objective planning.'},
 {id:'all-together',seed:'sm-v1-together-15',chapter:3,number:15,titleKey:'level15',config:config(26,[score(6500),clear([...shapes],170)]),setup:[special('color'),special('color',4)],mechanic:'Two prisms clear the board. Build further cascades and combinations to finish.',difficulty:'Finale: compound goals and full-board opening power.'},
];
export const level=levels[0]; // Approved G2 identity remains a compatibility/export alias.
export const FREE='free-play';
export function definition(id=level.id):Level {
 if(id===FREE)return {id:FREE,seed:'shape-match-free-v1',chapter:0,number:0,titleKey:'free',config:config(null,[]),mechanic:'Unlimited moves, all engine mechanics, no required target.',difficulty:'Relaxed and open-ended.'};
 const found=levels.find(item=>item.id===id);if(!found)throw new Error('Unknown level');return found;
}
export function newGame(id=level.id) {
 const spec=definition(id),game=createGame(spec.config,spec.seed);
 if(!spec.setup)return game;
 const state=game.state;
 for(const {row,col,special}of spec.setup){state.board[row][col].special=special;if(special==='color')state.board[row][col].type=null;}
 return loadGame(state);
}
/** Reject malformed production data before any playable session is created. */
export function validateManifest(manifest:Level[]=levels):void {
 if(manifest.length!==15||new Set(manifest.map(l=>l.id)).size!==15||new Set(manifest.map(l=>l.seed)).size!==15)throw new Error('Expected 15 unique authored levels');
 for(const [i,l]of manifest.entries()){
  if(l.number!==i+1||l.chapter!==Math.ceil((i+1)/5)||!l.id||!l.seed||!l.titleKey||!l.mechanic||!l.difficulty||l.config.rows!==8||l.config.cols!==8||JSON.stringify(l.config.pieceTypes)!==JSON.stringify(shapes)||!Number.isSafeInteger(l.config.moveLimit)||l.config.moveLimit!<=0||!l.config.objectives?.length)throw new Error(`Invalid level ${i+1}`);
  const cells=new Set<string>();for(const p of l.setup??[]){const key=`${p.row},${p.col}`;if(cells.has(key)||!Number.isInteger(p.row)||!Number.isInteger(p.col)||p.row<0||p.row>7||p.col<0||p.col>7||!['horizontal','vertical','bomb','color'].includes(p.special))throw new Error(`Invalid setup ${i+1}`);cells.add(key);}
  // The pinned engine validates objectives, targets and configuration semantics.
  createGame(l.config,l.seed);
 }
}
validateManifest();
