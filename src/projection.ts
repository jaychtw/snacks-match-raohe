import type { Game, GameEvent, GameState, Piece, Status } from '@jaychtw/match3-core';
export interface View {
 board: (Piece | null)[][]; score: number; moves: number; status: Status;
 progress: ReturnType<Game['objectives']>;
}
export const project = (game: Game): View => ({ board:game.state.board,score:game.state.score,moves:game.state.moves,status:game.state.status,progress:game.objectives() });
const unreachable = (event: never): never => { throw new Error(`Unsupported engine event: ${JSON.stringify(event)}`); };
/** Consume only engine facts. Effect targets never remove pieces. */
export function consume(view: View, event: GameEvent): void {
 switch(event.type) {
  case 'swapped': {
   const {from,to}=event.move;
   view.board[from.row][from.col]=structuredClone(event.toPiece);
   view.board[to.row][to.col]=structuredClone(event.fromPiece); view.moves=event.moves; break;
  }
  case 'specialCreated': case 'specialConverted': view.board[event.at.row][event.at.col]=structuredClone(event.piece); break;
  case 'eliminated':
   for(const cell of event.cells) {
    if(view.board[cell.row][cell.col]?.id!==cell.piece.id)throw new Error('Elimination identity mismatch');
    view.board[cell.row][cell.col]=null;
   } break;
  case 'fell':
   for(const {from} of event.pieces)view.board[from.row][from.col]=null;
   for(const {piece,to} of event.pieces)view.board[to.row][to.col]=structuredClone(piece);
   break;
  case 'refilled': for(const cell of event.cells)view.board[cell.row][cell.col]=structuredClone(cell.piece); break;
  case 'scored': view.score=event.total; break;
  case 'objectives': view.progress=structuredClone(event.progress); break;
  case 'completed': view.status=event.status; view.score=event.score; view.moves=event.moves; break;
  case 'reshuffled': view.board=structuredClone(event.board); break;
  case 'rejected': case 'matched': case 'activated': case 'combined': break;
  default: unreachable(event);
 }
}
export function reconciles(view: View, state: GameState, progress: View['progress']): boolean {
 return JSON.stringify(view.board)===JSON.stringify(state.board) && view.score===state.score && view.moves===state.moves && view.status===state.status && JSON.stringify(view.progress)===JSON.stringify(progress);
}
