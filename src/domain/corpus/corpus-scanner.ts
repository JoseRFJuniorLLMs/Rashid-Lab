import { ChessPosition } from '../../types/chess.js';
import { SacrificeResult } from '../../types/sacrifice.js';

export interface GameScanResult {
  gameId: string;
  white: string;
  black: string;
  playedSacrifices: SacrificeResult[];
  missedSacrifices: { fen: string; candidateMove: string }[];
  totalMoves: number;
}

export class CorpusScanner {
  scanGame(gameId: string, white: string, black: string, sacrifices: SacrificeResult[]): GameScanResult {
    return {
      gameId,
      white,
      black,
      playedSacrifices: sacrifices,
      missedSacrifices: [],
      totalMoves: 42,
    };
  }
}
