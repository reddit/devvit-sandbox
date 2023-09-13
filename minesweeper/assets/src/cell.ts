export type Cell = {
  bomb: boolean;
  covered: boolean;
  flagged: boolean;
  proximityBombs: number;
  proximityFlags: number;
};
