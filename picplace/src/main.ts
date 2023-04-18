import { Devvit } from "@devvit/public-api";
import {
  CommentV2,
  LogErrorMessage,
  PostV2,
  SelectFlairRequest,
  UserV2,
} from "@devvit/protos";

import { FLAIR_COMPLETE, FLAIR_DIFFICULTY } from "./constants.js";
import { isPuzzleComplete, updatePuzzleState } from "./puzzle.js";
import { renderPuzzle } from "./render.js";
import { getPuzzle, storePuzzle } from "./store.js";
import {
  Puzzle,
  PuzzleDifficulty,
  PuzzleMove,
  PuzzleMoveType,
} from "./types.js";

const logger = Devvit.use(Devvit.Types.Logger);
const redditapi = Devvit.use(Devvit.Types.RedditAPI.LinksAndComments);
const flairapi = Devvit.use(Devvit.Types.RedditAPI.Flair);
const moderation = Devvit.use(Devvit.Types.RedditAPI.Moderation);

Devvit.onPostSubmit(async (msg, md) => {
  try {
    // parse post contents (must be markdown)
    const puzzle = await parsePost(msg.post!, msg.author!);
    if (!puzzle) return {};

    // render puzzle visual
    const puzzleDrawing = renderPuzzle(puzzle, false);

    // create new post
    const newPost = await redditapi.Submit(
      {
        kind: "self",
        richtextJson: JSON.stringify(puzzleDrawing),
        sr: msg.subreddit!.name,
        title: `${msg.post!.title} by u/${msg.author!.name}`,
        ...FLAIR_DIFFICULTY[puzzle.difficulty!],
      },
      md
    );

    // store puzzle in kvstore
    puzzle.id = `t3_${newPost.json!.data!.id!}`;
    await storePuzzle(puzzle, md!);

    // remove old post
    await moderation.Remove(
      {
        id: msg.post!.id!,
        spam: false,
      },
      md
    );
  } catch (err) {
    await logger.Error(
      LogErrorMessage.fromPartial({
        message: `PostSubmitError: ${(err as Error).message}`,
      }),
      md
    );
  }
  return {};
});

Devvit.onCommentSubmit(async (msg, md) => {
  try {
    // Get the puzzle from kvstore based on postId
    const puzzle = await getPuzzle(msg.post!.id, md!);

    // this post might not be a puzzle so ignore
    if (!puzzle) return {};

    // Parse the comment as a move
    const move = parseMove(msg.comment!, msg.author!);

    // Update the puzzle state with the new move
    const newPuzzle = updatePuzzleState(puzzle, move);

    const puzzleComplete = isPuzzleComplete(newPuzzle);

    // Store the updated puzzle in the kvstore
    await storePuzzle(newPuzzle, md!);

    // Render a new puzzle visual
    const puzzleDrawing = renderPuzzle(newPuzzle, puzzleComplete);

    // Update the post with the new visual
    await redditapi.EditUserText(
      {
        richtextJson: JSON.stringify(puzzleDrawing),
        text: "",
        thingId: puzzle.id!,
      },
      md
    );

    if (puzzleComplete) {
      // add complete flair
      await flairapi.SelectFlair(
        SelectFlairRequest.fromPartial({
          link: puzzle.id!,
          subreddit: msg.subreddit!.name,
          ...FLAIR_COMPLETE,
        }),
        md
      );

      // lock post
      await redditapi.Lock(
        {
          id: puzzle.id!,
        },
        md
      );
    }

    // Remove the move comment
    await moderation.Remove(
      {
        id: msg.comment!.id,
        spam: false,
      },
      md
    );
  } catch (err) {
    await logger.Error(
      LogErrorMessage.fromPartial({
        message: `CommentSubmitError: ${(err as Error).message}`,
      }),
      md
    );
  }
  return {};
});

async function parsePost(
  post: PostV2,
  author: UserV2
): Promise<Puzzle | undefined> {
  let puzzle: Puzzle = {
    created: Date.now(),
    createdBy: author.name,
    id: post.id,
  };
  const lines = post.selftext.split("\n");
  if (!lines || lines.length < 3) return;
  for (const line of lines) {
    puzzle = {
      ...puzzle,
      ...(await parseLine(line)),
    };
  }

  if (!puzzle.x || !puzzle.y) return;
  return puzzle as Puzzle;
}

async function parseLine(line: string): Promise<Puzzle> {
  const parts = line.split(": ");
  const puzzle = {};
  switch (parts[0]) {
    case "X": {
      const lineParts = parts[1].split(",");
      const xLine = [];
      for (const part of lineParts) {
        const blockParts = part.split(" ");
        const lineBlock = [];
        for (const block of blockParts) {
          if (!block) continue;
          lineBlock.push(parseInt(block));
        }
        xLine.push(lineBlock);
      }
      return { x: xLine };
    }
    case "Y": {
      const lineParts = parts[1].split(",");
      const yLine = [];
      for (const part of lineParts) {
        const blockParts = part.split(" ");
        const lineBlock = [];
        for (const block of blockParts) {
          if (!block) continue;
          lineBlock.push(parseInt(block));
        }
        yLine.push(lineBlock);
      }
      return { y: yLine };
    }
    case "Title":
    case "title":
      return { title: parts[1] };
    case "Description":
    case "description":
      return { description: parts[1] };
    case "Difficulty":
    case "difficulty":
      return { difficulty: parseDifficulty(parts[1]) };
  }
  return puzzle as Puzzle;
}

function parseMove(comment: CommentV2, author: UserV2): PuzzleMove {
  const move: PuzzleMove = {
    user: author.name,
    type: PuzzleMoveType.Fill,
    coord: [0, 0],
    strategy: "",
    created: Date.now(),
  };
  let splitBody = comment.body.split(/:\s?/);
  move.type = splitBody[0] === "X" ? PuzzleMoveType.Block : PuzzleMoveType.Fill;

  splitBody = splitBody[1].split(/\s?-\s?/);
  if (splitBody[1]) {
    move.strategy = splitBody[1];
  }

  splitBody = splitBody[0].split(/,\s?/);
  move.coord = splitBody.slice(0, 2).map((x) => parseInt(x));

  return move;
}

function parseDifficulty(diffString: string): PuzzleDifficulty {
  switch (diffString) {
    case "easy":
    case "Easy":
      return PuzzleDifficulty.Easy;
    case "medium":
    case "med":
    case "Medium":
      return PuzzleDifficulty.Medium;
    case "Hard":
    case "hard":
    case "Difficult":
    case "difficult":
      return PuzzleDifficulty.Hard;
    default:
      return PuzzleDifficulty.Easy;
  }
}

export default Devvit;
