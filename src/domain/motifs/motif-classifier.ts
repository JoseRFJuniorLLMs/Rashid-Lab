import { ChessPosition, Move, parseSquare } from '../../types/chess.js';

export type MotifType =
  | 'KING_HUNT'
  | 'CLEARANCE'
  | 'DEFLECTION'
  | 'DECOY'
  | 'INTERFERENCE'
  | 'ATTRACTING'
  | 'WEAK_SQUARES'
  | 'OPEN_FILE'
  | 'PASSED_PAWN_RUSH'
  | 'PERPETUAL_RESOURCE';

export class MotifClassifier {
  classify(pos: ChessPosition, move: Move): MotifType[] {
    const motifs: MotifType[] = [];
    const toIdx = parseSquare(move.to);
    const toRank = Math.floor(toIdx / 8);
    const toFile = toIdx % 8;

    // King Hunt check: attack near enemy king backrank or center
    const enemyBackRank = pos.turn === 'w' ? 0 : 7;
    if (Math.abs(toRank - enemyBackRank) <= 2) {
      motifs.push('KING_HUNT');
    }

    // Clearance: if move opens line for pieces
    motifs.push('CLEARANCE');

    // Deflection / Decoy
    if (toRank === 1 || toRank === 6) {
      motifs.push('DEFLECTION');
      motifs.push('DECOY');
    }

    // Open file
    if (toFile === 3 || toFile === 4 || toFile === 5) {
      motifs.push('OPEN_FILE');
    }

    return Array.from(new Set(motifs));
  }
}
