import { SharedProps } from '../../sharedProps.js';
import { Cell } from '../../cell.js';
import { ClickMode } from '../../clickMode.js';
import { Devvit } from '@devvit/public-api';

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
  const playable =
    !game.gameOver &&
    !game.paused &&
    (cell.covered ||
      (cell.proximityFlags == cell.proximityBombs &&
        cell.proximityBombs > 0 &&
        game.clickMode === ClickMode.Dig)) &&
    (!cell.flagged || game.clickMode === ClickMode.Flag);
  const onPress = playable ? game.clickCell(x, y) : undefined;
  const bgColor = game.paused
    ? '#efefef'
    : cell.covered
    ? 'white'
    : cell.bomb
    ? 'red'
    : 'lightgray';

  const proximity =
    cell.covered || game.paused || cell.bomb ? (
      <></>
    ) : cell.proximityBombs ? (
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

  const bomb =
    cell.bomb && game.gameOver && !game.winner ? <text selectable={false}>💣</text> : <></>;
  const flag =
    (cell.flagged && !game.gameOver) || (cell.bomb && game.winner) ? (
      <text selectable={false}>🚩</text>
    ) : (
      <></>
    );

  return (
    <zstack onPress={onPress} alignment={'middle center'}>
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
