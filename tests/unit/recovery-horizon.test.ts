import test from 'node:test';
import assert from 'node:assert';
import { RecoveryHorizonService } from '../../src/domain/sacrifice/recovery-horizon.js';

test('RecoveryHorizonService: tracks material timeline and recovery ply', () => {
  const service = new RecoveryHorizonService();
  const pv = ['e8f7', 'd3g6', 'f7g8', 'd1h5', 'd8e7', 'h5e8'];
  const res = service.computeRecovery(3.0, pv, 15);
  assert.strictEqual(res.initialDeficit, 3.0);
  assert.ok(res.materialTimeline.length > 0);
  assert.ok(res.confidence > 0.8);
});
