import { EngineLine, WdlScore } from '../types/analysis.js';

export interface FakeEngineResponse {
  scoreCp?: number;
  scoreMate?: number;
  wdl?: WdlScore;
  pv?: string[];
  depth?: number;
  nodes?: number;
}

export class FakeUciEngine {
  private ready = false;
  private analyzing = false;
  private currentPosition = 'startpos';
  private lines: EngineLine[] = [];
  private onLineCallback?: (line: EngineLine) => void;
  private onBestmoveCallback?: (move: string) => void;

  constructor(private name = 'FakeStockfish 17') {}

  onLine(cb: (line: EngineLine) => void) {
    this.onLineCallback = cb;
  }

  onBestmove(cb: (move: string) => void) {
    this.onBestmoveCallback = cb;
  }

  sendCommand(cmd: string): string[] {
    const trimmed = cmd.trim();
    const parts = trimmed.split(/\s+/);
    const op = parts[0];

    if (op === 'uci') {
      return [
        `id name ${this.name}`,
        'id author Rashid Lab Team',
        'option name MultiPV type spin default 1 min 1 max 500',
        'uciok',
      ];
    }
    if (op === 'isready') {
      this.ready = true;
      return ['readyok'];
    }
    if (op === 'position') {
      this.currentPosition = parts.slice(1).join(' ');
      return [];
    }
    if (op === 'go') {
      this.analyzing = true;
      // Default line
      const line: EngineLine = {
        multipv: 1,
        depth: 15,
        scoreCp: 45,
        expectedScore: 0.56,
        wdl: { win: 350, draw: 550, loss: 100 },
        pv: ['e2e4', 'e7e5', 'g1f3'],
        nodes: 50000,
        timeMs: 120,
      };

      // Check if searchmoves was passed
      const smIdx = parts.indexOf('searchmoves');
      if (smIdx !== -1) {
        const smMoves = parts.slice(smIdx + 1);
        if (smMoves.length > 0) {
          line.pv = [smMoves[0]!, 'e7e5'];
        }
      }

      if (this.onLineCallback) this.onLineCallback(line);
      const best = line.pv[0] || 'e2e4';
      if (this.onBestmoveCallback) {
        setTimeout(() => {
          if (this.analyzing) {
            this.analyzing = false;
            this.onBestmoveCallback?.(best);
          }
        }, 10);
      }
      return [`info depth ${line.depth} score cp ${line.scoreCp} pv ${line.pv.join(' ')}`, `bestmove ${best}`];
    }
    if (op === 'stop') {
      this.analyzing = false;
      return ['bestmove e2e4'];
    }
    if (op === 'quit') {
      this.ready = false;
      this.analyzing = false;
      return [];
    }
    return [];
  }

  isAnalyzing(): boolean {
    return this.analyzing;
  }
}
