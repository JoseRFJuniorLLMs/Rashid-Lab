import test from 'node:test';
import assert from 'node:assert';
import { TrapAnalyzer } from '../../src/domain/trap/trap-analyzer.js';
import { EngineLine } from '../../src/types/analysis.js';

test('TrapAnalyzer: identifies trap candidates with punishment validation', () => {
  const analyzer = new TrapAnalyzer();
  const replyLines: EngineLine[] = [
    { multipv: 1, depth: 16, scoreCp: 550, expectedScore: 0.95, pv: ['d1h5', 'g7g6', 'h5e5'], nodes: 60000, timeMs: 150 }
  ];

  const trap = analyzer.analyzeTrap({
    baitMove: 'f2f4',
    temptingReply: 'e5f4',
    engineLinesAfterBait: [],
    engineLinesAfterReply: replyLines,
  });

  assert.ok(trap !== null);
  assert.strictEqual(trap!.category, 'SACRIFICE_TRAP');
  assert.strictEqual(trap!.punishmentMove, 'd1h5');
  assert.ok(trap!.evalLossIfBaitTaken >= 300);
});
