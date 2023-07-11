import { Devvit } from "@devvit/public-api-next";
import { type CustomPostType } from "@devvit/public-api-next";
import { CellProps } from "./Cell.js";
import { makeGame, verifyWinCondition } from "./game.js";
import { MinesweeperGrid } from "./Grid.js";

const NUM_COLUMNS = 9;
const NUM_ROWS = 9;
const NUM_MINES = 10;

const initGame = makeGame({
  rows: NUM_ROWS,
  cols: NUM_COLUMNS,
  mines: NUM_MINES,
});

enum Mode {
  Flagging,
  Revealing,
}

const ModeDisplayText = {
  [Mode.Flagging]: "Flagging",
  [Mode.Revealing]: "Revealing",
};

enum GameStatus {
  InProgress,
  Won,
  Lost,
}
enum CellState {
  Hidden,
  Revealed,
  Flagged,
}

export const MineSweeperGameRoot: CustomPostType["render"] = ({
  ui,
  useState,
}) => {
  const [game, setGame] = useState(initGame);
  const [mode, setMode] = useState(Mode.Revealing);
  const [gameStatus, setGameStatus] = useState(GameStatus.InProgress);
  const [timer, setTimer] = useState(0); // seconds elapsed

  type OnClickCellHandler = CellProps["onClick"];

  const onClickCellFlagMode: OnClickCellHandler = ({ row, col }) => {
    const cell = game.grid[row][col];

    if (cell.state === CellState.Revealed) {
      // no-op
      return;
    }

    if (cell.state === CellState.Flagged) {
      game.grid[row][col] = {
        ...cell,
        state: CellState.Hidden,
      };
    } else {
      game.grid[row][col] = {
        ...cell,
        state: CellState.Flagged,
      };
    }
    return setGame(game);
  };

  const onClickCellRevealMode: OnClickCellHandler = ({ row, col }) => {
    const cell = game.grid[row][col];

    if (cell.state !== CellState.Hidden) {
      // no-op
      return;
    }

    if (cell.isMine) {
      game.grid[row][col].state = CellState.Revealed;
      setGameStatus(GameStatus.Lost);
      return ui.showToast("BOOOOOM! You clicked on a mine!");
    }

    // use DFS to reveal all the cells in the area that are not adjacent
    // to mines, as well as the cells on the fringe of that area
    const dfs = (row: number, col: number) => {
      const currentCell = game.grid[row][col];

      if (currentCell.state !== CellState.Hidden) {
        return;
      }

      if (currentCell.isMine) {
        return;
      }

      game.grid[row][col].state = CellState.Revealed;

      // if the cell is adjacent to a mine, we don't need to keep
      // traversing
      if (currentCell.adjacentMines > 0) {
        return;
      }

      for (
        let r = Math.max(0, row - 1);
        r <= Math.min(game.grid.length - 1, row + 1);
        r++
      ) {
        for (
          let c = Math.max(0, col - 1);
          c <= Math.min(game.grid[0].length - 1, col + 1);
          c++
        ) {
          dfs(r, c);
        }
      }
    };

    if (cell.adjacentMines === 0) {
      dfs(row, col);
    } else {
      game.grid[row][col].state = CellState.Revealed;
    }

    setGame(game);
  };

  const onClickCellHandler = (() => {
    if (gameStatus !== GameStatus.InProgress) {
      // no more clicking around
      return () => {};
    }

    if (mode === Mode.Flagging) {
      return onClickCellFlagMode;
    }

    return onClickCellRevealMode;
  })();

  return (
    <>
      <MinesweeperGrid
        game={game}
        onClickCell={(input) => {
          onClickCellHandler(input);
          if (verifyWinCondition(game)) {
            setGameStatus(GameStatus.Won);
            ui.showToast("You won!");
            return;
          }
        }}
      />
      <vstack>
        <hstack>
          <text size="xxlarge">Mode: {ModeDisplayText[mode]}</text>
          <button
            onPress={() => {
              if (mode === Mode.Flagging) {
                setMode(Mode.Revealing);
              } else {
                setMode(Mode.Flagging);
              }
            }}
          >
            Change mode
          </button>
        </hstack>
        <button
          onPress={() => {
            setGame(
              makeGame({
                rows: NUM_ROWS,
                cols: NUM_COLUMNS,
                mines: NUM_MINES,
              })
            );
            setGameStatus(GameStatus.InProgress);
          }}
        >
          {gameStatus === GameStatus.Won || gameStatus === GameStatus.Lost
            ? "Play again"
            : "Restart"}
        </button>
      </vstack>
    </>
  );
};
