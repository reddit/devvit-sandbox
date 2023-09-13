import { ContextAPIClients, UIClient, UseIntervalResult, UseStateResult } from '@devvit/public-api';
import { Pages } from './pages.js';
import { Difficulty } from './difficulty.js';
import { Cell } from './cell.js';
import { ClickMode } from './clickMode.js';

export class MinesweeperGame {
  private readonly _currentPage: UseStateResult<Pages>;
  private readonly _board: UseStateResult<Cell[]>;
  private readonly _boardWidth: UseStateResult<number>;
  private readonly _boardHeight: UseStateResult<number>;
  private readonly _remainingBombs: UseStateResult<number>;
  private readonly _remainingTiles: UseStateResult<number>;
  private readonly _currentTime: UseStateResult<number>;
  private readonly _gameOver: UseStateResult<boolean>;
  private readonly _winner: UseStateResult<boolean>;
  private readonly _paused: UseStateResult<boolean>;
  private readonly _clickMode: UseStateResult<ClickMode>;

  private readonly _counterInterval: UseIntervalResult;

  private readonly _ui: UIClient;

  constructor({ useState, useInterval, ui }: ContextAPIClients) {
    this._ui = ui;

    // Construct state
    this._currentPage = useState(Pages.Home);
    this._board = useState([] as Cell[]);
    this._boardWidth = useState(0);
    this._boardHeight = useState(0);
    this._remainingBombs = useState(0);
    this._remainingTiles = useState(0);
    this._currentTime = useState(0);
    this._gameOver = useState(false);
    this._winner = useState(false);
    this._paused = useState(false);
    this._clickMode = useState(ClickMode.Dig);

    // Construct interval
    this._counterInterval = useInterval(() => {
      if (this.currentTime < 999) {
        this.currentTime++;
      }
    }, 1000);
  }

  private get board() {
    return this._board[0];
  }

  private set board(value: Array<Cell>) {
    this._board[0] = value;
    this._board[1](value);
  }

  get currentPage() {
    return this._currentPage[0];
  }

  private set currentPage(value: Pages) {
    this._currentPage[0] = value;
    this._currentPage[1](value);
  }

  get boardWidth() {
    return this._boardWidth[0];
  }

  private set boardWidth(value: number) {
    this._boardWidth[0] = value;
    this._boardWidth[1](value);
  }

  get boardHeight() {
    return this._boardHeight[0];
  }

  private set boardHeight(value: number) {
    this._boardHeight[0] = value;
    this._boardHeight[1](value);
  }

  get currentTime() {
    return this._currentTime[0];
  }

  private set currentTime(value: number) {
    this._currentTime[0] = value;
    this._currentTime[1](value);
  }

  get remainingBombs() {
    return this._remainingBombs[0];
  }

  private set remainingBombs(value: number) {
    this._remainingBombs[0] = value;
    this._remainingBombs[1](value);
  }

  get paused() {
    return this._paused[0];
  }

  private set paused(value: boolean) {
    this._paused[0] = value;
    this._paused[1](value);
  }

  get gameOver() {
    return this._gameOver[0];
  }

  private set gameOver(value: boolean) {
    this._gameOver[0] = value;
    this._gameOver[1](value);
  }

  get winner() {
    return this._winner[0];
  }

  private set winner(value: boolean) {
    this._winner[1](value);
  }

  get clickMode() {
    return this._clickMode[0];
  }

  private set clickMode(mode: ClickMode) {
    this._clickMode[1](mode);
  }

  get remainingTiles() {
    return this._remainingTiles[0];
  }

  private set remainingTiles(value: number) {
    this._remainingTiles[0] = value;
    this._remainingTiles[1](value);
  }

  setClickMode = (mode: ClickMode) => () => {
    this.clickMode = mode;
  };

  getCell(x: number, y: number) {
    const index = y * this.boardWidth + x;
    return this._board[0][index];
  }

  clickCell(x: number, y: number): (() => void) | undefined {
    const cell = this.getCell(x, y);

    const isPlaying = !this.gameOver && !this.paused;
    const isDigging = this.clickMode === ClickMode.Dig;
    const isFlagging = this.clickMode === ClickMode.Flag;

    const proximitySatisfied =
      cell.proximityFlags === cell.proximityBombs && cell.proximityBombs > 0;
    const canDig = isDigging && cell.covered && !cell.flagged;
    const canRevealMore = isDigging && !cell.covered && proximitySatisfied;
    const canToggleFlag = isFlagging && cell.covered;
    const isClickable = canDig || canRevealMore || canToggleFlag;
    const playable = isPlaying && isClickable;

    return playable
      ? () => {
          switch (this.clickMode) {
            case ClickMode.Dig:
              this._reveal(x, y);
              break;
            case ClickMode.Flag:
              this._toggleFlag(x, y);
              break;
          }
        }
      : undefined;
  }

  startGame = (difficulty: Difficulty) => () => this._startGame(difficulty);

  private _startGame(difficulty: Difficulty) {
    let width: number;
    let height: number;
    let bombs: number;
    switch (difficulty) {
      case Difficulty.Easy:
        width = 10;
        height = 10;
        bombs = 10;
        break;
      case Difficulty.Medium:
        width = 15;
        height = 12;
        bombs = 30;
        break;
    }
    const board = new Array(width * height).fill(0).map(
      () =>
        ({
          bomb: false,
          proximityBombs: 0,
          covered: true,
          proximityFlags: 0,
          flagged: false,
        }) as Cell
    );
    this.remainingTiles = width * height - bombs;
    this.remainingBombs = bombs;
    this.board = board;
    this.boardWidth = width;
    this.boardHeight = height;

    while (bombs > 0) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const cell = this.getCell(x, y);
      if (cell.bomb) {
        continue;
      }

      cell.bomb = true;
      bombs--;
      this.forNeighbors(x, y, (neighbor) => {
        neighbor.proximityBombs++;
      });
    }

    this.currentTime = 0;
    this.winner = false;
    this.gameOver = false;
    this.currentPage = Pages.Game;
    this._counterInterval.start();
  }

  goHome() {
    this.currentPage = Pages.Home;
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this._counterInterval.stop();
    } else {
      this._counterInterval.start();
    }
  }

  private _reveal(x: number, y: number) {
    const cell = this.getCell(x, y);
    const uncovered = !cell.covered;
    cell.covered = false;
    if (!uncovered) {
      this.remainingTiles--;
    }
    if (cell.bomb) {
      this.endGame(false);
    } else if (cell.proximityBombs === 0) {
      this.forNeighbors(x, y, (neighbor, nx, ny) => {
        if (neighbor.covered) {
          this._reveal(nx, ny);
        }
      });
    } else if (uncovered && cell.proximityBombs == cell.proximityBombs) {
      this.forNeighbors(x, y, (neighbor, nx, ny) => {
        if (neighbor.covered && !neighbor.flagged) {
          this._reveal(nx, ny);
        }
      });
    }

    if (this.remainingTiles === 0) {
      this.endGame(true);
    }
  }

  private _toggleFlag(x: number, y: number) {
    const cell = this.getCell(x, y);
    cell.flagged = !cell.flagged;
    this.forNeighbors(x, y, (neighbor) => {
      if (cell.flagged) {
        neighbor.proximityFlags++;
      } else {
        neighbor.proximityFlags--;
      }
    });
    if (cell.flagged) {
      this.remainingBombs--;
    } else {
      this.remainingBombs++;
    }
  }

  private endGame(winner: boolean) {
    this.gameOver = true;
    this.winner = winner;
    this._counterInterval.stop();
    if (winner) {
      this.remainingBombs = 0;
      this._ui.showToast({ appearance: 'success', text: 'winner!' });
    }
  }

  private forNeighbors(
    x: number,
    y: number,
    action: (neighbor: Cell, x: number, y: number) => void
  ) {
    for (let nx = x - 1; nx <= x + 1; ++nx) {
      if (nx < 0 || nx >= this.boardWidth) {
        continue;
      }
      for (let ny = y - 1; ny <= y + 1; ++ny) {
        if (ny < 0 || ny >= this.boardHeight) {
          continue;
        }
        const nidx = ny * this.boardWidth + nx;
        action(this.board[nidx], nx, ny);
      }
    }
  }
}
