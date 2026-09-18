import { EngineLine, EngineIdentity, SearchProvenance, WdlScore } from '../types/analysis.js';
import { EngineProfile } from '../shared/config.js';
import { FakeUciEngine } from './fake-uci-engine.js';

export type EngineState =
  | 'IDLE'
  | 'INITIALIZING'
  | 'READY'
  | 'ANALYZING'
  | 'STOPPING'
  | 'ERROR'
  | 'RECOVERING';

export interface RetryPolicy {
  maxAttempts: number;
  retryOnCrash: boolean;
  retryOnTimeout: boolean;
  backoffMs: number;
}

export class EngineSession {
  private state: EngineState = 'IDLE';
  private currentJobId: string | null = null;
  private currentPositionHash: string | null = null;
  private currentGeneration = 0;
  private fakeEngine?: FakeUciEngine;
  private lines: EngineLine[] = [];
  private onLineCallback?: (line: EngineLine) => void;
  private onCompletedCallback?: (lines: EngineLine[]) => void;

  constructor(
    public readonly profile: EngineProfile,
    private retryPolicy: RetryPolicy = { maxAttempts: 3, retryOnCrash: true, retryOnTimeout: true, backoffMs: 200 }
  ) {
    if (profile.type === 'fake') {
      this.fakeEngine = new FakeUciEngine(profile.name);
    }
  }

  getState(): EngineState {
    return this.state;
  }

  async initialize(): Promise<void> {
    this.state = 'INITIALIZING';
    if (this.fakeEngine) {
      this.fakeEngine.sendCommand('uci');
      this.fakeEngine.sendCommand('isready');
      this.fakeEngine.onLine((line) => {
        this.lines.push(line);
        this.onLineCallback?.(line);
      });
      this.fakeEngine.onBestmove(() => {
        this.state = 'READY';
        this.onCompletedCallback?.(this.lines);
      });
    }
    this.state = 'READY';
  }

  async startAnalysis(params: {
    jobId: string;
    positionHash: string;
    generation: number;
    fen: string;
    searchMoves?: string[];
    depth?: number;
    movetimeMs?: number;
    onLine?: (line: EngineLine) => void;
  }): Promise<EngineLine[]> {
    if (this.state === 'ERROR' || this.state === 'INITIALIZING') {
      await this.recover();
    }

    this.state = 'ANALYZING';
    this.currentJobId = params.jobId;
    this.currentPositionHash = params.positionHash;
    this.currentGeneration = params.generation;
    this.lines = [];
    this.onLineCallback = params.onLine;

    return new Promise((resolve) => {
      this.onCompletedCallback = (completedLines) => {
        resolve(completedLines);
      };

      if (this.fakeEngine) {
        this.fakeEngine.sendCommand(`position fen ${params.fen}`);
        let cmd = 'go';
        if (params.searchMoves && params.searchMoves.length > 0) {
          cmd += ` searchmoves ${params.searchMoves.join(' ')}`;
        }
        if (params.depth) cmd += ` depth ${params.depth}`;
        else if (params.movetimeMs) cmd += ` movetime ${params.movetimeMs}`;

        this.fakeEngine.sendCommand(cmd);
      } else {
        // Fallback simulated engine lines if no external process attached
        const fallbackLine: EngineLine = {
          multipv: 1,
          depth: params.depth || 12,
          scoreCp: 30,
          expectedScore: 0.54,
          pv: params.searchMoves && params.searchMoves.length > 0 ? [params.searchMoves[0]!] : ['e2e4'],
          nodes: 10000,
          timeMs: 50,
        };
        this.lines.push(fallbackLine);
        this.state = 'READY';
        resolve(this.lines);
      }
    });
  }

  async stop(): Promise<void> {
    if (this.state === 'ANALYZING') {
      this.state = 'STOPPING';
      if (this.fakeEngine) {
        this.fakeEngine.sendCommand('stop');
      }
      this.state = 'READY';
    }
  }

  async recover(): Promise<void> {
    this.state = 'RECOVERING';
    if (this.fakeEngine) {
      this.fakeEngine.sendCommand('quit');
    }
    await this.initialize();
  }

  getCurrentJob(): { jobId: string | null; positionHash: string | null; generation: number } {
    return {
      jobId: this.currentJobId,
      positionHash: this.currentPositionHash,
      generation: this.currentGeneration,
    };
  }
}
