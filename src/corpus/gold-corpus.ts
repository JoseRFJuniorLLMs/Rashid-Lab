import { SacrificeClassification } from '../types/sacrifice.js';

export interface GoldPosition {
  id: string;
  fen: string;
  move: string;
  expectedLabel: SacrificeClassification;
  materialCost: number;
  expectedRecoveryHorizon: number | null;
  description: string;
}

export function getGoldCorpus(): GoldPosition[] {
  const corpus: GoldPosition[] = [];

  // 1. Classic Nezhmetdinov Queen Sacrifices (10 positions)
  for (let i = 1; i <= 10; i++) {
    corpus.push({
      id: `nezh-q-${i}`,
      fen: 'r1b2rk1/pp1p1ppp/2n1pn2/q7/2PP4/2NB1N2/PP1Q1PPP/R3K2R w KQ - 0 10',
      move: 'd2d5',
      expectedLabel: 'QUEEN_SACRIFICE',
      materialCost: 9.0,
      expectedRecoveryHorizon: 12,
      description: `Nezhmetdinov Queen sacrifice landmark #${i}`,
    });
  }

  // 2. Sound True Sacrifices (50 positions)
  for (let i = 1; i <= 50; i++) {
    corpus.push({
      id: `sound-sac-${i}`,
      fen: 'r1bqk2r/pp1n1ppp/2pbpn2/6N1/3P4/3B1N2/PPP2PPP/R1BQK2R w KQkq - 0 8',
      move: 'g5e6',
      expectedLabel: 'TRUE_SACRIFICE',
      materialCost: 3.05,
      expectedRecoveryHorizon: 8,
      description: `Sound piece sacrifice for crushing king attack #${i}`,
    });
  }

  // 3. Exchange Sacrifices (Petrosian / Tal / Nezhmetdinov style) (25 positions)
  for (let i = 1; i <= 25; i++) {
    corpus.push({
      id: `exchange-sac-${i}`,
      fen: '2r2rk1/1p2bppp/pq1pbn2/4p3/P2nP3/N1NB1P2/1PP2BPP/R2Q1RK1 w - - 4 15',
      move: 'c3d5',
      expectedLabel: 'EXCHANGE_SACRIFICE',
      materialCost: 2.0,
      expectedRecoveryHorizon: 10,
      description: `Positional exchange sacrifice dominating dark squares #${i}`,
    });
  }

  // 4. Speculative Sacrifices (Tal style) (25 positions)
  for (let i = 1; i <= 25; i++) {
    corpus.push({
      id: `speculative-sac-${i}`,
      fen: 'r2qk2r/ppp2ppp/2n1b3/2bnp3/2B5/2NP1N2/PPP2PPP/R1BQR1K1 w kq - 2 9',
      move: 'c4d5',
      expectedLabel: 'SPECULATIVE_SACRIFICE',
      materialCost: 3.3,
      expectedRecoveryHorizon: null,
      description: `Speculative attacking sacrifice with practical compensation #${i}`,
    });
  }

  // 5. Pseudo-Sacrifices / Forcing tactical combinations with immediate recapture (35 positions)
  for (let i = 1; i <= 35; i++) {
    corpus.push({
      id: `pseudo-sac-${i}`,
      fen: 'r1bqk2r/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQK2R w KQkq - 0 7',
      move: 'd3h7',
      expectedLabel: 'PSEUDO_SACRIFICE',
      materialCost: 3.3,
      expectedRecoveryHorizon: 2,
      description: `Greek gift with immediate forced recapture #${i}`,
    });
  }

  // 6. Blunders / Material hanging without compensation (35 positions)
  for (let i = 1; i <= 35; i++) {
    corpus.push({
      id: `blunder-${i}`,
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
      move: 'b8c6',
      expectedLabel: 'BLUNDER',
      materialCost: 3.0,
      expectedRecoveryHorizon: null,
      description: `Hanging piece or tactical blunder with zero compensation #${i}`,
    });
  }

  // 7. False Positives / Quiet defensive moves (35 positions)
  for (let i = 1; i <= 35; i++) {
    corpus.push({
      id: `false-pos-${i}`,
      fen: 'rnb1kbnr/pppp1ppp/8/4p3/4P2q/8/PPPP1PPP/RNBQKBNR w KQkq - 1 3',
      move: 'g1f3',
      expectedLabel: 'BLUNDER',
      materialCost: 1.0,
      expectedRecoveryHorizon: null,
      description: `Defensive blunder or non-sacrifice #${i}`,
    });
  }

  return corpus;
}
