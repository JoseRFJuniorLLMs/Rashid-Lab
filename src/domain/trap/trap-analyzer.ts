import { TrapCandidate, TrapCategory } from '../../types/trap.js';
import { EngineLine } from '../../types/analysis.js';
import { TemptationAnalyzer } from '../behavior/temptation-analyzer.js';

export class TrapAnalyzer {
  private temptationAnalyzer = new TemptationAnalyzer();

  analyzeTrap(params: {
    baitMove: string;
    temptingReply: string;
    engineLinesAfterBait: EngineLine[];
    engineLinesAfterReply: EngineLine[];
  }): TrapCandidate | null {
    const { baitMove, temptingReply, engineLinesAfterReply } = params;
    const punishmentLine = engineLinesAfterReply[0];

    if (!punishmentLine || !punishmentLine.pv[0]) return null;

    // Calculate temptation of reply
    const temptationScore = this.temptationAnalyzer.computeTemptation({
      capturedPieceType: 'q',
      capturerPieceType: 'r',
      givesCheck: false,
      defenderCount: 1,
    });

    const evalLoss = punishmentLine.scoreCp ? Math.abs(punishmentLine.scoreCp) : 350;

    return {
      baitMove,
      temptingReply,
      punishmentMove: punishmentLine.pv[0],
      category: 'SACRIFICE_TRAP',
      temptationScore,
      evalLossIfBaitTaken: evalLoss,
      isRecaptureOnly: false,
      punishmentPv: punishmentLine.pv,
    };
  }
}
