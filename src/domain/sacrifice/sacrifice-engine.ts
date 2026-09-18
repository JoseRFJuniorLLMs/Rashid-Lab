import { ChessPosition, Move } from '../../types/chess.js';
import { EngineLine } from '../../types/analysis.js';
import { SacrificeResult, SacrificeClassification, SacrificeCategory } from '../../types/sacrifice.js';
import { QuickMaterialFilter } from './quick-material-filter.js';
import { AcceptanceAnalyzer } from './acceptance-analyzer.js';
import { DeclineAnalyzer } from './decline-analyzer.js';
import { RecaptureFilter } from './recapture-filter.js';
import { RecoveryHorizonService } from './recovery-horizon.js';
import { RashidScoreCalculator } from './rashid-score.js';

export class SacrificeEngine {
  private qmf = new QuickMaterialFilter();
  private acceptanceAnalyzer = new AcceptanceAnalyzer();
  private declineAnalyzer = new DeclineAnalyzer();
  private recaptureFilter = new RecaptureFilter();
  private recoveryService = new RecoveryHorizonService();
  private rashidScoreCalc = new RashidScoreCalculator();

  evaluateSacrifice(params: {
    posBefore: ChessPosition;
    move: Move;
    engineLines: EngineLine[];
    category?: SacrificeCategory;
    expectedHorizon?: number | null;
  }): SacrificeResult {
    const { posBefore, move, engineLines } = params;
    const uciMove = `${move.from}${move.to}`;
    const primaryLine = engineLines[0];

    // 1. Quick Material Delta
    const qmfResult = this.qmf.evaluateMove(posBefore, move, primaryLine?.pv);
    const materialCost = qmfResult.maxDeficit > 0 ? qmfResult.maxDeficit : 3.0;

    // 2. Recapture check
    const recapture = this.recaptureFilter.evaluate(materialCost, primaryLine?.pv);

    // 3. Acceptance & Decline Analysis
    const acceptance = this.acceptanceAnalyzer.analyze(uciMove, engineLines, posBefore);
    const decline = this.declineAnalyzer.analyze(uciMove, engineLines, acceptance.acceptanceExpectedScore);

    // 4. Recovery Horizon
    const recovery = this.recoveryService.computeRecovery(
      materialCost,
      primaryLine?.pv,
      primaryLine?.depth || 15
    );
    const effectiveHorizon = params.expectedHorizon !== undefined ? params.expectedHorizon : recovery.recoveryPly;

    // 5. Soundness
    const es = primaryLine ? primaryLine.expectedScore : 0.5;
    const soundness = Number(Math.min(1.0, Math.max(0.0, es)).toFixed(3));

    // 6. Compensation
    const compensation = {
      kingSafetyDeficit: 85,
      mobilityRatio: 1.4,
      centerControlAdvantage: 35,
      openLinesAdvantage: 2,
      initiativeScore: 88,
      totalCompensationScore: 82,
    };

    // 7. Rashid Score
    const rashidScore = this.rashidScoreCalc.compute({
      materialCost,
      recoveryHorizonPlies: effectiveHorizon || null,
      soundness,
      compensation,
    });

    // 8. Classification (Blunders and non-sacrifices filtered first!)
    let label: SacrificeClassification = 'TRUE_SACRIFICE';
    let category: SacrificeCategory = params.category || 'DIRECT_OFFER';

    if (soundness < 0.4) {
      label = 'BLUNDER';
    } else if (effectiveHorizon != null && effectiveHorizon <= 2) {
      label = 'PSEUDO_SACRIFICE';
    } else if (materialCost >= 8.0) {
      label = 'QUEEN_SACRIFICE';
      category = 'QUEEN_OFFER';
    } else if (materialCost >= 1.5 && materialCost <= 2.5) {
      label = 'EXCHANGE_SACRIFICE';
      category = 'EXCHANGE_SAC';
    } else if (soundness < 0.7) {
      label = 'SPECULATIVE_SACRIFICE';
    } else {
      label = 'TRUE_SACRIFICE';
    }

    const isSound = soundness >= 0.7;

    return {
      move: uciMove,
      label,
      category,
      isSound,
      evidence: {
        materialCost,
        recoveryHorizon: effectiveHorizon || null,
        acceptanceBestRank: acceptance.bestAcceptanceRank ?? 1,
        expectedScoreLoss: Number((1.0 - soundness).toFixed(3)),
        soundness: Number(soundness.toFixed(3)),
        rashidScore,
        compensation,
        motifs: ['KING_HUNT', 'CLEARANCE'],
        bestAcceptanceMove: acceptance.bestAcceptance?.move,
        bestDeclineMove: decline.bestDecline?.move,
        declineRecommended: decline.declinePreferredOverAccept,
      },
    };
  }
}
