import { Puzzle, PuzzleMove, PuzzleMoveType } from "./types.js";

export function updatePuzzleState(puzzle: Puzzle, move: PuzzleMove): Puzzle {
  const tempPuzzle = { ...puzzle };
  if (!tempPuzzle.history) tempPuzzle.history = [];
  tempPuzzle.history?.push(move);

  // move.coord is 1-based
  if (!tempPuzzle.state) tempPuzzle.state = [];
  if (!tempPuzzle.state[move.coord[1] - 1]) {
    tempPuzzle.state[move.coord[1] - 1] = [];
  }
  tempPuzzle.state![move.coord[1] - 1][move.coord[0] - 1] = move.type;
  tempPuzzle.updated = Date.now();
  return tempPuzzle;
}

export function isPuzzleComplete(puzzle: Puzzle): boolean {
  if (!puzzle.state) return false;

  // create coordinates from puzzle state
  const ycoords = [];
  for (let i = 0; i < puzzle.y!.length; i++) {
    const coords = [];
    let count = 0;
    for (let j = 0; j < puzzle.x!.length; j++) {
      if (!puzzle.state[i]) break;
      if (puzzle.state[i][j] === PuzzleMoveType.Fill) {
        count++;
      } else {
        if (count) {
          coords.push(count);
          count = 0;
        }
      }
    }
    if (count) coords.push(count);
    ycoords[i] = [...(coords.length ? coords : [0])];
  }

  // create coordinates from puzzle state
  const xcoords = [];
  for (let i = 0; i < puzzle.x!.length; i++) {
    const coords = [];
    let count = 0;
    for (let j = 0; j < puzzle.y!.length; j++) {
      if (!puzzle.state[j]) break;
      if (puzzle.state[j][i] === PuzzleMoveType.Fill) {
        count++;
      } else {
        if (count) {
          coords.push(count);
          count = 0;
        }
      }
    }
    if (count) coords.push(count);
    xcoords[i] = [...(coords.length ? coords : [0])];
  }

  // compare against existing coords
  return (
    xcoords.toString() === puzzle.x!.toString() &&
    ycoords.toString() === puzzle.y!.toString()
  );
}
