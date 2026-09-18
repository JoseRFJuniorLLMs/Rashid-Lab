export type TrapCategory =
  | 'SACRIFICE_TRAP'
  | 'TEMPTING_CAPTURE_TRAP'
  | 'OPENING_TRAP'
  | 'TACTICAL_TRAP'
  | 'POSITIONAL_TRAP';

export interface TrapCandidate {
  baitMove: string;
  temptingReply: string;
  punishmentMove: string;
  category: TrapCategory;
  temptationScore: number; // 0 - 100
  evalLossIfBaitTaken: number; // cp or expectedScore loss
  isRecaptureOnly: boolean;
  punishmentPv: string[];
}
