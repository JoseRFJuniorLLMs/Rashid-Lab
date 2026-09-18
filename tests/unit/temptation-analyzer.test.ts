import test from 'node:test';
import assert from 'node:assert';
import { TemptationAnalyzer } from '../../src/domain/behavior/temptation-analyzer.js';

test('TemptationAnalyzer: scoring human temptation and defender suspicion', () => {
  const analyzer = new TemptationAnalyzer();
  // Free queen capture
  const queenScore = analyzer.computeTemptation({
    capturedPieceType: 'q',
    capturerPieceType: 'p',
    givesCheck: false,
    defenderCount: 0,
  });
  assert.ok(queenScore >= 90, 'Queen capture by pawn must have very high temptation score');

  // Heavily defended bait gives suspicion penalty
  const suspiciousScore = analyzer.computeTemptation({
    capturedPieceType: 'n',
    capturerPieceType: 'b',
    givesCheck: false,
    defenderCount: 4,
  });
  assert.ok(suspiciousScore < 70, 'Suspicious bait with 4 defenders must be penalized');
  assert.ok(analyzer.isSuspiciousBait(4));
});
