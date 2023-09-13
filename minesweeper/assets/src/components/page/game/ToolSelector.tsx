import { Devvit } from '@devvit/public-api';

import { ClickMode } from '../../../clickMode.js';
import { SharedProps } from '../../../sharedProps.js';
import BlockComponent = Devvit.BlockComponent;

export const ToolSelector: BlockComponent<SharedProps> = ({ game }) => {
  const isDigging = game.clickMode === ClickMode.Dig;
  return (
    <hstack alignment={'middle center'} gap={'small'}>
      <text selectable={false}>Mode:</text>
      <button
        appearance={!isDigging ? 'primary' : 'secondary'}
        onPress={game.setClickMode(ClickMode.Flag)}
      >
        🚩 Flag
      </button>
      <button
        appearance={isDigging ? 'primary' : 'secondary'}
        onPress={game.setClickMode(ClickMode.Dig)}
      >
        ⛏️ Dig
      </button>
    </hstack>
  );
};
