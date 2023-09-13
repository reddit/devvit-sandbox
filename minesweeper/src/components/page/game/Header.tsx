import { Devvit } from '@devvit/public-api';

import { NumberDisplay } from './NumberDisplay.js';
import { SharedProps } from '../../../sharedProps.js';
import BlockComponent = Devvit.BlockComponent;

export const Header: BlockComponent<SharedProps> = ({ game }) => {
  const pauseAction = !game.gameOver ? () => game.togglePause() : undefined;
  const pauseButton = !game.gameOver ? (
    <button onPress={pauseAction} appearance={game.paused ? 'primary' : 'secondary'}>
      {game.paused ? '▶️' : '⏸️'}
    </button>
  ) : (
    <></>
  );

  return (
    <hstack padding={'small'} alignment={'middle'} gap={'medium'}>
      <NumberDisplay num={game.remainingBombs} />

      <spacer grow />

      {pauseButton}
      <button onPress={() => game.goHome()}>❌</button>

      <spacer grow />

      <NumberDisplay num={game.currentTime} />
    </hstack>
  );
};
