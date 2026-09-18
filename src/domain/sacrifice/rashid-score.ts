import { CompensationFactors } from '../../types/sacrifice.js';

export interface RashidScoreParams {
  materialCost: number;       // Pawns, e.g. 3.0
  recoveryHorizonPlies: number | null; // e.g. 8 plies, or null if never recovered
  soundness: number;          // 0.0 to 1.0 (based on engine expectedScore)
  compensation: CompensationFactors;
  surpriseFactor?: number;    // 0 - 100
}

export class RashidScoreCalculator {
  /**
   * Calculates the Rashid Score (0 - 100)
   * High Rashid scores reward:
   * - Deep recovery horizons (or unrecovered positional sacrifices that remain winning)
   * - High objective soundness
   * - High king safety disruption / initiative compensation
   * - High material investment
   */
  compute(params: RashidScoreParams): number {
    const { materialCost, recoveryHorizonPlies, soundness, compensation } = params;

    // 1. Material weight (up to 25 pts)
    // 1 pawn = 10, minor = 20, rook = 23, queen = 25
    const matScore = Math.min(25, materialCost * 6.5);

    // 2. Soundness weight (up to 35 pts)
    const soundScore = soundness * 35;

    // 3. Horizon depth weight (up to 20 pts)
    // Deeper recovery horizon = more profound sacrifice
    let horizonScore = 0;
    if (recoveryHorizonPlies === null || recoveryHorizonPlies >= 8) {
      horizonScore = 20;
    } else if (recoveryHorizonPlies >= 4) {
      horizonScore = 14;
    } else {
      horizonScore = 6;
    }

    // 4. Compensation weight (up to 20 pts)
    const compScore = (compensation.totalCompensationScore / 100) * 20;

    const total = matScore + soundScore + horizonScore + compScore;
    return Math.max(0, Math.min(100, Math.round(total)));
  }
}
