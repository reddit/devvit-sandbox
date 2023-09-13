import { Devvit } from '@devvit/public-api';
import { MinesweeperGame } from '../../game.js';
import { Difficulty } from '../../difficulty.js';

export const HomePage = ({ game }: { game: MinesweeperGame }) => {
  const startGame = (difficulty: Difficulty) => () => {
    game.startGame(difficulty);
  };

  return (
    <vstack gap={'medium'} alignment={'middle center'} grow>
      <image url={'mines.png'} imageWidth={128} imageHeight={128} />
      <button onPress={startGame(Difficulty.Easy)}>Easy - 10x10 - 10 💣</button>
      <button onPress={startGame(Difficulty.Medium)}>Medium - 15x12 - 30 💣</button>
    </vstack>
  );
};
