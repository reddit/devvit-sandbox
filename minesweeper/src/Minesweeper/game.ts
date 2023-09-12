export interface GameSettings {
  rows: number;
  cols: number;
  mines: number;
}

export enum CellState {
  Hidden,
  Revealed,
  Flagged,
}

export interface Cell {
  state: CellState;
  adjacentMines: number;
  isMine: boolean;
}

export interface MinesweeperGame {
  readonly grid: Cell[][];
}

// Creates a new game with the given settings
export function makeGame({ rows, cols, mines }: GameSettings): MinesweeperGame {
  const grid = Array.from({ length: rows }).map((_) =>
    Array.from({ length: cols }).map((_) => ({
      isMine: false,
      state: CellState.Hidden,
      adjacentMines: 0, // will populate this later
    }))
  );

  let placedMines = 0;
  // randomly place mines in the grid, with total mines / total cells roughly equal to mines / (rows * cols)
  grid.forEach((row) => {
    row.forEach((cell) => {
      if (Math.random() < mines / (rows * cols)) {
        cell.isMine = true;
        placedMines++;
      }
    });
  });

  // if we didn't place enough mines, place them randomly until we do
  while (placedMines < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (!grid[row][col].isMine) {
      grid[row][col].isMine = true;
      placedMines++;
    }
  }

  // process the grid and calculate the number of adjacent mines for each cell
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.isMine) {
        return;
      }

      // count the number of mines in the adjacent cells
      let adjacentMines = 0;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
          const row = rowIndex + rowOffset;
          const col = colIndex + colOffset;
          if (
            row >= 0 &&
            row < rows &&
            col >= 0 &&
            col < cols &&
            !!grid[row][col]?.isMine
          ) {
            adjacentMines++;
          }
        }
      }
      grid[rowIndex][colIndex].adjacentMines = adjacentMines;
    });
  });

  return { grid };
}

export function verifyWinCondition(game: MinesweeperGame): boolean {
  // verify all non-mine cells are revealed
  // and all mine cells are flagged
  for (let row = 0; row < game.grid.length; row++) {
    for (let col = 0; col < game.grid[0].length; col++) {
      const cell = game.grid[row][col];

      if (cell.isMine && cell.state !== CellState.Flagged) {
        console.log("mine not flagged", row, col);
        return false;
      }

      if (!cell.isMine && cell.state !== CellState.Revealed) {
        console.log("non-mine not revealed", row, col);
        return false;
      }

      if (cell.state === CellState.Hidden) {
        console.log("cell is hidden", row, col);
        return false;
      }
    }
  }

  return true;
}
