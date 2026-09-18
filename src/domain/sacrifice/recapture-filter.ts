import { RecaptureAnalysis } from '../../types/sacrifice.js';

export class RecaptureFilter {
  /**
   * Determines whether a move is just an immediate equal trade / recapture by the player
   */
  evaluate(initialDeficit: number, pv: string[] = []): RecaptureAnalysis {
    // A pseudo-sacrifice has immediate forced recapture of material by the offering player at ply 2 or 3
    // E.g., Greek Gift (Bxh7+ Kxh7, Ng5+ Kg8, Qxg4)
    if (pv.length >= 3 && initialDeficit <= 3.3) {
      // If the 3rd move in PV (ply 3, white's second move) takes back material
      const hasForcedRecapture = pv.length >= 4 && pv[2] !== undefined;
      return {
        immediateRecapture: hasForcedRecapture,
        recaptureWithinPlies: hasForcedRecapture ? 3 : undefined,
        recoveryValue: initialDeficit,
        isLikelyPseudoSacrifice: hasForcedRecapture,
      };
    }

    return {
      immediateRecapture: false,
      recoveryValue: 0,
      isLikelyPseudoSacrifice: false,
    };
  }
}
