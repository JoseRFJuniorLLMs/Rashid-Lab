import test from 'node:test';
import assert from 'node:assert';
import { parseFen, calculateMaterial, staticExchangeEvaluation, parseSquare, squareToName } from '../../src/types/chess.js';

test('Chess: square conversions', () => {
  assert.strictEqual(parseSquare('a8'), 0);
  assert.strictEqual(parseSquare('h1'), 63);
  assert.strictEqual(parseSquare('e4'), 36);
  assert.strictEqual(squareToName(0), 'a8');
  assert.strictEqual(squareToName(63), 'h1');
  assert.strictEqual(squareToName(36), 'e4');
});

test('Chess: FEN parsing and material counting', () => {
  const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const pos = parseFen(startFen);
  assert.strictEqual(pos.turn, 'w');
  assert.strictEqual(pos.castling, 'KQkq');
  const mat = calculateMaterial(pos);
  assert.strictEqual(mat.white, 41.57);
  assert.strictEqual(mat.black, 41.57);
  assert.strictEqual(mat.diff, 0.0);
});

test('Chess: SEE evaluation of favorable and unfavorable captures', () => {
  const fen = 'r1bqk2r/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQK2R w KQkq - 0 7';
  const pos = parseFen(fen);
  // Bishop captures pawn on h7
  const seePawn = staticExchangeEvaluation(pos, { from: 'd3', to: 'h7' });
  assert.strictEqual(seePawn, -2.33); // Bishop(3.33) takes Pawn(1.0) net -2.33
});
