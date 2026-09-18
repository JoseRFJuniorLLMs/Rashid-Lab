import { EngineLine } from '../../types/analysis.js';
import { DeclineAnalysis, DeclineMoveAnalysis } from '../../types/sacrifice.js';

export class DeclineAnalyzer {
  analyze(sacrificeMove: string, replies: EngineLine[], acceptanceBestExpectedScore?: number): DeclineAnalysis {
    const toSquare = sacrificeMove.slice(2, 4);
    const decliningMoves: DeclineMoveAnalysis[] = [];

    for (let i = 0; i < replies.length; i++) {
      const line = replies[i]!;
      const replyMove = line.pv[0];
      if (!replyMove) continue;

      const replyTo = replyMove.slice(2, 4);
      // Decline: Any legal reply that is NOT taking on the sacrifice square
      if (replyTo !== toSquare) {
        const expectedScore = line.expectedScore ?? (line.scoreCp ? 1 / (1 + Math.exp(-line.scoreCp / 200)) : 0.5);
        decliningMoves.push({
          move: replyMove,
          scoreCp: line.scoreCp,
          expectedScore: Number(expectedScore.toFixed(3)),
          rankAmongReplies: i + 1,
          pv: line.pv,
        });
      }
    }

    const bestDecline = decliningMoves[0];
    const bestDeclineScore = bestDecline?.expectedScore;
    const declinePreferred = (bestDeclineScore !== undefined && acceptanceBestExpectedScore !== undefined)
      ? (bestDeclineScore > acceptanceBestExpectedScore)
      : false;

    return {
      decliningMoves,
      bestDecline,
      bestDeclineExpectedScore: bestDeclineScore,
      declinePreferredOverAccept: declinePreferred,
    };
  }
}
