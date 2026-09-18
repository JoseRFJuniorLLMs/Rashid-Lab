export interface SacrificeConfig {
  minMaterialDeficit: number;     // e.g. 0.9 pawn
  recoveryHorizonThreshold: number;// plies, e.g. 4
  pseudoSacrificeMaxPlies: number; // plies, e.g. 3
  maxSoundExpectedScoreLoss: number; // e.g. 0.05
  temptationCheckBonus: number;
  defenderSuspicionThreshold: number; // e.g. 3 defenders
}

export const DEFAULT_SACRIFICE_CONFIG: SacrificeConfig = {
  minMaterialDeficit: 0.9,
  recoveryHorizonThreshold: 4,
  pseudoSacrificeMaxPlies: 3,
  maxSoundExpectedScoreLoss: 0.06,
  temptationCheckBonus: 15,
  defenderSuspicionThreshold: 3,
};

export interface EngineProfile {
  id: string;
  name: string;
  type: 'stockfish' | 'lc0' | 'fake';
  threads: number;
  hashMb: number;
  multiPv: number;
  defaultDepth: number;
  defaultMoveTimeMs: number;
}

export const DEFAULT_ENGINE_PROFILES: Record<string, EngineProfile> = {
  stockfish: {
    id: 'stockfish-default',
    name: 'Stockfish 17',
    type: 'stockfish',
    threads: 4,
    hashMb: 256,
    multiPv: 3,
    defaultDepth: 20,
    defaultMoveTimeMs: 2000,
  },
  lc0: {
    id: 'lc0-default',
    name: 'Leela Chess Zero',
    type: 'lc0',
    threads: 2,
    hashMb: 256,
    multiPv: 3,
    defaultDepth: 18,
    defaultMoveTimeMs: 3000,
  },
  fake: {
    id: 'fake-test',
    name: 'Fake Engine',
    type: 'fake',
    threads: 1,
    hashMb: 16,
    multiPv: 1,
    defaultDepth: 10,
    defaultMoveTimeMs: 100,
  }
};
