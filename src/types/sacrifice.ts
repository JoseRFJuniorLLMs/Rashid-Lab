import { PieceType } from './chess.js';
import { EngineLine, WdlScore } from './analysis.js';

export type SacrificeCategory =
  | 'DIRECT_OFFER'
  | 'CAPTURE_SAC'
  | 'EXCHANGE_SAC'
  | 'QUEEN_OFFER'
  | 'QUIET_SAC'
  | 'DEFENSIVE_SAC'
  | 'CLEARANCE_SAC'
  | 'KING_ATTACK_SAC'
  | 'PROMOTION_SAC';

export type SacrificeClassification =
  | 'TRUE_SACRIFICE'
  | 'PSEUDO_SACRIFICE'
  | 'SPECULATIVE_SACRIFICE'
  | 'EXCHANGE_SACRIFICE'
  | 'QUEEN_SACRIFICE'
  | 'SOUND_COMBINATION'
  | 'BLUNDER'
  | 'DESPERADO';

export interface MaterialCaptureEvent {
  ply: number;
  move: string;
  capturedPiece: PieceType;
  capturerPiece: PieceType;
  delta: number;
}

export interface MaterialDeltaResult {
  initialDelta: number;
  maxDeficit: number;
  finalDelta: number;
  captures: MaterialCaptureEvent[];
  possibleRecoveryDetected: boolean;
  analyzedPlies: number;
}

export interface AcceptanceMoveAnalysis {
  move: string;
  materialGain: number;
  scoreCp?: number;
  expectedScore: number;
  rankAmongReplies: number;
  pv: string[];
  stable: boolean;
}

export interface AcceptanceAnalysis {
  acceptingMoves: AcceptanceMoveAnalysis[];
  bestAcceptance?: AcceptanceMoveAnalysis;
  isAcceptanceAvailable: boolean;
  isAcceptanceObjectivelyValid: boolean;
  bestAcceptanceRank?: number;
  acceptanceExpectedScore?: number;
  acceptanceMaterialGain?: number;
}

export interface DeclineMoveAnalysis {
  move: string;
  scoreCp?: number;
  expectedScore: number;
  rankAmongReplies: number;
  pv: string[];
}

export interface DeclineAnalysis {
  decliningMoves: DeclineMoveAnalysis[];
  bestDecline?: DeclineMoveAnalysis;
  bestDeclineExpectedScore?: number;
  declinePreferredOverAccept: boolean;
}

export interface RecaptureAnalysis {
  immediateRecapture: boolean;
  recaptureWithinPlies?: number;
  recoveryValue: number;
  isLikelyPseudoSacrifice: boolean;
}

export interface MaterialTimelinePoint {
  ply: number;
  whiteMaterial: number;
  blackMaterial: number;
  materialDelta: number; // positive = sacrificer is up, negative = in deficit
}

export interface RecoveryHorizonResult {
  initialDeficit: number;
  maxDeficit: number;
  recovered: boolean;
  recoveryPly?: number;
  materialTimeline: MaterialTimelinePoint[];
  confidence: number;
}

export interface CompensationFactors {
  kingSafetyDeficit: number;     // 0 - 100
  mobilityRatio: number;         // ratio > 1 means advantage
  centerControlAdvantage: number;// -100 to 100
  openLinesAdvantage: number;    // open files/diagonals to enemy king
  initiativeScore: number;       // 0 - 100
  totalCompensationScore: number;// 0 - 100
}

export interface SacrificeEvidence {
  materialCost: number;
  recoveryHorizon: number | null; // plies, null if unrecovered
  acceptanceBestRank: number;
  expectedScoreLoss: number;
  soundness: number; // 0.0 to 1.0
  rashidScore: number; // 0 to 100
  compensation: CompensationFactors;
  motifs: string[];
  bestAcceptanceMove?: string;
  bestDeclineMove?: string;
  declineRecommended: boolean;
}

export interface SacrificeResult {
  move: string;
  label: SacrificeClassification;
  category: SacrificeCategory;
  isSound: boolean;
  evidence: SacrificeEvidence;
}
