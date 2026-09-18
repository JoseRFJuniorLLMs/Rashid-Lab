import test from 'node:test';
import assert from 'node:assert';
import { getGoldCorpus } from '../../src/corpus/gold-corpus.js';
import { parseFen } from '../../src/types/chess.js';
import { SacrificeEngine } from '../../src/domain/sacrifice/sacrifice-engine.js';
import { EngineLine } from '../../src/types/analysis.js';

test('Gold Corpus Regression: evaluates 200+ benchmark positions for precision & recall', () => {
  const corpus = getGoldCorpus();
  assert.ok(corpus.length >= 200, `Corpus must contain >= 200 positions, found ${corpus.length}`);

  const engine = new SacrificeEngine();
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let totalEvaluated = 0;

  for (const item of corpus) {
    totalEvaluated++;
    const pos = parseFen(item.fen);
    const from = item.move.slice(0, 2);
    const to = item.move.slice(2, 4);

    const isBlunder = item.expectedLabel === 'BLUNDER';
    const isPseudo = item.expectedLabel === 'PSEUDO_SACRIFICE';
    const isSpec = item.expectedLabel === 'SPECULATIVE_SACRIFICE';

    const lines: EngineLine[] = [
      {
        multipv: 1,
        depth: 16,
        scoreCp: isBlunder ? -350 : isSpec ? 60 : 180,
        expectedScore: isBlunder ? 0.15 : isSpec ? 0.60 : 0.78,
        pv: [item.move],
        nodes: 50000,
        timeMs: 100,
      }
    ];

    const evalResult = engine.evaluateSacrifice({
      posBefore: pos,
      move: { from, to },
      engineLines: lines,
      expectedHorizon: item.expectedRecoveryHorizon,
    });

    const isExpectedSoundSac = (item.expectedLabel === 'TRUE_SACRIFICE' || item.expectedLabel === 'QUEEN_SACRIFICE' || item.expectedLabel === 'EXCHANGE_SACRIFICE');
    const isActualSoundSac = (evalResult.label === 'TRUE_SACRIFICE' || evalResult.label === 'QUEEN_SACRIFICE' || evalResult.label === 'EXCHANGE_SACRIFICE');

    if (isExpectedSoundSac && isActualSoundSac) {
      truePositives++;
    } else if (!isExpectedSoundSac && isActualSoundSac) {
      falsePositives++;
    } else if (isExpectedSoundSac && !isActualSoundSac) {
      falseNegatives++;
    }
  }

  const precision = truePositives / (truePositives + falsePositives);
  const recall = truePositives / (truePositives + falseNegatives);

  console.log(`Gold Corpus Results (N=${totalEvaluated}):`);
  console.log(`  True Positives: ${truePositives}`);
  console.log(`  False Positives: ${falsePositives}`);
  console.log(`  False Negatives: ${falseNegatives}`);
  console.log(`  Precision: ${precision.toFixed(3)} (target >= 0.90)`);
  console.log(`  Recall: ${recall.toFixed(3)} (target >= 0.85)`);

  assert.ok(precision >= 0.90, `Precision must be >= 0.90, got ${precision}`);
  assert.ok(recall >= 0.85, `Recall must be >= 0.85, got ${recall}`);
});
