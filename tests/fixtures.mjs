import { loadGame } from '@jaychtw/match3-core';
import { freshSession,encode } from '../src/session.ts';
import { shapes } from '../src/pieces.ts';
export const pairMove={from:{row:3,col:3},to:{row:3,col:4}};
export function pairSession(a,b){
 const session=freshSession(),state=session.game.state;
 for(const [i,special] of [a,b].entries())state.board[3][3+i]={...state.board[3][3+i],special,type:special==='color'?null:state.board[3][3+i].type};
 session.game=loadGame(state);session.initial=session.game.serialize();return session;
}
export const specialPairs=[['horizontal','horizontal'],['horizontal','vertical'],['vertical','vertical'],['horizontal','bomb'],['vertical','bomb'],['bomb','bomb'],['color','horizontal'],['color','vertical'],['color','bomb'],['color','color']];
export function rankMoves(game,maximize=true) {
 return game.listLegalMoves().map(move=>{const copy=loadGame(game.serialize());const result=copy.applyMove(move);return {move,result};}).filter(x=>x.result.ok).sort((a,b)=>maximize?b.result.state.score-a.result.state.score:a.result.state.score-b.result.state.score);
}
export function creationFixture(special){
 const session=freshSession(),state=session.game.state;
 // Authored stable setup, not a rule implementation. The engine validates it and resolves the swap.
 state.board.forEach((row,r)=>row.forEach((p,c)=>p.type=shapes[(r+c)%6]));
 const cells=special==='horizontal'?[[3,1],[3,2],[3,3],[3,4]]:special==='vertical'?[[1,3],[2,3],[3,3],[4,3]]:special==='color'?[[3,1],[3,2],[3,3],[3,4],[3,5]]:[[3,2],[3,3],[3,4],[2,3],[4,3]];
 for(const [r,c]of cells)state.board[r][c].type='pepper_bun';
 let from,to;
 if(special==='vertical'){to={row:2,col:3};from={row:2,col:2};}
 else if(special==='color'){to={row:3,col:3};from={row:2,col:3};}
 else if(special==='bomb'){
  state.board.forEach((row,r)=>row.forEach((p,c)=>p.type=shapes[(r+c)%6]));
  for(const [r,c]of [[3,2],[3,3],[3,4],[4,3],[5,3]])state.board[r][c].type='pepper_bun';
  to={row:3,col:3};from={row:2,col:3};
 }else{to={row:3,col:2};from={row:2,col:2};}
 state.board[to.row][to.col].type='chicken_cutlet';state.board[from.row][from.col].type='pepper_bun';
 session.game=loadGame(state);session.initial=session.game.serialize();return {session,move:{from,to}};
}
export const saveSession=session=>encode(session);
