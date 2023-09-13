import { Devvit } from '@devvit/public-api';

import { SharedProps } from '../../sharedProps.js';
import { Board } from './game/Board.js';
import { Header } from './game/Header.js';
import { ToolSelector } from './game/ToolSelector.js';

export const GamePage = ({ game }: SharedProps) => {
  return (
    <vstack grow>
      <Header game={game} />

      <Board game={game} />

      <spacer size={'xsmall'} />

      <ToolSelector game={game} />
    </vstack>
  );
};
