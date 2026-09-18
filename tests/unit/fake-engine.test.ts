import test from 'node:test';
import assert from 'node:assert';
import { FakeUciEngine } from '../../src/engine/fake-uci-engine.js';
import { EngineSession } from '../../src/engine/engine-session.js';
import { DEFAULT_ENGINE_PROFILES } from '../../src/shared/config.js';

test('FakeUciEngine & EngineSession: lifecycle and searchmoves support', async () => {
  const session = new EngineSession(DEFAULT_ENGINE_PROFILES['fake']!);
  assert.strictEqual(session.getState(), 'IDLE');

  await session.initialize();
  assert.strictEqual(session.getState(), 'READY');

  const lines = await session.startAnalysis({
    jobId: 'test_job',
    positionHash: 'hash_abc',
    generation: 1,
    fen: 'startpos',
    searchMoves: ['e2e4'],
  });

  assert.ok(lines.length > 0);
  assert.strictEqual(lines[0]?.pv[0], 'e2e4');
});
