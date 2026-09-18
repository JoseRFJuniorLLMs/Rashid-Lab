import test from 'node:test';
import assert from 'node:assert';
import { RashidScoreCalculator } from '../../src/domain/sacrifice/rashid-score.js';

test('RashidScoreCalculator: calculates balanced 0-100 metric for sacrifices', () => {
  const calc = new RashidScoreCalculator();
  const score = calc.compute({
    materialCost: 3.05,
    recoveryHorizonPlies: 8,
    soundness: 0.95,
    compensation: {
      kingSafetyDeficit: 85,
      mobilityRatio: 1.4,
      centerControlAdvantage: 30,
      openLinesAdvantage: 2,
      initiativeScore: 85,
      totalCompensationScore: 80,
    },
  });

  assert.ok(score >= 70 && score <= 100, `Rashid score should be high for sound deep sacrifice, got ${score}`);
});
