export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  color: PieceColor;
  type: PieceType;
}

export interface Move {
  from: string; // e.g., 'e2'
  to: string;   // e.g., 'e4'
  promotion?: PieceType;
}

export interface ChessPosition {
  fen: string;
  turn: PieceColor;
  castling: string;
  enPassant: string | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  board: (Piece | null)[]; // 64 squares (0 = a8, 63 = h1)
}

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 1.0,
  n: 3.05,
  b: 3.33,
  r: 5.63,
  q: 9.55,
  k: 0.0,
};

export function parseSquare(sq: string): number {
  const file = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(sq[1]!, 10);
  return rank * 8 + file;
}

export function squareToName(index: number): string {
  const file = String.fromCharCode('a'.charCodeAt(0) + (index % 8));
  const rank = 8 - Math.floor(index / 8);
  return `${file}${rank}`;
}

export function parseFen(fen: string): ChessPosition {
  const parts = fen.trim().split(/\s+/);
  const placement = parts[0] || '8/8/8/8/8/8/8/8';
  const turn = (parts[1] === 'b' ? 'b' : 'w') as PieceColor;
  const castling = parts[2] || '-';
  const enPassant = parts[3] && parts[3] !== '-' ? parts[3] : null;
  const halfMoveClock = parseInt(parts[4] || '0', 10);
  const fullMoveNumber = parseInt(parts[5] || '1', 10);

  const board: (Piece | null)[] = new Array(64).fill(null);
  let square = 0;
  for (const char of placement) {
    if (char === '/') continue;
    if (char >= '1' && char <= '8') {
      square += parseInt(char, 10);
    } else {
      const isUpper = char === char.toUpperCase();
      board[square] = {
        color: isUpper ? 'w' : 'b',
        type: char.toLowerCase() as PieceType,
      };
      square++;
    }
  }

  return { fen, turn, castling, enPassant, halfMoveClock, fullMoveNumber, board };
}

export function calculateMaterial(pos: ChessPosition): { white: number; black: number; diff: number } {
  let white = 0;
  let black = 0;
  for (const piece of pos.board) {
    if (!piece) continue;
    const val = PIECE_VALUES[piece.type] || 0;
    if (piece.color === 'w') white += val;
    else black += val;
  }
  return {
    white: Number(white.toFixed(2)),
    black: Number(black.toFixed(2)),
    diff: Number((white - black).toFixed(2)),
  };
}

/**
 * Static Exchange Evaluation (SEE) approximation
 */
export function staticExchangeEvaluation(pos: ChessPosition, move: Move): number {
  const fromIdx = parseSquare(move.from);
  const toIdx = parseSquare(move.to);
  const attacker = pos.board[fromIdx];
  const target = pos.board[toIdx];

  if (!attacker) return 0;
  const targetValue = target ? PIECE_VALUES[target.type] : 0;
  const attackerValue = PIECE_VALUES[attacker.type];

  // If capturing a higher value piece with a lower value piece, it is immediately positive
  if (targetValue >= attackerValue) {
    return targetValue - (move.promotion ? PIECE_VALUES[move.promotion] - 1 : 0);
  }
  // Otherwise net delta
  return targetValue - attackerValue;
}
