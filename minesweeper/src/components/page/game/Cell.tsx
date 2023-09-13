import { Devvit } from '@devvit/public-api';

import { Cell } from '../../../cell.js';
import { SharedProps } from '../../../sharedProps.js';

const TEXT_COLORS = [
  '#0000FF',
  '#008000',
  '#808000',
  '#800080',
  '#FF0000',
  '#800000',
  '#008080',
  '#2B0000',
];

type CellViewProps = SharedProps & {
  x: number;
  y: number;
  cell: Cell;
};

export const CellView = ({ game, x, y, cell }: CellViewProps) => {
  let bgColor = 'lightgray';
  if (game.paused) {
    bgColor = '#efefef';
  } else if (cell.covered) {
    bgColor = 'white';
  } else if (cell.bomb) {
    bgColor = 'red';
  }

  const proximityVisible = !cell.covered && !cell.bomb && cell.proximityBombs && !game.paused;
  const proximity = proximityVisible ? (
    <text
      color={TEXT_COLORS[cell.proximityBombs - 1]}
      selectable={false}
      weight={'bold'}
      size={'xlarge'}
    >
      {cell.proximityBombs}
    </text>
  ) : (
    <></>
  );

  const bombVisible = cell.bomb && game.gameOver && !game.winner;
  const bomb = bombVisible ? <text selectable={false}>💣</text> : <></>;

  const flagVisible = (cell.flagged && !game.gameOver && !game.paused) || (cell.bomb && game.winner);
  const flag = flagVisible ? <text selectable={false}>🚩</text> : <></>;

  return (
    <zstack onPress={game.clickCell(x, y)} alignment={'middle center'}>
      <hstack
        border={'thin'}
        backgroundColor={bgColor}
        padding={'medium'}
        cornerRadius={'small'}
      ></hstack>
      {proximity}
      {bomb}
      {flag}
    </zstack>
  );
};
