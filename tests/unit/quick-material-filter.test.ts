import test from 'node:test';
import assert from 'node:assert';
import { parseFen } from '../../src/types/chess.js';
import { QuickMaterialFilter } from '../../src/domain/sacrifice/quick-material-filter.js';

test('QuickMaterialFilter: evaluates immediate piece sacrifice and deficit', () => {
  const qmf = new QuickMaterialFilter();
  const fen = 'r1bqk2r/pp1n1ppp/2pbpn2/6N1/3P4/3B1N2/PPP2PPP/R1BQK2R w KQkq - 0 8';
  const pos = parseFen(fen);
  // Move Nxf7
  const result = qmf.evaluateMove(pos, { from: 'g5', to: 'f7' }, ['g5f7', 'e8f7', 'd3g6']);
  assert.ok(result.maxDeficit >= 2.0, 'Deficit must be at least 2 pawns for Knight sac');
  assert.strictEqual(result.captures.length, 1);
  assert.strictEqual(result.captures[0]?.capturedPiece, 'p');
});
