import { Devvit } from '@devvit/public-api';

export const Preview = () => {
  return (
    <blocks height={'tall'}>
      <vstack gap={'large'} alignment={'center middle'} grow>
        <image url={'mines.png'} imageWidth={128} imageHeight={128} />
        <text style={'heading'}>Minesweeper</text>
      </vstack>
    </blocks>
  );
};
