import test from 'node:test';
import assert from 'node:assert';
import { parseFen } from '../../src/types/chess.js';
import { CandidateSearchService } from '../../src/domain/sacrifice/candidate-search-service.js';

test('CandidateSearchService: finds candidate sacrifices independent of MultiPV', () => {
  const service = new CandidateSearchService();
  const fen = 'r1bqk2r/pp1n1ppp/2pbpn2/6N1/3P4/3B1N2/PPP2PPP/R1BQK2R w KQkq - 0 8';
  const pos = parseFen(fen);
  const candidates = service.findCandidates(pos);
  assert.ok(candidates.length > 0, 'Should detect candidate sacrifice moves');
  const hasKnightSac = candidates.some(c => c.sacrificedPiece === 'n');
  assert.ok(hasKnightSac, 'Should include knight sacrifice candidate');
});
