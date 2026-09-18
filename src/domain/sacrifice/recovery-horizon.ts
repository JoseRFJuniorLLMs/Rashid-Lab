import { RecoveryHorizonResult, MaterialTimelinePoint } from '../../types/sacrifice.js';

export class RecoveryHorizonService {
  computeRecovery(initialDeficit: number, pv: string[] = [], searchDepth = 15): RecoveryHorizonResult {
    const timeline: MaterialTimelinePoint[] = [];
    let currentDeficit = initialDeficit;
    let maxDeficit = initialDeficit;
    let recovered = false;
    let recoveryPly: number | undefined = undefined;

    timeline.push({
      ply: 0,
      whiteMaterial: 39,
      blackMaterial: 39,
      materialDelta: -initialDeficit,
    });

    const plies = Math.min(pv.length, 12);
    for (let p = 1; p <= plies; p++) {
      // Simulate material balance recovery along PV
      if (p >= 4 && p % 2 === 0 && currentDeficit > 0.5) {
        currentDeficit -= 1.5; // Gradual material recoup
      }
      if (currentDeficit <= 0.5 && !recovered && p >= 2) {
        recovered = true;
        recoveryPly = p;
      }
      timeline.push({
        ply: p,
        whiteMaterial: 39 - Math.max(0, currentDeficit),
        blackMaterial: 39,
        materialDelta: Number((-currentDeficit).toFixed(2)),
      });
    }

    return {
      initialDeficit,
      maxDeficit,
      recovered,
      recoveryPly,
      materialTimeline: timeline,
      confidence: searchDepth >= 12 ? 0.92 : 0.75,
    };
  }
}
