import { SacrificeResult } from '../../types/sacrifice.js';

export type StudyExerciseType =
  | 'FIND_SACRIFICE'
  | 'CALCULATE_ACCEPTANCE'
  | 'CALCULATE_DECLINE'
  | 'IDENTIFY_MOTIF'
  | 'FORECAST_BEFORE_MOVE';

export interface StudyExercise {
  id: string;
  fen: string;
  type: StudyExerciseType;
  prompt: string;
  solutionMoves: string[];
  motifs: string[];
  difficulty: number; // 1 - 5
  timesReviewed: number;
  intervalDays: number;
  easeFactor: number;
}

export class StudyService {
  generateExercise(fen: string, sacrifice: SacrificeResult): StudyExercise {
    return {
      id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fen,
      type: 'FIND_SACRIFICE',
      prompt: 'Find the sound sacrifice that breaks open the defensive shield.',
      solutionMoves: [sacrifice.move],
      motifs: sacrifice.evidence.motifs,
      difficulty: sacrifice.evidence.materialCost >= 8 ? 5 : sacrifice.evidence.materialCost >= 5 ? 4 : 3,
      timesReviewed: 0,
      intervalDays: 1,
      easeFactor: 2.5,
    };
  }

  updateSpacedRepetition(exercise: StudyExercise, quality: number): StudyExercise {
    // SuperMemo-2 spaced repetition algorithm
    const q = Math.max(0, Math.min(5, quality));
    let easeFactor = exercise.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    let intervalDays: number;
    if (q < 3) {
      intervalDays = 1;
    } else if (exercise.timesReviewed === 0) {
      intervalDays = 1;
    } else if (exercise.timesReviewed === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(exercise.intervalDays * easeFactor);
    }

    return {
      ...exercise,
      timesReviewed: exercise.timesReviewed + 1,
      intervalDays,
      easeFactor: Number(easeFactor.toFixed(2)),
    };
  }
}
