import { PieceColor } from './chess.js';

export interface PositionRef {
  fen: string;
  hash: string;
}

export interface EngineIdentity {
  name: string;
  version: string;
  author?: string;
  options?: Record<string, string | number | boolean>;
}

export interface SearchProvenance {
  depth: number;
  seldepth?: number;
  nodes: number;
  timeMs: number;
  nps: number;
  hashfull?: number;
}

export interface WdlScore {
  win: number;   // 0 - 1000 permille
  draw: number;  // 0 - 1000 permille
  loss: number;  // 0 - 1000 permille
}

export interface EngineLine {
  multipv: number;
  depth: number;
  scoreCp?: number;
  scoreMate?: number;
  wdl?: WdlScore;
  expectedScore: number; // 0.0 - 1.0 (winrate probability)
  pv: string[]; // uci moves, e.g. ['e2e4', 'e7e5']
  nodes: number;
  timeMs: number;
}

export type AnalysisJobType =
  | 'PRIMARY'
  | 'CANDIDATE_SCAN'
  | 'SACRIFICE_ACCEPT'
  | 'SACRIFICE_DECLINE'
  | 'FORECAST_BRANCH'
  | 'DISCOVER'
  | 'CORPUS'
  | 'STUDY'
  | 'VALIDATION';

export interface AnalysisJobRequest {
  id?: string;
  type: AnalysisJobType;
  priority: number; // 0 = highest, 7 = lowest
  position: PositionRef;
  engineProfile: { id: string; name: string };
  search?: {
    depth?: number;
    nodes?: number;
    movetimeMs?: number;
    searchMoves?: string[];
    multiPv?: number;
  };
  generation: number;
  metadata?: Record<string, unknown>;
}

export interface AnalysisJobResult {
  jobId: string;
  positionHash: string;
  generation: number;
  engine: EngineIdentity;
  search: SearchProvenance;
  lines: EngineLine[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export type AnalysisJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'ERROR';

export interface AnalysisJobHandle {
  id: string;
  cancel(): Promise<void>;
  status(): AnalysisJobStatus;
  promise: Promise<AnalysisJobResult>;
}

export interface AnalysisUpdate {
  positionHash: string;
  generation: number;
  primaryLine?: EngineLine;
  allLines: EngineLine[];
}
