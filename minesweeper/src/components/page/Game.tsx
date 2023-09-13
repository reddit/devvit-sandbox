import { Devvit } from '@devvit/public-api';
import { Board } from './Board.js';
import { SharedProps } from '../../sharedProps.js';
import { ClickMode } from '../../clickMode.js';
import ButtonAppearance = Devvit.Blocks.ButtonAppearance;

const NumDisplay = ({ num }: { num: number }) => {
  return (
    <zstack
      backgroundColor={'black'}
      border={'thin'}
      borderColor={'gray'}
      padding={'small'}
      alignment={'end'}
    >
      <text color={'red'} weight={'bold'} selectable={false}>{`${num}`}</text>
      <text color={'transparent'} weight={'bold'} selectable={false}>
        {999}
      </text>
    </zstack>
  );
};

export const GamePage = ({ game }: SharedProps) => {
  let flagActive: ButtonAppearance = 'secondary';
  let digActive: ButtonAppearance = 'secondary';
  let flagAction;
  let digAction;

  switch (game.clickMode) {
    case ClickMode.Flag:
      flagActive = 'primary';
      digAction = () => {
        game.clickMode = ClickMode.Dig;
      };
      break;
    case ClickMode.Dig:
      digActive = 'primary';
      flagAction = () => {
        game.clickMode = ClickMode.Flag;
      };
      break;
  }

  const pauseAction = !game.gameOver ? () => game.togglePause() : undefined;
  const pauseButton = !game.gameOver ? (
    <button onPress={pauseAction} appearance={game.paused ? 'primary' : 'secondary'}>
      {game.paused ? '▶️' : '⏸️'}
    </button>
  ) : (
    <></>
  );

  return (
    <vstack grow>
      <hstack padding={'small'} alignment={'middle'} gap={'medium'}>
        <NumDisplay num={game.remainingBombs} />
        <spacer grow />
        {pauseButton}
        <button onPress={() => game.goHome()}>❌</button>
        <spacer grow />
        <NumDisplay num={game.currentTime} />
      </hstack>

      <Board game={game} />

      <spacer size={'xsmall'} />

      <hstack alignment={'middle center'} gap={'small'}>
        <text selectable={false}>Mode:</text>
        <button appearance={flagActive} onPress={flagAction}>
          🚩 Flag
        </button>
        <button appearance={digActive} onPress={digAction}>
          ⛏️ Dig
        </button>
      </hstack>
    </vstack>
  );
};
