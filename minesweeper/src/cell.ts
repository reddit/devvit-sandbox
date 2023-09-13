export type Cell = {
  bomb: boolean;
  proximityBombs: number;
  covered: boolean;
  flagged: boolean;
  proximityFlags: number;
};
