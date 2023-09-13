import { Devvit } from "@devvit/public-api";

export const NumberDisplay = ({ num }: { num: number }) => {
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
