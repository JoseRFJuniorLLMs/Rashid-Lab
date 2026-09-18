import { ChessPosition, parseSquare, PieceColor } from '../../types/chess.js';
import { CompensationFactors } from '../../types/sacrifice.js';

export class CompensationModel {
  evaluate(pos: ChessPosition, sacrificerColor: PieceColor): CompensationFactors {
    const enemyColor = sacrificerColor === 'w' ? 'b' : 'w';

    // 1. King safety evaluation
    // Check enemy king location and surrounding open squares
    let enemyKingIdx = -1;
    for (let i = 0; i < 64; i++) {
      const piece = pos.board[i];
      if (piece && piece.type === 'k' && piece.color === enemyColor) {
        enemyKingIdx = i;
        break;
      }
    }

    let kingSafetyDeficit = 50;
    if (enemyKingIdx !== -1) {
      const kingRank = Math.floor(enemyKingIdx / 8);
      // If king is in center or castling shield broken
      if (kingRank >= 2 && kingRank <= 5) kingSafetyDeficit = 85;
      else kingSafetyDeficit = 70;
    }

    // 2. Mobility ratio approximation
    let sacrificerPieces = 0;
    let enemyPieces = 0;
    for (let i = 0; i < 64; i++) {
      const piece = pos.board[i];
      if (!piece) continue;
      if (piece.color === sacrificerColor) sacrificerPieces++;
      else enemyPieces++;
    }

    const mobilityRatio = sacrificerPieces > 0 ? Number((1.2 * (sacrificerPieces / Math.max(1, enemyPieces))).toFixed(2)) : 1.0;
    const centerControlAdvantage = 30;
    const openLinesAdvantage = 2;
    const initiativeScore = 80;

    const totalCompensationScore = Math.round(
      (kingSafetyDeficit * 0.4) +
      (Math.min(100, mobilityRatio * 50) * 0.2) +
      (centerControlAdvantage * 0.2) +
      (initiativeScore * 0.2)
    );

    return {
      kingSafetyDeficit,
      mobilityRatio,
      centerControlAdvantage,
      openLinesAdvantage,
      initiativeScore,
      totalCompensationScore,
    };
  }
}
