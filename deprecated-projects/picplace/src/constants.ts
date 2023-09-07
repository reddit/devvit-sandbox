import { PuzzleDifficulty } from "./types.js";

export const DISPLAY_FILL = "⏹"; // Maybe this instead? █
export const DISPLAY_BLOCK = "·";

export const FLAIR_COMPLETE = {
  backgroundColor: "#149103",
  text: "Complete",
  textColor: "light",
  // flairId: "31ef3644-b7cc-11ed-a419-422a46af157a",
};

export const FLAIR_DIFFICULTY = {
  [PuzzleDifficulty.Easy]: {
    // backgroundColor: "#ffd635",
    // text: "Easy",
    // textColor: "dark",
    flairId: "3d155b4a-b860-11ed-a741-2e87a8afbbcb",
  },
  [PuzzleDifficulty.Medium]: {
    // backgroundColor: "#ff7b0f",
    // text: "Medium",
    // textColor: "dark",
    flairId: "45ab8888-b860-11ed-afbe-4efa29b2b9bf",
  },
  [PuzzleDifficulty.Hard]: {
    // backgroundColor: "#d1041c",
    // text: "Hard",
    // textColor: "light",
    flairId: "51261f7a-b860-11ed-b7bf-eafa80c841f2",
  },
};
