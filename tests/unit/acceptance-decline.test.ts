import test from 'node:test';
import assert from 'node:assert';
import { parseFen } from '../../src/types/chess.js';
import { AcceptanceAnalyzer } from '../../src/domain/sacrifice/acceptance-analyzer.js';
import { DeclineAnalyzer } from '../../src/domain/sacrifice/decline-analyzer.js';
import { EngineLine } from '../../src/types/analysis.js';

test('Acceptance & Decline Analyzers: branch evaluation and recommendation', () => {
  const fen = 'r1bqk2r/pp1n1ppp/2pbpn2/6N1/3P4/3B1N2/PPP2PPP/R1BQK2R w KQkq - 0 8';
  const pos = parseFen(fen);
  const replies: EngineLine[] = [
    { multipv: 1, depth: 15, scoreCp: -120, expectedScore: 0.35, pv: ['e8f7', 'd3g6'], nodes: 50000, timeMs: 100 },
    { multipv: 2, depth: 15, scoreCp: 50, expectedScore: 0.56, pv: ['e8e7', 'f7g5'], nodes: 40000, timeMs: 90 },
  ];

  const acceptAnalyzer = new AcceptanceAnalyzer();
  const declineAnalyzer = new DeclineAnalyzer();

  const acceptResult = acceptAnalyzer.analyze('g5f7', replies, pos);
  assert.ok(acceptResult.isAcceptanceAvailable);
  assert.strictEqual(acceptResult.bestAcceptance?.move, 'e8f7');

  const declineResult = declineAnalyzer.analyze('g5f7', replies, acceptResult.acceptanceExpectedScore);
  assert.strictEqual(declineResult.bestDecline?.move, 'e8e7');
  assert.ok(declineResult.declinePreferredOverAccept, 'Decline should be preferred because acceptance leads to heavy attack');
});
