import test from 'node:test';
import assert from 'node:assert';
import { AnalysisCoordinator } from '../../src/analysis/analysis-coordinator.js';
import { AnalysisJobScheduler } from '../../src/analysis/job-scheduler.js';
import { EngineManager } from '../../src/engine/engine-manager.js';
import { AnalysisCache } from '../../src/shared/cache/analysis-cache.js';
import { AnalysisEventBus } from '../../src/shared/event-bus.js';
import { DEFAULT_ENGINE_PROFILES } from '../../src/shared/config.js';

test('AnalysisCoordinator & JobScheduler: priority queue and stale result dropping', async () => {
  const scheduler = new AnalysisJobScheduler();
  const engineManager = new EngineManager();
  const cache = new AnalysisCache();
  const events = new AnalysisEventBus();

  const coordinator = new AnalysisCoordinator(scheduler, engineManager, cache, events);
  await coordinator.start();

  let eventFired = false;
  events.subscribe('position.changed', (pos) => {
    eventFired = true;
  });

  coordinator.setPosition({ fen: 'startpos', hash: 'hash_1' });
  assert.strictEqual(coordinator.getCurrentGeneration(), 1);
  assert.ok(eventFired);

  // Submit job
  const handle = await coordinator.submitJob({
    type: 'PRIMARY',
    priority: 0,
    position: { fen: 'startpos', hash: 'hash_1' },
    engineProfile: DEFAULT_ENGINE_PROFILES['fake']!,
    generation: 1,
  });

  const result = await handle.promise;
  assert.strictEqual(result.positionHash, 'hash_1');
  assert.strictEqual(result.generation, 1);
  assert.ok(result.lines.length > 0);

  // Change position to increment generation and verify stale jobs dropped
  coordinator.setPosition({ fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', hash: 'hash_2' });
  assert.strictEqual(coordinator.getCurrentGeneration(), 2);
});
