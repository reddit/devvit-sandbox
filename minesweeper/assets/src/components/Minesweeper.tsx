import { Devvit } from '@devvit/public-api';

import { MinesweeperGame } from '../game.js';
import { Pages } from '../pages.js';
import { GamePage } from './page/Game.js';
import { HomePage } from './page/Home.js';
import CustomPostComponent = Devvit.CustomPostComponent;

export const Minesweeper: CustomPostComponent = (context): JSX.Element => {
  const game = new MinesweeperGame(context);

  let currentPage: JSX.Element;
  switch (game.currentPage) {
    case Pages.Home:
      currentPage = <HomePage game={game} />;
      break;
    case Pages.Game:
      currentPage = <GamePage game={game} />;
      break;
  }

  return <blocks height={'tall'}>{currentPage}</blocks>;
};
