import test from 'node:test';
import assert from 'node:assert';
import { parseFen } from '../../src/types/chess.js';
import { SacrificeForecastEngine } from '../../src/domain/forecast/sacrifice-forecast-engine.js';

test('SacrificeForecastEngine: multi-horizon forecast, uninflated score and pressure map', () => {
  const engine = new SacrificeForecastEngine();
  const fen = 'r1bqk2r/pp1n1ppp/2pbpn2/6N1/3P4/3B1N2/PPP2PPP/R1BQK2R w KQkq - 0 8';
  const pos = parseFen(fen);
  const forecast = engine.forecast(pos, 'pos_hash_123');

  assert.strictEqual(forecast.positionHash, 'pos_hash_123');
  assert.ok(forecast.overallPotentialScore > 0 && forecast.overallPotentialScore <= 100);
  assert.ok(forecast.calibratedSacrificeProbability <= 0.8, 'Probability must be uninflated');
  assert.strictEqual(forecast.horizons.length, 5);
  assert.strictEqual(forecast.pressureMap.squareValues.length, 64);
  assert.ok(forecast.pressureMap.hotSpots.length > 0);

  // Brier score test
  const brier = engine.evaluateBrierScore([0.7, 0.2, 0.9], [1, 0, 1]);
  assert.ok(brier < 0.15, 'Brier score should accurately measure calibration error');
});
