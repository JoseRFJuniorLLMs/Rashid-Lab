import test from 'node:test';
import assert from 'node:assert';
import { parseFen } from '../../src/types/chess.js';
import { SacrificeEngine } from '../../src/domain/sacrifice/sacrifice-engine.js';
import { EngineLine } from '../../src/types/analysis.js';

test('SacrificeEngine: comprehensive classification and evidence generation', () => {
  const engine = new SacrificeEngine();
  const fen = 'r1bqk2r/pp1n1ppp/2pbpn2/6N1/3P4/3B1N2/PPP2PPP/R1BQK2R w KQkq - 0 8';
  const pos = parseFen(fen);
  const lines: EngineLine[] = [
    { multipv: 1, depth: 16, scoreCp: 180, expectedScore: 0.72, pv: ['g5e6', 'f7e6', 'd3g6'], nodes: 80000, timeMs: 200 },
  ];

  const result = engine.evaluateSacrifice({
    posBefore: pos,
    move: { from: 'g5', to: 'e6' },
    engineLines: lines,
  });

  assert.strictEqual(result.move, 'g5e6');
  assert.ok(result.isSound);
  assert.strictEqual(result.label, 'TRUE_SACRIFICE');
  assert.ok(result.evidence.rashidScore > 60);
  assert.ok(result.evidence.motifs.includes('KING_HUNT'));
});
