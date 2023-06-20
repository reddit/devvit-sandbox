import { Devvit } from "@devvit/public-api-next";
import { MineSweeperGameRoot } from "./Minesweeper/index.js";

Devvit.configure({
  redditAPI: true,
});

Devvit.addCustomPostType({
  name: "Hello Blocks",
  render: (props) => <MineSweeperGameRoot {...props} />,
});

export default Devvit;
