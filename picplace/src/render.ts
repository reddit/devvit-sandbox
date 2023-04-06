import { format } from "small-date";

import { DISPLAY_BLOCK, DISPLAY_FILL } from "./constants.js";
import {
  JsonDocumentRow,
  JsonTable,
  JsonTableField,
  JsonTableFieldValue,
  Puzzle,
  PuzzleAchievements,
  PuzzleMoveType,
} from "./types.js";

export function renderPuzzle(
  puzzle: Puzzle,
  isPuzzleComplete: boolean
): JsonTable {
  const puzzleDrawing: JsonTable = {
    document: [
      { e: "par", c: [] },
      {
        e: "table",
        h: [],
        c: [],
      },
    ],
  };

  // add description
  if (puzzle.description) {
    puzzleDrawing.document.push({
      e: "par",
      c: [
        { e: "text", t: "Description: ", f: [[1, 0, 12]] },
        { e: "text", t: puzzle.description },
      ],
    });
  }

  // add created by
  if (puzzle.createdBy) {
    puzzleDrawing.document.push({
      e: "par",
      c: [
        { e: "text", t: "Created by " },
        { e: "u/", t: puzzle.createdBy, l: false },
      ],
    });
  }

  // find max height of x & y coords
  const maxX = puzzle.x!.reduce((prev, col) => Math.max(col.length, prev), 0);
  const maxY = puzzle.y!.reduce((prev, col) => Math.max(col.length, prev), 0);
  const EMPTY_CELL = { c: [], a: "C" };

  // build upper coords
  for (let i = maxX; i > 0; i--) {
    const newC: JsonTableField[] = [];

    // empty cells for padding/alignment
    for (let x = 0; x < maxY; x++) {
      newC.push(EMPTY_CELL);
    }

    for (let j = 0; j < puzzle.x!.length; j++) {
      const valid = puzzle.x![j].length - i;
      if (valid >= 0) {
        newC.push({
          a: "C",
          c: [{ e: "text", t: `${puzzle.x![j][valid]}` }],
        });
      } else {
        newC.push(EMPTY_CELL);
      }
    }

    // push first row to headers
    if (i === maxX) {
      puzzleDrawing.document[1].h?.push(...newC);
    } else {
      puzzleDrawing.document[1].c.push(newC);
    }
  }

  // build puzzle state
  for (let i = 0; i < puzzle.y!.length; i++) {
    // create y cells for current col
    const newC: JsonTableFieldValue[] = puzzle.y![i].map((coord) => ({
      c: [{ e: "text", t: `${coord}` }],
    }));

    // pad left side with empty cells to match max
    while (newC.length < maxY) {
      newC.unshift(EMPTY_CELL);
    }
    for (let j = 0; j < puzzle.x!.length; j++) {
      let value = isPuzzleComplete ? DISPLAY_BLOCK : "";
      if (puzzle.state && puzzle.state[i]) {
        switch (puzzle.state[i][j]) {
          case PuzzleMoveType.Block:
            value = DISPLAY_BLOCK;
            break;
          case PuzzleMoveType.Fill:
            value = DISPLAY_FILL;
            break;
        }
      }
      newC.push({
        c: [
          {
            e: "text",
            t: value,
          },
        ],
      });
    }
    puzzleDrawing.document[1].c.push(newC);
  }

  // if complete, add history
  if (isPuzzleComplete) {
    puzzleDrawing.document.push(...generateWrapup(puzzle));
  }

  return puzzleDrawing;
}

function generateWrapup(puzzle: Puzzle): JsonDocumentRow[] {
  const achievements = getAchievements(puzzle);
  const newRows: JsonDocumentRow[] = [
    {
      e: "par",
      c: [{ e: "text", t: "Achievements:", f: [[1, 0, 13]] }],
    },
    {
      e: "list",
      c: puzzle.history!.map((move) => ({
        e: "li",
        c: [
          {
            e: "par",
            c: [
              {
                e: "text",
                t: `${format(new Date(move.created), "HH:mm MM/dd/yyyy")} - `,
              },
              { e: "u/", t: move.user, l: false },
              {
                e: "text",
                t: ` - ${move.coord.join(",")}${
                  move.strategy ? `- ${move.strategy}` : ""
                }`,
              },
            ],
          },
        ],
      })),
      o: false,
    },
    {
      e: "par",
      c: [{ e: "text", t: "Move History:", f: [[1, 0, 13]] }],
    },
    {
      e: "list",
      c: puzzle.history!.map((move) => ({
        e: "li",
        c: [
          {
            e: "par",
            c: [
              {
                e: "text",
                t: `${format(new Date(move.created), "HH:mm MM/dd/yyyy")} - `,
              },
              { e: "u/", t: move.user, l: false },
              {
                e: "text",
                t: ` - ${
                  move.type === PuzzleMoveType.Block ? "X" : "O"
                } ${move.coord.join(",")}${
                  move.strategy ? `- ${move.strategy}` : ""
                }`,
              },
            ],
          },
        ],
      })),
      o: false,
    },
  ];

  return newRows;
}

function getAchievements(puzzle: Puzzle): PuzzleAchievements {
  const firstMove = puzzle.history?.at(0)?.user || "";
  const lastMove = puzzle.history?.at(-1)?.user || "";
  const userMap = {};
  for (const move of puzzle.history || []) {
    if (!userMap[move.user]) {
      userMap[move.user] = {
        name: move.user,
        [PuzzleMoveType.Block]: 0,
        [PuzzleMoveType.Fill]: 0,
      };
    }
    userMap[move.user][move.type]++;
  }

  let topFillUser;
  let topBlockUser;

  for (const username in userMap) {
    const user = userMap[username];
    if (
      !topFillUser ||
      user[PuzzleMoveType.Fill] > topFillUser[PuzzleMoveType.Fill]
    ) {
      topFillUser = user;
    }
    if (
      !topBlockUser ||
      user[PuzzleMoveType.Block] > topBlockUser[PuzzleMoveType.Block]
    ) {
      topBlockUser = user;
    }
  }

  return {
    firstMove,
    lastMove,
    mostFilled: topFillUser.name,
    mostEmptied: topBlockUser.name,
  };
}
