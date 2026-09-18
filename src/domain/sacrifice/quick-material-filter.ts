import { ChessPosition, Move, PIECE_VALUES, parseSquare, PieceType } from '../../types/chess.js';
import { MaterialDeltaResult, MaterialCaptureEvent } from '../../types/sacrifice.js';

export class QuickMaterialFilter {
  /**
   * Scans a move and its subsequent PV to evaluate material investment dynamics
   */
  evaluateMove(pos: ChessPosition, move: Move, pv: string[] = [], maxPlies = 8): MaterialDeltaResult {
    const fromIdx = parseSquare(move.from);
    const toIdx = parseSquare(move.to);
    const attacker = pos.board[fromIdx];
    const target = pos.board[toIdx];

    if (!attacker) {
      return {
        initialDelta: 0,
        maxDeficit: 0,
        finalDelta: 0,
        captures: [],
        possibleRecoveryDetected: false,
        analyzedPlies: 0,
      };
    }

    const captures: MaterialCaptureEvent[] = [];
    const attackerVal = PIECE_VALUES[attacker.type];
    const targetVal = target ? PIECE_VALUES[target.type] : 0;

    // Initial material change from the perspective of the moving player
    let currentDelta = targetVal - attackerVal; // Negative if investing higher value piece
    if (target) {
      captures.push({
        ply: 1,
        move: `${move.from}${move.to}`,
        capturedPiece: target.type,
        capturerPiece: attacker.type,
        delta: currentDelta,
      });
    }

    let maxDeficit = Math.max(0, -currentDelta);
    let analyzedPlies = 1;

    // Evaluate subsequent PV captures
    const effectivePlies = Math.min(pv.length, maxPlies);
    for (let i = 1; i < effectivePlies; i++) {
      const uci = pv[i];
      if (!uci || uci.length < 4) break;
      analyzedPlies++;

      const f = parseSquare(uci.slice(0, 2));
      const t = parseSquare(uci.slice(2, 4));
      // In PV line alternating turns
      const isAttackerTurn = (i % 2 === 0);
      // Rough approximation of PV captures
      if (t % 8 === toIdx % 8 && Math.floor(t / 8) === Math.floor(toIdx / 8)) {
        // Recapture on the same square
        if (isAttackerTurn) {
          currentDelta += attackerVal;
        } else {
          currentDelta -= targetVal;
        }
      }
      if (-currentDelta > maxDeficit) {
        maxDeficit = -currentDelta;
      }
    }

    const possibleRecoveryDetected = currentDelta >= -0.5 && maxDeficit >= 1.0;

    return {
      initialDelta: Number(currentDelta.toFixed(2)),
      maxDeficit: Number(maxDeficit.toFixed(2)),
      finalDelta: Number(currentDelta.toFixed(2)),
      captures,
      possibleRecoveryDetected,
      analyzedPlies,
    };
  }
}
