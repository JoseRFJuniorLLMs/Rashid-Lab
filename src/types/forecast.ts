import { PieceType } from './chess.js';

export interface LikelyTarget {
  square: string;
  score: number; // 0 - 100
}

export interface HorizonForecast {
  horizonPly: number;
  potentialScore: number; // 0 - 100
  calibratedProbability: number; // 0.0 - 1.0
  likelyPiece?: PieceType;
  likelyTargetSquare?: string;
}

export interface SacrificePressureMap {
  // 64 values representing pressure per square (0 = a8, 63 = h1)
  squareValues: number[];
  hotSpots: string[]; // e.g. ['h7', 'f7', 'e6']
}

export interface SacrificeForecastResult {
  positionHash: string;
  overallPotentialScore: number; // 0 - 100
  calibratedSacrificeProbability: number; // 0.0 - 1.0
  expectedSacrificeTimePlies: number;
  confidence: number; // 0.0 - 1.0
  stability: number;  // 0.0 - 1.0
  horizons: HorizonForecast[];
  pressureMap: SacrificePressureMap;
  likelySacrificedPiece?: PieceType;
  likelyTarget?: LikelyTarget;
  likelyMotifs: string[];
  treeEvidenceMoves: string[];
}
