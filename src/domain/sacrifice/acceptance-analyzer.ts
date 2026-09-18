import { ChessPosition, PIECE_VALUES } from '../../types/chess.js';
import { EngineLine } from '../../types/analysis.js';
import { AcceptanceAnalysis, AcceptanceMoveAnalysis } from '../../types/sacrifice.js';

export class AcceptanceAnalyzer {
  analyze(sacrificeMove: string, replies: EngineLine[], posBefore: ChessPosition): AcceptanceAnalysis {
    const toSquare = sacrificeMove.slice(2, 4);
    const acceptingMoves: AcceptanceMoveAnalysis[] = [];

    for (let i = 0; i < replies.length; i++) {
      const line = replies[i]!;
      const replyMove = line.pv[0];
      if (!replyMove) continue;

      // Acceptance is defined as capturing onto the sacrifice square or capturing the offered piece
      const replyTo = replyMove.slice(2, 4);
      const isCaptureOnSquare = (replyTo === toSquare);

      if (isCaptureOnSquare) {
        const expectedScore = line.expectedScore ?? (line.scoreCp ? 1 / (1 + Math.exp(-line.scoreCp / 200)) : 0.5);
        acceptingMoves.push({
          move: replyMove,
          materialGain: 3.0, // default minor gain if not exact piece
          scoreCp: line.scoreCp,
          expectedScore: Number(expectedScore.toFixed(3)),
          rankAmongReplies: i + 1,
          pv: line.pv,
          stable: line.depth >= 10,
        });
      }
    }

    const isAcceptanceAvailable = acceptingMoves.length > 0;
    const bestAcceptance = acceptingMoves[0];
    const bestAcceptanceRank = bestAcceptance ? bestAcceptance.rankAmongReplies : undefined;
    const isAcceptanceObjectivelyValid = bestAcceptance ? bestAcceptance.rankAmongReplies <= 2 : false;

    return {
      acceptingMoves,
      bestAcceptance,
      isAcceptanceAvailable,
      isAcceptanceObjectivelyValid,
      bestAcceptanceRank,
      acceptanceExpectedScore: bestAcceptance?.expectedScore,
      acceptanceMaterialGain: bestAcceptance?.materialGain,
    };
  }
}
