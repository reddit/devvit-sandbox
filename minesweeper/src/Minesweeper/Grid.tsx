import { Devvit } from "@devvit/public-api-next";
import { Cell, type CellProps } from "./Cell.js";
import { type MinesweeperGame } from "./game.js";

export interface MinesweeperProps {
  game: MinesweeperGame;
  onClickCell: CellProps["onClick"];
}

export const MinesweeperGrid = ({ game, onClickCell }: MinesweeperProps) => {
  const rows = game.grid.length;
  const cols = game.grid[0].length;

  return Array.from({ length: rows }).map((_, row) => (
    <hstack>
      {Array.from({ length: cols }).map((_, col) => (
        <Cell
          row={row}
          col={col}
          onClick={onClickCell}
          state={game.grid[row][col].state}
          isMine={game.grid[row][col].isMine}
          adjacentMines={game.grid[row][col].adjacentMines}
        />
      ))}
    </hstack>
  ));
};
