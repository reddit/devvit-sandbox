export enum PuzzleMoveType {
  Block = 1,
  Fill = 2,
}

export enum PuzzleDifficulty {
  Easy = 1,
  Medium = 2,
  Hard = 3,
}

export type PuzzleMove = {
  user: string;
  coord: number[];
  type: PuzzleMoveType;
  strategy: string;
  created: number;
};

export type PuzzleAchievements = {
  firstMove: string;
  lastMove: string;
  mostFilled: string;
  mostEmptied: string;
};

export type Puzzle = {
  id?: string;
  x?: number[][];
  y?: number[][];
  state?: PuzzleMoveType[][];
  history?: PuzzleMove[];
  title?: string;
  description?: string;
  historyCommentId?: string;
  created?: number;
  updated?: number;
  createdBy?: string;
  difficulty?: PuzzleDifficulty;
};

// Reddit Richtext JSON types
export type JsonTable = {
  document: JsonDocumentRow[];
};

export type JsonDocumentRow = {
  e: string;
  c: JsonTableField[][] | JsonTableFieldValue[] | JsonTableFieldValue[][];
  h?: JsonTableField[];
  o?: boolean;
};

export type JsonTableField = {
  a?: string;
  c?: JsonTableFieldValue[];
};

export type JsonTableFieldValue = {
  c?: unknown;
  e?: string;
  f?: number[][];
  l?: boolean;
  t?: string;
};
