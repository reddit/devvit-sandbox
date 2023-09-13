import { Devvit } from '@devvit/public-api';

import { CellView } from './Cell.js';
import { SharedProps } from '../../../sharedProps.js';

export const Board = ({ game }: SharedProps) => {
  const rows = [];

  for (let row = 0; row < game.boardHeight; ++row) {
    const cells = [];
    for (let col = 0; col < game.boardWidth; ++col) {
      cells.push(<CellView game={game} x={col} y={row} cell={game.getCell(col, row)} />);
    }
    rows.push(<hstack>{cells}</hstack>);
  }

  return <vstack alignment={'middle center'}>{rows}</vstack>;
};
