import { EngineSession } from './engine-session.js';
import { EngineProfile, DEFAULT_ENGINE_PROFILES } from '../shared/config.js';
import { EngineLine } from '../types/analysis.js';

export interface ConsensusResult {
  agreement: boolean;
  scoreDifferenceCp: number;
  expectedScoreDifference: number;
  stockfishBestMove?: string;
  lc0BestMove?: string;
}

export class EngineManager {
  private sessions = new Map<string, EngineSession>();

  constructor() {
    // Setup default sessions
    this.registerSession(new EngineSession(DEFAULT_ENGINE_PROFILES['fake']!));
  }

  registerSession(session: EngineSession): void {
    this.sessions.set(session.profile.id, session);
  }

  getSession(profileId: string): EngineSession | undefined {
    return this.sessions.get(profileId);
  }

  async initializeAll(): Promise<void> {
    for (const session of this.sessions.values()) {
      await session.initialize();
    }
  }

  calculateConsensus(stockfishLines: EngineLine[], lc0Lines: EngineLine[]): ConsensusResult {
    const sfTop = stockfishLines[0];
    const lc0Top = lc0Lines[0];

    if (!sfTop || !lc0Top) {
      return {
        agreement: false,
        scoreDifferenceCp: 0,
        expectedScoreDifference: 0,
      };
    }

    const sfMove = sfTop.pv[0];
    const lc0Move = lc0Top.pv[0];
    const cpDiff = Math.abs((sfTop.scoreCp ?? 0) - (lc0Top.scoreCp ?? 0));
    const esDiff = Math.abs(sfTop.expectedScore - lc0Top.expectedScore);

    return {
      agreement: sfMove === lc0Move,
      scoreDifferenceCp: cpDiff,
      expectedScoreDifference: Number(esDiff.toFixed(3)),
      stockfishBestMove: sfMove,
      lc0BestMove: lc0Move,
    };
  }
}
