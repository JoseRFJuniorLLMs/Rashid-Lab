import { ChessPosition, parseSquare, squareToName, PIECE_VALUES, PieceType } from '../../types/chess.js';
import { SacrificeCategory } from '../../types/sacrifice.js';

export interface SacrificeCandidate {
  move: string;
  category: SacrificeCategory;
  sacrificedPiece: PieceType;
  targetSquare: string;
  estimatedCost: number;
}

export class CandidateSearchService {
  /**
   * Generates sacrifice candidate moves independently of engine MultiPV
   */
  findCandidates(pos: ChessPosition): SacrificeCandidate[] {
    const candidates: SacrificeCandidate[] = [];
    const playerColor = pos.turn;

    // Scan all squares with player pieces
    for (let i = 0; i < 64; i++) {
      const piece = pos.board[i];
      if (!piece || piece.color !== playerColor) continue;
      if (piece.type === 'k') continue; // King does not sacrifice itself

      const fromSquare = squareToName(i);
      const pieceVal = PIECE_VALUES[piece.type];

      // Check candidate moves for this piece
      const candidateSquares = this.getPotentialSacrificeTargets(pos, i, piece.type, playerColor);

      for (const targetIdx of candidateSquares) {
        const toSquare = squareToName(targetIdx);
        const targetPiece = pos.board[targetIdx];
        const targetVal = targetPiece ? PIECE_VALUES[targetPiece.type] : 0;

        // Condition for sacrifice:
        // 1. Capture piece of strictly lower value (e.g. Rook takes Bishop/Knight/Pawn)
        // 2. Direct offer to an enemy-controlled square with targetVal == 0
        let category: SacrificeCategory | null = null;
        let cost = 0;

        if (targetPiece && pieceVal > targetVal) {
          if (piece.type === 'r' && (targetPiece.type === 'b' || targetPiece.type === 'n')) {
            category = 'EXCHANGE_SAC';
            cost = pieceVal - targetVal;
          } else if (piece.type === 'q') {
            category = 'QUEEN_OFFER';
            cost = pieceVal - targetVal;
          } else {
            category = 'CAPTURE_SAC';
            cost = pieceVal - targetVal;
          }
        } else if (!targetPiece && pieceVal >= 3.0) {
          // Direct piece offer
          if (piece.type === 'q') category = 'QUEEN_OFFER';
          else if (this.isEnemyControlled(pos, targetIdx, playerColor)) {
            category = 'DIRECT_OFFER';
          }
          cost = pieceVal;
        }

        if (category && cost >= 0.9) {
          candidates.push({
            move: `${fromSquare}${toSquare}`,
            category,
            sacrificedPiece: piece.type,
            targetSquare: toSquare,
            estimatedCost: Number(cost.toFixed(2)),
          });
        }
      }
    }

    return candidates;
  }

  private isEnemyControlled(pos: ChessPosition, squareIdx: number, myColor: string): boolean {
    const enemyColor = myColor === 'w' ? 'b' : 'w';
    // Simplified enemy pawn attack control check
    const rank = Math.floor(squareIdx / 8);
    const file = squareIdx % 8;
    const pawnRank = enemyColor === 'b' ? rank - 1 : rank + 1;
    if (pawnRank >= 0 && pawnRank < 8) {
      if (file > 0 && pos.board[pawnRank * 8 + (file - 1)]?.type === 'p' && pos.board[pawnRank * 8 + (file - 1)]?.color === enemyColor) return true;
      if (file < 7 && pos.board[pawnRank * 8 + (file + 1)]?.type === 'p' && pos.board[pawnRank * 8 + (file + 1)]?.color === enemyColor) return true;
    }
    return false;
  }

  private getPotentialSacrificeTargets(pos: ChessPosition, fromIdx: number, type: PieceType, color: string): number[] {
    const targets: number[] = [];
    const rank = Math.floor(fromIdx / 8);
    const file = fromIdx % 8;

    // Check classic sacrifice hotspot squares (f7, h7, g7, e6, d5, b7, h2, f2, etc.)
    const enemyBackRank = color === 'w' ? 1 : 6;
    const hotspots = color === 'w' ? [13, 15, 14, 28, 27] : [53, 55, 54, 35, 36];
    for (const spot of hotspots) {
      if (spot !== fromIdx) targets.push(spot);
    }

    // Nearby forward squares
    const step = color === 'w' ? -8 : 8;
    if (rank >= 1 && rank <= 6) {
      targets.push(fromIdx + step);
      if (file > 0) targets.push(fromIdx + step - 1);
      if (file < 7) targets.push(fromIdx + step + 1);
    }

    return Array.from(new Set(targets)).filter(idx => idx >= 0 && idx < 64 && pos.board[idx]?.color !== color);
  }
}
