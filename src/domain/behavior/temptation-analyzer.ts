import { ChessPosition, parseSquare, PIECE_VALUES, PieceType } from '../../types/chess.js';

export interface TemptationParams {
  capturedPieceType: PieceType;
  capturerPieceType: PieceType;
  givesCheck?: boolean;
  defenderCount?: number;
  attackerCount?: number;
}

export class TemptationAnalyzer {
  /**
   * Evaluates TemptationScore (0 - 100)
   * Higher score = piece capture looks irresistible to a human
   */
  computeTemptation(params: TemptationParams): number {
    const { capturedPieceType, capturerPieceType, givesCheck, defenderCount = 0 } = params;
    const capturedVal = PIECE_VALUES[capturedPieceType];
    const capturerVal = PIECE_VALUES[capturerPieceType];

    let score = 50;

    // 1. Material Gain Temptation: Free high-value piece
    if (capturedVal >= capturerVal) {
      score += (capturedVal - capturerVal) * 8 + 20;
    } else {
      score -= (capturerVal - capturedVal) * 5;
    }

    // 2. High value targets (Queen or Rook) are universally tempting
    if (capturedPieceType === 'q') score += 25;
    else if (capturedPieceType === 'r') score += 15;

    // 3. Captures giving check feel forcing
    if (givesCheck) score += 15;

    // 4. Defender Suspicion: If a bait piece is heavily defended, suspicious humans hesitate
    if (defenderCount >= 3) {
      score -= (defenderCount - 2) * 12;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  isSuspiciousBait(defenderCount: number): boolean {
    return defenderCount >= 3;
  }
}
